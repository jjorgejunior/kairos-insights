import type { ClientConfig } from "@/data/clients";

const MONO = "var(--f-mono)";

/** Dossier cover page — only rendered in the print layer. */
export function PrintCover({ client }: { client: ClientConfig }) {
  const meta: [string, string][] = [
    ["CLIENTE", client.short],
    ["SETOR", client.industry],
    ["PERÍODO", client.periodo],
    ["ANALISTA", client.autor],
    ["VERSÃO", client.version],
  ];
  return (
    <div className="print-only" style={{ padding: "0 0 30px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
        <div
          style={{
            width: 38,
            height: 38,
            border: "1.5px solid var(--kairos)",
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div style={{ width: 2, height: 18, background: "var(--kairos)" }} />
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--critical)",
            }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 800, letterSpacing: ".14em", fontSize: 16 }}>
            KAIROS CONSULTING
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: ".2em",
              color: "var(--graphite)",
            }}
          >
            PESQUISA OPERACIONAL
          </div>
        </div>
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: ".2em",
          color: "var(--kairos)",
          marginBottom: 16,
        }}
      >
        DOSSIÊ DE DIAGNÓSTICO OPERACIONAL
      </div>
      <h1
        style={{
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: "-.02em",
          lineHeight: 1.08,
          margin: "0 0 12px",
          maxWidth: 680,
        }}
      >
        {client.headline}
      </h1>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--graphite)",
          maxWidth: 640,
          margin: "0 0 30px",
        }}
      >
        {client.resumo}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 14,
          borderTop: "2px solid var(--ink)",
          borderBottom: "1px solid var(--line)",
          padding: "16px 0",
          fontFamily: MONO,
          fontSize: 11,
        }}
      >
        {meta.map(([k, v]) => (
          <div key={k}>
            <div style={{ color: "var(--faint)" }}>{k}</div>
            <div style={{ fontWeight: 600, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact per-section print header (single-section export). */
export function PrintSectionHeader({
  client,
  sectionName,
}: {
  client: ClientConfig;
  sectionName: string;
}) {
  return (
    <div
      className="print-only"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "2px solid var(--ink)",
        padding: "0 0 12px",
        marginBottom: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ fontWeight: 800, letterSpacing: ".14em", fontSize: 13 }}>KAIROS</div>
        <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--graphite)" }}>
          · {client.short} · {sectionName}
        </span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>
        {client.periodo} · {client.version}
      </div>
    </div>
  );
}
