export interface EOQResult {
  Q: number;
  orderCost: number;   // annual
  holdingCost: number; // annual
  totalCost: number;   // annual
}

/**
 * EOQ Q* = sqrt(2DS/H)
 * D = annual demand, S = cost per order, H = holding cost per unit per year
 */
export function calcEOQ(D: number, S: number, H: number): EOQResult {
  if (D <= 0 || S <= 0 || H <= 0) {
    return { Q: 0, orderCost: 0, holdingCost: 0, totalCost: 0 };
  }
  const Q = Math.sqrt((2 * D * S) / H);
  const orderCost = (D / Q) * S;
  const holdingCost = (Q / 2) * H;
  return { Q, orderCost, holdingCost, totalCost: orderCost + holdingCost };
}

/** Days needed to consume Q units at demand rate D/year */
export function daysToConsume(Q: number, D_anual: number): number {
  if (D_anual <= 0) return Infinity;
  return (Q / D_anual) * 365;
}

/** Maximum safe order size given a shelf life in days */
export function maxSafeQty(D_anual: number, validade_dias: number): number {
  return (D_anual / 365) * validade_dias;
}
