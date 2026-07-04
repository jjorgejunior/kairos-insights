// Single source of number/currency/percent formatting (pt-BR).
// Replaces the mix of toLocaleString + toFixed spread across the old tabs.

/** Fixed-decimal pt-BR number with thousands separators. */
export function fmt(n: number, dec = 0): string {
  return Number(n).toLocaleString("pt-BR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

/** Brazilian currency, rounded to whole reais. */
export function brl(n: number): string {
  return "R$ " + fmt(Math.round(n));
}

/** Percentage with a fixed number of decimals. */
export function pct(n: number, dec = 1): string {
  return fmt(n, dec) + "%";
}
