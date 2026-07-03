import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/store/useAppStore";
import { Header } from "@/components/Header";
import { FilasTab } from "@/components/tabs/FilasTab";
import { PertTab } from "@/components/tabs/PertTab";
import { EstoquesTab } from "@/components/tabs/EstoquesTab";
import { JogosTab } from "@/components/tabs/JogosTab";
import { CopilotoTab } from "@/components/tabs/CopilotoTab";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const activeTab = useAppStore((s) => s.activeTab);
  return (
    <div className="min-h-screen bg-[color:var(--bg-carbon)]">
      <Header />
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {activeTab === 'filas' && <FilasTab />}
        {activeTab === 'pert' && <PertTab />}
        {activeTab === 'estoques' && <EstoquesTab />}
        {activeTab === 'jogos' && <JogosTab />}
        {activeTab === 'copiloto' && <CopilotoTab />}
      </main>
      <footer className="max-w-[1400px] mx-auto px-6 py-6 text-center text-xs text-[color:var(--slate)]/60 no-print">
        Kairos Consulting · Pesquisa Operacional II · Dashboard interno
      </footer>
    </div>
  );
}
