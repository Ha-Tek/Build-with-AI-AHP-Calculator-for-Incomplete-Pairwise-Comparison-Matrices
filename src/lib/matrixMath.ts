/**
 * Linear Algebra, Graph Analysis, and Spectral Utilities for AHP Matrix Completion
 */

import { MatrixValidationStatus } from '../types';
import { getRI } from './constants';

export interface EigenResult {
  lambdaMax: number;
  eigenvector: number[]; // normalized sum = 1
  ci: number;
  cr: number;
}

/**
 * Multiply two square matrices of size n x n
 */
export function matMul(A: number[][], B: number[][]): number[][] {
  const n = A.length;
  const C: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += A[i][k] * B[k][j];
      }
      C[i][j] = sum;
    }
  }
  return C;
}

/**
 * Invert a square matrix of size n x n using Gauss-Jordan elimination with partial pivoting.
 * Returns null if the matrix is singular or near-singular.
 */
export function invertMatrix(A: number[][]): number[][] | null {
  const n = A.length;
  // Augmented matrix [A | I]
  const aug: number[][] = Array.from({ length: n }, (_, i) => {
    const row = [...A[i]];
    const ident = Array(n).fill(0);
    ident[i] = 1;
    return [...row, ...ident];
  });

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    let maxVal = Math.abs(aug[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > maxVal) {
        maxVal = Math.abs(aug[k][i]);
        maxRow = k;
      }
    }

    if (maxVal < 1e-12) {
      return null; // Singular matrix
    }

    // Swap rows
    if (maxRow !== i) {
      const temp = aug[i];
      aug[i] = aug[maxRow];
      aug[maxRow] = temp;
    }

    // Normalize pivot row
    const pivot = aug[i][i];
    for (let j = 0; j < 2 * n; j++) {
      aug[i][j] /= pivot;
    }

    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = aug[k][i];
        for (let j = 0; j < 2 * n; j++) {
          aug[k][j] -= factor * aug[i][j];
        }
      }
    }
  }

  // Extract inverted matrix
  const inv: number[][] = Array.from({ length: n }, (_, i) =>
    aug[i].slice(n, 2 * n)
  );
  return inv;
}

/**
 * Solve linear system A * x = b using Gaussian elimination with partial pivoting
 */
export function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  const M: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxVal) {
        maxVal = Math.abs(M[k][i]);
        maxRow = k;
      }
    }

    if (maxVal < 1e-12) {
      return null; // Singular system
    }

    if (maxRow !== i) {
      const temp = M[i];
      M[i] = M[maxRow];
      M[maxRow] = temp;
    }

    const pivot = M[i][i];
    for (let j = i; j <= n; j++) {
      M[i][j] /= pivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        for (let j = i; j <= n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }
  }

  return M.map((row) => row[n]);
}

/**
 * Computes Perron-Frobenius eigenvalue λmax and normalized right eigenvector w
 * using Power Iteration for positive reciprocal matrices.
 */
export function computePerronEigen(
  matrix: number[][],
  maxIter = 300,
  tol = 1e-10
): EigenResult {
  const n = matrix.length;
  if (n <= 1) {
    return {
      lambdaMax: 1,
      eigenvector: [1],
      ci: 0,
      cr: 0,
    };
  }

  if (n === 2) {
    // Exact analytical formula for 2x2 reciprocal matrix:
    // [1, a; 1/a, 1] has λmax = 2, CI = 0, CR = 0
    const a = matrix[0][1];
    const w1 = a / (1 + a);
    const w2 = 1 / (1 + a);
    return {
      lambdaMax: 2,
      eigenvector: [w1, w2],
      ci: 0,
      cr: 0,
    };
  }

  // Initialize vector with positive values
  let v = Array(n).fill(1 / n);
  let lambda = n;

  for (let iter = 0; iter < maxIter; iter++) {
    // Next vector = matrix * v
    const vNext = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += matrix[i][j] * v[j];
      }
      vNext[i] = sum;
    }

    // Estimate lambda using Rayleigh quotient or element-wise ratio
    let sumVNext = 0;
    for (let i = 0; i < n; i++) {
      sumVNext += vNext[i];
    }

    const currentLambda = sumVNext; // Since sum(v) was 1

    // Normalize vNext to sum = 1
    for (let i = 0; i < n; i++) {
      vNext[i] /= sumVNext;
    }

    // Check convergence
    let diff = 0;
    for (let i = 0; i < n; i++) {
      diff = Math.max(diff, Math.abs(vNext[i] - v[i]));
    }

    v = vNext;
    lambda = currentLambda;

    if (diff < tol) {
      break;
    }
  }

  // Refine lambdaMax via Rayleigh quotient
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += matrix[i][j] * v[j];
    }
    num += v[i] * rowSum;
    den += v[i] * v[i];
  }
  const lambdaMax = Math.max(n, den > 0 ? num / den : lambda);

  // Saaty Consistency Index CI = (λmax - n) / (n - 1)
  const ci = Math.max(0, (lambdaMax - n) / (n - 1));
  const ri = getRI(n);
  const cr = ri > 0 ? ci / ri : 0;

  return {
    lambdaMax,
    eigenvector: v,
    ci,
    cr,
  };
}

/**
 * Validate input incomplete matrix:
 * - Checks size
 * - Checks reciprocity of known entries (a_ji = 1/a_ij)
 * - Checks diagonal is 1
 * - Checks graph connectedness: returns connected components
 */
export function validateIncompleteMatrix(
  matrix: (number | null)[][]
): MatrixValidationStatus {
  const n = matrix.length;
  const errorMessages: string[] = [];
  const warningMessages: string[] = [];

  if (n < 3) {
    errorMessages.push('Matrix order n must be at least 3 for AHP analysis.');
  }

  let missingCountUpper = 0;
  let knownCountUpper = 0;

  // Build adjacency list for known undirected edges
  const adj: number[][] = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    if (matrix[i].length !== n) {
      errorMessages.push(`Row ${i + 1} has invalid column count.`);
    }

    // Check diagonal
    const diag = matrix[i][i];
    if (diag !== null && Math.abs(diag - 1.0) > 1e-4) {
      warningMessages.push(`Diagonal entry a_${i + 1}${i + 1} should be 1.0.`);
    }

    for (let j = i + 1; j < n; j++) {
      const a_ij = matrix[i][j];
      const a_ji = matrix[j][i];

      if (a_ij === null || isNaN(a_ij)) {
        missingCountUpper++;
      } else {
        knownCountUpper++;
        if (a_ij <= 0) {
          errorMessages.push(`Entry a_${i + 1}${j + 1} must be positive.`);
        } else if (a_ij < 1 / 9 - 1e-4 || a_ij > 9 + 1e-4) {
          warningMessages.push(
            `Entry a_${i + 1}${j + 1} (${a_ij}) is outside Saaty scale [1/9, 9].`
          );
        }
        // Check reciprocal if present
        if (a_ji !== null && !isNaN(a_ji)) {
          if (Math.abs(a_ij * a_ji - 1.0) > 1e-3) {
            warningMessages.push(
              `Reciprocal mismatch: a_${i + 1}${j + 1} = ${a_ij}, but a_${j + 1}${i + 1} = ${a_ji}.`
            );
          }
        }
        // Graph edge
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }

  // Find connected components via BFS
  const visited = Array(n).fill(false);
  const components: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (!visited[i]) {
      const comp: number[] = [];
      const queue: number[] = [i];
      visited[i] = true;

      while (queue.length > 0) {
        const u = queue.shift()!;
        comp.push(u);
        for (const v of adj[u]) {
          if (!visited[v]) {
            visited[v] = true;
            queue.push(v);
          }
        }
      }
      components.push(comp);
    }
  }

  const isConnected = components.length === 1;
  if (!isConnected) {
    errorMessages.push(
      `The comparison graph is disconnected into ${components.length} components: ${components
        .map((c) => `{${c.map((idx) => `A${idx + 1}`).join(', ')}}`)
        .join(
          ', '
        )}. To enable mathematical completion, add comparisons connecting these groups.`
    );
  }

  if (missingCountUpper === 0) {
    warningMessages.push(
      'Matrix is already complete (no missing entries in upper triangle).'
    );
  }

  const maxMissingPossible = (n * (n - 1)) / 2 - (n - 1);
  if (missingCountUpper > maxMissingPossible) {
    warningMessages.push(
      `Matrix has ${missingCountUpper} missing comparisons; only ${(n * (n - 1)) / 2 - missingCountUpper} known comparisons remain. Tree requires at least ${n - 1} connected comparisons.`
    );
  }

  return {
    isValid: errorMessages.length === 0,
    isConnected,
    n,
    missingCountUpper,
    knownCountUpper,
    components,
    errorMessages,
    warningMessages,
  };
}

/**
 * Find all simple paths between start and end node in an undirected graph
 * using depth-first search with backtracking (for Method M7).
 */
export function findAllSimplePaths(
  adj: number[][],
  start: number,
  end: number,
  maxPathLen = 10
): number[][] {
  const paths: number[][] = [];
  const currentPath: number[] = [start];
  const visited = Array(adj.length).fill(false);
  visited[start] = true;

  function dfs(u: number) {
    if (u === end) {
      paths.push([...currentPath]);
      return;
    }

    if (currentPath.length >= maxPathLen) {
      return;
    }

    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true;
        currentPath.push(v);
        dfs(v);
        currentPath.pop();
        visited[v] = false;
      }
    }
  }

  dfs(start);
  return paths;
}

/**
 * Compute Manhattan log-distance D(L, B) between two completed matrices
 * as defined in Eq. (20) of the paper:
 * D(L, B) = || log(L) - log(B) || = ∑_i ∑_j | ln(l_ij) - ln(b_ij) |
 */
export function computeMatrixDistance(L: number[][], B: number[][]): number {
  const n = L.length;
  let dist = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const valL = L[i][j];
      const valB = B[i][j];
      if (valL > 0 && valB > 0) {
        dist += Math.abs(Math.log(valL) - Math.log(valB));
      }
    }
  }
  return dist;
}

/**
 * Compute Manhattan distance between two normalized weight vectors
 * as defined in Eq. (21) of the paper:
 * d^(u, v) = ∑_i | u_i - v_i |
 */
export function computeWeightDistance(u: number[], v: number[]): number {
  let dist = 0;
  for (let i = 0; i < u.length; i++) {
    dist += Math.abs(u[i] - v[i]);
  }
  return dist;
}

/**
 * Clamps value into standard Saaty range [1/9, 9]
 */
export function clampToSaatyRange(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 1.0;
  if (val < 1 / 9) return 1 / 9;
  if (val > 9) return 9.0;
  return val;
}

/**
 * Convert numerical value to readable fraction or clean decimal string
 */
export function formatAHPValue(val: number, precision = 3): string {
  if (isNaN(val)) return '—';
  const saatyFracs: [number, string][] = [
    [1 / 9, '1/9'],
    [1 / 8, '1/8'],
    [1 / 7, '1/7'],
    [1 / 6, '1/6'],
    [1 / 5, '1/5'],
    [1 / 4, '1/4'],
    [1 / 3, '1/3'],
    [1 / 2, '1/2'],
    [2 / 3, '2/3'],
    [3 / 4, '3/4'],
    [1, '1'],
    [4 / 3, '4/3'],
    [3 / 2, '3/2'],
    [2, '2'],
    [5 / 2, '5/2'],
    [3, '3'],
    [7 / 2, '7/2'],
    [4, '4'],
    [9 / 2, '9/2'],
    [5, '5'],
    [6, '6'],
    [7, '7'],
    [8, '8'],
    [9, '9'],
  ];

  for (const [fracVal, label] of saatyFracs) {
    if (Math.abs(val - fracVal) < 0.005) {
      return label;
    }
  }

  // Format decimal
  return Number(val.toFixed(precision)).toString();
}
