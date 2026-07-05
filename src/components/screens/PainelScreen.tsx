import { Link } from "@tanstack/react-router";
import type { AccentKey, Section } from "@/data/clients";
import { toRawActivities } from "@/data/clients";
import { useClient } from "@/lib/client-context";
import { calcMMs } from "@/utils/queuing";
import { derivePert } from "@/utils/pert";
import { calcEOQ, daysToConsume } from "@/utils/eoq";
import { HeroNumber, RecommendationRow, accentVar } from "@/components/ui-kit";

const MONO = "var(--f-mono)";

interface HeroKpi {
  frente: string;
  label: string;
  context: string;
  status: string;
  color: string;
  action: boolean; // front demands action → feeds the executive read
  section: Section;
  value: number;
  unit: string;
  unstableText?: string;
}

export function PainelScreen() {
  const client = useClient();

  // Severity is authored per front (rec.accent). The KPI dot, the status chip,
  // the executive read and the sidebar badge all read from this single source,
  // so they can never contradict one another.
  const statusFor = (accent: AccentKey, crit: string, att: string, ok: string) =>
    accent === "critical" ? crit : accent === "amber" ? att : ok;

  // ---------- FILAS ----------
  const canal = client.filas.canais[0];
  const kpi = calcMMs(canal.lambda, canal.mu, canal.s);

  // ---------- CRONOGRAMA ----------
  const pt = derivePert(toRawActivities(client.pert.atividades));

  // ---------- ESTOQUES ----------
  const eRows = client.estoque.skus.map(([, , D, S, H, val]) => {
    const { Q } = calcEOQ(D, S, H);
    return { viola: daysToConsume(Q, D) > val };
  });
  const violaCount = eRows.filter((r) => r.viola).length;

  const heroKpis: HeroKpi[] = [
    {
      frente: "FILAS",
      label: "Utilização no pico",
      context: `${canal.label} · jantar`,
      status: statusFor(client.filas.rec.accent, "Ação requerida", "Atenção", "Estável"),
      color: accentVar(client.filas.rec.accent),
      action: client.filas.rec.accent === "critical",
      section: "filas",
      value: kpi.rho * 100,
      unit: "%",
      unstableText: kpi.unstable ? "≥100" : undefined,
    },
    {
      frente: "CRONOGRAMA",
      label: "Prazo do projeto",
      context: `${pt.cp.length} atividades críticas`,
      status: statusFor(client.pert.rec.accent, "Ação requerida", "Atenção", "No prazo"),
      color: accentVar(client.pert.rec.accent),
      action: client.pert.rec.accent === "critical",
      section: "cronograma",
      value: pt.duracao,
      unit: "d",
    },
    {
      frente: "ESTOQUES",
      label: "SKUs em risco",
      context: "lote ótimo acima da validade",
      status: statusFor(client.estoque.rec.accent, "Ação requerida", "Atenção", "Sob controle"),
      color: accentVar(client.estoque.rec.accent),
      action: client.estoque.rec.accent === "critical",
      section: "estoques",
      value: violaCount,
      unit: `/${eRows.length}`,
    },
    {
      frente: "JOGOS",
      label: "Cenários mapeados",
      context: "equilíbrio de Nash",
      status: statusFor(client.jogos.rec.accent, "Ação requerida", "Atenção", "Resolvido"),
      color: accentVar(client.jogos.rec.accent),
      action: client.jogos.rec.accent === "critical",
      section: "jogos",
      value: client.jogos.cenarios.length,
      unit: "",
    },
  ];

  const actionCount = heroKpis.filter((k) => k.action).length;

  const topRecs: { rec: typeof client.filas.rec; frente: string; section: Section }[] = [
    { rec: client.filas.rec, frente: "FILAS", section: "filas" },
    { rec: client.pert.rec, frente: "PERT", section: "cronograma" },
    { rec: client.estoque.rec, frente: "EOQ", section: "estoques" },
    { rec: client.jogos.rec, frente: "JOGOS", section: "jogos" },
  ];

  return (
    <div className="kview" style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 30px 70px" }}>
      {/* ---------------- header ---------------- */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: ".2em",
          color: "var(--kairos)",
          marginBottom: 12,
        }}
      >
        PAINEL EXECUTIVO
        <span style={{ color: "var(--faint)" }}>
          {"  ·  "}
          {client.industry}
          {"  ·  "}
          {client.periodo}
        </span>
      </div>
      <h1
        style={{
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: "-.025em",
          lineHeight: 1.03,
          margin: 0,
        }}
      >
        {client.cliente}
      </h1>
      <p
        style={{
          maxWidth: 720,
          fontSize: 15.5,
          lineHeight: 1.5,
          color: "var(--graphite)",
          margin: "14px 0 0",
        }}
      >
        {client.resumo}
      </p>

      {/* executive read strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 22,
          padding: "13px 18px",
          borderRadius: 11,
          background: "var(--chrome)",
          color: "var(--chrome-fg)",
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: "-.02em",
            color: actionCount > 0 ? "var(--critical)" : "var(--optimal)",
          }}
        >
          {actionCount}/{heroKpis.length}
        </span>
        <span style={{ fontSize: 13.5, lineHeight: 1.4 }}>
          {actionCount > 0 ? (
            <>
              <strong style={{ fontWeight: 700 }}>frentes exigem ação imediata.</strong>{" "}
              <span style={{ color: "#9A9EA8" }}>Plano priorizado por impacto abaixo.</span>
            </>
          ) : (
            <>
              <strong style={{ fontWeight: 700 }}>frentes sob controle.</strong>{" "}
              <span style={{ color: "#9A9EA8" }}>Oportunidades de otimização no plano abaixo.</span>
            </>
          )}
        </span>
      </div>

      <div style={{ height: 1, background: "var(--line)", margin: "28px 0 24px" }} />

      {/* ---------------- hero KPIs ---------------- */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: ".16em",
          color: "var(--faint)",
          marginBottom: 14,
        }}
      >
        INDICADORES POR FRENTE
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {heroKpis.map((k, i) => (
          <Link
            key={k.frente}
            to="/$clientId/$section"
            params={{ clientId: client.id, section: k.section }}
            className="kpi pop"
            style={{
              display: "flex",
              flexDirection: "column",
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "18px 18px 16px",
              cursor: "pointer",
              minHeight: 172,
              ["--i" as string]: i,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: ".14em",
                  color: "var(--faint)",
                }}
              >
                {k.frente}
              </span>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: k.color }} />
            </div>

            {k.unstableText ? (
              <span
                style={{
                  fontFamily: MONO,
                  fontWeight: 600,
                  fontSize: 36,
                  letterSpacing: "-.03em",
                  lineHeight: 1,
                  color: k.color,
                }}
              >
                {k.unstableText}
                <span style={{ fontSize: 15, color: "var(--faint)", marginLeft: 3 }}>{k.unit}</span>
              </span>
            ) : (
              <HeroNumber
                value={k.value}
                unit={k.unit}
                color={k.color}
                size={36}
                countUp
                resetKey={client.id}
              />
            )}

            <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600, marginTop: 11 }}>
              {k.label}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--graphite)", marginTop: 2 }}>
              {k.context}
            </div>

            <span
              style={{
                marginTop: "auto",
                alignSelf: "flex-start",
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: ".04em",
                color: k.color,
                background: `color-mix(in srgb, ${k.color} 12%, transparent)`,
                padding: "3px 9px",
                borderRadius: 20,
              }}
            >
              {k.status}
            </span>
          </Link>
        ))}
      </div>

      {/* ---------------- action plan ---------------- */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          margin: "36px 0 14px",
        }}
      >
        <div
          style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".16em", color: "var(--faint)" }}
        >
          PLANO DE AÇÃO
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--graphite)" }}>
          {topRecs.length} recomendações · uma por frente
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {topRecs.map((r) => (
          <RecommendationRow
            key={r.section}
            rec={r.rec}
            frente={r.frente}
            clientId={client.id}
            section={r.section}
          />
        ))}
      </div>
    </div>
  );
}
