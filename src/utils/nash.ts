// 2x2 game analysis: pure Nash equilibria + strict dominance

export type PayoffMatrix = [number, number][][]; // matrix[i][j] = [rowPayoff, colPayoff]

/**
 * A cell (i,j) is a pure Nash equilibrium if:
 *  - row player cannot improve by switching row (given col j)
 *  - col player cannot improve by switching col (given row i)
 */
export function findNashPure(matrix: PayoffMatrix): [number, number][] {
  const nash: [number, number][] = [];
  const rows = matrix.length;
  const cols = matrix[0].length;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const [rP, cP] = matrix[i][j];
      let rowBest = true;
      for (let k = 0; k < rows; k++) {
        if (matrix[k][j][0] > rP) { rowBest = false; break; }
      }
      if (!rowBest) continue;
      let colBest = true;
      for (let k = 0; k < cols; k++) {
        if (matrix[i][k][1] > cP) { colBest = false; break; }
      }
      if (colBest) nash.push([i, j]);
    }
  }
  return nash;
}

export interface DominanceResult {
  rowDominant: number | null; // index of strictly dominant row strategy, or null
  colDominant: number | null;
  rowProof: string;
  colProof: string;
}

export function checkDominance(matrix: PayoffMatrix): DominanceResult {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let rowDominant: number | null = null;
  let rowProof = '';
  for (let i = 0; i < rows; i++) {
    for (let k = 0; k < rows; k++) {
      if (i === k) continue;
      let dominates = true;
      for (let j = 0; j < cols; j++) {
        if (matrix[i][j][0] <= matrix[k][j][0]) { dominates = false; break; }
      }
      if (dominates) {
        rowDominant = i;
        rowProof = Array.from({ length: cols }, (_, j) => `${matrix[i][j][0]} > ${matrix[k][j][0]}`).join(' e ');
      }
    }
  }
  let colDominant: number | null = null;
  let colProof = '';
  for (let j = 0; j < cols; j++) {
    for (let k = 0; k < cols; k++) {
      if (j === k) continue;
      let dominates = true;
      for (let i = 0; i < rows; i++) {
        if (matrix[i][j][1] <= matrix[i][k][1]) { dominates = false; break; }
      }
      if (dominates) {
        colDominant = j;
        colProof = Array.from({ length: rows }, (_, i) => `${matrix[i][j][1]} > ${matrix[i][k][1]}`).join(' e ');
      }
    }
  }
  return { rowDominant, colDominant, rowProof, colProof };
}
