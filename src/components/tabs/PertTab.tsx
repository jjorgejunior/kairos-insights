import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  LineChart, Line, ReferenceLine, Cell,
} from 'recharts';
import { PROJECT_DATA } from '@/data/projectData';
import { normalCDF, runCrashing } from '@/utils/pert';
import { KpiCard } from '@/components/KpiCard';
import { Badge } from '@/components/Badge';
import { DataTable, type Column } from '@/components/DataTable';
import type { PertActivity } from '@/data/projectData';

const CHART_GRID = '#2e3340';
const AXIS = '#8a93a6';
const tooltipStyle = {
  contentStyle: { background: '#22262f', border: '1px solid #2e3340', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#e8c373' },
};

export function PertTab() {
  const { pert_atividades, pert_meta } = PROJECT_DATA;

  const criticasCount = pert_atividades.filter((a) => a.critica).length;

  // Deadline probability
  const [deadline, setDeadline] = useState(85);
  const probDeadline = normalCDF(deadline, pert_meta.duracao_total, pert_meta.desvio_padrao_cp);

  // Normal curve data
  const curveData = useMemo(() => {
    const mu = pert_meta.duracao_total;
    const sigma = pert_meta.desvio_padrao_cp;
    const points: { x: number; f: number }[] = [];
    for (let x = mu - 4 * sigma; x <= mu + 4 * sigma; x += 0.5) {
      const f = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
      points.push({ x: +x.toFixed(2), f: +f.toFixed(4) });
    }
    return points;
  }, [pert_meta]);

  // Crashing
  const [budget, setBudget] = useState(50000);
  const crashing = useMemo(
    () => runCrashing(pert_atividades, budget, pert_meta.duracao_total),
    [pert_atividades, budget, pert_meta.duracao_total],
  );

  // Crashing chart: step-down curve of duration vs cumulative spend
  const crashCurve = useMemo(() => {
    const pts = [{ gasto: 0, duracao: pert_meta.duracao_total }];
    crashing.log.forEach((step) => {
      pts.push({ gasto: step.gasto_acumulado, duracao: step.duracao_depois });
    });
    return pts;
  }, [crashing, pert_meta.duracao_total]);

  // Segment annotations: which activity is being crashed at each budget range,
  // derived from the actual crashing log so it stays correct if the budget changes.
  const crashAnnotations = useMemo(() => {
    const marks: { x: number; atividade: string }[] = [];
    let lastAtividade: string | null = null;
    let segmentStart = 0;
    crashing.log.forEach((step) => {
      if (step.atividade !== lastAtividade) {
        marks.push({ x: segmentStart, atividade: step.atividade });
        lastAtividade = step.atividade;
      }
      segmentStart = step.gasto_acumulado;
    });
    return marks;
  }, [crashing]);

  // Gantt data — sorted by ES
  const gantt = useMemo(() =>
    [...pert_atividades]
      .sort((a, b) => a.es - b.es)
      .map((a) => ({
        codigo: a.codigo,
        offset: a.es,
        te: a.te,
        folga: a.folga,
        critica: a.critica,
        descricao: a.descricao,
        ef: a.ef,
      })),
    [pert_atividades]
  );

  const cols: Column<PertActivity>[] = [
    { key: 'codigo', header: 'Ativ', accessor: (r) => r.codigo, sortable: true },
    { key: 'descricao', header: 'Descrição', accessor: (r) => r.descricao, className: 'min-w-[220px]' },
    { key: 'pred', header: 'Pred', render: (r) => r.predecessoras.join(', ') || '—' },
    { key: 'te', header: 'Te', accessor: (r) => r.te, render: (r) => <span className="kpi-value">{r.te}</span>, sortable: true },
    { key: 'es', header: 'ES', accessor: (r) => r.es, render: (r) => r.es.toFixed(2), sortable: true },
    { key: 'ef', header: 'EF', accessor: (r) => r.ef, render: (r) => r.ef.toFixed(2), sortable: true },
    { key: 'ls', header: 'LS', accessor: (r) => r.ls, render: (r) => r.ls.toFixed(2) },
    { key: 'lf', header: 'LF', accessor: (r) => r.lf, render: (r) => r.lf.toFixed(2) },
    { key: 'folga', header: 'Folga', accessor: (r) => r.folga, render: (r) => (
      <span className={r.folga === 0 ? 'text-[color:var(--crimson-soft)] kpi-value' : 'kpi-value'}>{r.folga.toFixed(2)}</span>
    ), sortable: true },
    { key: 'status', header: 'Status', render: (r) => r.critica ? <Badge variant="crimson">Crítica</Badge> : <Badge variant="slate">Folga</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Duração esperada" value={pert_meta.duracao_total.toFixed(2)} unit="dias" variant="gold" caption="Te do projeto" />
        <KpiCard label="Atividades críticas" value={`${criticasCount}/${pert_atividades.length}`} variant="crimson" caption="Folga = 0" />
        <KpiCard label="σ do caminho crítico" value={pert_meta.desvio_padrao_cp.toFixed(2)} unit="dias" caption={`Var = ${pert_meta.variancia_cp.toFixed(2)}`} />
        <KpiCard label="P(T ≤ 85 dias)" value={(normalCDF(85, pert_meta.duracao_total, pert_meta.desvio_padrao_cp) * 100).toFixed(1)} unit="%" variant="green" caption="Distribuição Normal" />
      </div>

      {/* Critical path visual */}
      <div className="card-elevated p-5">
        <h3 className="text-sm font-semibold text-[color:var(--gold-light)] mb-4">Caminho Crítico</h3>
        <div className="flex flex-wrap items-center gap-2">
          {pert_meta.caminho_critico.map((c, i) => (
            <div key={c} className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[color:var(--crimson)] text-white flex items-center justify-center font-bold shadow-lg">{c}</div>
              {i < pert_meta.caminho_critico.length - 1 && (
                <span className="mx-1 text-[color:var(--crimson-soft)]">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gantt */}
      <div className="card-elevated p-4">
        <h3 className="text-sm font-semibold text-[color:var(--slate-light)] mb-3">Cronograma (Gantt) — Te + Folga</h3>
        <ResponsiveContainer width="100%" height={560}>
          <BarChart data={gantt} layout="vertical" stackOffset="none" margin={{ left: 20 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis type="number" stroke={AXIS} domain={[0, Math.ceil(pert_meta.duracao_total + 5)]} />
            <YAxis dataKey="codigo" type="category" stroke={AXIS} width={30} />
            <Tooltip
              {...tooltipStyle}
              formatter={(v: number, n: string) => [v.toFixed(2), n]}
              labelFormatter={(l: string) => {
                const row = gantt.find((g) => g.codigo === l);
                return row ? `${l} · ${row.descricao} · ES=${row.offset.toFixed(2)} EF=${row.ef.toFixed(2)}` : l;
              }}
            />
            <ReferenceLine x={pert_meta.duracao_total} stroke="#e8c373" strokeDasharray="4 2" label={{ value: `Te=${pert_meta.duracao_total}`, fill: '#e8c373', fontSize: 11 }} />
            <Bar dataKey="offset" stackId="a" fill="transparent" />
            <Bar dataKey="te" stackId="a" name="Duração Te">
              {gantt.map((g, i) => <Cell key={i} fill={g.critica ? '#b3122e' : '#c9952c'} />)}
            </Bar>
            <Bar dataKey="folga" stackId="a" name="Folga" fill="#8a93a6" fillOpacity={0.35} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full table */}
      <div className="card-elevated p-4">
        <h3 className="text-sm font-semibold text-[color:var(--slate-light)] mb-3">Tabela CPM completa (22 atividades)</h3>
        <DataTable
          columns={cols}
          data={pert_atividades}
          rowClassName={(r) => r.critica ? 'border-l-4 border-l-[color:var(--crimson)]' : ''}
        />
      </div>

      {/* Probabilistic + calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-elevated p-4">
          <h3 className="text-sm font-semibold text-[color:var(--slate-light)] mb-3">Distribuição Normal da duração do projeto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={curveData}>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="x" stroke={AXIS} tickFormatter={(v: number) => v.toFixed(0)} />
              <YAxis stroke={AXIS} />
              <Tooltip {...tooltipStyle} />
              <ReferenceLine x={pert_meta.duracao_total} stroke="#e8c373" strokeDasharray="4 2" label={{ value: `Te=${pert_meta.duracao_total}`, fill: '#e8c373', fontSize: 11 }} />
              <ReferenceLine x={deadline} stroke="#b3122e" label={{ value: `Prazo=${deadline}`, fill: '#ef6b80', fontSize: 11 }} />
              <Line type="monotone" dataKey="f" stroke="#c9952c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card-elevated p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[color:var(--slate-light)]">Calculadora de prazo</h3>
          <label className="block">
            <div className="flex justify-between mb-2">
              <span className="text-xs uppercase text-[color:var(--slate)]">Prazo (dias)</span>
              <span className="kpi-value text-lg text-[color:var(--gold-light)]">{deadline}</span>
            </div>
            <input type="range" min={60} max={100} step={1} value={deadline} onChange={(e) => setDeadline(+e.target.value)} className="w-full accent-[color:var(--gold)]" />
          </label>
          <div className="text-center py-3 border-y border-[color:var(--border-subtle)]">
            <div className="text-xs uppercase text-[color:var(--slate)] tracking-wider">P(T ≤ {deadline})</div>
            <div className="kpi-value text-4xl text-[color:var(--green-ok)]">{(probDeadline * 100).toFixed(1)}%</div>
          </div>
          <div className="space-y-3">
            {[75, 80, 85, 90].map((d) => {
              const p = normalCDF(d, pert_meta.duracao_total, pert_meta.desvio_padrao_cp);
              return (
                <div key={d}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[color:var(--slate)]">P(T ≤ {d} dias)</span>
                    <span className="kpi-value text-[color:var(--slate-light)]">{(p*100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-[color:var(--bg-panel-2)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[color:var(--gold)] to-[color:var(--gold-light)]" style={{ width: `${p * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Crashing */}
      <div className="card-elevated p-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--gold-light)]">Simulador de Crashing</h3>
          <span className="text-xs text-[color:var(--slate)]">Algoritmo: prioriza atividades críticas por menor custo/dia</span>
        </div>
        <label className="block max-w-xl">
          <div className="flex justify-between mb-2">
            <span className="text-xs uppercase text-[color:var(--slate)]">Orçamento (R$)</span>
            <span className="kpi-value text-lg text-[color:var(--gold-light)]">R$ {budget.toLocaleString('pt-BR')}</span>
          </div>
          <input type="range" min={0} max={50000} step={1000} value={budget} onChange={(e) => setBudget(+e.target.value)} className="w-full accent-[color:var(--gold)]" />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard label="Duração Final" value={crashing.finalDuration.toFixed(2)} unit="dias" variant="gold" />
          <KpiCard label="Redução" value={(pert_meta.duracao_total - crashing.finalDuration).toFixed(2)} unit="dias" variant="green" />
          <KpiCard label="Orçamento Utilizado" value={`R$ ${crashing.spent.toLocaleString('pt-BR')}`} caption={`${crashing.log.length} iterações`} />
        </div>
        <div>
          <h4 className="text-xs uppercase text-[color:var(--slate)] mb-2">Curva Custo × Duração</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={crashCurve} margin={{ top: 20 }}>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="gasto" stroke={AXIS} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <YAxis stroke={AXIS} domain={['auto','auto']} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => v.toFixed(2)} />
              {crashAnnotations.map((m) => (
                <ReferenceLine
                  key={`${m.atividade}-${m.x}`}
                  x={m.x}
                  stroke={CHART_GRID}
                  strokeDasharray="3 3"
                  label={{ value: m.atividade, position: 'top', fill: '#c9952c', fontSize: 11 }}
                />
              ))}
              <Line type="stepAfter" dataKey="duracao" name="Duração (d)" stroke="#c9952c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[color:var(--bg-panel-2)] text-[color:var(--slate-light)] uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">#</th>
                <th className="text-left px-3 py-2">Atividade</th>
                <th className="text-right px-3 py-2">Custo/dia</th>
                <th className="text-right px-3 py-2">Gasto Acum.</th>
                <th className="text-right px-3 py-2">Antes</th>
                <th className="text-right px-3 py-2">Depois</th>
              </tr>
            </thead>
            <tbody>
              {crashing.log.map((s) => (
                <tr key={s.iter} className="border-t border-[color:var(--border-subtle)]">
                  <td className="px-3 py-1.5">{s.iter}</td>
                  <td className="px-3 py-1.5 font-semibold text-[color:var(--crimson-soft)]">{s.atividade}</td>
                  <td className="px-3 py-1.5 text-right kpi-value">R$ {s.custo_dia.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-1.5 text-right kpi-value">R$ {s.gasto_acumulado.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-1.5 text-right kpi-value">{s.duracao_antes.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right kpi-value text-[color:var(--green-ok)]">{s.duracao_depois.toFixed(2)}</td>
                </tr>
              ))}
              {crashing.log.length === 0 && (
                <tr><td colSpan={6} className="text-center py-6 text-[color:var(--slate)]">Aumente o orçamento para iniciar o crashing.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
