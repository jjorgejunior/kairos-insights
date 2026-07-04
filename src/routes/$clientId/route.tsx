import { createFileRoute, redirect, Outlet, useParams } from "@tanstack/react-router";
import { DEFAULT_CLIENT, isSection, type Section } from "@/data/clients";
import { fetchClientConfig } from "@/data/supabaseClients";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/$clientId")({
  loader: async ({ params, context }) => {
    const client = await context.queryClient.ensureQueryData({
      queryKey: ["client", params.clientId],
      queryFn: () => fetchClientConfig(params.clientId),
    });
    if (!client) {
      throw redirect({
        to: "/$clientId/$section",
        params: { clientId: DEFAULT_CLIENT, section: "painel" },
      });
    }
    return client;
  },
  component: ClientLayout,
});

function ClientLayout() {
  const client = Route.useLoaderData();
  const child = useParams({ strict: false }) as { section?: string };
  const section: Section = isSection(child.section) ? child.section : "painel";
  return (
    <AppShell client={client} section={section}>
      <Outlet />
    </AppShell>
  );
}
