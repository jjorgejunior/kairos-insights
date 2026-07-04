import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$clientId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$clientId/$section",
      params: { clientId: params.clientId, section: "painel" },
    });
  },
});
