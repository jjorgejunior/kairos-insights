import { useAppStore, type Tab } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Activity, GitBranch, Package, Swords, Bot, FileDown } from 'lucide-react';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'filas', label: 'Teoria das Filas', icon: Activity },
  { id: 'pert', label: 'PERT / CPM', icon: GitBranch },
  { id: 'estoques', label: 'Estoques EOQ/EPQ', icon: Package },
  { id: 'jogos', label: 'Teoria dos Jogos', icon: Swords },
  { id: 'copiloto', label: 'Copiloto de IA', icon: Bot },
];

export function Header() {
  const { activeTab, setActiveTab } = useAppStore();
  return (
    <div className="sticky top-0 z-40 bg-[color:var(--bg-carbon)]/95 backdrop-blur border-b border-[color:var(--border-subtle)] no-print">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[color:var(--gold)] to-[color:var(--gold-light)] flex items-center justify-center text-[color:var(--bg-carbon)] font-bold text-lg shadow-lg">K</div>
          <div>
            <div className="text-sm font-semibold text-[color:var(--gold-light)] tracking-wide">Kairos Consulting</div>
            <div className="text-xs text-[color:var(--slate)]">McDonald's · Salvador Shopping · Dashboard Executivo</div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-[color:var(--bg-panel-2)] border border-[color:var(--border-subtle)] hover:border-[color:var(--gold)] transition-colors text-[color:var(--slate-light)]"
        >
          <FileDown size={14} /> Exportar PDF
        </button>
      </div>
      <div className="max-w-[1400px] mx-auto px-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-fit">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  active
                    ? 'border-[color:var(--gold)] text-[color:var(--gold-light)]'
                    : 'border-transparent text-[color:var(--slate)] hover:text-[color:var(--slate-light)]',
                )}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
