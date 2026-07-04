import { useState } from "react";
import { useClient } from "@/lib/client-context";
import { findNashPure, checkDominance } from "@/utils/nash";
import type { GameScenario } from "@/data/clients";
import { ScreenHead, RecommendationPlaque, Pill } from "@/components/ui-kit";
import { DataTable, type Column } from "@/components/ui-kit/DataTable";
import { fmt } from "@/utils/format";

const MONO = "var(--f-mono)";

/* --------------------------------------------------------- PrecosCampo */
interface PrecoRow {
  categoria: string;
  precos: (number | null)[];
}

function PrecosCampo({
  players,
  rows,
  label,
}: {
  players: string[];
  rows: PrecoRow[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const columns: Column<PrecoRow>[] = [
    { key: "categoria", header: "Categoria", accessor: (r) => r.categoria },
    ...players.map(
      (p, i): Column<PrecoRow> => ({
        key: p,
        header: p,
        align: "right",
        mono: true,
        render: (r) => (r.precos[i] != null ? `R$ ${fmt(r.precos[i] as number, 2)}` : "—"),
      }),
    ),
  ];

  return (
    <div
      className="card no-print"
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: 18,
        marginBottom: 16,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ink)",
        }}
      >
        <span>Ver preços coletados em campo (Salvador Shopping)</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--faint)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ marginTop: 16 }}>
          <DataTable columns={columns} data={rows} />
          {label && (
            <div style={{ marginTop: 10 }}>
              <Pill label={label} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ PayoffMatrix */
function PayoffMatrix({ cen, nash }: { cen: GameScenario; nash: [number, number][] }) {
  const isNash = (i: number, j: number) => nash.some(([a, b]) => a === i && b === j);
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
          <thead>
            <tr>
              <th />
              <th
                colSpan={cen.estColuna.length}
                style={{
                  padding: 6,
                  fontFamily: MONO,
                  fontSize: 11,
                  color: "var(--kairos)",
                  fontWeight: 600,
                }}
              >
                {cen.coluna} →
              </th>
            </tr>
            <tr>
              <th />
              {cen.estColuna.map((c) => (
                <th
                  key={c}
                  style={{
                    padding: "8px 10px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "var(--graphite)",
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                    minWidth: 110,
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cen.matrix.map((row, i) => (
              <tr key={i}>
                <th
                  style={{
                    padding: "8px 10px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "var(--graphite)",
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                    textAlign: "left",
                    maxWidth: 120,
                  }}
                >
                  {i === 0 && (
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 9,
                        color: "var(--kairos)",
                        display: "block",
                      }}
                    >
                      ↓ {cen.linha}
                    </span>
                  )}
                  {cen.estLinha[i]}
                </th>
                {row.map(([rP, cP], j) => {
                  const nashCell = isNash(i, j);
                  return (
                    <td
                      key={j}
                      className={nashCell ? "mcell nashring" : "mcell"}
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        border: "1px solid var(--line)",
                        minWidth: 120,
                        background: nashCell ? "rgba(46,112,80,.12)" : "var(--panel)",
                        outline: nashCell ? "2px solid var(--optimal)" : undefined,
                        outlineOffset: nashCell ? -2 : undefined,
                      }}
                    >
                      <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600 }}>
                        <span style={{ color: "var(--kairos)" }}>{rP}</span>
                        <span style={{ color: "var(--faint)", margin: "0 3px" }}>,</span>
                        <span style={{ color: "var(--critical)" }}>{cP}</span>
                      </div>
                      {nashCell && (
                        <div
                          style={{
                            fontFamily: MONO,
                            fontSize: 9,
                            fontWeight: 600,
                            color: "var(--optimal)",
                            marginTop: 6,
                            letterSpacing: ".08em",
                          }}
                        >
                          ★ NASH
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: "var(--faint)", margin: "14px 0 0", fontFamily: MONO }}>
        célula = (<span style={{ color: "var(--kairos)" }}>payoff {cen.linha}</span>,{" "}
        <span style={{ color: "var(--critical)" }}>payoff {cen.coluna}</span>)
      </p>
    </>
  );
}

/* --------------------------------------------------------------- JogosScreen */
export function JogosScreen() {
  const client = useClient();
  const [jSel, setJSel] = useState(client.jogos.selected);
  const cen = client.jogos.cenarios[jSel] || client.jogos.cenarios[0];
  const nash = findNashPure(cen.matrix);
  const dom = checkDominance(cen.matrix);

  const hasDomNash = dom.rowDominant != null && dom.colDominant != null;

  return (
    <div
      className="kview print-break"
      style={{ maxWidth: 1120, margin: "0 auto", padding: "34px 30px 70px" }}
    >
      <ScreenHead eyebrow="EQUILÍBRIO DE NASH" title="Decisões competitivas" />

      <div
        className="no-print"
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}
      >
        {client.jogos.cenarios.map((c, i) => {
          const active = jSel === i;
          return (
            <button
              key={c.id}
              className="btn"
              onClick={() => setJSel(i)}
              style={{
                padding: "8px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                borderRadius: 7,
                cursor: "pointer",
                border: `1px solid ${active ? "var(--chrome)" : "var(--line)"}`,
                background: active ? "var(--chrome)" : "var(--panel)",
                color: active ? "var(--chrome-fg)" : "var(--graphite)",
              }}
            >
              {c.titulo}
            </button>
          );
        })}
      </div>

      {client.jogos.precosCampo && client.jogos.precosCampo.length > 0 && (
        <PrecosCampo
          players={client.jogos.precosCampoPlayers ?? []}
          rows={client.jogos.precosCampo}
          label={client.jogos.precosCampoLabel}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* matrix */}
        <div
          className="card"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{cen.titulo}</h3>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: "var(--graphite)",
                background: "var(--paper)",
                border: "1px solid var(--line)",
                padding: "3px 8px",
                borderRadius: 5,
              }}
            >
              {cen.tipo}
            </span>
          </div>
          <PayoffMatrix cen={cen} nash={nash} />
        </div>

        {/* insights */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            className="card"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: ".1em",
                color: "var(--faint)",
                marginBottom: 8,
              }}
            >
              LEITURA ESTRATÉGICA
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)", margin: 0 }}>
              {cen.leitura}
            </p>
          </div>

          <div
            className="card"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderLeft: "3px solid var(--optimal)",
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: ".1em",
                color: "var(--faint)",
                marginBottom: 10,
              }}
            >
              EQUILÍBRIOS DE NASH PUROS
            </div>
            {nash.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--graphite)", margin: 0 }}>
                Nenhum equilíbrio puro — requer estratégias mistas.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {nash.map(([i, j]) => (
                  <div
                    key={`${i}-${j}`}
                    style={{ background: "var(--paper)", borderRadius: 8, padding: "10px 12px" }}
                  >
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--optimal)",
                      }}
                    >
                      ({cen.estLinha[i]}, {cen.estColuna[j]})
                    </div>
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: "var(--graphite)",
                        marginTop: 2,
                      }}
                    >
                      payoffs = ({cen.matrix[i][j][0]}, {cen.matrix[i][j][1]})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="card"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: ".1em",
                color: "var(--faint)",
                marginBottom: 10,
              }}
            >
              DOMINÂNCIA ESTRITA
            </div>
            <div style={{ fontSize: 12.5, marginBottom: 8 }}>
              <span style={{ color: "var(--graphite)" }}>{cen.linha}:</span>{" "}
              <span style={{ fontWeight: 600 }}>
                {dom.rowDominant != null ? cen.estLinha[dom.rowDominant] : "—"}
              </span>
              <div
                style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--kairos)", marginTop: 2 }}
              >
                {dom.rowProof || "sem dominância estrita"}
              </div>
            </div>
            <div style={{ fontSize: 12.5 }}>
              <span style={{ color: "var(--graphite)" }}>{cen.coluna}:</span>{" "}
              <span style={{ fontWeight: 600 }}>
                {dom.colDominant != null ? cen.estColuna[dom.colDominant] : "—"}
              </span>
              <div
                style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--critical)", marginTop: 2 }}
              >
                {dom.colProof || "sem dominância estrita"}
              </div>
            </div>
            {hasDomNash && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  background: "rgba(46,112,80,.1)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--ink)",
                }}
              >
                <strong>IEDS → Nash único:</strong>{" "}
                <span style={{ fontFamily: MONO, color: "var(--optimal)" }}>
                  ({cen.estLinha[dom.rowDominant!]}, {cen.estColuna[dom.colDominant!]}) = (
                  {cen.matrix[dom.rowDominant!][dom.colDominant!][0]},{" "}
                  {cen.matrix[dom.rowDominant!][dom.colDominant!][1]})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <RecommendationPlaque rec={client.jogos.rec} />
    </div>
  );
}
