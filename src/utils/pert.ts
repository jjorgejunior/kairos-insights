// PERT / CPM — everything derived from raw activity inputs.
// No project duration or variance is hardcoded: Te, σ, criticality and the
// critical path all fall out of the activity table.

/** Raw activity as authored per client (before derivation). */
export interface RawActivity {
  codigo: string;
  desc: string;
  pred: string[];
  o: number; // optimistic
  m: number; // most likely
  p: number; // pessimistic
  es: number; // early start
  ls: number; // late start
  floor: number | null; // crash floor (min duration in days), null = cannot crash
  crashCost: number; // cost per day crashed
}

export interface DerivedActivity extends RawActivity {
  te: number; // expected duration (o + 4m + p) / 6
  varr: number; // variance ((p - o) / 6)^2
  ef: number; // early finish  = es + te
  lf: number; // late finish   = ls + te
  folga: number; // slack = ls - es
  critica: boolean;
}

export interface PertDerived {
  acts: DerivedActivity[];
  duracao: number; // project duration = max(EF)
  varCP: number; // variance of the critical path (Σ variance of critical activities)
  sigma: number; // √varCP
  cp: string[]; // critical-path activity codes
}

/** Abramowitz-Stegun approximation of the standard normal CDF. */
export function normalCDF(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return x >= mu ? 1 : 0;
  const z = (x - mu) / sigma;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/** Derive the full CPM table + project metrics from raw activities. */
export function derivePert(raw: RawActivity[]): PertDerived {
  const acts: DerivedActivity[] = raw.map((a) => {
    const te = +((a.o + 4 * a.m + a.p) / 6).toFixed(3);
    const varr = +Math.pow((a.p - a.o) / 6, 2).toFixed(3);
    const ef = +(a.es + te).toFixed(3);
    const lf = +(a.ls + te).toFixed(3);
    const folga = +(a.ls - a.es).toFixed(3);
    return { ...a, te, varr, ef, lf, folga, critica: folga < 0.01 };
  });
  const duracao = +Math.max(...acts.map((a) => a.ef)).toFixed(2);
  const varCP = +acts
    .filter((a) => a.critica)
    .reduce((s, a) => s + a.varr, 0)
    .toFixed(3);
  const sigma = +Math.sqrt(varCP).toFixed(3);
  const cp = acts.filter((a) => a.critica).map((a) => a.codigo);
  return { acts, duracao, varCP, sigma, cp };
}

export interface CrashStep {
  iter: number;
  atividade: string;
  custo: number; // cost/day of the crashed activity
  acum: number; // cumulative spend
  antes: number; // project duration before this step
  depois: number; // project duration after this step
}

export interface CrashingResult {
  finalDuration: number;
  spent: number;
  log: CrashStep[];
}

/**
 * Iteratively crash 1 day off the cheapest critical activity that still has
 * crash room, until the budget or crash floors are exhausted. Prioritises
 * critical activities by lowest cost/day.
 */
export function runCrashing(acts: DerivedActivity[], budget: number, base: number): CrashingResult {
  const cr = acts
    .filter((a) => a.critica && a.floor != null && a.crashCost > 0)
    .map((a) => ({ codigo: a.codigo, custo: a.crashCost, current: a.te, floor: a.floor as number }))
    .sort((x, y) => x.custo - y.custo);

  const log: CrashStep[] = [];
  let spent = 0;
  let dur = base;
  let iter = 0;

  while (true) {
    const c = cr.find((c) => c.current > c.floor && spent + c.custo <= budget);
    if (!c) break;
    iter++;
    const before = dur;
    c.current = +(c.current - 1).toFixed(2);
    dur = +(dur - 1).toFixed(2);
    spent = +(spent + c.custo).toFixed(2);
    log.push({
      iter,
      atividade: c.codigo,
      custo: c.custo,
      acum: spent,
      antes: +before.toFixed(2),
      depois: dur,
    });
    if (iter > 200) break;
  }

  return { finalDuration: dur, spent, log };
}
