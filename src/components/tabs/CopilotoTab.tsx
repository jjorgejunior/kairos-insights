import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { sendMessage } from '@/services/geminiService';
import { PROJECT_DATA } from '@/data/projectData';
import { Bot, Send, KeyRound, RefreshCcw, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/Badge';

const QUICK_CARDS = [
  { icon: '🔵', theme: 'Filas', question: 'Quantos atendentes recomenda para o totem no pico de jantar, e qual o impacto esperado em Wq?' },
  { icon: '🔴', theme: 'PERT',  question: 'Quais atividades do caminho crítico devem ser priorizadas para crashing e por quê?' },
  { icon: '🟡', theme: 'EOQ',   question: 'O que acontece com o custo total se o custo de manutenção (H) subir 20% no SKU de carne?' },
  { icon: '⚪', theme: 'Jogos', question: 'Qual estratégia de preço a unidade deveria adotar frente ao Madero, com base no equilíbrio de Nash?' },
];

const QUICK_PILLS = [
  'Calcule ρ para λ=25/h, μ=7.6/h, s=3',
  'Explique a folga da atividade K',
  'Qual o custo mínimo para reduzir o projeto a 70 dias?',
  'Interprete P(T ≤ 80) = 53%',
  'Recomende política de estoque para pão brioche',
];

// Minimal markdown: **bold** -> <strong>, newlines -> <br/>
function renderMarkdown(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export function CopilotoTab() {
  const { geminiApiKey, setGeminiApiKey, clearGeminiApiKey, chatHistory, addMessage } = useAppStore();
  const [keyInput, setKeyInput] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  if (!geminiApiKey) {
    return (
      <div className="card-elevated p-8 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[color:var(--gold)]/20 flex items-center justify-center">
            <KeyRound className="text-[color:var(--gold-light)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--gold-light)]">Configurar Gemini API</h2>
            <p className="text-xs text-[color:var(--slate)]">A chave fica somente na memória da sessão (Zustand). Nunca é salva em localStorage nem enviada ao servidor.</p>
          </div>
        </div>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="Cole sua API key do Gemini (AIza...)"
          className="w-full px-3 py-2 rounded-lg bg-[color:var(--bg-panel-2)] border border-[color:var(--border-subtle)] text-sm text-[color:var(--slate-light)] focus:outline-none focus:border-[color:var(--gold)]"
        />
        <div className="flex items-center justify-between">
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-xs text-[color:var(--gold-light)] hover:underline inline-flex items-center gap-1">
            Obter chave gratuita em aistudio.google.com/apikey <ExternalLink size={11} />
          </a>
          <button
            onClick={() => keyInput.trim() && setGeminiApiKey(keyInput.trim())}
            disabled={!keyInput.trim()}
            className="px-4 py-2 rounded-lg bg-[color:var(--gold)] text-[color:var(--bg-carbon)] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ativar Consultor
          </button>
        </div>
      </div>
    );
  }

  const send = async (msg: string) => {
    const trimmed = msg.trim();
    if (!trimmed || loading) return;
    setError(null);
    addMessage({ role: 'user', content: trimmed, timestamp: Date.now() });
    setInput('');
    setLoading(true);
    try {
      const history = chatHistory.map((m) => ({ role: m.role, parts: m.content }));
      const reply = await sendMessage(geminiApiKey, history, trimmed);
      addMessage({ role: 'model', content: reply, timestamp: Date.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="card-elevated p-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="text-[color:var(--gold-light)]" size={22} />
              <span className="absolute -right-1 -bottom-1 w-2.5 h-2.5 rounded-full bg-[color:var(--green-ok)] ring-2 ring-[color:var(--bg-panel)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[color:var(--gold-light)]">Consultor PO II — Kairos Consulting</h3>
              <p className="text-[11px] text-[color:var(--slate)]">Explicabilidade obrigatória · Português técnico</p>
            </div>
            <Badge variant="gold">Gemini API</Badge>
          </div>
          <button
            onClick={clearGeminiApiKey}
            className="text-xs flex items-center gap-1 text-[color:var(--slate)] hover:text-[color:var(--crimson-soft)]"
          >
            <RefreshCcw size={12} /> Alterar chave
          </button>
        </div>

        {/* Quick cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_CARDS.map((c) => (
            <button
              key={c.theme}
              onClick={() => send(c.question)}
              className="card-elevated p-3 text-left hover:border-[color:var(--gold)] transition-colors"
            >
              <div className="text-xl">{c.icon}</div>
              <div className="text-xs uppercase text-[color:var(--slate)] tracking-wider mt-1">{c.theme}</div>
              <div className="text-xs text-[color:var(--slate-light)] mt-1 leading-snug">{c.question}</div>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="card-elevated p-4 h-[500px] flex flex-col">
          <div className="flex-1 overflow-auto space-y-3 pr-2">
            {chatHistory.length === 0 && (
              <div className="text-center text-[color:var(--slate)] text-sm py-16">
                Faça sua primeira pergunta — o consultor sempre citará a fórmula ou conceito utilizado.
              </div>
            )}
            {chatHistory.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#1e2a4a] text-[color:var(--slate-light)] rounded-br-sm'
                      : 'bg-[color:var(--bg-panel-2)] text-[color:var(--slate-light)] rounded-bl-sm border border-[color:var(--border-subtle)]'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl bg-[color:var(--bg-panel-2)] border border-[color:var(--border-subtle)]">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[color:var(--gold)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[color:var(--gold)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[color:var(--gold)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-[color:var(--crimson)]/15 border border-[color:var(--crimson)]/40 text-xs text-[color:var(--crimson-soft)]">
                {error}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="mt-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Pergunte algo sobre filas, PERT, EOQ ou jogos..."
              className="flex-1 px-3 py-2 rounded-lg bg-[color:var(--bg-panel-2)] border border-[color:var(--border-subtle)] text-sm text-[color:var(--slate-light)] focus:outline-none focus:border-[color:var(--gold)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded-lg bg-[color:var(--gold)] text-[color:var(--bg-carbon)] font-semibold disabled:opacity-50 flex items-center gap-1"
            >
              <Send size={16} />
            </button>
          </form>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_PILLS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                disabled={loading}
                className="text-[11px] px-2 py-1 rounded-full bg-[color:var(--bg-panel-2)] border border-[color:var(--border-subtle)] text-[color:var(--slate)] hover:text-[color:var(--gold-light)] hover:border-[color:var(--gold)] transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Knowledge base panel */}
      <aside className="card-elevated p-4 h-fit">
        <h3 className="text-sm font-semibold text-[color:var(--gold-light)] mb-1">Base de conhecimento interna</h3>
        <p className="text-[11px] text-[color:var(--slate)] mb-3">Dados fornecidos ao consultor a cada pergunta.</p>
        <table className="w-full text-xs">
          <tbody className="divide-y divide-[color:var(--border-subtle)]">
            <KbRow k="λ campo (média)" v={`${PROJECT_DATA.lambda_campo_media}/h`} />
            <KbRow k="μ campo" v={`${PROJECT_DATA.filas_campo.servico.mu_hora.toFixed(2)}/h`} />
            <KbRow k="s atendentes" v={PROJECT_DATA.filas_campo.s_atendentes} />
            <KbRow k="CV serviço" v={PROJECT_DATA.filas_campo.servico.cv.toFixed(2)} />
            <KbRow k="PERT — duração Te" v={`${PROJECT_DATA.pert_meta.duracao_total} dias`} />
            <KbRow k="PERT — σ CP" v={`${PROJECT_DATA.pert_meta.desvio_padrao_cp} dias`} />
            <KbRow k="PERT — críticas" v={`${PROJECT_DATA.pert_meta.caminho_critico.length}/${PROJECT_DATA.pert_atividades.length}`} />
            <KbRow k="Crashing alvo" v={`R$${PROJECT_DATA.pert_meta.crashing_alvo.gasto_esperado.toLocaleString('pt-BR')} → ${PROJECT_DATA.pert_meta.crashing_alvo.duracao_final}d`} />
            <KbRow k="SKUs total" v={PROJECT_DATA.skus.length} />
            <KbRow k="SKUs viola validade" v={`12/${PROJECT_DATA.skus.length}`} />
            <KbRow k="Cenários de jogos" v={PROJECT_DATA.jogos_cenarios.length} />
          </tbody>
        </table>
      </aside>
    </div>
  );
}

function KbRow({ k, v }: { k: string; v: string | number }) {
  return (
    <tr>
      <td className="py-1.5 text-[color:var(--slate)] pr-2">{k}</td>
      <td className="py-1.5 text-right kpi-value text-[color:var(--gold-light)]">{v}</td>
    </tr>
  );
}
