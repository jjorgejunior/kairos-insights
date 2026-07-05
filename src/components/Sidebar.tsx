import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ClientConfig, Section } from "@/data/clients";
import { fetchClientList } from "@/data/supabaseClients";
import { useAppStore } from "@/store/useAppStore";
import { calcEOQ, daysToConsume } from "@/utils/eoq";

const MONO = "var(--f-mono)";

const NAV: { r: Section; label: string; glyph: string }[] = [
  { r: "painel", label: "Painel executivo", glyph: "◧" },
  { r: "filas", label: "Filas de atendimento", glyph: "≋" },
  { r: "cronograma", label: "Cronograma · PERT", glyph: "⌥" },
  { r: "estoques", label: "Estoques · EOQ", glyph: "▤" },
  { r: "jogos", label: "Estratégia competitiva", glyph: "◈" },
  { r: "copiloto", label: "Copiloto de IA", glyph: "✦" },
];

function violaCountFor(client: ClientConfig): number {
  return client.estoque.skus.filter(([, , D, S, H, val]) => {
    const { Q } = calcEOQ(D, S, H);
    return daysToConsume(Q, D) > val;
  }).length;
}

export function Sidebar({ client, section }: { client: ClientConfig; section: Section }) {
  const navigate = useNavigate();
  const { data: clientList = [] } = useQuery({ queryKey: ["clientList"], queryFn: fetchClientList });
  const setLoading = useAppStore((s) => s.setLoading);
  const theme = useAppStore((s) => s.themes[client.id] ?? client.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const exportMenu = useAppStore((s) => s.exportMenu);
  const toggleExportMenu = useAppStore((s) => s.toggleExportMenu);
  const closeExportMenu = useAppStore((s) => s.closeExportMenu);
  const setPrint = useAppStore((s) => s.setPrint);

  const activeIndex = Math.max(
    0,
    NAV.findIndex((n) => n.r === section),
  );
  const viola = violaCountFor(client);
  const navFlags: Partial<Record<Section, string>> = {
    filas: client.filas.rec.accent === "critical" ? "!" : undefined,
    estoques: viola > 0 ? String(viola) : undefined,
  };

  const selectProject = (k: string) => {
    if (k === client.id) return;
    setLoading(true);
    setTimeout(() => {
      navigate({ to: "/$clientId/$section", params: { clientId: k, section: "painel" } });
      setLoading(false);
    }, 480);
  };

  const doExport = (scope: "section" | "all") => {
    closeExportMenu();
    setPrint(true, scope);
    setTimeout(() => {
      window.print();
      setPrint(false, scope);
    }, 380);
  };

  const sectionName = (
    {
      painel: "PAINEL",
      filas: "FILAS",
      cronograma: "PERT/CPM",
      estoques: "EOQ/EPQ",
      jogos: "JOGOS",
      copiloto: "COPILOTO",
    } as const
  )[section];

  return (
    <aside
      className="no-print sbscroll"
      style={{
        width: 238,
        flexShrink: 0,
        margin: "14px 0 14px 14px",
        color: "var(--ink)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 14,
        height: "calc(100vh - 28px)",
        borderRadius: 20,
        border: "1px solid var(--line)",
        overflow: "hidden",
        background:
          "radial-gradient(135% 50% at 50% -6%, rgba(110,155,209,.10), transparent 60%), linear-gradient(180deg,var(--panel),var(--paper))",
        boxShadow: "0 20px 48px rgba(0,0,0,.14),0 2px 8px rgba(0,0,0,.05)",
        transition: "background .45s ease, border-color .45s ease",
      }}
    >
      {/* logo */}
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: "1.5px solid var(--kairos-soft)",
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              background: "linear-gradient(160deg,rgba(110,155,209,.14),transparent)",
              boxShadow: "0 0 10px rgba(110,155,209,.14),inset 0 1px 0 rgba(255,255,255,.1)",
            }}
          >
            <div
              style={{ width: 2, height: 16, background: "var(--kairos-soft)", borderRadius: 2 }}
            />
            <div
              className="logodot"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--critical)",
                boxShadow: "0 0 8px var(--critical)",
              }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: ".15em", fontSize: 15 }}>KAIROS</div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: ".24em",
                color: "var(--kairos-soft)",
              }}
            >
              OPERATIONS · OS
            </div>
          </div>
        </div>
      </div>

      {/* project switcher */}
      <div style={{ padding: "14px 14px", borderBottom: "1px solid var(--line)" }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: ".2em",
            color: "var(--faint)",
            marginBottom: 9,
          }}
        >
          CLIENTES
        </div>
        {clientList.map((pr) => {
          const k = pr.id;
          const active = k === client.id;
          return (
            <button
              key={k}
              type="button"
              className="projbtn"
              onClick={() => selectProject(k)}
              style={{
                width: "100%",
                display: "block",
                padding: "10px 11px",
                borderRadius: 12,
                marginBottom: 5,
                cursor: "pointer",
                border: `1px solid ${active ? "var(--kairos-soft)" : "var(--line)"}`,
                background: active
                  ? "linear-gradient(180deg,rgba(110,155,209,.16),rgba(110,155,209,.04))"
                  : "transparent",
                boxShadow: active ? "0 4px 14px rgba(43,74,111,.14)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 29,
                    height: 29,
                    flexShrink: 0,
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    color: "#fff",
                    background: active
                      ? "linear-gradient(145deg,var(--kairos-soft),#33578a)"
                      : "linear-gradient(145deg,#8E929C,#6A6E77)",
                    boxShadow: active ? "0 3px 12px rgba(43,74,111,.4)" : "none",
                  }}
                >
                  {pr.initial}
                </div>
                <div style={{ textAlign: "left", lineHeight: 1.25, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {pr.short}
                  </div>
                  <div style={{ fontSize: 9.5, color: "var(--faint)", fontFamily: MONO }}>
                    {pr.industry}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--line)",
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: ".04em",
            color: "var(--faint)",
          }}
        >
          <span>{client.local}</span>
          <span>DADOS {client.periodo}</span>
        </div>
      </div>

      {/* nav */}
      <nav
        className="sbscroll"
        style={{
          padding: "16px 12px 12px",
          flex: 1,
          minHeight: 0,
          overflowX: "hidden",
          overflowY: "auto",
        }}
        aria-label="Diagnósticos"
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: ".2em",
            color: "var(--faint)",
            margin: "0 8px 11px",
          }}
        >
          DIAGNÓSTICOS
        </div>
        <div style={{ position: "relative" }}>
          <div className="navind" style={{ top: activeIndex * 44 }} />
          {NAV.map((n, idx) => {
            const active = section === n.r;
            const flag = navFlags[n.r];
            return (
              <Link
                key={n.r}
                to="/$clientId/$section"
                params={{ clientId: client.id, section: n.r }}
                className="navlink navin"
                aria-current={active ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  height: 40,
                  marginBottom: 4,
                  padding: "0 12px",
                  borderRadius: 11,
                  cursor: "pointer",
                  position: "relative",
                  zIndex: 1,
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--ink)" : "var(--graphite)",
                  ["--i" as string]: idx,
                }}
              >
                <span
                  className="navico"
                  aria-hidden="true"
                  style={{
                    width: 22,
                    textAlign: "center",
                    fontSize: 15,
                    color: active ? "var(--kairos)" : "var(--faint)",
                    textShadow: active ? "0 0 10px rgba(110,155,209,.45)" : undefined,
                  }}
                >
                  {n.glyph}
                </span>
                <span style={{ flex: 1, fontSize: 13.5 }}>{n.label}</span>
                {flag && (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: "rgba(224,118,92,.22)",
                      color: "#EBA491",
                      boxShadow: "0 0 0 1px rgba(224,118,92,.3)",
                    }}
                  >
                    {flag}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* footer: export + theme */}
      <div style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--line)" }}>
        <div style={{ position: "relative", display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            className="btn"
            onClick={toggleExportMenu}
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--chrome-fg)",
              background: "linear-gradient(180deg,var(--kairos-soft),#33578a)",
              border: "none",
              padding: "10px 12px",
              borderRadius: 10,
              cursor: "pointer",
              boxShadow: "0 3px 12px rgba(43,74,111,.4)",
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 11 }}>↧</span> Exportar{" "}
            <span style={{ fontFamily: MONO, fontSize: 9, opacity: 0.75 }}>▴</span>
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => toggleTheme(client.id)}
            title="Alternar tema claro/escuro deste cliente"
            style={{
              width: 40,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              color: "var(--ink)",
              background: "rgba(110,155,209,.10)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          {exportMenu && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "calc(100% + 8px)",
                background: "var(--panel)",
                border: "1px solid var(--line)",
                borderRadius: 11,
                boxShadow: "0 -8px 30px rgba(0,0,0,.22)",
                overflow: "hidden",
                zIndex: 40,
              }}
            >
              <button
                className="btn"
                onClick={() => doExport("section")}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "11px 13px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--line)",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                  Seção atual
                </div>
                <div style={{ fontSize: 10, color: "var(--faint)", marginTop: 2 }}>
                  Apenas “{sectionName}”
                </div>
              </button>
              <button
                className="btn"
                onClick={() => doExport("all")}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "11px 13px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                  Dossiê completo
                </div>
                <div style={{ fontSize: 10, color: "var(--faint)", marginTop: 2 }}>
                  Capa + todas as frentes
                </div>
              </button>
            </div>
          )}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 9.5,
            color: "var(--faint)",
            lineHeight: 1.7,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>REL. {client.version}</span>
          <span style={{ color: "var(--graphite)" }}>{client.autor}</span>
        </div>
      </div>
    </aside>
  );
}
