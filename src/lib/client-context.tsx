import { createContext, useContext, type ReactNode } from "react";
import type { ClientConfig } from "@/data/clients";

const ClientCtx = createContext<ClientConfig | null>(null);

export function ClientProvider({
  client,
  children,
}: {
  client: ClientConfig;
  children: ReactNode;
}) {
  return <ClientCtx.Provider value={client}>{children}</ClientCtx.Provider>;
}

/** The active engagement config. Screens read all their data from here. */
export function useClient(): ClientConfig {
  const c = useContext(ClientCtx);
  if (!c) throw new Error("useClient must be used within <ClientProvider>");
  return c;
}
