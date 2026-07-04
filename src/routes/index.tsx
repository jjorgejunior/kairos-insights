import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_CLIENT } from "@/data/clients";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({
      to: "/$clientId/$section",
      params: { clientId: DEFAULT_CLIENT, section: "painel" },
    });
  },
});
