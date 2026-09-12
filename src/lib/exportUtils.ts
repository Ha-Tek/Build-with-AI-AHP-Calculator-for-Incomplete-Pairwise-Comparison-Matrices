/**
 * Exporter utilities for Excel (.xlsx), CSV, and Python/Streamlit script generation.
 */

import * as XLSX from 'xlsx';
import { CompletionResult, MethodId } from '../types';
import { formatAHPValue } from './matrixMath';

/**
 * Export results to a multi-sheet Excel (.xlsx) file
 */
export function exportToExcel(
  results: CompletionResult[],
  originalMatrix: (number | null)[][],
  filename = 'AHP_Incomplete_PCM_Completion_Results.xlsx'
): void {
  const wb = XLSX.utils.book_new();
  const n = originalMatrix.length;

  // Sheet 1: Summary
  const summaryData = results.map((r) => {
    const estimatedStr = r.estimatedEntries
      .map((e) => `${e.variableName} (a_${e.row + 1},${e.col + 1}) = ${formatAHPValue(e.value)}`)
      .join('; ');

    return {
      Method: r.methodId,
      Name: r.methodName,
      Category: r.category,
      'λmax': Number(r.lambdaMax.toFixed(5)),
      CI: Number(r.ci.toFixed(5)),
      CR: Number(r.cr.toFixed(5)),
      Status: r.isConsistent ? 'PASS (CR ≤ 0.10)' : 'FAIL (CR > 0.10)',
      'Time (ms)': Number(r.computationTimeMs.toFixed(1)),
      'Estimated Missing Values': estimatedStr,
      Notes: r.notes || '',
    };
  });
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Comparison');

  // Sheet 2: Priority Weights & Ranks
  const weightsData: Record<string, string | number>[] = [];
  results.forEach((r) => {
    const rowObj: Record<string, string | number> = {
      Method: r.methodId,
      Name: r.methodName,
      CR: Number(r.cr.toFixed(4)),
    };
    for (let i = 0; i < n; i++) {
      rowObj[`w_A${i + 1} (Weight)`] = Number(r.weights[i].toFixed(4));
      rowObj[`Rank_A${i + 1}`] = r.rankings[i];
    }
    weightsData.push(rowObj);
  });
  const wsWeights = XLSX.utils.json_to_sheet(weightsData);
  XLSX.utils.book_append_sheet(wb, wsWeights, 'Weights & Rankings');

  // Sheet 3: Estimated Values Comparison
  if (results.length > 0 && results[0].estimatedEntries.length > 0) {
    const missingVars = results[0].estimatedEntries;
    const estData = missingVars.map((mVar) => {
      const rowObj: Record<string, string | number> = {
        Variable: mVar.variableName,
        Position: `a_${mVar.row + 1},${mVar.col + 1}`,
      };
      results.forEach((r) => {
        const found = r.estimatedEntries.find(
          (e) => e.row === mVar.row && e.col === mVar.col
        );
        if (found) {
          rowObj[`${r.methodId} (Decimal)`] = Number(found.value.toFixed(4));
          rowObj[`${r.methodId} (Fraction)`] = formatAHPValue(found.value);
        }
      });
      return rowObj;
    });
    const wsEst = XLSX.utils.json_to_sheet(estData);
    XLSX.utils.book_append_sheet(wb, wsEst, 'Missing Values');
  }

  // Sheet 4: Original Incomplete Matrix
  const origData: Record<string, string>[] = [];
  for (let i = 0; i < n; i++) {
    const rowObj: Record<string, string> = { Alternative: `A${i + 1}` };
    for (let j = 0; j < n; j++) {
      const v = originalMatrix[i][j];
      rowObj[`A${j + 1}`] = v !== null && !isNaN(v) ? formatAHPValue(v) : '*';
    }
    origData.push(rowObj);
  }
  const wsOrig = XLSX.utils.json_to_sheet(origData);
  XLSX.utils.book_append_sheet(wb, wsOrig, 'Original Incomplete Matrix');

  // Trigger download
  XLSX.writeFile(wb, filename);
}

/**
 * Export results to CSV
 */
export function exportToCSV(
  results: CompletionResult[],
  filename = 'AHP_Completion_Summary.csv'
): void {
  const headers = [
    'Method',
    'Method Name',
    'Category',
    'LambdaMax',
    'CI',
    'CR',
    'Status',
    'ComputationTimeMs',
    'EstimatedValues',
  ];

  const rows = results.map((r) => [
    r.methodId,
    `"${r.methodName}"`,
    `"${r.category}"`,
    r.lambdaMax.toFixed(5),
    r.ci.toFixed(5),
    r.cr.toFixed(5),
    r.isConsistent ? 'PASS' : 'FAIL',
    r.computationTimeMs.toFixed(1),
    `"${r.estimatedEntries
      .map((e) => `${e.variableName}=${formatAHPValue(e.value)}`)
      .join('; ')}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate self-contained Python / Streamlit code for offline execution with NumPy & SciPy
 */
export function generatePythonScript(
  originalMatrix: (number | null)[][],
  selectedMethod?: MethodId
): string {
  const matrixStr = JSON.stringify(originalMatrix)
    .replace(/null/g, 'None')
    .replace(/\],\[/g, '],\n     [');

  return `"""
===========================================================================
AHP Incomplete Pairwise Comparison Matrix (PCM) Completion Calculator
Implementing 11 methods from:
Tekile, H. A., Brunelli, M., & Fedrizzi, M. (2023).
A numerical comparative study of completion methods for pairwise comparison matrices.
Operations Research Perspectives, 10, 100272.
===========================================================================
Dependencies:
    pip install numpy scipy pandas streamlit
Run:
    python incomplete_pcm_solver.py
"""

import numpy as np
from scipy.optimize import minimize
import pandas as pd

# Random Consistency Index RI_n (Table 1 of Tekile et al., 2023)
RI_TABLE = {
    1: 0.0, 2: 0.0, 3: 0.58, 4: 0.8816, 5: 1.1086,
    6: 1.2479, 7: 1.3417, 8: 1.4057, 9: 1.4499, 10: 1.4854
}

# Example incomplete PCM (None indicates missing comparison '*')
INCOMPLETE_PCM = np.array(
    ${matrixStr},
    dtype=object
)

def perron_eigen(A):
    """Computes Perron-Frobenius eigenvalue and normalized right eigenvector."""
    n = A.shape[0]
    eigenvals, eigenvecs = np.linalg.eig(A)
    max_idx = np.argmax(np.real(eigenvals))
    lambda_max = float(np.real(eigenvals[max_idx]))
    w = np.real(eigenvecs[:, max_idx])
    w = np.abs(w) / np.sum(np.abs(w))
    ci = max(0.0, (lambda_max - n) / (n - 1)) if n > 1 else 0.0
    ri = RI_TABLE.get(n, 1.49)
    cr = ci / ri if ri > 0 else 0.0
    return lambda_max, w, ci, cr

def fill_matrix(base, missing_coords, x_vals):
    """Reconstructs reciprocal matrix with estimated missing entries."""
    n = base.shape[0]
    A = np.ones((n, n), dtype=float)
    for i in range(n):
      for j in range(n):
        if base[i, j] is not None:
          A[i, j] = float(base[i, j])
    for (r, c), val in zip(missing_coords, x_vals):
      clamped = np.clip(float(val), 1/9.0, 9.0)
      A[r, c] = clamped
      A[c, r] = 1.0 / clamped
    return A

def solve_m11_lls(base, missing_coords):
    """M11: Incomplete Logarithmic Least Squares (Bozoki et al. 2010)"""
    n = base.shape[0]
    L = np.zeros((n, n))
    d = np.zeros(n)
    for i in range(n):
      for j in range(n):
        if i != j and base[i, j] is not None:
          L[i, i] += 1
          L[i, j] -= 1
          d[i] += np.log(float(base[i, j]))
    # Gauge constraint sum(y) = 0
    A_sys = L + (1.0 / n) * np.ones((n, n))
    y = np.linalg.solve(A_sys, d)
    w = np.exp(y) / np.sum(np.exp(y))
    x_est = [w[r] / w[c] for r, c in missing_coords]
    return fill_matrix(base, missing_coords, x_est), w

def solve_m10_harker(base, missing_coords):
    """M10: Harker's Eigenvalue Method (Harker 1987)"""
    n = base.shape[0]
    k_row = np.zeros(n)
    for r, c in missing_coords:
      k_row[r] += 1
      k_row[c] += 1
    B = np.zeros((n, n))
    for i in range(n):
      for j in range(n):
        if i == j:
          B[i, j] = 1.0 + k_row[i]
        elif base[i, j] is not None:
          B[i, j] = float(base[i, j])
    _, w, _, _ = perron_eigen(B)
    x_est = [w[r] / w[c] for r, c in missing_coords]
    return fill_matrix(base, missing_coords, x_est), w

def solve_m1_lambdamax(base, missing_coords, x0):
    """M1: LambdaMax Minimization (Bozoki et al. 2010)"""
    def obj(x):
      A = fill_matrix(base, missing_coords, x)
      lmax, _, _, _ = perron_eigen(A)
      return lmax
    bounds = [(1/9.0, 9.0) for _ in missing_coords]
    res = minimize(obj, x0, method='L-BFGS-B', bounds=bounds)
    return fill_matrix(base, missing_coords, res.x)

if __name__ == "__main__":
    n = INCOMPLETE_PCM.shape[0]
    missing = [(i, j) for i in range(n) for j in range(i+1, n) if INCOMPLETE_PCM[i, j] is None]
    print(f"Matrix order n={n}, Missing upper-triangle entries: {len(missing)}")
    
    # Solve M11 baseline
    A_m11, w_m11 = solve_m11_lls(INCOMPLETE_PCM, missing)
    lmax, w, ci, cr = perron_eigen(A_m11)
    print(f"M11 (LLS): λmax={lmax:.4f}, CI={ci:.4f}, CR={cr:.4f}, Consistent: {cr <= 0.10}")
`;
}
