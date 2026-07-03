// M/M/s queueing model — Erlang-C

export interface MMsResult {
  rho: number;
  P0: number;
  Lq: number;
  Wq: number; // hours
  W: number;  // hours
  L: number;
  unstable: boolean;
}

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/**
 * lambda: chegadas/hora
 * mu: atendimentos/hora por servidor
 * s: número de servidores
 */
export function calcMMs(lambda: number, mu: number, s: number): MMsResult {
  const rho = lambda / (s * mu);
  if (rho >= 1) {
    return { rho, P0: 0, Lq: Infinity, Wq: Infinity, W: Infinity, L: Infinity, unstable: true };
  }
  const a = lambda / mu; // offered load

  let sum = 0;
  for (let n = 0; n < s; n++) {
    sum += Math.pow(a, n) / factorial(n);
  }
  const last = (Math.pow(a, s) / factorial(s)) * (1 / (1 - rho));
  const P0 = 1 / (sum + last);

  const Lq = (P0 * Math.pow(a, s) * rho) / (factorial(s) * Math.pow(1 - rho, 2));
  const Wq = Lq / lambda;
  const W = Wq + 1 / mu;
  const L = lambda * W;

  return { rho, P0, Lq, Wq, W, L, unstable: false };
}
