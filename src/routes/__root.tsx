import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-[color:var(--gold-light)] kpi-value">404</h1>
        <p className="mt-4 text-sm text-[color:var(--slate)]">Página não encontrada.</p>
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center card-elevated p-6">
        <h1 className="text-xl font-semibold text-[color:var(--gold-light)]">Erro ao carregar</h1>
        <p className="mt-2 text-sm text-[color:var(--slate)]">Algo deu errado. Tente novamente.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-4 px-4 py-2 rounded-lg bg-[color:var(--gold)] text-[color:var(--bg-carbon)] font-semibold text-sm"
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
      { title: "Kairos Consulting · Dashboard Executivo — McDonald's Salvador Shopping" },
      { name: "description", content: "Diagnóstico operacional integrado: Teoria das Filas, PERT/CPM, Estoques EOQ/EPQ e Teoria dos Jogos com copiloto de IA." },
      { name: "author", content: "Kairos Consulting" },
      { property: "og:title", content: "Kairos Consulting · Dashboard Executivo" },
      { property: "og:description", content: "Pesquisa Operacional aplicada — McDonald's Salvador Shopping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
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
