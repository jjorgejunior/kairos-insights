import { Link } from "@tanstack/react-router";
import type { Section } from "@/data/clients";
import { toRawActivities } from "@/data/clients";
import { useClient } from "@/lib/client-context";
import { calcMMs } from "@/utils/queuing";
import { derivePert } from "@/utils/pert";
import { calcEOQ, daysToConsume } from "@/utils/eoq";
import { HeroNumber, RecommendationRow } from "@/components/ui-kit";

const MONO = "var(--f-mono)";

interface HeroKpi {
  frente: string;
  label: string;
  sub: string;
  color: string;
  section: Section;
  value: number;
  unit: string;
  unstableText?: string;
}

export function PainelScreen() {
  const client = useClient();

  // ---------- FILAS ----------
  const canal = client.filas.canais[0];
  const kpi = calcMMs(canal.lambda, canal.mu, canal.s);
  const filasColor =
    kpi.rho >= 0.85 ? "var(--critical)" : kpi.rho >= 0.7 ? "var(--amber)" : "var(--optimal)";

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
      sub: `ρ = λ/(s·μ) · ${canal.label}`,
      color: filasColor,
      section: "filas",
      value: kpi.rho * 100,
      unit: "%",
      unstableText: kpi.unstable ? "≥100" : undefined,
    },
    {
      frente: "CRONOGRAMA",
      label: "Duração esperada",
      sub: `Te derivado · ${pt.cp.length} críticas`,
      color: "var(--kairos)",
      section: "cronograma",
      value: pt.duracao,
      unit: "d",
    },
    {
      frente: "ESTOQUES",
      label: "SKUs em risco de perda",
      sub: "Q* acima da validade",
      color: violaCount > 0 ? "var(--critical)" : "var(--optimal)",
      section: "estoques",
      value: violaCount,
      unit: `/${eRows.length}`,
    },
    {
      frente: "JOGOS",
      label: "Cenários resolvidos",
      sub: "Equilíbrio de Nash puro",
      color: "var(--kairos)",
      section: "jogos",
      value: client.jogos.cenarios.length,
      unit: "",
    },
  ];

  const topRecs: { rec: typeof client.filas.rec; frente: string; section: Section }[] = [
    { rec: client.filas.rec, frente: "FILAS", section: "filas" },
    { rec: client.pert.rec, frente: "PERT", section: "cronograma" },
    { rec: client.estoque.rec, frente: "EOQ", section: "estoques" },
    { rec: client.jogos.rec, frente: "JOGOS", section: "jogos" },
  ];

  return (
    <div className="kview" style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 30px 70px" }}>
      {/* context header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 20,
          marginBottom: 8,
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: ".2em",
              color: "var(--kairos)",
              marginBottom: 12,
            }}
          >
            VISÃO GERAL DO ENGAJAMENTO
          </div>
          <h1
            style={{
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: "-.02em",
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            {client.headline}
          </h1>
        </div>
        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: 10,
            background: "var(--panel)",
            padding: "16px 18px",
            minWidth: 230,
            fontFamily: MONO,
            fontSize: 11,
            lineHeight: 2,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "var(--faint)" }}>CLIENTE</span>
            <span style={{ fontWeight: 600 }}>{client.short}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "var(--faint)" }}>SETOR</span>
            <span>{client.industry}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "var(--faint)" }}>PERÍODO</span>
            <span>{client.periodo}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "var(--faint)" }}>ANALISTA</span>
            <span>{client.autor}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "var(--faint)" }}>VERSÃO</span>
            <span>{client.version}</span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--line)", margin: "26px 0 24px" }} />

      {/* hero KPIs */}
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
              display: "block",
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "18px 18px 20px",
              cursor: "pointer",
              ["--i" as string]: i,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
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
                  fontSize: 34,
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
                size={34}
                countUp
                resetKey={client.id}
              />
            )}
            <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 600, marginTop: 10 }}>
              {k.label}
            </div>
            <div
              style={{ fontSize: 11.5, color: "var(--graphite)", marginTop: 3, lineHeight: 1.4 }}
            >
              {k.sub}
            </div>
          </Link>
        ))}
      </div>

      {/* recommendations */}
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
          RECOMENDAÇÕES PRIORIZADAS
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--graphite)" }}>
          {topRecs.length} ações · uma por frente
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
