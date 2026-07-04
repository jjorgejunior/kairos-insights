import { useMemo, useState, type MouseEvent } from "react";
import { useClient } from "@/lib/client-context";
import { useTip } from "@/lib/tip";
import { calcEOQ, daysToConsume, maxSafeQty } from "@/utils/eoq";
import { fmt, brl } from "@/utils/format";
import {
  MetricCard,
  ScreenHead,
  ChartCard,
  LegendItem,
  RecommendationPlaque,
} from "@/components/ui-kit";
import { DataTable, type Column } from "@/components/ui-kit/DataTable";
import type { SkuCat } from "@/data/clients";

interface ERow {
  codigo: string;
  desc: string;
  D: number;
  S: number;
  H: number;
  val: number;
  cat: SkuCat;
  Q: number;
  dias: number;
  viola: boolean;
}

/* ---------------------------------------------------------- QvChart (local) */
function QvChart({ rows }: { rows: ERow[] }) {
  const tip = useTip();
  const qvMax = Math.max(...rows.map((r) => Math.max(r.dias, r.val))) * 1.05;

  return (
    <ChartCard
      title="Dias para consumir Q* × validade"
      legend={
        <>
          <LegendItem color="var(--critical)" label="Viola" bar />
          <LegendItem color="var(--ink)" label="Validade" />
        </>
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          height: 200,
          position: "relative",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {rows.map((r, i) => {
          const barH = (r.dias / qvMax) * 100;
          const valY = 100 - (r.val / qvMax) * 100;
          const color = r.viola ? "var(--critical)" : "var(--optimal)";
          return (
            <div
              key={r.codigo}
              style={{
                flex: 1,
                height: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                cursor: "pointer",
              }}
              onMouseMove={(e) =>
                tip.show(
                  e,
                  `<span class="k">${r.codigo}${r.viola ? " · VIOLA VALIDADE" : ""}</span><br/>${r.desc}<br/>Q* consome em <strong>${r.dias.toFixed(1)}d</strong><br/>validade <strong>${r.val}d</strong>`,
                )
              }
              onMouseLeave={() => tip.hide()}
            >
              <div
                style={{
                  position: "absolute",
                  left: -2,
                  right: -2,
                  top: `${valY}%`,
                  height: 2,
                  background: "var(--ink)",
                  zIndex: 2,
                }}
              />
              <div
                className="qvcol growy"
                style={{
                  width: "100%",
                  height: `${barH}%`,
                  background: color,
                  borderRadius: "3px 3px 0 0",
                  ["--i" as string]: i,
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {rows.map((r) => (
          <div
            key={r.codigo}
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "var(--f-mono)",
              fontSize: 9,
              color: "var(--faint)",
            }}
          >
            {r.codigo.slice(-3)}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

/* ------------------------------------------------------ CostCurveChart (local) */
function CostCurveChart({
  eSel,
  crossF,
  onMove,
  onLeave,
}: {
  eSel: ERow;
  crossF: number | null;
  onMove: (f: number, e: { clientX: number; clientY: number }) => void;
  onLeave: () => void;
}) {
  const tip = useTip();
  const Qs = eSel.Q;
  const cmin = Math.max(1, Qs * 0.25);
  const cmax = Qs * 1.9;

  const cpts = useMemo(() => {
    const pts: { Q: number; order: number; hold: number; total: number }[] = [];
    for (let i = 0; i <= 44; i++) {
      const Q = cmin + ((cmax - cmin) * i) / 44;
      const order = (eSel.D / Q) * eSel.S;
      const hold = (Q / 2) * eSel.H;
      pts.push({ Q, order, hold, total: order + hold });
    }
    return pts;
  }, [cmin, cmax, eSel.D, eSel.S, eSel.H]);

  const eMaxCost = Math.max(...cpts.map((p) => p.total)) * 1.05;
  const ecw = 560,
    ech = 230;
  const epad = { l: 44, r: 14, t: 14, b: 26 };
  const exF = (Q: number) => epad.l + ((Q - cmin) / (cmax - cmin)) * (ecw - epad.l - epad.r);
  const eyF = (c: number) => ech - epad.b - (c / eMaxCost) * (ech - epad.t - epad.b);
  const line = (key: "order" | "hold" | "total") =>
    "M" + cpts.map((p) => `${exF(p.Q).toFixed(1)},${eyF(p[key]).toFixed(1)}`).join(" L");

  const safeQ = maxSafeQty(eSel.D, eSel.val);
  const safeX = eSel.viola && safeQ >= cmin && safeQ <= cmax ? exF(safeQ) : null;
  const qstarX = exF(eSel.Q);
  const baseY = eyF(0);
  const topY = epad.t;

  const xticks = [cmin, (cmin + cmax) / 2, cmax].map((q) => ({ x: exF(q), label: q.toFixed(0) }));
  const yticks = [0, 0.5, 1].map((f) => ({
    y: eyF(eMaxCost * f),
    label: "R$" + ((eMaxCost * f) / 1000).toFixed(1) + "k",
  }));

  let cross: { x: number; yT: number; yO: number; yH: number } | null = null;
  if (crossF != null) {
    const Q = cmin + crossF * (cmax - cmin);
    const order = (eSel.D / Q) * eSel.S;
    const hold = (Q / 2) * eSel.H;
    cross = { x: exF(Q), yT: eyF(order + hold), yO: eyF(order), yH: eyF(hold) };
  }

  const handleMove = (e: MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let f = (e.clientX - rect.left) / rect.width;
    f = Math.max(0, Math.min(1, f));
    const Q = cmin + f * (cmax - cmin);
    const order = (eSel.D / Q) * eSel.S;
    const hold = (Q / 2) * eSel.H;
    onMove(f, e);
    tip.show(
      e,
      `<span class="k">Q = ${Math.round(Q)} un</span><br/>Total <strong>${brl(order + hold)}</strong><br/>Pedido ${brl(order)} · Manter ${brl(hold)}`,
    );
  };

  const handleLeave = () => {
    onLeave();
    tip.hide();
  };

  return (
    <>
      <svg viewBox="0 0 560 230" style={{ width: "100%", height: "auto" }}>
        {yticks.map((t, i) => (
          <g key={i}>
            <line x1={44} y1={t.y} x2={546} y2={t.y} stroke="var(--line-2)" />
            <text
              x={40}
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
          <text key={i} x={t.x} y={224} textAnchor="middle" fontSize={9} fill="var(--faint)">
            Q={t.label}
          </text>
        ))}
        <path
          className="draw2"
          pathLength={1}
          d={line("hold")}
          fill="none"
          stroke="var(--optimal)"
          strokeWidth={1.4}
        />
        <path
          className="draw2"
          pathLength={1}
          d={line("order")}
          fill="none"
          stroke="var(--amber)"
          strokeWidth={1.4}
        />
        <path
          className="draw"
          pathLength={1}
          d={line("total")}
          fill="none"
          stroke="var(--kairos)"
          strokeWidth={2.4}
        />
        <line
          x1={qstarX}
          y1={topY}
          x2={qstarX}
          y2={baseY}
          stroke="var(--kairos)"
          strokeDasharray="3 3"
        />
        <text
          x={qstarX}
          y={12}
          textAnchor="middle"
          fontSize={9}
          fill="var(--kairos)"
        >{`Q* ${eSel.Q.toFixed(0)}`}</text>
        {safeX != null && (
          <>
            <line
              x1={safeX}
              y1={topY}
              x2={safeX}
              y2={baseY}
              stroke="var(--critical)"
              strokeDasharray="3 3"
            />
            <text
              x={safeX}
              y={12}
              textAnchor="middle"
              fontSize={9}
              fill="var(--critical)"
            >{`seguro ${safeQ.toFixed(0)}`}</text>
          </>
        )}
        {cross && (
          <>
            <line
              x1={cross.x}
              y1={topY}
              x2={cross.x}
              y2={baseY}
              stroke="var(--faint)"
              strokeDasharray="2 3"
            />
            <circle cx={cross.x} cy={cross.yH} r={3} fill="var(--optimal)" />
            <circle cx={cross.x} cy={cross.yO} r={3} fill="var(--amber)" />
            <circle
              cx={cross.x}
              cy={cross.yT}
              r={4.5}
              fill="var(--kairos)"
              stroke="var(--panel)"
              strokeWidth={1.5}
            />
          </>
        )}
        <rect
          x={44}
          y={14}
          width={502}
          height={190}
          fill="transparent"
          style={{ cursor: "crosshair" }}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        />
      </svg>
      <div
        style={{
          display: "flex",
          gap: 16,
          fontFamily: "var(--f-mono)",
          fontSize: 10,
          color: "var(--graphite)",
          marginTop: 4,
        }}
      >
        <LegendItem color="var(--kairos)" label="Total" bar />
        <LegendItem color="var(--amber)" label="Pedido" />
        <LegendItem color="var(--optimal)" label="Manter" />
      </div>
    </>
  );
}

/* -------------------------------------------------------------- Slider (local, matches prototype input styling) */
function SensSlider({
  label,
  pct,
  onChange,
}: {
  label: string;
  pct: number;
  onChange: (v: number) => void;
}) {
  const fill = ((pct - -20) / 40) * 100;
  return (
    <label style={{ display: "block" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}
      >
        <span style={{ color: "var(--graphite)" }}>{label}</span>
        <span style={{ fontFamily: "var(--f-mono)", color: "var(--kairos)" }}>
          {pct > 0 ? "+" : ""}
          {pct}%
        </span>
      </div>
      <input
        type="range"
        min={-20}
        max={20}
        step={1}
        value={pct}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", ["--fill" as string]: `${fill.toFixed(1)}%` }}
      />
    </label>
  );
}

/* ---------------------------------------------------------------- Screen */
export function EstoquesScreen() {
  const client = useClient();

  const eRows: ERow[] = useMemo(
    () =>
      client.estoque.skus.map(([codigo, desc, D, S, H, val, cat]) => {
        const { Q } = calcEOQ(D, S, H);
        const dias = daysToConsume(Q, D);
        return { codigo, desc, D, S, H, val, cat, Q, dias, viola: dias > val };
      }),
    [client.estoque.skus],
  );

  const violaCount = eRows.filter((r) => r.viola).length;
  const catCount = {
    EOQ: eRows.filter((r) => r.cat === "EOQ_CLASSICO").length,
    REV: eRows.filter((r) => r.cat === "REVISAO_PERIODICA").length,
    FIX: eRows.filter((r) => r.cat === "PERIODO_FIXO").length,
  };

  const [selCode, setSelCode] = useState(client.estoque.selected);
  const [dPct, setDPct] = useState(0);
  const [sPct, setSPct] = useState(0);
  const [hPct, setHPct] = useState(0);
  const [crossF, setCrossF] = useState<number | null>(null);

  const eSel = eRows.find((r) => r.codigo === selCode) || eRows[0];

  const sens = calcEOQ(
    eSel.D * (1 + dPct / 100),
    eSel.S * (1 + sPct / 100),
    eSel.H * (1 + hPct / 100),
  );
  const eBaseCost = (eSel.D / eSel.Q) * eSel.S + (eSel.Q / 2) * eSel.H;

  const violaColor = violaCount > 0 ? "#E7A99B" : "#BFD7C9";

  const columns: Column<ERow>[] = [
    {
      key: "codigo",
      header: "SKU",
      mono: true,
      sortable: true,
      accessor: (r) => r.codigo,
      render: (r) => <span style={{ color: "var(--kairos)", fontWeight: 600 }}>{r.codigo}</span>,
    },
    {
      key: "desc",
      header: "DESCRIÇÃO",
      accessor: (r) => r.desc,
      render: (r) => <span style={{ color: "var(--graphite)" }}>{r.desc}</span>,
    },
    {
      key: "D",
      header: "D/ANO",
      align: "right",
      mono: true,
      sortable: true,
      accessor: (r) => r.D,
      render: (r) => fmt(r.D),
    },
    {
      key: "val",
      header: "VALID.",
      align: "right",
      mono: true,
      sortable: true,
      accessor: (r) => r.val,
      render: (r) => <span style={{ color: "var(--graphite)" }}>{r.val}d</span>,
    },
    {
      key: "Q",
      header: "Q*",
      align: "right",
      mono: true,
      sortable: true,
      accessor: (r) => r.Q,
      render: (r) => r.Q.toFixed(0),
    },
    {
      key: "dias",
      header: "CONSOME",
      align: "right",
      mono: true,
      sortable: true,
      accessor: (r) => r.dias,
      render: (r) => `${r.dias.toFixed(1)}d`,
      cellStyle: (r) => ({
        fontWeight: 600,
        color: r.viola ? "var(--critical)" : "var(--optimal)",
      }),
    },
    {
      key: "cat",
      header: "ABORDAGEM",
      align: "center",
      accessor: (r) => r.cat,
      render: (r) => {
        const { label, color } =
          r.cat === "EOQ_CLASSICO"
            ? { label: "EOQ", color: "var(--optimal)" }
            : r.cat === "REVISAO_PERIODICA"
              ? { label: "Revisão", color: "var(--amber)" }
              : { label: "Período fixo", color: "var(--critical)" };
        return (
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 10,
              fontWeight: 600,
              color,
              border: `1px solid ${color}`,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            {label}
          </span>
        );
      },
    },
  ];

  return (
    <div
      className="kview print-break"
      style={{ maxWidth: 1120, margin: "0 auto", padding: "34px 30px 70px" }}
    >
      <ScreenHead eyebrow="EOQ / EPQ" title="Lote econômico e validade" />

      {/* hero + categories */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr 1fr 1fr",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div
          className="card"
          style={{
            background: "var(--chrome)",
            color: "var(--chrome-fg)",
            borderRadius: 12,
            padding: 22,
          }}
        >
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 10,
              letterSpacing: ".1em",
              color: "#9A9EA8",
            }}
          >
            SKUs EM RISCO DE PERDA
          </span>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontWeight: 600,
              fontSize: 48,
              lineHeight: 1,
              marginTop: 12,
              color: violaColor,
            }}
          >
            {violaCount}
            <span style={{ fontSize: 20, color: "#9A9EA8" }}>/{eRows.length}</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#9A9EA8", marginTop: 10 }}>
            Q* excede o prazo de validade
          </div>
        </div>
        <MetricCard
          accent="optimal"
          label="EOQ CLÁSSICO"
          value={catCount.EOQ}
          caption="Não-perecível · Q*=√(2DS/H)"
          valueSize={30}
        />
        <MetricCard
          accent="amber"
          label="REVISÃO PERIÓDICA"
          value={catCount.REV}
          caption="Semi-perecível · nível-alvo"
          valueSize={30}
        />
        <MetricCard
          accent="critical"
          label="PERÍODO FIXO"
          value={catCount.FIX}
          caption="Perecível · reposição por validade"
          valueSize={30}
        />
      </div>

      {/* Q* vs validade */}
      <div style={{ marginBottom: 16 }}>
        <QvChart rows={eRows} />
      </div>

      {/* per-SKU analysis */}
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
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Análise por SKU</h3>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
          <div
            className="no-print"
            style={{
              maxHeight: 340,
              overflow: "auto",
              border: "1px solid var(--line-2)",
              borderRadius: 8,
              padding: 4,
            }}
          >
            {eRows.map((r) => {
              const active = r.codigo === selCode;
              return (
                <button
                  key={r.codigo}
                  onClick={() => setSelCode(r.codigo)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "7px 10px",
                    fontSize: 12,
                    borderRadius: 6,
                    cursor: "pointer",
                    border: "none",
                    fontFamily: "var(--f-mono)",
                    background: active ? "var(--kairos)" : "transparent",
                    color: active ? "#fff" : "var(--graphite)",
                  }}
                >
                  {r.codigo} — {r.desc}
                </button>
              );
            })}
          </div>
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  flex: 1,
                  minWidth: 110,
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: 11,
                }}
              >
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, color: "var(--faint)" }}>
                  D · DEMANDA/ANO
                </span>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 18,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {fmt(eSel.D)}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 90,
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: 11,
                }}
              >
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, color: "var(--faint)" }}>
                  Q* ÓTIMO
                </span>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 18,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {eSel.Q.toFixed(1)}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 110,
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: 11,
                }}
              >
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, color: "var(--faint)" }}>
                  CONSOME EM
                </span>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 18,
                    fontWeight: 600,
                    marginTop: 4,
                    color: eSel.viola ? "var(--critical)" : "var(--optimal)",
                  }}
                >
                  {eSel.dias.toFixed(1)}d
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 90,
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: 11,
                }}
              >
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, color: "var(--faint)" }}>
                  VALIDADE
                </span>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 18,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {eSel.val}d
                </div>
              </div>
            </div>

            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 10,
                color: "var(--faint)",
                marginBottom: 6,
              }}
            >
              CURVA DE CUSTO TOTAL · {eSel.desc}
            </div>
            <CostCurveChart
              eSel={eSel}
              crossF={crossF}
              onMove={(f) => setCrossF(f)}
              onLeave={() => setCrossF(null)}
            />

            {/* sensitivity */}
            <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 14 }}>
              <div
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 10,
                  color: "var(--faint)",
                  marginBottom: 10,
                }}
              >
                SENSIBILIDADE (±20%)
              </div>
              <div
                className="no-print"
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}
              >
                <SensSlider label="D" pct={dPct} onChange={setDPct} />
                <SensSlider label="S" pct={sPct} onChange={setSPct} />
                <SensSlider label="H" pct={hPct} onChange={setHPct} />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10 }}>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, color: "var(--faint)" }}>
                    Q* BASE
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: 3,
                    }}
                  >
                    {eSel.Q.toFixed(1)}
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    padding: 10,
                    background: "var(--paper)",
                  }}
                >
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, color: "var(--faint)" }}>
                    Q* AJUST.
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: 3,
                      color: "var(--kairos)",
                    }}
                  >
                    {sens.Q.toFixed(1)}
                  </div>
                </div>
                <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10 }}>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, color: "var(--faint)" }}>
                    CUSTO BASE
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 14,
                      fontWeight: 600,
                      marginTop: 3,
                    }}
                  >
                    {brl(eBaseCost)}
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    padding: 10,
                    background: "var(--paper)",
                  }}
                >
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, color: "var(--faint)" }}>
                    CUSTO AJUST.
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 14,
                      fontWeight: 600,
                      marginTop: 3,
                      color: "var(--kairos)",
                    }}
                  >
                    {brl(sens.totalCost)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* table */}
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
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Todos os SKUs</h3>
        <DataTable
          data={eRows}
          columns={columns}
          rowAccent={(r) => (r.viola ? "critical" : null)}
        />
      </div>

      <RecommendationPlaque rec={client.estoque.rec} />
    </div>
  );
}
