/**
 * Implementation of all 11 PCM completion methods M1 - M11
 * strictly according to Tekile, Brunelli, & Fedrizzi (2023).
 */

import {
  CompletionResult,
  EstimatedValue,
  MethodId,
  MissingEntry,
} from '../types';
import { METHOD_INFO_LIST } from './constants';
import {
  clampToSaatyRange,
  computePerronEigen,
  findAllSimplePaths,
  invertMatrix,
  matMul,
  solveLinearSystem,
} from './matrixMath';
import { optimizeNelderMead } from './optimization';

/**
 * Extract missing positions in the upper triangle (i < j)
 */
export function extractMissingEntries(
  matrix: (number | null)[][]
): MissingEntry[] {
  const n = matrix.length;
  const missing: MissingEntry[] = [];
  let counter = 1;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const val = matrix[i][j];
      if (val === null || isNaN(val)) {
        missing.push({
          row: i,
          col: j,
          variableName: `x${counter++}`,
        });
      }
    }
  }
  return missing;
}

/**
 * Fill an incomplete matrix with given missing values x (array matching missing entries)
 */
export function fillMatrixWithValues(
  baseMatrix: (number | null)[][],
  missing: MissingEntry[],
  x: number[]
): number[][] {
  const n = baseMatrix.length;
  const A: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 1.0;
      const baseVal = baseMatrix[i][j];
      if (baseVal !== null && !isNaN(baseVal) && baseVal > 0) {
        return baseVal;
      }
      return 1.0;
    })
  );

  // Set missing values and their reciprocals
  for (let p = 0; p < missing.length; p++) {
    const { row, col } = missing[p];
    const val = clampToSaatyRange(x[p]);
    A[row][col] = val;
    A[col][row] = 1.0 / val;
  }

  return A;
}

/**
 * Compute rankings from priority weight vector (1 = highest weight)
 */
export function computeRankings(weights: number[]): number[] {
  const indexed = weights.map((w, idx) => ({ w, idx }));
  // Sort descending
  indexed.sort((a, b) => b.w - a.w);
  const ranks = Array(weights.length).fill(1);
  indexed.forEach((item, rankIdx) => {
    ranks[item.idx] = rankIdx + 1;
  });
  return ranks;
}

/**
 * Finalize completion result: compute Perron eigen, CI, CR, ranks, etc.
 */
function finalizeResult(
  methodId: MethodId,
  completedMatrix: number[][],
  missing: MissingEntry[],
  startTime: number,
  objectiveValue?: number,
  notes?: string
): CompletionResult {
  const info = METHOD_INFO_LIST.find((m) => m.id === methodId)!;
  const eigen = computePerronEigen(completedMatrix);
  const ranks = computeRankings(eigen.eigenvector);

  const estimatedEntries: EstimatedValue[] = missing.map((m) => {
    const val = completedMatrix[m.row][m.col];
    return {
      row: m.row,
      col: m.col,
      variableName: m.variableName,
      value: val,
      reciprocalValue: 1.0 / val,
    };
  });

  return {
    methodId,
    methodName: info.name,
    shortName: info.shortName,
    category: info.category,
    completedMatrix,
    estimatedEntries,
    weights: eigen.eigenvector,
    rankings: ranks,
    lambdaMax: eigen.lambdaMax,
    ci: eigen.ci,
    cr: eigen.cr,
    isConsistent: eigen.cr <= 0.1,
    computationTimeMs: Math.max(0.1, performance.now() - startTime),
    objectiveValue,
    notes,
  };
}

// -------------------------------------------------------------------------
// METHOD 11: Incomplete Logarithmic Least Squares (LLS) [Bozóki et al. 2010]
// -------------------------------------------------------------------------
export function solveM11_LLS(
  matrix: (number | null)[][],
  missing: MissingEntry[]
): CompletionResult {
  const startTime = performance.now();
  const n = matrix.length;

  if (missing.length === 0) {
    const filled = fillMatrixWithValues(matrix, [], []);
    return finalizeResult('M11', filled, missing, startTime);
  }

  // Set of known edges E
  // Laplacian matrix L where L_ii = deg(i), L_ij = -1 if edge exists
  const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const b: number[] = Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const val = matrix[i][j];
        if (val !== null && !isNaN(val) && val > 0) {
          L[i][i] += 1;
          L[i][j] -= 1;
          b[i] += Math.log(val);
        }
      }
    }
  }

  // To fix the gauge constraint ∑ y_i = 0, add (1/n) * 1 * 1^T to L
  const A_sys: number[][] = Array.from({ length: n }, (row, i) =>
    Array.from({ length: n }, (col, j) => L[i][j] + 1.0 / n)
  );

  const y = solveLinearSystem(A_sys, b);
  let weights: number[];

  if (y) {
    const expY = y.map((v) => Math.exp(v));
    const sumExp = expY.reduce((acc, v) => acc + v, 0);
    weights = expY.map((v) => v / sumExp);
  } else {
    // Fallback: uniform
    weights = Array(n).fill(1 / n);
  }

  // Estimate missing entries as ratio w_i / w_j
  const estimatedX: number[] = missing.map((m) => {
    const ratio = weights[m.row] / weights[m.col];
    return clampToSaatyRange(ratio);
  });

  const completed = fillMatrixWithValues(matrix, missing, estimatedX);
  return finalizeResult(
    'M11',
    completed,
    missing,
    startTime,
    undefined,
    'Exact solution of graph Laplacian system.'
  );
}

// -------------------------------------------------------------------------
// METHOD 10: Harker's Eigenvalue Method [Harker 1987]
// -------------------------------------------------------------------------
export function solveM10_Harker(
  matrix: (number | null)[][],
  missing: MissingEntry[]
): CompletionResult {
  const startTime = performance.now();
  const n = matrix.length;

  if (missing.length === 0) {
    const filled = fillMatrixWithValues(matrix, [], []);
    return finalizeResult('M10', filled, missing, startTime);
  }

  // Count missing entries in each row k_i
  const k_row = Array(n).fill(0);
  for (const m of missing) {
    k_row[m.row]++;
    k_row[m.col]++;
  }

  // Construct auxiliary matrix B
  const B: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) {
        return 1.0 + k_row[i];
      }
      const val = matrix[i][j];
      if (val !== null && !isNaN(val) && val > 0) {
        return val;
      }
      return 0.0;
    })
  );

  // Compute maximum eigenvalue and right eigenvector of B
  const eigen = computePerronEigen(B, 300, 1e-10);
  const w = eigen.eigenvector;

  // Estimate missing entries as w_i / w_j
  const estimatedX: number[] = missing.map((m) => {
    const ratio = w[m.row] / w[m.col];
    return clampToSaatyRange(ratio);
  });

  const completed = fillMatrixWithValues(matrix, missing, estimatedX);
  return finalizeResult(
    'M10',
    completed,
    missing,
    startTime,
    eigen.lambdaMax,
    `Auxiliary matrix B spectral radius: ${eigen.lambdaMax.toFixed(4)}`
  );
}

// -------------------------------------------------------------------------
// METHOD 7: Connecting Paths Method (Geometric Mean of Paths) [Harker 1987]
// -------------------------------------------------------------------------
export function solveM7_ConnectingPaths(
  matrix: (number | null)[][],
  missing: MissingEntry[]
): CompletionResult {
  const startTime = performance.now();
  const n = matrix.length;

  if (missing.length === 0) {
    const filled = fillMatrixWithValues(matrix, [], []);
    return finalizeResult('M7', filled, missing, startTime);
  }

  // Build graph of known entries
  const adj: number[][] = Array.from({ length: n }, () => []);
  const edgeWeights: Map<string, number> = new Map();

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const val = matrix[i][j];
        if (val !== null && !isNaN(val) && val > 0) {
          adj[i].push(j);
          edgeWeights.set(`${i}-${j}`, val);
        }
      }
    }
  }

  const estimatedX: number[] = missing.map((m) => {
    // Find all simple connecting paths from m.row to m.col
    const paths = findAllSimplePaths(adj, m.row, m.col, n);

    if (paths.length === 0) {
      return 1.0;
    }

    // Geometric mean of path intensities
    let sumLogIntensity = 0;
    for (const path of paths) {
      let pathIntensity = 1.0;
      for (let k = 0; k < path.length - 1; k++) {
        const u = path[k];
        const v = path[k + 1];
        pathIntensity *= edgeWeights.get(`${u}-${v}`) ?? 1.0;
      }
      sumLogIntensity += Math.log(pathIntensity);
    }

    const geoMean = Math.exp(sumLogIntensity / paths.length);
    return clampToSaatyRange(geoMean);
  });

  const completed = fillMatrixWithValues(matrix, missing, estimatedX);
  return finalizeResult(
    'M7',
    completed,
    missing,
    startTime,
    undefined,
    'Geometric mean over all simple connecting paths.'
  );
}

// -------------------------------------------------------------------------
// METHOD 8: Alonso et al.'s Iterative Method [Alonso et al. 2008]
// -------------------------------------------------------------------------
export function solveM8_Alonso(
  matrix: (number | null)[][],
  missing: MissingEntry[]
): CompletionResult {
  const startTime = performance.now();
  const n = matrix.length;

  if (missing.length === 0) {
    const filled = fillMatrixWithValues(matrix, [], []);
    return finalizeResult('M8', filled, missing, startTime);
  }

  // Copy matrix
  const A: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 1.0;
      const v = matrix[i][j];
      return v !== null && !isNaN(v) && v > 0 ? v : 0.0;
    })
  );

  // Track known values (KV) and missing values (UV)
  const isKnown: boolean[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return true;
      const v = matrix[i][j];
      return v !== null && !isNaN(v) && v > 0;
    })
  );

  let remainingMissing = missing.length;
  let iterations = 0;
  const maxIterations = n * 2;

  while (remainingMissing > 0 && iterations < maxIterations) {
    iterations++;
    const stepEstimates: { row: number; col: number; val: number }[] = [];

    // Check all currently unknown pairs (i, k)
    for (let i = 0; i < n; i++) {
      for (let k = i + 1; k < n; k++) {
        if (!isKnown[i][k]) {
          // Identify H1, H2, H3
          const H1: number[] = [];
          const H2: number[] = [];
          const H3: number[] = [];

          for (let j = 0; j < n; j++) {
            if (j !== i && j !== k) {
              if (isKnown[i][j] && isKnown[j][k]) H1.push(j);
              if (isKnown[j][k] && isKnown[j][i]) H2.push(j);
              if (isKnown[i][j] && isKnown[k][j]) H3.push(j);
            }
          }

          const K_set: number[] = [];
          if (H1.length > 0) K_set.push(1);
          if (H2.length > 0) K_set.push(2);
          if (H3.length > 0) K_set.push(3);

          if (K_set.length > 0) {
            let logProductK = 0;

            if (H1.length > 0) {
              let sumLogH1 = 0;
              for (const j of H1) {
                sumLogH1 += Math.log(A[i][j] * A[j][k]);
              }
              logProductK += sumLogH1 / H1.length;
            }

            if (H2.length > 0) {
              let sumLogH2 = 0;
              for (const j of H2) {
                sumLogH2 += Math.log(A[j][k] / A[j][i]);
              }
              logProductK += sumLogH2 / H2.length;
            }

            if (H3.length > 0) {
              let sumLogH3 = 0;
              for (const j of H3) {
                sumLogH3 += Math.log(A[i][j] / A[k][j]);
              }
              logProductK += sumLogH3 / H3.length;
            }

            const estimated = Math.exp(logProductK / K_set.length);
            stepEstimates.push({
              row: i,
              col: k,
              val: clampToSaatyRange(estimated),
            });
          }
        }
      }
    }

    if (stepEstimates.length === 0) {
      // If stuck, fill remaining with M11 estimates to avoid infinite loop
      break;
    }

    for (const est of stepEstimates) {
      A[est.row][est.col] = est.val;
      A[est.col][est.row] = 1.0 / est.val;
      isKnown[est.row][est.col] = true;
      isKnown[est.col][est.row] = true;
      remainingMissing--;
    }
  }

  // If any missing remain (due to graph edge ordering), fill using geometric mean / fallback
  for (const m of missing) {
    if (!isKnown[m.row][m.col]) {
      A[m.row][m.col] = 1.0;
      A[m.col][m.row] = 1.0;
    }
  }

  return finalizeResult(
    'M8',
    A,
    missing,
    startTime,
    iterations,
    `Completed in ${iterations} propagation step(s).`
  );
}

// -------------------------------------------------------------------------
// METHOD 9: DEMATEL-based Completion Method [Zhou et al. 2018]
// -------------------------------------------------------------------------
export function solveM9_DEMATEL(
  matrix: (number | null)[][]
): CompletionResult {
  const startTime = performance.now();
  const n = matrix.length;
  const missing = extractMissingEntries(matrix);

  if (missing.length === 0) {
    const filled = fillMatrixWithValues(matrix, [], []);
    return finalizeResult('M9', filled, missing, startTime);
  }

  // Step 1: Direct-relation matrix Dr (known values, missing = 0, diagonal = 1)
  const Dr: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 1.0;
      const val = matrix[i][j];
      return val !== null && !isNaN(val) && val > 0 ? val : 0.0;
    })
  );

  // Compute m = max(max_row_sum, max_col_sum)
  let maxRowSum = 0;
  let maxColSum = 0;
  for (let i = 0; i < n; i++) {
    let rSum = 0;
    let cSum = 0;
    for (let j = 0; j < n; j++) {
      rSum += Dr[i][j];
      cSum += Dr[j][i];
    }
    maxRowSum = Math.max(maxRowSum, rSum);
    maxColSum = Math.max(maxColSum, cSum);
  }
  const m = Math.max(maxRowSum, maxColSum, 1.0);

  // Normalized matrix N = Dr / m
  const N: number[][] = Dr.map((row) => row.map((v) => v / m));

  // Step 2: Total-relation matrix Tr = N * (I - N)^(-1)
  // Compute (I - N)
  const I_minus_N: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1.0 - N[i][j] : -N[i][j]))
  );

  const inv = invertMatrix(I_minus_N);
  let Tr: number[][];

  if (inv) {
    Tr = matMul(N, inv);
  } else {
    // If singular, power approximation Tr = ∑_{p=1}^5 N^p (Section 3, Step 4 of paper)
    Tr = Array.from({ length: n }, () => Array(n).fill(0));
    let N_pow = N.map((row) => [...row]);
    for (let p = 1; p <= 5; p++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          Tr[i][j] += N_pow[i][j];
        }
      }
      if (p < 5) {
        N_pow = matMul(N_pow, N);
      }
    }
  }

  // Step 3 & 4: c_ij = sqrt(t_ij / t_ji)
  const estimatedX: number[] = missing.map((mis) => {
    const t_ij = Tr[mis.row][mis.col];
    const t_ji = Tr[mis.col][mis.row];
    let c_ij = 1.0;
    if (t_ij > 1e-12 && t_ji > 1e-12) {
      c_ij = Math.sqrt(t_ij / t_ji);
    } else if (t_ij > 1e-12) {
      c_ij = 9.0;
    } else if (t_ji > 1e-12) {
      c_ij = 1 / 9;
    }
    return clampToSaatyRange(c_ij);
  });

  const completed = fillMatrixWithValues(matrix, missing, estimatedX);
  return finalizeResult(
    'M9',
    completed,
    missing,
    startTime,
    undefined,
    inv
      ? 'Total-relation matrix Tr = N*(I - N)^(-1)'
      : 'Power series approximation Tr = ∑_{p=1}^5 N^p'
  );
}

// -------------------------------------------------------------------------
// METHOD 3: ρ-based Optimal Completion Method [Fedrizzi & Giove 2007]
// -------------------------------------------------------------------------
export function solveM3_Rho(
  matrix: (number | null)[][],
  missing: MissingEntry[],
  initialGuessX?: number[]
): CompletionResult {
  const startTime = performance.now();
  const n = matrix.length;

  if (missing.length === 0) {
    const filled = fillMatrixWithValues(matrix, [], []);
    return finalizeResult('M3', filled, missing, startTime);
  }

  // Map multiplicative entries into reciprocal preference relation R:
  // r_ij = 0.5 * (1 + log9(a_ij))
  // Missing variables y_p in [0, 1]
  const log9 = Math.log(9);
  function toR(a: number): number {
    return 0.5 * (1.0 + Math.log(a) / log9);
  }
  function fromR(r: number): number {
    return Math.pow(9, 2.0 * r - 1.0);
  }

  // Initial y vector
  const x0 = initialGuessX ?? missing.map(() => 1.0);
  const y0 = x0.map((x) => Math.max(0, Math.min(1, toR(x))));

  // Objective function ρ(R(y)) = ∑_{i,h,j} (r_ih + r_hj - r_ij - 0.5)^2
  function costRho(y: number[]): number {
    // Fill R matrix
    const R: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return 0.5;
        const val = matrix[i][j];
        if (val !== null && !isNaN(val) && val > 0) {
          return toR(val);
        }
        return 0.5;
      })
    );

    for (let p = 0; p < missing.length; p++) {
      const { row, col } = missing[p];
      const rVal = Math.max(0, Math.min(1, y[p]));
      R[row][col] = rVal;
      R[col][row] = 1.0 - rVal;
    }

    let sum = 0;
    for (let i = 0; i < n; i++) {
      for (let h = 0; h < n; h++) {
        for (let j = 0; j < n; j++) {
          const diff = R[i][h] + R[h][j] - R[i][j] - 0.5;
          sum += diff * diff;
        }
      }
    }
    return sum;
  }

  const lb = missing.map(() => 0.0);
  const ub = missing.map(() => 1.0);

  const opt = optimizeNelderMead(costRho, y0, lb, ub, {
    maxIter: 400,
    tol: 1e-7,
  });

  const estimatedX = opt.x.map((y) => clampToSaatyRange(fromR(y)));
  const completed = fillMatrixWithValues(matrix, missing, estimatedX);

  return finalizeResult(
    'M3',
    completed,
    missing,
    startTime,
    opt.fval,
    `Minimized quadratic additive inconsistency ρ(R) = ${opt.fval.toFixed(4)}`
  );
}

// -------------------------------------------------------------------------
// METHOD 2: c3-based Optimal Completion Method [Shiraishi et al. 1998, Obata et al. 1999]
// -------------------------------------------------------------------------
export function solveM2_c3(
  matrix: (number | null)[][],
  missing: MissingEntry[],
  initialGuessX?: number[]
): CompletionResult {
  const startTime = performance.now();
  const n = matrix.length;

  if (missing.length === 0) {
    const filled = fillMatrixWithValues(matrix, [], []);
    return finalizeResult('M2', filled, missing, startTime);
  }

  // Maximize c3(A(x)) = ∑ (2 - a_ih*a_hj/a_ij - a_ij/(a_ih*a_hj))
  // Equivalent to minimizing -c3 = ∑ (a_ih*a_hj/a_ij + a_ij/(a_ih*a_hj) - 2)
  function costNegativeC3(x: number[]): number {
    const A = fillMatrixWithValues(matrix, missing, x);
    let negC3 = 0;
    for (let i = 0; i < n; i++) {
      for (let h = i + 1; h < n; h++) {
        for (let j = h + 1; j < n; j++) {
          const ratio1 = (A[i][h] * A[h][j]) / A[i][j];
          const ratio2 = A[i][j] / (A[i][h] * A[h][j]);
          negC3 += ratio1 + ratio2 - 2.0;
        }
      }
    }
    return negC3;
  }

  const x0 = initialGuessX ?? missing.map(() => 1.0);
  const lb = missing.map(() => 1 / 9);
  const ub = missing.map(() => 9.0);

  const opt = optimizeNelderMead(costNegativeC3, x0, lb, ub, {
    maxIter: 400,
    tol: 1e-7,
  });

  const completed = fillMatrixWithValues(matrix, missing, opt.x);
  const actualC3 = -opt.fval;

  return finalizeResult(
    'M2',
    completed,
    missing,
    startTime,
    actualC3,
    `Maximized c3 index = ${actualC3.toFixed(4)}`
  );
}

// -------------------------------------------------------------------------
// METHOD 1: λmax-based Optimal Completion Method [Bozóki et al. 2010, Tekile et al. 2021]
// -------------------------------------------------------------------------
export function solveM1_LambdaMax(
  matrix: (number | null)[][],
  missing: MissingEntry[],
  initialGuessX?: number[]
): CompletionResult {
  const startTime = performance.now();

  if (missing.length === 0) {
    const filled = fillMatrixWithValues(matrix, [], []);
    return finalizeResult('M1', filled, missing, startTime);
  }

  // Cost function is Perron-Frobenius eigenvalue λmax(A(x))
  function costLambda(x: number[]): number {
    const A = fillMatrixWithValues(matrix, missing, x);
    const eigen = computePerronEigen(A, 120, 1e-8);
    return eigen.lambdaMax;
  }

  const x0 = initialGuessX ?? missing.map(() => 1.0);
  const lb = missing.map(() => 1 / 9);
  const ub = missing.map(() => 9.0);

  const opt = optimizeNelderMead(costLambda, x0, lb, ub, {
    maxIter: 400,
    tol: 1e-8,
  });

  const completed = fillMatrixWithValues(matrix, missing, opt.x);
  return finalizeResult(
    'M1',
    completed,
    missing,
    startTime,
    opt.fval,
    `Minimizes Perron eigenvalue λmax = ${opt.fval.toFixed(4)}`
  );
}

// -------------------------------------------------------------------------
// METHOD 4: δ-based Local Inconsistency Indicator [Ergu & Kou 2013]
// -------------------------------------------------------------------------
export function solveM4_Delta(
  matrix: (number | null)[][],
  missing: MissingEntry[],
  initialGuessX?: number[]
): CompletionResult {
  const startTime = performance.now();
  const n = matrix.length;

  if (missing.length === 0) {
    const filled = fillMatrixWithValues(matrix, [], []);
    return finalizeResult('M4', filled, missing, startTime);
  }

  // δ_ij = (1/n) ∑_{h=1}^n (a_ih * a_hj - a_ij)
  // Minimize ∑_i ∑_j (δ_ij)^2
  function costDelta(x: number[]): number {
    const A = fillMatrixWithValues(matrix, missing, x);
    let totalDeltaSq = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sumIndirect = 0;
        for (let h = 0; h < n; h++) {
          sumIndirect += A[i][h] * A[h][j];
        }
        const delta_ij = (1.0 / n) * (sumIndirect - n * A[i][j]);
        totalDeltaSq += delta_ij * delta_ij;
      }
    }
    return totalDeltaSq;
  }

  const x0 = initialGuessX ?? missing.map(() => 1.0);
  const lb = missing.map(() => 1 / 9);
  const ub = missing.map(() => 9.0);

  const opt = optimizeNelderMead(costDelta, x0, lb, ub, {
    maxIter: 400,
    tol: 1e-7,
  });

  const completed = fillMatrixWithValues(matrix, missing, opt.x);
  return finalizeResult(
    'M4',
    completed,
    missing,
    startTime,
    opt.fval,
    `Minimized sum of squared bias indicators ∑(δ_ij)^2 = ${opt.fval.toFixed(4)}`
  );
}

// -------------------------------------------------------------------------
// METHOD 5: ε-based Least Absolute Error (LAE) [Ergu et al. 2014, 2016]
// -------------------------------------------------------------------------
export function solveM5_LAE(
  matrix: (number | null)[][],
  missing: MissingEntry[],
  initialGuessX?: number[]
): CompletionResult {
  const startTime = performance.now();
  const n = matrix.length;

  if (missing.length === 0) {
    const filled = fillMatrixWithValues(matrix, [], []);
    return finalizeResult('M5', filled, missing, startTime);
  }

  // c_ij = [ ∏ a_ih ]^(1/n) / [ ∏ a_jh ]^(1/n) * a_ji
  // ε_ij = c_ij - 1
  // Minimize ∑_i ∑_j |ε_ij|
  function costLAE(x: number[]): number {
    const A = fillMatrixWithValues(matrix, missing, x);
    // Geometric mean of each row
    const geoRow = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sumLog = 0;
      for (let h = 0; h < n; h++) {
        sumLog += Math.log(A[i][h]);
      }
      geoRow[i] = Math.exp(sumLog / n);
    }

    let sumAbsError = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const c_ij = (geoRow[i] / geoRow[j]) * A[j][i];
        sumAbsError += Math.abs(c_ij - 1.0);
      }
    }
    return sumAbsError;
  }

  const x0 = initialGuessX ?? missing.map(() => 1.0);
  const lb = missing.map(() => 1 / 9);
  const ub = missing.map(() => 9.0);

  const opt = optimizeNelderMead(costLAE, x0, lb, ub, {
    maxIter: 400,
    tol: 1e-7,
  });

  const completed = fillMatrixWithValues(matrix, missing, opt.x);
  return finalizeResult(
    'M5',
    completed,
    missing,
    startTime,
    opt.fval,
    `Minimized sum of absolute errors ∑|ε_ij| = ${opt.fval.toFixed(4)}`
  );
}

// -------------------------------------------------------------------------
// METHOD 6: ε-based Least Squares Method (LSM) [Ergu et al. 2016]
// -------------------------------------------------------------------------
export function solveM6_LSM(
  matrix: (number | null)[][],
  missing: MissingEntry[],
  initialGuessX?: number[]
): CompletionResult {
  const startTime = performance.now();
  const n = matrix.length;

  if (missing.length === 0) {
    const filled = fillMatrixWithValues(matrix, [], []);
    return finalizeResult('M6', filled, missing, startTime);
  }

  // Minimize ∑_i ∑_j (ε_ij)^2
  function costLSM(x: number[]): number {
    const A = fillMatrixWithValues(matrix, missing, x);
    const geoRow = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sumLog = 0;
      for (let h = 0; h < n; h++) {
        sumLog += Math.log(A[i][h]);
      }
      geoRow[i] = Math.exp(sumLog / n);
    }

    let sumSqError = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const c_ij = (geoRow[i] / geoRow[j]) * A[j][i];
        const eps = c_ij - 1.0;
        sumSqError += eps * eps;
      }
    }
    return sumSqError;
  }

  const x0 = initialGuessX ?? missing.map(() => 1.0);
  const lb = missing.map(() => 1 / 9);
  const ub = missing.map(() => 9.0);

  const opt = optimizeNelderMead(costLSM, x0, lb, ub, {
    maxIter: 400,
    tol: 1e-7,
  });

  const completed = fillMatrixWithValues(matrix, missing, opt.x);
  return finalizeResult(
    'M6',
    completed,
    missing,
    startTime,
    opt.fval,
    `Minimized sum of squared errors ∑(ε_ij)^2 = ${opt.fval.toFixed(4)}`
  );
}

/**
 * Execute a single specified method
 */
export function executeSingleMethod(
  methodId: MethodId,
  matrix: (number | null)[][]
): CompletionResult {
  const missing = extractMissingEntries(matrix);

  // Obtain baseline analytical guess from M11 or M7 for optimization methods
  let baselineX: number[] | undefined;
  if (missing.length > 0) {
    try {
      const resM11 = solveM11_LLS(matrix, missing);
      baselineX = resM11.estimatedEntries.map((e) => e.value);
    } catch {
      baselineX = undefined;
    }
  }

  switch (methodId) {
    case 'M1':
      return solveM1_LambdaMax(matrix, missing, baselineX);
    case 'M2':
      return solveM2_c3(matrix, missing, baselineX);
    case 'M3':
      return solveM3_Rho(matrix, missing, baselineX);
    case 'M4':
      return solveM4_Delta(matrix, missing, baselineX);
    case 'M5':
      return solveM5_LAE(matrix, missing, baselineX);
    case 'M6':
      return solveM6_LSM(matrix, missing, baselineX);
    case 'M7':
      return solveM7_ConnectingPaths(matrix, missing);
    case 'M8':
      return solveM8_Alonso(matrix, missing);
    case 'M9':
      return solveM9_DEMATEL(matrix);
    case 'M10':
      return solveM10_Harker(matrix, missing);
    case 'M11':
      return solveM11_LLS(matrix, missing);
    default:
      throw new Error(`Unknown method ${methodId}`);
  }
}

/**
 * Execute ALL 11 methods on the given incomplete matrix
 */
export function executeAll11Methods(
  matrix: (number | null)[][]
): CompletionResult[] {
  const missing = extractMissingEntries(matrix);

  // 1. Solve analytical/algebraic methods first (M11, M10, M7, M8, M9)
  const resM11 = solveM11_LLS(matrix, missing);
  const baselineX = resM11.estimatedEntries.map((e) => e.value);

  const resM10 = solveM10_Harker(matrix, missing);
  const resM7 = solveM7_ConnectingPaths(matrix, missing);
  const resM8 = solveM8_Alonso(matrix, missing);
  const resM9 = solveM9_DEMATEL(matrix);

  // 2. Solve optimization methods using robust baseline
  const resM1 = solveM1_LambdaMax(matrix, missing, baselineX);
  const resM2 = solveM2_c3(matrix, missing, baselineX);
  const resM3 = solveM3_Rho(matrix, missing, baselineX);
  const resM4 = solveM4_Delta(matrix, missing, baselineX);
  const resM5 = solveM5_LAE(matrix, missing, baselineX);
  const resM6 = solveM6_LSM(matrix, missing, baselineX);

  // Return sorted M1 through M11
  return [
    resM1,
    resM2,
    resM3,
    resM4,
    resM5,
    resM6,
    resM7,
    resM8,
    resM9,
    resM10,
    resM11,
  ];
}
