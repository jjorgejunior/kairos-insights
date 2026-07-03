import type { PertActivity } from '@/data/projectData';

// Abramowitz-Stegun approximation of normal CDF
export function normalCDF(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export interface CrashStep {
  iter: number;
  atividade: string;
  custo_dia: number;
  gasto_acumulado: number;
  duracao_antes: number;
  duracao_depois: number;
}

export interface CrashingResult {
  finalDuration: number;
  spent: number;
  log: CrashStep[];
}

/**
 * Given the initial PERT activities & a budget, iteratively crash 1 day off
 * the cheapest critical activity that still has crash room, until budget or
 * crash floor is exhausted.
 *
 * Simplified model: since critical path is fixed at project's structural
 * critical path (A-B-G-H-M-Q-R-S-T-U-V), and each activity has a min duration
 * (duracao_min_dias), we crash within those constraints. Total project duration
 * decreases by 1 day per crash step (as long as we crash a critical activity).
 */
export function runCrashing(
  activities: PertActivity[],
  budget: number,
  baseDuration: number,
): CrashingResult {
  const criticals = activities
    .filter((a) => a.critica && a.duracao_min_dias !== undefined && a.custo_crash_dia !== undefined)
    .map((a) => ({
      codigo: a.codigo,
      custo: a.custo_crash_dia!,
      current: a.te,
      floor: a.duracao_min_dias!,
    }))
    .sort((x, y) => x.custo - y.custo);

  const log: CrashStep[] = [];
  let spent = 0;
  let duration = baseDuration;
  let iter = 0;

  while (true) {
    const candidate = criticals.find((c) => c.current > c.floor && spent + c.custo <= budget);
    if (!candidate) break;
    iter++;
    const before = duration;
    candidate.current = +(candidate.current - 1).toFixed(2);
    duration = +(duration - 1).toFixed(2);
    spent = +(spent + candidate.custo).toFixed(2);
    log.push({
      iter,
      atividade: candidate.codigo,
      custo_dia: candidate.custo,
      gasto_acumulado: spent,
      duracao_antes: +before.toFixed(2),
      duracao_depois: duration,
    });
    if (iter > 200) break;
  }

  return { finalDuration: duration, spent, log };
}
