import { createFileRoute, redirect, Outlet, useParams } from "@tanstack/react-router";
import { CLIENTS, DEFAULT_CLIENT, isClient, isSection, type Section } from "@/data/clients";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/$clientId")({
  beforeLoad: ({ params }) => {
    if (!isClient(params.clientId)) {
      throw redirect({
        to: "/$clientId/$section",
        params: { clientId: DEFAULT_CLIENT, section: "painel" },
      });
    }
  },
  component: ClientLayout,
});

function ClientLayout() {
  const { clientId } = Route.useParams();
  const child = useParams({ strict: false }) as { section?: string };
  const client = CLIENTS[clientId];
  const section: Section = isSection(child.section) ? child.section : "painel";
  return (
    <AppShell client={client} section={section}>
      <Outlet />
    </AppShell>
  );
}
