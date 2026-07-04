import { useEffect, useRef, useState, type FormEvent } from "react";
import { toRawActivities } from "@/data/clients";
import { useClient } from "@/lib/client-context";
import { useAppStore, type ChatMessage } from "@/store/useAppStore";
import { calcMMs } from "@/utils/queuing";
import { derivePert, runCrashing } from "@/utils/pert";
import { calcEOQ, daysToConsume } from "@/utils/eoq";
import { brl } from "@/utils/format";
import { ScreenHead, Pill } from "@/components/ui-kit";
import { buildSystemPrompt, sendMessage } from "@/services/geminiService";

const MONO = "var(--f-mono)";

/* -------------------------------------------------------------- markdown */
// Minimal, escaped-first markdown renderer mirroring the prototype's _md/_inline.
function inlineMd(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`(.+?)`/g,
      '<code style="font-family:var(--f-mono);font-size:.92em;background:var(--paper);padding:1px 5px;border-radius:4px">$1</code>',
    );
}

function renderMd(text: string): string {
  const esc = (text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = esc.split(/\n/);
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const raw of lines) {
    const l = raw.trim();
    if (l === "") {
      closeList();
      continue;
    }
    if (/^---+$/.test(l)) {
      closeList();
      out.push('<hr style="border:none;border-top:1px solid var(--line);margin:10px 0"/>');
      continue;
    }
    const mH = l.match(/^(#{1,4})\s+(.*)$/);
    if (mH) {
      closeList();
      const sz = [16, 15, 14, 13][mH[1].length - 1];
      out.push(
        `<div style="font-weight:700;font-size:${sz}px;margin:10px 0 4px">${inlineMd(mH[2])}</div>`,
      );
      continue;
    }
    if (/^[-*]\s+/.test(l)) {
      if (!inList) {
        out.push('<ul style="margin:4px 0;padding-left:18px">');
        inList = true;
      }
      out.push(`<li style="margin:2px 0">${inlineMd(l.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    const mO = l.match(/^\d+\.\s+(.*)$/);
    if (mO) {
      if (!inList) {
        out.push('<ul style="margin:4px 0;padding-left:18px">');
        inList = true;
      }
      out.push(`<li style="margin:2px 0">${inlineMd(mO[1])}</li>`);
      continue;
    }
    closeList();
    out.push(`<div style="margin:3px 0">${inlineMd(l)}</div>`);
  }
  closeList();
  return out.join("");
}

/* -------------------------------------------------------------- screen */
export function CopilotoScreen() {
  const client = useClient();
  const chats = useAppStore((s) => s.chats);
  const setChat = useAppStore((s) => s.setChat);
  const clearChat = useAppStore((s) => s.clearChat);

  const chat = chats[client.id] ?? [];

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ---------- derived knowledge base ----------
  const f = client.filas.canais[0];
  const mm = calcMMs(f.lambda, f.mu, f.s);
  const pt = derivePert(toRawActivities(client.pert.atividades));
  const crashTarget = runCrashing(pt.acts, client.pert.budget, pt.duracao);
  const eRows = client.estoque.skus.map(([, , D, S, H, val]) => {
    const { Q } = calcEOQ(D, S, H);
    return { viola: daysToConsume(Q, D) > val };
  });
  const violaCount = eRows.filter((r) => r.viola).length;
  const cen0 = client.jogos.cenarios[0];

  const kbRows: { k: string; v: string }[] = [
    { k: `λ ${f.label}`, v: `${f.lambda}/h` },
    { k: "μ", v: `${f.mu}/h` },
    { k: "s", v: `${f.s}` },
    { k: "ρ", v: `${(mm.rho * 100).toFixed(1)}%` },
    { k: "Wq", v: `${(mm.Wq * 3600).toFixed(0)}s` },
    { k: "PERT · Te", v: `${pt.duracao.toFixed(1)}d` },
    { k: "PERT · σ", v: `${pt.sigma.toFixed(2)}d` },
    { k: "PERT · críticas", v: `${pt.cp.length}/${pt.acts.length}` },
    {
      k: "Crashing alvo",
      v: `${brl(crashTarget.spent)} → ${crashTarget.finalDuration.toFixed(0)}d`,
    },
    { k: "SKUs", v: `${eRows.length}` },
    { k: "SKUs viola validade", v: `${violaCount}/${eRows.length}` },
    { k: "Cenários de jogos", v: `${client.jogos.cenarios.length}` },
  ];

  const quickChips = [
    `Calcule ρ para λ=${f.lambda}/h, μ=${f.mu}/h, s=${f.s}`,
    "Quais atividades priorizar no crashing e por quê?",
    "O que acontece com o custo total se H subir 20% no SKU selecionado?",
    `Qual estratégia recomenda no cenário "${cen0.titulo}"?`,
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, loading, error]);

  async function send(msg: string) {
    const text = msg.trim();
    if (!text || loading) return;
    const history: ChatMessage[] = [...chat, { role: "user", content: text, t: Date.now() }];
    setChat(client.id, history);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const reply = await sendMessage({
        history: chat.map((m) => ({ role: m.role, content: m.content })),
        userMessage: text,
        systemPrompt: buildSystemPrompt(client),
      });
      setChat(client.id, [...history, { role: "model", content: reply, t: Date.now() }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao consultar o modelo. Tente reenviar.");
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    const last = [...chat].reverse().find((m) => m.role === "user");
    if (last) send(last.content);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="kview" style={{ maxWidth: 1120, margin: "0 auto", padding: "34px 30px 40px" }}>
      <ScreenHead eyebrow="COPILOTO" title="Copiloto do engajamento" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginTop: 20 }}>
        {/* ---------------- LEFT ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* chat header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--kairos)" }}
              />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Copiloto · {client.short}</span>
              <Pill label="Gemini API" color="var(--kairos)" />
            </div>
            <button
              className="no-print"
              onClick={() => clearChat(client.id)}
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--graphite)",
                background: "transparent",
                border: "1px solid var(--line)",
                borderRadius: 6,
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Limpar conversa
            </button>
          </div>

          {/* quick chips */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
            className="no-print"
          >
            {quickChips.map((q) => (
              <button
                key={q}
                className="chip"
                onClick={() => send(q)}
                style={{
                  textAlign: "left",
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 12.5,
                  color: "var(--ink)",
                  cursor: "pointer",
                  lineHeight: 1.4,
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* chat card */}
          <div
            className="card"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              height: 460,
            }}
          >
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                paddingRight: 6,
              }}
            >
              {chat.length === 0 && !loading && !error && (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    color: "var(--faint)",
                    fontSize: 13,
                    maxWidth: 280,
                  }}
                >
                  Pergunte algo sobre este engajamento. A resposta cita a fórmula ou o critério
                  usado (ρ, Q*, folga, Nash…).
                </div>
              )}

              {chat.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={`${m.t}-${i}`}
                    className="msg-in"
                    style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}
                  >
                    <div
                      style={{
                        maxWidth: "82%",
                        padding: "11px 14px",
                        borderRadius: 14,
                        fontSize: 13.5,
                        lineHeight: 1.55,
                        ...(isUser
                          ? {
                              background: "var(--chrome)",
                              color: "var(--chrome-fg)",
                              borderBottomRightRadius: 4,
                            }
                          : {
                              background: "var(--panel)",
                              color: "var(--ink)",
                              border: "1px solid var(--line)",
                              borderBottomLeftRadius: 4,
                            }),
                      }}
                    >
                      {isUser ? (
                        m.content
                      ) : (
                        <span dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    className="card"
                    style={{
                      background: "var(--panel)",
                      border: "1px solid var(--line)",
                      borderRadius: 14,
                      padding: "14px 16px",
                      display: "flex",
                      gap: 5,
                    }}
                  >
                    <span className="kdot" />
                    <span className="kdot" style={{ animationDelay: ".15s" }} />
                    <span className="kdot" style={{ animationDelay: ".3s" }} />
                  </div>
                </div>
              )}

              {error && (
                <div
                  style={{
                    background: "rgba(187,59,36,.08)",
                    border: "1px solid var(--critical-soft)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 12.5,
                    color: "var(--critical)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span>{error}</span>
                  <button
                    onClick={retry}
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#fff",
                      background: "var(--critical)",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Reenviar
                  </button>
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", gap: 8, marginTop: 14 }}
              className="no-print"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre filas, PERT, EOQ ou jogos…"
                style={{
                  flex: 1,
                  padding: "11px 14px",
                  borderRadius: 9,
                  border: "1px solid var(--line)",
                  background: "var(--paper)",
                  fontFamily: "var(--f-display)",
                  fontSize: 13.5,
                  color: "var(--ink)",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "11px 18px",
                  borderRadius: 9,
                  background: "var(--kairos)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Enviar
              </button>
            </form>
          </div>
        </div>

        {/* ---------------- RIGHT ---------------- */}
        <aside
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 18,
            height: "fit-content",
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: ".1em",
              color: "var(--faint)",
              marginBottom: 4,
            }}
          >
            BASE DE CONHECIMENTO
          </div>
          <p
            style={{ fontSize: 11, color: "var(--graphite)", margin: "0 0 12px", lineHeight: 1.4 }}
          >
            Indicadores do engajamento disponíveis ao copiloto como contexto.
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {kbRows.map((r) => (
              <div
                key={r.k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "7px 0",
                  borderTop: "1px solid var(--line-2)",
                }}
              >
                <span style={{ fontSize: 11.5, color: "var(--graphite)" }}>{r.k}</span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "var(--kairos)",
                    textAlign: "right",
                  }}
                >
                  {r.v}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
