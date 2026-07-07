import { useState } from "react";
import { useClient } from "@/lib/client-context";
import { calcMMs } from "@/utils/queuing";
import { useTip } from "@/lib/tip";
import {
  MetricCard,
  Slider,
  Jargon,
  RecommendationPlaque,
  ScreenHead,
  ChartCard,
  LegendItem,
} from "@/components/ui-kit";

const MONO = "var(--f-mono)";

/* ------------------------------------------------------------ VolumeChart */
function VolumeChart({
  volume,
  canais,
}: {
  volume: Array<{ h: number } & Record<string, number>>;
  canais: { key: string; label: string }[];
}) {
  const tip = useTip();
  const cw = 680,
    ch = 230,
    pad = { l: 38, r: 16, t: 14, b: 26 };
  const keys = canais.map((c) => c.key);
  const maxV = Math.max(...volume.flatMap((d) => keys.map((k) => d[k]))) * 1.08;
  const xF = (i: number) => pad.l + (i / (volume.length - 1)) * (cw - pad.l - pad.r);
  const yF = (v: number) => ch - pad.b - (v / maxV) * (ch - pad.t - pad.b);
  const colors = ["var(--kairos)", "var(--amber)"];
  const series = canais.map((c, ci) => ({
    label: c.label,
    color: colors[ci] || "var(--kairos)",
    pts: volume.map((d, i) => `${xF(i).toFixed(1)},${yF(d[c.key]).toFixed(1)}`).join(" "),
  }));
  const xTicks = volume
    .map((d, i) => ({ d, i }))
    .filter((_, i) => i % 2 === 0)
    .map(({ d, i }) => ({ x: xF(i).toFixed(1), label: d.h + "h" }));
  const yTicks = [0, 0.5, 1].map((f) => ({
    y: yF(maxV * f).toFixed(1),
    label: Math.round(maxV * f),
  }));
  const peak = volume.reduce((a, b) => (b[keys[0]] > a[keys[0]] ? b : a), volume[0]);
  const peakIdx = volume.indexOf(peak);
  const bandW = (cw - pad.l - pad.r) / volume.length;

  return (
    <ChartCard
      title="Chegadas por hora"
      legend={
        <>
          {series.map((s) => (
            <LegendItem key={s.label} color={s.color} label={s.label} />
          ))}
        </>
      }
    >
      <svg viewBox="0 0 680 230" style={{ width: "100%", height: "auto" }}>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={38}
              y1={Number(t.y)}
              x2={664}
              y2={Number(t.y)}
              stroke="var(--line-2)"
              strokeWidth={1}
            />
            <text
              x={32}
              y={Number(t.y)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="var(--faint)"
            >
              {t.label}
            </text>
          </g>
        ))}
        <line
          x1={xF(peakIdx)}
          y1={14}
          x2={xF(peakIdx)}
          y2={204}
          stroke="var(--critical)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text x={xF(peakIdx)} y={12} textAnchor="middle" fontSize={10} fill="var(--critical)">
          pico {peak.h}h
        </text>
        {xTicks.map((t, i) => (
          <text
            key={i}
            x={Number(t.x)}
            y={222}
            textAnchor="middle"
            fontSize={10}
            fill="var(--faint)"
          >
            {t.label}
          </text>
        ))}
        {series.map((s, i) => (
          <polyline
            key={i}
            className="draw"
            pathLength={1}
            points={s.pts}
            fill="none"
            stroke={s.color}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
        ))}
        {volume.map((d, i) => (
          <rect
            key={i}
            x={xF(i) - bandW / 2}
            y={14}
            width={bandW}
            height={190}
            fill="transparent"
            style={{ cursor: "crosshair" }}
            onMouseMove={(e) => {
              const html =
                `<span class="k">${d.h}:00 · chegadas/h</span><br/>` +
                canais.map((c) => `${c.label}: <strong>${d[c.key]}</strong>`).join("<br/>");
              tip.show(e, html);
            }}
            onMouseLeave={tip.hide}
          />
        ))}
      </svg>
    </ChartCard>
  );
}

/* -------------------------------------------------------------- FilasScreen */
export function FilasScreen() {
  const client = useClient();
  const { filas } = client;

  const [canalKey, setCanalKey] = useState(filas.canais[0].key);
  const canal = filas.canais.find((c) => c.key === canalKey) || filas.canais[0];
  const kpi = calcMMs(canal.lambda, canal.mu, canal.s);

  const [simLambda, setSimLambda] = useState(filas.sim.lambda);
  const [simS, setSimS] = useState(filas.sim.s);
  const [simServ, setSimServ] = useState(filas.sim.serviceMin);
  const simMu = 60 / simServ;
  const sim = calcMMs(simLambda, simMu, simS);

  const rhoColor =
    kpi.rho >= 0.85 ? "var(--critical)" : kpi.rho >= 0.7 ? "var(--amber)" : "var(--optimal)";
  const simRhoColor =
    sim.rho >= 0.85 ? "var(--critical)" : sim.rho >= 0.7 ? "var(--amber)" : "var(--optimal)";

  // ---- Comparativo de canais + cenário "fila única" (pooling) ----
  const rhoCol = (r: number, unstable: boolean) =>
    unstable || r >= 0.85 ? "var(--critical)" : r >= 0.7 ? "var(--amber)" : "var(--optimal)";
  const canalStats = filas.canais.map((c) => ({
    label: c.label,
    s: c.s,
    lambda: c.lambda,
    mu: c.mu,
    m: calcMMs(c.lambda, c.mu, c.s),
    combined: false,
  }));
  // Coluna "Combinado" (fila única). Se houver parâmetros medidos em campo
  // (filas.pool), usa-os — assim o dashboard bate com o cálculo manual do
  // relatório. Senão, aproxima juntando os canais (só se μ for igual).
  const muEqual = filas.canais.every((c) => Math.abs(c.mu - filas.canais[0].mu) < 1e-6);
  const sTot = filas.canais.reduce((a, c) => a + c.s, 0);
  const poolMeasured = !!filas.pool;
  const poolLambda = filas.pool ? filas.pool.lambda : +filas.canais.reduce((a, c) => a + c.lambda, 0).toFixed(1);
  const poolMu = filas.pool ? filas.pool.mu : filas.canais[0].mu;
  const poolS = filas.pool ? filas.pool.s : sTot;
  const pooled =
    filas.pool || (muEqual && filas.canais.length > 1)
      ? {
          label: "Combinado",
          s: poolS,
          lambda: poolLambda,
          mu: poolMu,
          m: calcMMs(poolLambda, poolMu, poolS),
          combined: true,
        }
      : null;
  const compareCols = pooled ? [...canalStats, pooled] : canalStats;

  const canalButtons = (
    <>
      {filas.canais.map((c) => {
        const active = c.key === canalKey;
        return (
          <button
            key={c.key}
            className="btn"
            onClick={() => setCanalKey(c.key)}
            style={{
              padding: "7px 15px",
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 7,
              cursor: "pointer",
              border: "1px solid var(--line)",
              background: active ? "var(--chrome)" : "var(--panel)",
              color: active ? "var(--chrome-fg)" : "var(--graphite)",
              borderColor: active ? "var(--chrome)" : "var(--line)",
            }}
          >
            {c.label}
          </button>
        );
      })}
    </>
  );

  return (
    <div
      className="kview print-break"
      style={{ maxWidth: 1120, margin: "0 auto", padding: "34px 30px 70px" }}
    >
      <ScreenHead eyebrow="M/M/s · ERLANG-C" title="Filas de atendimento" right={canalButtons} />

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 16, marginTop: 24 }}>
        {/* hero rho */}
        <div
          className="card"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Jargon title="Taxa de utilização dos atendentes: fração do tempo ocupados.">
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 11,
                  letterSpacing: ".14em",
                  color: "var(--faint)",
                }}
              >
                ρ · UTILIZAÇÃO — {canal.label}
              </span>
            </Jargon>
            <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--graphite)" }}>
              λ={canal.lambda}/h · μ={canal.mu}/h · s={canal.s}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontWeight: 600,
              fontSize: 74,
              lineHeight: 1,
              letterSpacing: "-.04em",
              color: rhoColor,
              margin: "18px 0 6px",
            }}
          >
            {kpi.unstable ? "≥100" : (kpi.rho * 100).toFixed(1)}
            <span style={{ fontSize: 30, color: "var(--faint)" }}>%</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: rhoColor }}>
            {kpi.unstable || kpi.rho >= 0.85
              ? "Saturado"
              : kpi.rho >= 0.7
                ? "Sensível a picos"
                : "Opera com folga"}
          </div>
        </div>

        {/* 2x2 metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MetricCard
            abbrTitle="Tempo médio de espera na fila, antes do atendimento."
            label="Wq · ESPERA"
            value={kpi.unstable ? "∞" : (kpi.Wq * 3600).toFixed(1)}
            unit="s"
          />
          <MetricCard
            abbrTitle="Número médio de clientes aguardando na fila."
            label="Lq · FILA"
            value={kpi.unstable ? "∞" : kpi.Lq.toFixed(2)}
          />
          <MetricCard
            abbrTitle="Tempo total no sistema: espera + atendimento."
            label="W · SISTEMA"
            value={kpi.unstable ? "∞" : (kpi.W * 60).toFixed(1)}
            unit="min"
          />
          <MetricCard
            chrome
            label="MODELO"
            value={
              <>
                Erlang-C
                <br />
                M/M/s
              </>
            }
            valueSize={15}
          />
        </div>
      </div>

      {/* comparativo de canais + fila única (pooling) */}
      <div
        className="card"
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: 22,
          marginTop: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 16,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Comparativo de canais</h3>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
            ρ · Wq · Lq · W por canal
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${compareCols.length}, 1fr)`,
            gap: 12,
          }}
        >
          {compareCols.map((c) => {
            const col = rhoCol(c.m.rho, c.m.unstable);
            const chrome = c.combined;
            const faint = chrome ? "#9A9EA8" : "var(--faint)";
            return (
              <div
                key={c.label}
                style={{
                  border: `1px solid ${chrome ? "var(--chrome)" : "var(--line)"}`,
                  borderRadius: 10,
                  padding: "16px 16px 14px",
                  background: chrome ? "var(--chrome)" : "var(--panel)",
                  color: chrome ? "var(--chrome-fg)" : "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</span>
                  {chrome && (
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".08em", color: faint }}>
                      FILA ÚNICA
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: chrome ? faint : "var(--graphite)", marginTop: 2 }}>
                  s={c.s} · λ={c.lambda}/h · μ={c.mu}/h
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontWeight: 600,
                    fontSize: 38,
                    lineHeight: 1,
                    letterSpacing: "-.03em",
                    color: col,
                    margin: "14px 0 2px",
                  }}
                >
                  {c.m.unstable ? "≥100" : (c.m.rho * 100).toFixed(1)}
                  <span style={{ fontSize: 16, color: faint }}>%</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: faint, marginBottom: 12 }}>
                  ρ · utilização
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { k: "Wq", v: c.m.unstable ? "∞" : `${(c.m.Wq * 3600).toFixed(0)}s` },
                    { k: "Lq", v: c.m.unstable ? "∞" : c.m.Lq.toFixed(2) },
                    { k: "W", v: c.m.unstable ? "∞" : `${(c.m.W * 60).toFixed(1)}m` },
                  ].map((x) => (
                    <div key={x.k}>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: faint }}>{x.k}</div>
                      <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                        {x.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {pooled && poolMeasured && (
          <p style={{ fontSize: 12, color: "var(--graphite)", lineHeight: 1.55, margin: "14px 0 0" }}>
            <strong>Modelo adotado.</strong> O cenário <strong>Combinado</strong> trata balcão e
            totens como uma <strong>fila única com s={poolS}</strong> (o cliente vai a qualquer posto
            livre) e usa a <strong>taxa de chegada medida em campo (λ={poolLambda}/h)</strong> — por
            isso reproduz o cálculo manual do relatório: ρ = λ/(s·μ) ={" "}
            {(pooled.m.rho * 100).toFixed(1)}%. As colunas por canal (médias amostrais por sessão)
            ficam como leitura complementar.
          </p>
        )}
        {pooled && !poolMeasured && (
          <p style={{ fontSize: 12, color: "var(--graphite)", lineHeight: 1.55, margin: "14px 0 0" }}>
            O cenário <strong>Combinado</strong> junta os {filas.canais.length} canais numa{" "}
            <strong>fila única com s={sTot}</strong> (pooling): a mesma demanda, mas qualquer
            atendente serve qualquer cliente — o que reduz a espera vs. filas separadas.
          </p>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <VolumeChart volume={filas.volume} canais={filas.canais} />
      </div>

      {/* simulator */}
      <div
        className="card"
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: 22,
          marginTop: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 18,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Simulador M/M/s</h3>
          <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--faint)" }}>
            ρ = λ/(s·μ)
          </span>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "center" }}
        >
          <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Slider
              label="λ · chegadas/h"
              value={simLambda}
              min={10}
              max={150}
              step={1}
              onChange={setSimLambda}
            />
            <Slider
              label="s · atendentes"
              value={simS}
              min={1}
              max={8}
              step={1}
              onChange={setSimS}
            />
            <Slider
              label="tempo de serviço · min"
              value={simServ}
              min={2}
              max={15}
              step={0.5}
              onChange={setSimServ}
              display={simServ.toFixed(1)}
            />
          </div>

          {sim.unstable ? (
            <div
              style={{
                background: "rgba(187,59,36,.08)",
                border: "1px solid var(--critical-soft)",
                borderRadius: 10,
                padding: 22,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 34,
                  fontWeight: 600,
                  color: "var(--critical)",
                }}
              >
                ρ ≥ 1
              </div>
              <div
                style={{ fontSize: 13, color: "var(--critical)", marginTop: 8, fontWeight: 600 }}
              >
                Sistema instável — a fila cresce indefinidamente.
              </div>
              <div style={{ fontSize: 12, color: "var(--graphite)", marginTop: 4 }}>
                Aumente s ou reduza λ.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--faint)" }}>
                  ρ
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 26,
                    fontWeight: 600,
                    color: simRhoColor,
                    marginTop: 4,
                  }}
                >
                  {(sim.rho * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--faint)" }}>
                  Wq
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 26,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {(sim.Wq * 3600).toFixed(1)}s
                </div>
              </div>
              <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--faint)" }}>
                  Lq
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 26,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {sim.Lq.toFixed(2)}
                </div>
              </div>
              <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--faint)" }}>
                  W
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 26,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {(sim.W * 60).toFixed(1)}
                  <span style={{ fontSize: 13, color: "var(--faint)" }}>min</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <RecommendationPlaque rec={filas.rec} />
      </div>
    </div>
  );
}
