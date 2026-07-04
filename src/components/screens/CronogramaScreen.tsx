import { useState, type MouseEvent } from "react";
import { useClient } from "@/lib/client-context";
import { useTip } from "@/lib/tip";
import { toRawActivities } from "@/data/clients";
import { derivePert, runCrashing, normalCDF, type DerivedActivity } from "@/utils/pert";
import { fmt, brl } from "@/utils/format";
import {
  MetricCard,
  Slider,
  ScreenHead,
  ChartCard,
  LegendItem,
  RecommendationPlaque,
} from "@/components/ui-kit";
import { DataTable, type Column } from "@/components/ui-kit/DataTable";

const MONO = "var(--f-mono)";

/* ------------------------------------------------------------ GanttChart */
function GanttChart({ pt }: { pt: ReturnType<typeof derivePert> }) {
  const tip = useTip();
  const gantt = [...pt.acts].sort((a, b) => a.es - b.es);
  const gMax = pt.duracao + 4;
  const teLine = (pt.duracao / gMax) * 100;
  const axis = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ left: f * 100, label: Math.round(gMax * f) }));

  return (
    <ChartCard
      title="Cronograma · Te + folga"
      legend={
        <>
          <LegendItem color="var(--critical)" label="Crítica" bar />
          <LegendItem color="var(--kairos)" label="Com folga" bar />
        </>
      }
    >
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 18,
            left: `${teLine}%`,
            width: 1,
            borderLeft: "1px dashed var(--critical)",
            zIndex: 2,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -4,
              left: 4,
              fontFamily: MONO,
              fontSize: 9,
              color: "var(--critical)",
              whiteSpace: "nowrap",
            }}
          >
            {`Te ${pt.duracao.toFixed(0)}`}
          </span>
        </div>
        {gantt.map((a, i) => {
          const barLeft = (a.es / gMax) * 100;
          const barW = (a.te / gMax) * 100;
          const folgaW = (a.folga / gMax) * 100;
          const color = a.critica ? "var(--critical)" : "var(--kairos)";
          return (
            <div
              key={a.codigo}
              style={{ display: "flex", alignItems: "center", gap: 8, height: 19 }}
              onMouseMove={(e) =>
                tip.show(
                  e,
                  `<span class="k">${a.codigo} · ${a.critica ? "CRÍTICA" : "com folga"}</span><br/>${a.desc}<br/>Te <strong>${a.te.toFixed(1)}d</strong> · ES ${a.es.toFixed(1)} · EF ${a.ef.toFixed(1)}<br/>folga <strong>${a.folga.toFixed(1)}d</strong>`,
                )
              }
              onMouseLeave={() => tip.hide()}
            >
              <div
                style={{
                  width: 20,
                  fontFamily: MONO,
                  fontSize: 10,
                  color: "var(--graphite)",
                  textAlign: "right",
                }}
              >
                {a.codigo}
              </div>
              <div style={{ flex: 1, position: "relative", height: 11, cursor: "pointer" }}>
                <div
                  className="gbar growx"
                  style={{
                    position: "absolute",
                    left: `${barLeft}%`,
                    width: `${barW}%`,
                    height: 11,
                    background: color,
                    borderRadius: 2,
                    minWidth: 2,
                    ["--i" as string]: i,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `calc(${barLeft}% + ${barW}%)`,
                    width: `${folgaW}%`,
                    height: 11,
                    background: "var(--line)",
                    borderRadius: 2,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <div style={{ width: 20 }} />
          <div style={{ flex: 1, position: "relative", height: 14 }}>
            {axis.map((a, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: `${a.left}%`,
                  transform: "translateX(-50%)",
                  fontFamily: MONO,
                  fontSize: 9,
                  color: "var(--faint)",
                }}
              >
                {`${a.label}d`}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

/* -------------------------------------------------------- NormalCurveChart */
function NormalCurveChart({
  mu,
  sig,
  deadline,
  crossF,
  onMove,
  onLeave,
}: {
  mu: number;
  sig: number;
  deadline: number;
  crossF: number | null;
  onMove: (e: MouseEvent<SVGRectElement>) => void;
  onLeave: () => void;
}) {
  const ncw = 560,
    nch = 210,
    pad = { l: 10, r: 10, t: 12, b: 24 };
  const x0 = mu - 4 * sig,
    x1 = mu + 4 * sig;
  const fN = (x: number) =>
    (1 / (sig * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sig, 2));
  const fMax = fN(mu);
  const npts: { x: number; f: number }[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = x0 + ((x1 - x0) * i) / 60;
    npts.push({ x, f: fN(x) });
  }
  const nxF = (x: number) => pad.l + ((x - x0) / (x1 - x0)) * (ncw - pad.l - pad.r);
  const nyF = (f: number) => nch - pad.b - (f / fMax) * (nch - pad.t - pad.b);
  const curvePath =
    "M" + npts.map((p) => `${nxF(p.x).toFixed(1)},${nyF(p.f).toFixed(1)}`).join(" L");
  const areaPath =
    `M${nxF(x0).toFixed(1)},${nyF(0).toFixed(1)} ` +
    npts
      .filter((p) => p.x <= deadline)
      .map((p) => `L${nxF(p.x).toFixed(1)},${nyF(p.f).toFixed(1)}`)
      .join(" ") +
    ` L${nxF(Math.min(deadline, x1)).toFixed(1)},${nyF(0).toFixed(1)} Z`;
  const muX = nxF(mu),
    dlX = nxF(deadline),
    baseY = nyF(0),
    topY = pad.t;

  let cross: { x: number; y: number } | null = null;
  if (crossF != null) {
    const x = x0 + crossF * (x1 - x0);
    cross = { x: nxF(x), y: nyF(fN(x)) };
  }

  return (
    <svg viewBox={`0 0 ${ncw} ${nch}`} style={{ width: "100%", height: "auto" }}>
      <path d={areaPath} fill="rgba(46,112,80,.14)" />
      <path
        className="draw"
        pathLength={1}
        d={curvePath}
        fill="none"
        stroke="var(--kairos)"
        strokeWidth={2.2}
      />
      <line x1={muX} y1={topY} x2={muX} y2={baseY} stroke="var(--faint)" strokeDasharray="3 3" />
      <text
        x={muX}
        y={12}
        textAnchor="middle"
        fontSize={10}
        fill="var(--graphite)"
      >{`Te ${mu.toFixed(0)}`}</text>
      <line x1={dlX} y1={topY} x2={dlX} y2={baseY} stroke="var(--critical)" strokeWidth={1.5} />
      <text
        x={dlX}
        y={12}
        textAnchor="middle"
        fontSize={10}
        fill="var(--critical)"
      >{`${deadline}d`}</text>
      {cross && (
        <>
          <line
            x1={cross.x}
            y1={topY}
            x2={cross.x}
            y2={baseY}
            stroke="var(--ink)"
            strokeDasharray="2 2"
          />
          <circle cx={cross.x} cy={cross.y} r={3.5} fill="var(--kairos)" className="hitdot" />
        </>
      )}
      <rect
        x={0}
        y={0}
        width={ncw}
        height={nch}
        fill="transparent"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      />
    </svg>
  );
}

/* -------------------------------------------------------------- CrashingChart */
function CrashingChart({
  pt,
  crash,
  budget,
}: {
  pt: ReturnType<typeof derivePert>;
  crash: ReturnType<typeof runCrashing>;
  budget: number;
}) {
  const cc: { gasto: number; dur: number }[] = [{ gasto: 0, dur: pt.duracao }];
  crash.log.forEach((s) => cc.push({ gasto: s.acum, dur: s.depois }));
  const ccw = 560,
    cch = 200,
    pad = { l: 34, r: 14, t: 14, b: 26 };
  const cgMax = Math.max(budget, 1);
  const cdMin = Math.min(...cc.map((p) => p.dur));
  const cdMax = pt.duracao;
  const cxF = (g: number) => pad.l + (g / cgMax) * (ccw - pad.l - pad.r);
  const cyF = (d: number) =>
    cch - pad.b - ((d - cdMin) / (cdMax - cdMin || 1)) * (cch - pad.t - pad.b);
  let path = "M" + cxF(cc[0].gasto).toFixed(1) + "," + cyF(cc[0].dur).toFixed(1);
  for (let i = 1; i < cc.length; i++) {
    path += ` H${cxF(cc[i].gasto).toFixed(1)} V${cyF(cc[i].dur).toFixed(1)}`;
  }
  const xticks = [0, 0.5, 1].map((f) => ({
    x: cxF(cgMax * f),
    label: `R$${Math.round((cgMax * f) / 1000)}k`,
  }));
  const yticks = [cdMin, (cdMin + cdMax) / 2, cdMax].map((v) => ({
    y: cyF(v),
    label: v.toFixed(0),
  }));

  return (
    <svg viewBox={`0 0 ${ccw} ${cch}`} style={{ width: "100%", height: "auto" }}>
      {yticks.map((t, i) => (
        <g key={i}>
          <line x1={34} y1={t.y} x2={546} y2={t.y} stroke="var(--line-2)" />
          <text
            x={30}
            y={t.y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={9}
            fill="var(--faint)"
          >
            {t.label}
          </text>
        </g>
      ))}
      {xticks.map((t, i) => (
        <text key={i} x={t.x} y={194} textAnchor="middle" fontSize={9} fill="var(--faint)">
          {t.label}
        </text>
      ))}
      <path
        className="draw"
        pathLength={1}
        d={path}
        fill="none"
        stroke="var(--kairos)"
        strokeWidth={2}
      />
    </svg>
  );
}

/* ------------------------------------------------------------- CronogramaScreen */
export function CronogramaScreen() {
  const client = useClient();
  const tip = useTip();
  const pt = derivePert(toRawActivities(client.pert.atividades));

  const [deadline, setDeadline] = useState(client.pert.deadline);
  const [budget, setBudget] = useState(client.pert.budget);
  const [crossF, setCrossF] = useState<number | null>(null);

  const pProb = normalCDF(deadline, pt.duracao, pt.sigma);
  const crash = runCrashing(pt.acts, budget, pt.duracao);

  const mu = pt.duracao,
    sig = pt.sigma;
  const x0 = mu - 4 * sig,
    x1 = mu + 4 * sig;

  const probBars = [
    Math.round(mu - 4),
    Math.round(mu),
    Math.round(mu + 5),
    Math.round(mu + 10),
  ].map((d) => {
    const pr = normalCDF(d, mu, sig);
    return { d, pct: pr * 100, w: pr * 100 };
  });

  const cpmColumns: Column<DerivedActivity>[] = [
    {
      key: "codigo",
      header: "ATIV",
      mono: true,
      render: (a) => <span style={{ fontWeight: 600 }}>{a.codigo}</span>,
    },
    {
      key: "desc",
      header: "DESCRIÇÃO",
      render: (a) => <span style={{ color: "var(--graphite)" }}>{a.desc}</span>,
    },
    {
      key: "pred",
      header: "PRED",
      mono: true,
      render: (a) => <span style={{ color: "var(--faint)" }}>{a.pred.join(", ") || "—"}</span>,
    },
    { key: "te", header: "Te", align: "right", mono: true, render: (a) => a.te.toFixed(2) },
    {
      key: "es",
      header: "ES",
      align: "right",
      mono: true,
      render: (a) => <span style={{ color: "var(--graphite)" }}>{a.es.toFixed(1)}</span>,
    },
    {
      key: "ef",
      header: "EF",
      align: "right",
      mono: true,
      render: (a) => <span style={{ color: "var(--graphite)" }}>{a.ef.toFixed(1)}</span>,
    },
    {
      key: "ls",
      header: "LS",
      align: "right",
      mono: true,
      render: (a) => <span style={{ color: "var(--graphite)" }}>{a.ls.toFixed(1)}</span>,
    },
    {
      key: "lf",
      header: "LF",
      align: "right",
      mono: true,
      render: (a) => <span style={{ color: "var(--graphite)" }}>{a.lf.toFixed(1)}</span>,
    },
    {
      key: "folga",
      header: "FOLGA",
      align: "right",
      mono: true,
      render: (a) => (
        <span
          style={{
            color: a.critica ? "var(--critical)" : "var(--graphite)",
            fontWeight: a.critica ? 600 : 400,
          }}
        >
          {a.folga.toFixed(1)}
        </span>
      ),
    },
  ];

  return (
    <div
      className="kview print-break"
      style={{ maxWidth: 1120, margin: "0 auto", padding: "34px 30px 70px" }}
    >
      <ScreenHead eyebrow="PERT / CPM" title="Cronograma e aceleração" />

      {/* hero + kpis */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr 1fr 1fr",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <MetricCard
          chrome
          abbrTitle="Duração esperada do projeto = soma dos Te do caminho crítico. Derivada da tabela, não fixada."
          label="Te · DURAÇÃO ESPERADA"
          value={pt.duracao.toFixed(1)}
          unit="d"
          valueSize={48}
        />
        <MetricCard
          label="ATIV. CRÍTICAS"
          value={
            <>
              {pt.cp.length}
              <span style={{ fontSize: 16, color: "var(--faint)" }}>{`/${pt.acts.length}`}</span>
            </>
          }
          valueColor="var(--critical)"
          caption="Folga = 0"
        />
        <MetricCard
          abbrTitle="Desvio-padrão do caminho crítico = raiz da soma das variâncias."
          label="σ · CAMINHO CRÍT."
          value={pt.sigma.toFixed(2)}
          unit="d"
          caption={`Var = ${pt.varCP.toFixed(2)}`}
        />
        <MetricCard
          label={`P(T ≤ ${deadline}d)`}
          value={(pProb * 100).toFixed(1)}
          unit="%"
          valueColor="var(--optimal)"
          caption="Distribuição normal"
        />
      </div>

      {/* critical path rail */}
      <div
        className="card"
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".12em",
            color: "var(--faint)",
            marginBottom: 12,
          }}
        >
          CAMINHO CRÍTICO
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
          {pt.cp.map((c, i) => (
            <span key={c} style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--critical)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: MONO,
                }}
              >
                {c}
              </span>
              {i < pt.cp.length - 1 && (
                <span style={{ color: "var(--critical-soft)", margin: "0 3px", fontSize: 13 }}>
                  →
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* gantt */}
      <div style={{ marginBottom: 16 }}>
        <GanttChart pt={pt} />
      </div>

      {/* probabilistic */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div
          className="card"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "20px 22px",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>
            Distribuição normal da duração
          </h3>
          <NormalCurveChart
            mu={mu}
            sig={sig}
            deadline={deadline}
            crossF={crossF}
            onMove={(e) => {
              const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
              let f = (e.clientX - r.left) / r.width;
              f = Math.max(0, Math.min(1, f));
              const x = x0 + f * (x1 - x0);
              const cdf = normalCDF(x, mu, sig);
              setCrossF(f);
              tip.show(
                e,
                `<span class="k">${x.toFixed(0)} dias</span><br/>P(T ≤ ${x.toFixed(0)}) = <strong>${(cdf * 100).toFixed(1)}%</strong>`,
              );
            }}
            onLeave={() => {
              setCrossF(null);
              tip.hide();
            }}
          />
        </div>
        <div
          className="card"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "20px 22px",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Calculadora de prazo</h3>
          <div style={{ margin: "14px 0" }} className="no-print">
            <Slider
              label="Prazo (dias)"
              value={deadline}
              min={60}
              max={100}
              step={1}
              onChange={(v) => setDeadline(v)}
            />
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "12px 0",
              borderTop: "1px solid var(--line)",
              borderBottom: "1px solid var(--line)",
              marginBottom: 14,
            }}
          >
            <div
              style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}
            >{`P(T ≤ ${deadline})`}</div>
            <div
              style={{ fontFamily: MONO, fontSize: 38, fontWeight: 600, color: "var(--optimal)" }}
            >{`${(pProb * 100).toFixed(1)}%`}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {probBars.map((b) => (
              <div key={b.d}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    marginBottom: 3,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{ color: "var(--graphite)", fontFamily: MONO }}
                  >{`P(T≤${b.d}d)`}</span>
                  <span
                    style={{ fontFamily: MONO, color: "var(--ink)" }}
                  >{`${b.pct.toFixed(1)}%`}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "var(--paper)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ height: "100%", width: `${b.w}%`, background: "var(--kairos)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* crashing */}
      <div
        className="card"
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: 22,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Simulador de crashing</h3>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
            prioriza críticas por menor custo/dia
          </span>
        </div>
        <div style={{ maxWidth: 560, marginBottom: 18 }} className="no-print">
          <Slider
            label="Orçamento"
            value={budget}
            min={0}
            max={50000}
            step={1000}
            onChange={(v) => setBudget(v)}
            display={`R$ ${fmt(budget)}`}
          />
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}
        >
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
              DURAÇÃO FINAL
            </span>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 26,
                fontWeight: 600,
                color: "var(--kairos)",
                marginTop: 6,
              }}
            >
              {crash.finalDuration.toFixed(1)}
              <span style={{ fontSize: 13, color: "var(--faint)" }}>d</span>
            </div>
          </div>
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>REDUÇÃO</span>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 26,
                fontWeight: 600,
                color: "var(--optimal)",
                marginTop: 6,
              }}
            >
              {`−${(pt.duracao - crash.finalDuration).toFixed(1)}`}
              <span style={{ fontSize: 13, color: "var(--faint)" }}>d</span>
            </div>
          </div>
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
            <span
              style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}
            >{`GASTO · ${crash.log.length} ITER.`}</span>
            <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, marginTop: 6 }}>
              {brl(crash.spent)}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)", marginBottom: 8 }}>
              CUSTO × DURAÇÃO
            </div>
            <CrashingChart pt={pt} crash={crash} budget={budget} />
          </div>
          <div
            style={{
              maxHeight: 220,
              overflow: "auto",
              border: "1px solid var(--line-2)",
              borderRadius: 8,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, background: "var(--paper)" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "7px 9px",
                      fontFamily: MONO,
                      fontSize: 9,
                      color: "var(--faint)",
                      fontWeight: 500,
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "7px 9px",
                      fontFamily: MONO,
                      fontSize: 9,
                      color: "var(--faint)",
                      fontWeight: 500,
                    }}
                  >
                    ATIV
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "7px 9px",
                      fontFamily: MONO,
                      fontSize: 9,
                      color: "var(--faint)",
                      fontWeight: 500,
                    }}
                  >
                    CUSTO
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "7px 9px",
                      fontFamily: MONO,
                      fontSize: 9,
                      color: "var(--faint)",
                      fontWeight: 500,
                    }}
                  >
                    → DIAS
                  </th>
                </tr>
              </thead>
              <tbody>
                {crash.log.map((s) => (
                  <tr key={s.iter} style={{ borderTop: "1px solid var(--line-2)" }}>
                    <td style={{ padding: "6px 9px", fontFamily: MONO, color: "var(--graphite)" }}>
                      {s.iter}
                    </td>
                    <td
                      style={{
                        padding: "6px 9px",
                        fontFamily: MONO,
                        color: "var(--critical)",
                        fontWeight: 600,
                      }}
                    >
                      {s.atividade}
                    </td>
                    <td style={{ padding: "6px 9px", textAlign: "right", fontFamily: MONO }}>
                      {brl(s.custo)}
                    </td>
                    <td
                      style={{
                        padding: "6px 9px",
                        textAlign: "right",
                        fontFamily: MONO,
                        color: "var(--optimal)",
                      }}
                    >
                      {s.depois.toFixed(1)}
                    </td>
                  </tr>
                ))}
                {crash.log.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        padding: 20,
                        color: "var(--faint)",
                        fontSize: 11,
                      }}
                    >
                      Aumente o orçamento para iniciar o crashing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* full table */}
      <div
        className="card"
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "20px 22px",
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Tabela CPM completa</h3>
        <DataTable
          columns={cpmColumns}
          data={pt.acts}
          rowAccent={(a) => (a.critica ? "critical" : null)}
        />
      </div>

      <RecommendationPlaque rec={client.pert.rec} />
    </div>
  );
}
