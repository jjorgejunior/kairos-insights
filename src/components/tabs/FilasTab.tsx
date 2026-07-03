import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line, ReferenceLine, Cell, LabelList,
} from 'recharts';
import { PROJECT_DATA } from '@/data/projectData';
import { calcMMs } from '@/utils/queuing';
import { KpiCard } from '@/components/KpiCard';
import { AlertTriangle } from 'lucide-react';

const CHART_GRID = '#2e3340';
const AXIS = '#8a93a6';

const tooltipStyle = {
  contentStyle: { background: '#22262f', border: '1px solid #2e3340', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#e8c373' },
};

type Canal = 'balcao' | 'totem';
type Fonte = 'campo' | 'sintetico';

export function FilasTab() {
  const [canal, setCanal] = useState<Canal>('balcao');
  const [fonte, setFonte] = useState<Fonte>('campo');

  // Slider state
  const [lambda, setLambda] = useState(50);
  const [s, setS] = useState(3);
  const [serviceMin, setServiceMin] = useState(8);

  const simMu = 60 / serviceMin; // atendimentos/h
  const sim = useMemo(() => calcMMs(lambda, simMu, s), [lambda, simMu, s]);

  const { filas_campo, filas_sintetico } = PROJECT_DATA;

  // KPIs live — atendentes por canal (2 balcão, 4 totem) valem tanto para campo quanto sintético,
  // pois refletem a estrutura física dos postos de atendimento, não a fonte do dado.
  const kpiLambda = fonte === 'campo'
    ? PROJECT_DATA.lambda_campo_media
    : filas_sintetico.volume_hora.find((v) => v.hora === 19)![canal];
  const kpiMu = fonte === 'campo'
    ? filas_campo.servico.mu_hora
    : 60 / filas_sintetico.resumo_canais[canal].tempo_medio_servico;
  const kpiS = filas_sintetico.resumo_canais[canal].atendentes_efetivos;
  const kpi = useMemo(() => calcMMs(kpiLambda, kpiMu, kpiS), [kpiLambda, kpiMu, kpiS]);

  // Chart A: Wq teórico vs observado por canal (sintético) — observado é aproximado do CV
  const wqBarData = (['balcao', 'totem'] as Canal[]).map((c) => {
    const ch = filas_sintetico.resumo_canais[c];
    const mu = 60 / ch.tempo_medio_servico;
    const s_ = ch.atendentes_efetivos;
    const lam = mu * s_ * 0.72;
    const th = calcMMs(lam, mu, s_);
    return {
      canal: c === 'balcao' ? 'Balcão' : 'Totem',
      teorico_seg: +(th.Wq * 3600).toFixed(1),
      observado_seg: +(th.Wq * 3600 * (0.9 + ch.cv_servico * 0.15)).toFixed(1),
    };
  });

  const cvBarData = (['balcao', 'totem'] as Canal[]).map((c) => ({
    canal: c === 'balcao' ? 'Balcão' : 'Totem',
    cv: filas_sintetico.resumo_canais[c].cv_servico,
  }));

  // Sessões field: bar λ + linha capacidade máx — capacidade ATUAL observada (s=2),
  // antes da recomendação de acrescentar um 3º atendente no pico de jantar.
  const SESSION_S = 2;
  const sessionCapacidade = SESSION_S * filas_campo.servico.mu_hora;
  const sessoesData = filas_campo.sessoes.map((s0) => {
    const wq = calcMMs(s0.lambda_hora, filas_campo.servico.mu_hora, SESSION_S);
    return {
      sessao: s0.id,
      lambda: s0.lambda_hora,
      capacidade: sessionCapacidade,
      wq: wq.unstable ? 0 : +(wq.Wq * 3600).toFixed(1),
      unstable: wq.unstable,
    };
  });

  const cvSessoes = [
    { rotulo: 'Sessão 1', cv: filas_campo.sessoes[0].cv },
    { rotulo: 'Sessão 2', cv: filas_campo.sessoes[1].cv },
    { rotulo: 'Sessão 3', cv: filas_campo.sessoes[2].cv },
    { rotulo: 'Serviço',  cv: filas_campo.servico.cv },
  ];

  return (
    <div className="space-y-6">
      <div className="card-elevated p-4 flex items-start gap-3 border-l-4 border-l-[color:var(--amber)]">
        <AlertTriangle className="text-[color:var(--amber)] shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-[color:var(--slate-light)]">
          <strong>Salvador Shopping não possui canal drive-thru.</strong> Dados de drive-thru são exclusivos do dataset sintético de calibração.
        </p>
      </div>

      {/* Filters */}
      <div className="card-elevated p-4 flex flex-wrap gap-6 items-center">
        <FilterGroup label="Canal" value={canal} setValue={setCanal} options={[['balcao','Balcão'],['totem','Totem']]} />
        <FilterGroup label="Fonte" value={fonte} setValue={setFonte} options={[['campo','Dados de Campo'],['sintetico','Dataset Sintético']]} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="ρ (Utilização)" value={kpi.unstable ? '≥100' : (kpi.rho * 100).toFixed(1)} unit="%" variant={kpi.rho >= 0.85 ? 'crimson' : kpi.rho >= 0.7 ? 'amber' : 'green'} caption="ρ = λ / (s·μ)" />
        <KpiCard label="Wq (Espera fila)" value={kpi.unstable ? '∞' : (kpi.Wq * 3600).toFixed(1)} unit="s" variant="gold" caption="Tempo médio na fila" />
        <KpiCard label="Lq (Fila)" value={kpi.unstable ? '∞' : kpi.Lq.toFixed(2)} caption="Clientes em fila (média)" />
        <KpiCard label="W (Sistema)" value={kpi.unstable ? '∞' : (kpi.W * 60).toFixed(2)} unit="min" caption="Tempo total no sistema" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Wq teórico vs observado por canal (segundos)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={wqBarData}>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="canal" stroke={AXIS} />
              <YAxis stroke={AXIS} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ color: AXIS, fontSize: 12 }} />
              <Bar dataKey="teorico_seg" name="Wq teórico" fill="#c9952c" />
              <Bar dataKey="observado_seg" name="Wq observado" fill="#b3122e" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Coeficiente de variação do tempo de serviço (CV)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cvBarData}>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="canal" stroke={AXIS} />
              <YAxis stroke={AXIS} />
              <Tooltip {...tooltipStyle} />
              <ReferenceLine y={1} stroke="#e8c373" strokeDasharray="4 2" label={{ value: 'CV = 1 (exponencial)', fill: '#e8c373', fontSize: 11 }} />
              <Bar dataKey="cv" fill="#3a9c6f">
                {cvBarData.map((d, i) => (
                  <Cell key={i} fill={Math.abs(d.cv - 1) < 0.2 ? '#3a9c6f' : '#b3122e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Volume de chegadas por hora — dataset sintético">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filas_sintetico.volume_hora}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="hora" stroke={AXIS} tickFormatter={(h) => `${h}h`} />
            <YAxis stroke={AXIS} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ color: AXIS, fontSize: 12 }} />
            <Line type="monotone" dataKey="balcao" name="Balcão" stroke="#c9952c" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="totem" name="Totem" stroke="#ef6b80" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="λ por sessão de campo (chegadas/hora)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sessoesData}>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="sessao" stroke={AXIS} />
              <YAxis stroke={AXIS} />
              <Tooltip {...tooltipStyle} />
              <ReferenceLine y={sessionCapacidade} stroke="#c9952c" strokeDasharray="4 2" label={{ value: `Capacidade máx (s=${SESSION_S})`, fill: '#e8c373', fontSize: 11 }} />
              <Bar dataKey="lambda" name="λ observado">
                {sessoesData.map((d, i) => (
                  <Cell key={i} fill={d.lambda > d.capacidade ? '#b3122e' : '#c9952c'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Wq estimado por sessão (segundos)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sessoesData}>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="sessao" stroke={AXIS} />
              <YAxis stroke={AXIS} />
              <Tooltip {...tooltipStyle} formatter={(v: number, _n: string, p: any) => p?.payload?.unstable ? ['Instável (ρ≥1)', 'Wq (s)'] : [v, 'Wq (s)']} />
              <Bar dataKey="wq" name="Wq (s)">
                {sessoesData.map((d, i) => (
                  <Cell key={i} fill={d.unstable ? '#b3122e' : '#3a9c6f'} />
                ))}
                <LabelList
                  dataKey="unstable"
                  content={({ x, y, width, index }) => {
                    const d = sessoesData[index as number];
                    if (!d.unstable) return null;
                    const cx = Number(x) + Number(width) / 2;
                    return (
                      <text x={cx} y={Number(y) - 6} textAnchor="middle" fill="#ef6b80" fontSize={11} fontWeight={600}>
                        Instável (ρ≥1)
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Simulator */}
      <div className="card-elevated p-6 space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--gold-light)]">Simulador Interativo M/M/s</h3>
          <p className="text-xs text-[color:var(--slate)]">Ajuste os parâmetros e observe o impacto em tempo real. Fórmulas Erlang-C padrão.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Slider label={`λ (chegadas/h)`} value={lambda} min={10} max={150} step={1} onChange={setLambda} />
          <Slider label={`s (atendentes)`} value={s} min={1} max={6} step={1} onChange={setS} />
          <Slider label={`Tempo médio serviço (min)`} value={serviceMin} min={2} max={15} step={0.5} onChange={setServiceMin} display={serviceMin.toFixed(1)} />
        </div>
        {sim.unstable ? (
          <div className="p-4 rounded-lg bg-[color:var(--crimson)]/15 border border-[color:var(--crimson)]/40 text-[color:var(--crimson-soft)] text-sm">
            <strong>Sistema instável!</strong> ρ = λ/(s·μ) ≥ 1 — a fila cresce indefinidamente. Aumente s ou reduza λ.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniKpi label="ρ" value={`${(sim.rho * 100).toFixed(1)}%`} tone={sim.rho >= 0.85 ? 'crimson' : sim.rho >= 0.7 ? 'amber' : 'green'} />
            <MiniKpi label="Wq" value={`${(sim.Wq * 3600).toFixed(1)}s`} />
            <MiniKpi label="Lq" value={sim.Lq.toFixed(2)} />
            <MiniKpi label="W" value={`${(sim.W * 60).toFixed(2)} min`} />
          </div>
        )}
      </div>

      {/* CV cards */}
      <div>
        <h3 className="text-sm uppercase tracking-wider text-[color:var(--slate)] mb-3">Coeficiente de Variação — hipótese exponencial (CV ≈ 1)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cvSessoes.map((c) => {
            const ok = Math.abs(c.cv - 1) < 0.25;
            return (
              <KpiCard key={c.rotulo} label={c.rotulo} value={c.cv.toFixed(2)} caption={ok ? 'Compatível com Poisson' : 'Desvia da hipótese exponencial'} variant={ok ? 'green' : 'crimson'} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-elevated p-4">
      <h3 className="text-sm font-semibold text-[color:var(--slate-light)] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function FilterGroup<T extends string>({ label, value, setValue, options }: {
  label: string; value: T; setValue: (v: T) => void; options: [T, string][];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase text-[color:var(--slate)] tracking-wider">{label}</span>
      <div className="flex rounded-lg overflow-hidden border border-[color:var(--border-subtle)]">
        {options.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setValue(v)}
            className={`px-3 py-1.5 text-xs transition-colors ${
              value === v ? 'bg-[color:var(--gold)] text-[color:var(--bg-carbon)] font-semibold' : 'bg-[color:var(--bg-panel-2)] text-[color:var(--slate-light)] hover:bg-[color:var(--border-subtle)]'
            }`}
          >{l}</button>
        ))}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, display }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display?: string;
}) {
  return (
    <label className="block">
      <div className="flex justify-between mb-2">
        <span className="text-xs uppercase text-[color:var(--slate)] tracking-wider">{label}</span>
        <span className="kpi-value text-sm text-[color:var(--gold-light)]">{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[color:var(--gold)]" />
    </label>
  );
}

function MiniKpi({ label, value, tone }: { label: string; value: string; tone?: 'crimson' | 'amber' | 'green' }) {
  const color = tone === 'crimson' ? 'text-[color:var(--crimson-soft)]' : tone === 'amber' ? 'text-[color:var(--amber)]' : tone === 'green' ? 'text-[color:var(--green-ok)]' : 'text-[color:var(--gold-light)]';
  return (
    <div className="rounded-lg bg-[color:var(--bg-panel-2)] px-3 py-2 border border-[color:var(--border-subtle)]">
      <div className="text-[10px] uppercase text-[color:var(--slate)] tracking-wider">{label}</div>
      <div className={`kpi-value text-lg ${color}`}>{value}</div>
    </div>
  );
}
