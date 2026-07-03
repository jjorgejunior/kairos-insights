import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  ComposedChart, Line, LineChart, ReferenceLine, Cell,
} from 'recharts';
import { PROJECT_DATA, type SKU } from '@/data/projectData';
import { calcEOQ, daysToConsume, maxSafeQty } from '@/utils/eoq';
import { KpiCard } from '@/components/KpiCard';
import { Badge } from '@/components/Badge';
import { DataTable, type Column } from '@/components/DataTable';
import { AlertTriangle } from 'lucide-react';

const CHART_GRID = '#2e3340';
const AXIS = '#8a93a6';
const tooltipStyle = {
  contentStyle: { background: '#22262f', border: '1px solid #2e3340', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#e8c373' },
};

interface SKURow extends SKU {
  Q: number;
  dias: number;
  viola: boolean;
}

export function EstoquesTab() {
  const { skus } = PROJECT_DATA;

  const rows: SKURow[] = useMemo(() =>
    skus.map((s) => {
      const { Q } = calcEOQ(s.D_anual, s.S_pedido, s.H_unit_ano);
      const dias = daysToConsume(Q, s.D_anual);
      return { ...s, Q, dias, viola: dias > s.validade_dias };
    }),
    [skus]
  );

  const eoqCount = rows.filter((r) => r.categoria === 'EOQ_CLASSICO').length;
  const revCount = rows.filter((r) => r.categoria === 'REVISAO_PERIODICA').length;
  const fixCount = rows.filter((r) => r.categoria === 'PERIODO_FIXO').length;
  const violaCount = rows.filter((r) => r.viola).length;

  const [selectedCode, setSelectedCode] = useState(skus[7].codigo);
  const selected = rows.find((r) => r.codigo === selectedCode)!;

  // Sensitivity sliders
  const [dPct, setDPct] = useState(0);
  const [sPct, setSPct] = useState(0);
  const [hPct, setHPct] = useState(0);
  const sens = useMemo(() => {
    const D = selected.D_anual * (1 + dPct / 100);
    const S = selected.S_pedido * (1 + sPct / 100);
    const H = selected.H_unit_ano * (1 + hPct / 100);
    return calcEOQ(D, S, H);
  }, [selected, dPct, sPct, hPct]);

  // Total cost curve for selected SKU
  const curve = useMemo(() => {
    const Qstar = selected.Q;
    const min = Math.max(1, Qstar * 0.2);
    const max = Qstar * 2;
    const step = (max - min) / 40;
    const pts: { Q: number; order: number; hold: number; total: number }[] = [];
    for (let Q = min; Q <= max; Q += step) {
      const order = (selected.D_anual / Q) * selected.S_pedido;
      const hold = (Q / 2) * selected.H_unit_ano;
      pts.push({ Q: +Q.toFixed(1), order: +order.toFixed(2), hold: +hold.toFixed(2), total: +(order + hold).toFixed(2) });
    }
    return pts;
  }, [selected]);

  const safeQ = maxSafeQty(selected.D_anual, selected.validade_dias);

  // Q* vs validade chart
  const qValidade = rows.map((r) => ({
    codigo: r.codigo.slice(-3),
    descricao: r.descricao,
    dias_consumir: +r.dias.toFixed(1),
    validade: r.validade_dias,
    viola: r.viola,
  }));

  const cols: Column<SKURow>[] = [
    { key: 'codigo', header: 'SKU', accessor: (r) => r.codigo, sortable: true, render: (r) => <span className="kpi-value text-[color:var(--gold-light)]">{r.codigo}</span> },
    { key: 'desc', header: 'Descrição', accessor: (r) => r.descricao, className: 'min-w-[200px]' },
    { key: 'd', header: 'D anual', accessor: (r) => r.D_anual, sortable: true, render: (r) => <span className="kpi-value">{r.D_anual.toLocaleString('pt-BR')}</span> },
    { key: 'val', header: 'Validade (d)', accessor: (r) => r.validade_dias, sortable: true },
    { key: 'q', header: 'Q*', accessor: (r) => r.Q, sortable: true, render: (r) => <span className="kpi-value">{r.Q.toFixed(0)}</span> },
    { key: 'dias', header: 'Dias p/ consumir', accessor: (r) => r.dias, sortable: true, render: (r) => (
      <span className={`kpi-value ${r.viola ? 'text-[color:var(--crimson-soft)]' : 'text-[color:var(--green-ok)]'}`}>{r.dias.toFixed(1)}</span>
    )},
    { key: 'viola', header: 'Viola?', render: (r) => r.viola ? <Badge variant="crimson">Sim</Badge> : <Badge variant="green">Não</Badge> },
    { key: 'ab', header: 'Abordagem', render: (r) => (
      <Badge variant={r.categoria === 'EOQ_CLASSICO' ? 'green' : r.categoria === 'REVISAO_PERIODICA' ? 'amber' : 'crimson'}>
        {r.categoria === 'EOQ_CLASSICO' ? 'EOQ' : r.categoria === 'REVISAO_PERIODICA' ? 'Revisão' : 'Período Fixo'}
      </Badge>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="EOQ Clássico" value={eoqCount} unit="SKUs" variant="green" caption="Q* aplicável" />
        <KpiCard label="Revisão Periódica" value={revCount} unit="SKUs" variant="amber" caption="Revisão em janela fixa" />
        <KpiCard label="Período Fixo" value={fixCount} unit="SKUs" variant="crimson" caption="Perecível" />
        <KpiCard label="Violam Validade" value={`${violaCount}/${rows.length}`} variant="crimson" caption="Q* > shelf life" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CategoryCard title="EOQ Clássico" desc="SKUs estáveis, não-perecíveis. Q* = √(2DS/H) minimiza custo total anual." color="green" />
        <CategoryCard title="Revisão Periódica" desc="SKUs semi-perecíveis. Revisamos estoque em janela fixa e pedimos até atingir nível-alvo." color="amber" />
        <CategoryCard title="Período Fixo" desc="Perecíveis críticos. Pedidos em frequência determinada pela validade, não pelo custo." color="crimson" />
      </div>

      <div className="card-elevated p-4 flex items-start gap-3 border-l-4 border-l-[color:var(--crimson)]">
        <AlertTriangle className="text-[color:var(--crimson-soft)] shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-[color:var(--slate-light)]">
          <strong>{violaCount} de {rows.length} SKUs</strong> têm Q* que excede o prazo de validade — EOQ clássico seria matematicamente inviável para esses itens.
        </p>
      </div>

      <div className="card-elevated p-4">
        <h3 className="text-sm font-semibold text-[color:var(--slate-light)] mb-1">Q* vs Prazo de Validade</h3>
        <p className="text-xs text-[color:var(--slate)] mb-3">Barras acima da linha = risco de vencimento. Dias necessários para consumir Q* comparados ao shelf life.</p>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={qValidade}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="codigo" stroke={AXIS} />
            <YAxis stroke={AXIS} />
            <Tooltip {...tooltipStyle} labelFormatter={(l) => qValidade.find(q => q.codigo === l)?.descricao ?? l} />
            <Legend wrapperStyle={{ color: AXIS, fontSize: 12 }} />
            <Bar dataKey="dias_consumir" name="Dias p/ consumir Q*">
              {qValidade.map((d, i) => (
                <Cell key={i} fill={d.viola ? '#b3122e' : '#3a9c6f'} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="validade" name="Validade (dias)" stroke="#e8c373" strokeWidth={2} dot={{ r: 3, fill: '#e8c373' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* SKU selector */}
      <div className="card-elevated p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[color:var(--gold-light)]">Análise por SKU</h3>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="bg-[color:var(--bg-panel-2)] border border-[color:var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[color:var(--slate-light)]"
          >
            {rows.map((r) => <option key={r.codigo} value={r.codigo}>{r.codigo} — {r.descricao}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs uppercase text-[color:var(--slate)] mb-2">Curva de Custo Total — Q*</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={curve}>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="Q" stroke={AXIS} />
                <YAxis stroke={AXIS} tickFormatter={(v) => `R$${(v/1000).toFixed(1)}k`} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} />
                <Legend wrapperStyle={{ color: AXIS, fontSize: 12 }} />
                <ReferenceLine x={+selected.Q.toFixed(1)} stroke="#c9952c" strokeDasharray="4 2" label={{ value: `Q*=${selected.Q.toFixed(0)}`, fill: '#e8c373', fontSize: 11 }} />
                {selected.viola && (
                  <ReferenceLine x={+safeQ.toFixed(1)} stroke="#b3122e" strokeDasharray="4 2" label={{ value: `Q seguro=${safeQ.toFixed(0)}`, fill: '#ef6b80', fontSize: 11 }} />
                )}
                <Line type="monotone" dataKey="total" name="Custo total" stroke="#c9952c" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="order" name="Custo pedido" stroke="#ef6b80" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="hold" name="Custo manter" stroke="#3a9c6f" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs uppercase text-[color:var(--slate)]">Análise de Sensibilidade (±20%)</h4>
            <Slider label="Demanda D" pct={dPct} onChange={setDPct} />
            <Slider label="Custo pedido S" pct={sPct} onChange={setSPct} />
            <Slider label="Custo manter H" pct={hPct} onChange={setHPct} />
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[color:var(--border-subtle)]">
              <MiniKpi label="Q* base" value={selected.Q.toFixed(1)} />
              <MiniKpi label="Q* ajustado" value={sens.Q.toFixed(1)} tone="gold" />
              <MiniKpi label="Custo base" value={`R$ ${((selected.D_anual/selected.Q)*selected.S_pedido + (selected.Q/2)*selected.H_unit_ano).toFixed(0)}`} />
              <MiniKpi label="Custo ajustado" value={`R$ ${sens.totalCost.toFixed(0)}`} tone="gold" />
            </div>
          </div>
        </div>
      </div>

      <div className="card-elevated p-4">
        <h3 className="text-sm font-semibold text-[color:var(--slate-light)] mb-3">Todos os SKUs (15)</h3>
        <DataTable
          columns={cols}
          data={rows}
          rowClassName={(r) => r.viola ? 'border-l-4 border-l-[color:var(--crimson)]' : ''}
        />
      </div>
    </div>
  );
}

function CategoryCard({ title, desc, color }: { title: string; desc: string; color: 'green' | 'amber' | 'crimson' }) {
  const border = color === 'green' ? 'border-l-[color:var(--green-ok)]' : color === 'amber' ? 'border-l-[color:var(--amber)]' : 'border-l-[color:var(--crimson)]';
  return (
    <div className={`card-elevated p-4 border-l-4 ${border}`}>
      <h4 className="font-semibold text-[color:var(--slate-light)]">{title}</h4>
      <p className="text-xs text-[color:var(--slate)] mt-1">{desc}</p>
    </div>
  );
}

function Slider({ label, pct, onChange }: { label: string; pct: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="flex justify-between mb-1 text-xs">
        <span className="text-[color:var(--slate)] uppercase tracking-wider">{label}</span>
        <span className="kpi-value text-[color:var(--gold-light)]">{pct > 0 ? '+' : ''}{pct}%</span>
      </div>
      <input type="range" min={-20} max={20} step={1} value={pct} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[color:var(--gold)]" />
    </label>
  );
}

function MiniKpi({ label, value, tone }: { label: string; value: string; tone?: 'gold' }) {
  return (
    <div className="rounded-lg bg-[color:var(--bg-panel-2)] px-3 py-2 border border-[color:var(--border-subtle)]">
      <div className="text-[10px] uppercase text-[color:var(--slate)] tracking-wider">{label}</div>
      <div className={`kpi-value text-base ${tone === 'gold' ? 'text-[color:var(--gold-light)]' : 'text-[color:var(--slate-light)]'}`}>{value}</div>
    </div>
  );
}
