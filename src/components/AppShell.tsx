import type { ReactNode } from "react";
import type { ClientConfig, Section } from "@/data/clients";
import { useAppStore } from "@/store/useAppStore";
import { ClientProvider } from "@/lib/client-context";
import { GlobalTooltip } from "@/components/GlobalTooltip";
import { Sidebar } from "@/components/Sidebar";

function LoadingOverlay() {
  return (
    <div
      className="no-print"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        background: "color-mix(in srgb, var(--paper) 74%, transparent)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            border: "2px solid var(--line)",
            borderTopColor: "var(--kairos)",
            borderRadius: "50%",
            animation: "spin .7s linear infinite",
          }}
        />
        <div
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            letterSpacing: ".15em",
            color: "var(--graphite)",
          }}
        >
          CARREGANDO ENGAJAMENTO…
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  client,
  section,
  children,
}: {
  client: ClientConfig;
  section: Section;
  children: ReactNode;
}) {
  const theme = useAppStore((s) => s.themes[client.id] ?? client.theme);
  const loading = useAppStore((s) => s.loading);

  return (
    <ClientProvider client={client}>
      <div
        data-theme={theme}
        className="appshell"
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          background: "var(--paper)",
          color: "var(--ink)",
          transition: "background-color .45s ease, color .4s ease",
        }}
      >
        <GlobalTooltip />
        {loading && <LoadingOverlay />}
        <Sidebar client={client} section={section} />
        <div
          className="canvas"
          style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", overflowX: "hidden" }}
        >
          <main style={{ minWidth: 0 }}>{children}</main>
        </div>
      </div>
    </ClientProvider>
  );
}
