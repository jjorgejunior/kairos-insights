import { useMemo, useState } from 'react';
import { PROJECT_DATA } from '@/data/projectData';
import { findNashPure, checkDominance } from '@/utils/nash';
import { Badge } from '@/components/Badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, Target } from 'lucide-react';

export function JogosTab() {
  const { jogos_cenarios } = PROJECT_DATA;
  const [id, setId] = useState(jogos_cenarios[0].id);
  const scenario = jogos_cenarios.find((s) => s.id === id)!;

  const nash = useMemo(() => findNashPure(scenario.matrix), [scenario]);
  const dom = useMemo(() => checkDominance(scenario.matrix), [scenario]);
  const isNash = (i: number, j: number) => nash.some(([a, b]) => a === i && b === j);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {jogos_cenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => setId(s.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
              id === s.id
                ? 'bg-[color:var(--gold)] text-[color:var(--bg-carbon)] border-[color:var(--gold)]'
                : 'bg-[color:var(--bg-panel-2)] text-[color:var(--slate-light)] border-[color:var(--border-subtle)] hover:border-[color:var(--gold)]'
            )}
          >
            {s.titulo}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payoff matrix */}
        <div className="card-elevated p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-lg font-semibold text-[color:var(--gold-light)]">{scenario.titulo}</h3>
            <Badge variant="gold">{scenario.tipo}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="p-3"></th>
                  <th className="p-2 text-center text-xs text-[color:var(--slate)]" colSpan={2}>
                    {scenario.jogador_coluna}
                  </th>
                </tr>
                <tr>
                  <th className="p-2"></th>
                  {scenario.estrategias_coluna.map((e) => (
                    <th key={e} className="p-2 text-xs font-medium text-[color:var(--slate-light)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel-2)] min-w-[140px]">{e}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scenario.matrix.map((row, i) => (
                  <tr key={i}>
                    <th className="p-2 text-xs font-medium text-[color:var(--slate-light)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel-2)] align-middle">
                      <div className="text-[10px] text-[color:var(--slate)] mb-1">{i === 0 ? scenario.jogador_linha : ''}</div>
                      {scenario.estrategias_linha[i]}
                    </th>
                    {row.map(([rP, cP], j) => {
                      const nashCell = isNash(i, j);
                      return (
                        <td key={j} className={cn(
                          'p-4 text-center border border-[color:var(--border-subtle)] min-w-[140px] relative',
                          nashCell ? 'bg-[color:var(--crimson)]/25' : 'bg-[color:var(--bg-panel)]'
                        )}>
                          <div className="kpi-value text-lg">
                            <span className="text-[color:var(--gold-light)]">{rP}</span>
                            <span className="text-[color:var(--slate)] mx-1">,</span>
                            <span className="text-[color:var(--crimson-soft)]">{cP}</span>
                          </div>
                          {nashCell && (
                            <div className="mt-2 flex justify-center">
                              <Badge variant="crimson">Nash ★</Badge>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-[color:var(--slate)] mt-3">
            Cada célula: (<span className="text-[color:var(--gold-light)]">payoff {scenario.jogador_linha}</span>, <span className="text-[color:var(--crimson-soft)]">payoff {scenario.jogador_coluna}</span>).
          </p>
        </div>

        {/* Insights */}
        <div className="space-y-4">
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-[color:var(--gold)]" />
              <h4 className="text-sm font-semibold text-[color:var(--slate-light)]">Leitura estratégica</h4>
            </div>
            <p className="text-sm text-[color:var(--slate-light)]">{scenario.leitura}</p>
          </div>
          <div className="card-elevated p-4 border-l-4 border-l-[color:var(--crimson)]">
            <h4 className="text-sm font-semibold text-[color:var(--slate-light)] mb-2">Equilíbrios de Nash puros</h4>
            {nash.length === 0 ? (
              <p className="text-sm text-[color:var(--slate)]">Nenhum equilíbrio puro. Requer análise em estratégias mistas.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {nash.map(([i, j]) => (
                  <li key={`${i}-${j}`} className="p-2 rounded bg-[color:var(--bg-panel-2)]">
                    <span className="kpi-value text-[color:var(--crimson-soft)]">
                      ({scenario.estrategias_linha[i]}, {scenario.estrategias_coluna[j]})
                    </span>
                    <div className="text-xs text-[color:var(--slate)] mt-1">
                      Payoffs = ({scenario.matrix[i][j][0]}, {scenario.matrix[i][j][1]})
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Special: Scenario A — Dilema do Prisioneiro analysis */}
      {scenario.id === 'A' && (
        <div className="card-elevated p-5 border-l-4 border-l-[color:var(--amber)] space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-[color:var(--amber)]" size={18} />
            <h3 className="text-lg font-semibold text-[color:var(--gold-light)]">Análise — Dilema do Prisioneiro</h3>
          </div>
          <p className="text-sm text-[color:var(--slate-light)]">
            O Nash em (Promoção, Promoção) = (45, 38) é matematicamente correto, mas coletivamente subótimo: se ambos
            cooperassem e mantivessem preço cheio, obteriam (75, 65) — melhor para os dois. O problema é que esse
            resultado cooperativo é instável: qualquer um tem incentivo unilateral para desviar e promover, capturando
            95 enquanto o rival fica com 25.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg p-4 bg-[color:var(--bg-panel-2)] border border-[color:var(--border-subtle)]">
              <h4 className="text-xs uppercase text-[color:var(--slate)] tracking-wider mb-2">Desvio do McD (dado BK em Preço cheio)</h4>
              <p className="text-sm text-[color:var(--slate-light)]">
                Promover: <span className="kpi-value text-[color:var(--crimson-soft)] font-bold">95</span> vs Manter:{' '}
                <span className="kpi-value text-[color:var(--slate-light)] font-bold">75</span>
              </p>
              <p className="text-xs text-[color:var(--slate)] mt-1">→ incentivo para desviar</p>
            </div>
            <div className="rounded-lg p-4 bg-[color:var(--bg-panel-2)] border border-[color:var(--border-subtle)]">
              <h4 className="text-xs uppercase text-[color:var(--slate)] tracking-wider mb-2">Desvio do BK (dado McD em Preço cheio)</h4>
              <p className="text-sm text-[color:var(--slate-light)]">
                Promover: <span className="kpi-value text-[color:var(--crimson-soft)] font-bold">88</span> vs Manter:{' '}
                <span className="kpi-value text-[color:var(--slate-light)] font-bold">65</span>
              </p>
              <p className="text-xs text-[color:var(--slate)] mt-1">→ incentivo para desviar</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[color:var(--amber)]/10 border border-[color:var(--amber)]/30">
            <p className="text-sm text-[color:var(--slate-light)]">
              <strong className="text-[color:var(--gold-light)]">Equilíbrio estável mas ineficiente.</strong> A solução
              cooperativa (Preço cheio, Preço cheio) = (75, 65) só é sustentável com coordenação explícita ou repetição
              do jogo — o que pode ocorrer naturalmente em mercados com poucos players e interação frequente (teoria
              dos jogos repetidos).
            </p>
          </div>
        </div>
      )}

      {/* Special: Scenarios B and C — critical analysis via dominance */}
      {(scenario.id === 'B' || scenario.id === 'C') && (
        <div className="card-elevated p-5 border-l-4 border-l-[color:var(--amber)] space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-[color:var(--amber)]" size={18} />
            <h3 className="text-lg font-semibold text-[color:var(--gold-light)]">Análise Crítica — Reavaliação do Equilíbrio</h3>
          </div>
          {scenario.id === 'C' && (
            <p className="text-sm text-[color:var(--slate-light)]">
              O relatório descreve este cenário como um jogo de coordenação com <strong>dois</strong> equilíbrios de Nash puros —
              (Investir, Manter) e (Manter, Investir) — sustentando o argumento de first-mover advantage. A análise de dominância
              abaixo diverge dessa leitura: com esta matriz de payoffs, <strong>Investir forte é estratégia estritamente dominante
              para os dois jogadores</strong>, o que torna este um Dilema do Prisioneiro disfarçado, não um jogo de coordenação.
              O único Nash puro matematicamente válido é (Investir, Investir).
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg p-4 bg-[color:var(--bg-panel-2)] border border-[color:var(--border-subtle)]">
              <h4 className="text-sm font-semibold text-[color:var(--slate-light)] mb-2">Dominância — {scenario.jogador_linha}</h4>
              <p className="text-xs text-[color:var(--slate)] mb-2">Estratégia dominante: <span className="text-[color:var(--gold-light)] font-semibold">{dom.rowDominant !== null ? scenario.estrategias_linha[dom.rowDominant] : '—'}</span></p>
              <p className="kpi-value text-sm text-[color:var(--crimson-soft)]">{dom.rowProof || 'sem dominância estrita'}</p>
            </div>
            <div className="rounded-lg p-4 bg-[color:var(--bg-panel-2)] border border-[color:var(--border-subtle)]">
              <h4 className="text-sm font-semibold text-[color:var(--slate-light)] mb-2">Dominância — {scenario.jogador_coluna}</h4>
              <p className="text-xs text-[color:var(--slate)] mb-2">Estratégia dominante: <span className="text-[color:var(--gold-light)] font-semibold">{dom.colDominant !== null ? scenario.estrategias_coluna[dom.colDominant] : '—'}</span></p>
              <p className="kpi-value text-sm text-[color:var(--crimson-soft)]">{dom.colProof || 'sem dominância estrita'}</p>
            </div>
          </div>
          {dom.rowDominant !== null && dom.colDominant !== null && (
            <div className="p-4 rounded-lg bg-[color:var(--crimson)]/15 border border-[color:var(--crimson)]/40 text-sm text-[color:var(--slate-light)]">
              <strong>Dominância estrita identificada</strong> → Nash puro único:
              <span className="kpi-value text-[color:var(--crimson-soft)] ml-2">
                ({scenario.estrategias_linha[dom.rowDominant]}, {scenario.estrategias_coluna[dom.colDominant]})
              </span>
              <span className="ml-2 text-[color:var(--slate)]">
                = ({scenario.matrix[dom.rowDominant][dom.colDominant][0]}, {scenario.matrix[dom.rowDominant][dom.colDominant][1]})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
