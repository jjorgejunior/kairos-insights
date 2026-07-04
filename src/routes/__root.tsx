import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const MONO = "var(--f-mono)";

function NotFoundComponent() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 600,
            fontSize: 72,
            color: "var(--kairos)",
            letterSpacing: "-.03em",
          }}
        >
          404
        </div>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--graphite)" }}>
          Página não encontrada.
        </p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          textAlign: "center",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: 28,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
          Erro ao carregar
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--graphite)" }}>
          Algo deu errado. Tente novamente.
        </p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          style={{
            marginTop: 16,
            padding: "10px 18px",
            borderRadius: 10,
            background: "var(--kairos)",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Recarregar
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kairos OS · Plataforma de Pesquisa Operacional" },
      {
        name: "description",
        content:
          "Kairos OS — plataforma de diagnóstico de Pesquisa Operacional: filas, cronograma PERT/CPM, estoques EOQ/EPQ, teoria dos jogos e copiloto de IA, reconfigurável por cliente.",
      },
      { name: "author", content: "Kairos Consulting" },
      { property: "og:title", content: "Kairos OS · Plataforma de Pesquisa Operacional" },
      {
        property: "og:description",
        content:
          "Diagnóstico operacional integrado, reconfigurável por cliente, com copiloto de IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
