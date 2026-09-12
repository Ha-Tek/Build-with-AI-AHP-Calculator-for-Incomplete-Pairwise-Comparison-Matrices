/**
 * Constants, method registries, and benchmark presets from
 * Tekile, Brunelli, & Fedrizzi (2023) - Operations Research Perspectives 10 (2023) 100272
 */

import { MethodInfo, MethodId, PresetMatrix } from '../types';

/**
 * Random Consistency Index RI_n from Table 1 of the paper (Alonso & Lamata, 2006 / Tekile et al., 2023)
 */
export const RI_TABLE: Record<number, number> = {
  1: 0.0,
  2: 0.0,
  3: 0.58, // Standard Saaty AHP for n=3
  4: 0.8816,
  5: 1.1086,
  6: 1.2479,
  7: 1.3417,
  8: 1.4057,
  9: 1.4499,
  10: 1.4854,
};

export function getRI(n: number): number {
  if (n in RI_TABLE) {
    return RI_TABLE[n];
  }
  if (n > 10) {
    // Standard empirical approximation for n > 10: 1.98 * (n - 2) / n
    return (1.98 * (n - 2)) / n;
  }
  return 0.58;
}

export const METHOD_INFO_LIST: MethodInfo[] = [
  {
    id: 'M1',
    name: 'λmax-based optimal completion',
    shortName: 'M1 (λmax)',
    category: 'Inconsistency Optimization',
    paperName: 'λmax-based optimal completion method',
    authors: 'Bozóki et al. (2010), Tekile et al. (2021)',
    referenceYear: 2010,
    objectiveDescription:
      'Minimizes the Perron-Frobenius eigenvalue λmax of the completed matrix subject to 1/9 ≤ xp ≤ 9.',
    equations: ['min λmax(A(x))', 's.t. 1/9 ≤ xp ≤ 9, p = 1, ..., k'],
    paperClusterNote: 'Belongs to the 5-method core cluster {M1, M2, M3, M5, M11}.',
  },
  {
    id: 'M2',
    name: 'c3-based optimal completion',
    shortName: 'M2 (c3)',
    category: 'Inconsistency Optimization',
    paperName: 'c3-based optimal completion method',
    authors: 'Shiraishi et al. (1998), Obata et al. (1999)',
    referenceYear: 1999,
    objectiveDescription:
      'Maximizes the non-positive inconsistency index c3(A(x)) based on triplet ratios, equivalent to minimizing cyclic deviations.',
    equations: [
      'max c3(A(x)) = ∑ (2 - a_ih*a_hj/a_ij - a_ij/(a_ih*a_hj))',
      's.t. 1/9 ≤ xp ≤ 9, p = 1, ..., k',
    ],
    paperClusterNote: 'Belongs to the core cluster {M1, M2, M3, M5, M11}, very close to M1.',
  },
  {
    id: 'M3',
    name: 'ρ-based optimal completion',
    shortName: 'M3 (ρ)',
    category: 'Inconsistency Optimization',
    paperName: 'ρ-based optimal completion method',
    authors: 'Fedrizzi & Giove (2007)',
    referenceYear: 2007,
    objectiveDescription:
      'Maps multiplicative PCM to additive reciprocal preference relations R in [0,1], minimizes quadratic inconsistency ρ(R), then transforms back.',
    equations: [
      'r_ij = 0.5*(1 + log9(a_ij))',
      'min ρ(R) = ∑ (r_ih + r_hj - r_ij - 0.5)^2',
      'a_ij = 9^(2*r_ij - 1)',
    ],
    paperClusterNote: 'Remarkably close to M5 despite completely different formulation!',
  },
  {
    id: 'M4',
    name: 'δ-based local inconsistency indicator',
    shortName: 'M4 (δ-bias)',
    category: 'Bias/Error Optimization',
    paperName: 'A method of δ-based local inconsistency indicator',
    authors: 'Ergu & Kou (2013), Ergu et al. (2011)',
    referenceYear: 2013,
    objectiveDescription:
      'Minimizes the sum of squares of local average bias indicators δ_ij = (1/n)∑ (a_ih*a_hj - a_ij).',
    equations: [
      'δ_ij(A) = (1/n) ∑ (a_ih*a_hj - a_ij)',
      'min ∑_i ∑_j (δ_ij(A(x)))^2',
      's.t. 1/9 ≤ xp ≤ 9',
    ],
    paperClusterNote:
      'Outlier in the paper! Summed biases can cancel out even when strong inconsistency exists.',
  },
  {
    id: 'M5',
    name: 'ε-based least absolute error (LAE)',
    shortName: 'M5 (LAE)',
    category: 'Bias/Error Optimization',
    paperName: 'ε-based least absolute error (LAE) method',
    authors: 'Ergu et al. (2014, 2016)',
    referenceYear: 2016,
    objectiveDescription:
      'Minimizes sum of absolute errors |ε_ij| between pairwise comparison a_ji and ratio of geometric mean row weights.',
    equations: [
      'c_ij = [∏ a_ih]^(1/n) / [∏ a_jh]^(1/n) * a_ji',
      'ε_ij = c_ij - 1',
      'min ∑_i ∑_j |ε_ij(A(x))|',
    ],
    paperClusterNote: 'Extremely high similarity to M3 and member of core cluster.',
  },
  {
    id: 'M6',
    name: 'ε-based least squares method (LSM)',
    shortName: 'M6 (LSM)',
    category: 'Bias/Error Optimization',
    paperName: 'ε-based least squares method (LSM)',
    authors: 'Ergu et al. (2016)',
    referenceYear: 2016,
    objectiveDescription:
      'Minimizes sum of squared errors (ε_ij)^2 between pairwise comparisons and geometric mean weight ratios.',
    equations: [
      'ε_ij = c_ij - 1',
      'min ∑_i ∑_j (ε_ij(A(x)))^2',
      's.t. 1/9 ≤ xp ≤ 9',
    ],
    paperClusterNote:
      'Diverges and behaves as an outlier under high inconsistency / random perturbations.',
  },
  {
    id: 'M7',
    name: 'Connecting paths method',
    shortName: 'M7 (Paths)',
    category: 'Algorithmic (Non-Optimization)',
    paperName: 'Connecting paths method (Geometric mean of paths)',
    authors: 'Harker (1987), Chen & Triantaphyllou (2001)',
    referenceYear: 1987,
    objectiveDescription:
      'Estimates missing a_ij as the geometric mean of intensities across all simple connecting paths between i and j in the graph.',
    equations: [
      'CP(a_ij)_r = a_i,h1 * a_h1,h2 * ... * a_ht,j',
      'a_ij = [∏ CP(a_ij)_r]^(1/N)',
      'a_ij clamped to [1/9, 9], a_ji = 1/a_ij',
    ],
    paperClusterNote: 'Direct graph-theoretic calculation without numerical optimization.',
  },
  {
    id: 'M8',
    name: 'Alonso et al.’s iterative method',
    shortName: 'M8 (Alonso)',
    category: 'Algorithmic (Non-Optimization)',
    paperName: 'Alonso et al.’s iterative consistency method',
    authors: 'Alonso et al. (2008), Herrera-Viedma et al. (2007)',
    referenceYear: 2008,
    objectiveDescription:
      'Iterative expansion: estimates missing pairs using 1-step intermediate alternatives across three candidate sets H1, H2, H3.',
    equations: [
      'H1: a_ij * a_jk, H2: a_jk / a_ji, H3: a_ij / a_kj',
      'cp\'_ik = [∏_{l∈K} (∏_{j∈H_l} ca_ik^jl)^(1/#H_l)]^(1/#K)',
      'Iterates until all missing values are filled',
    ],
    paperClusterNote: 'Forms cluster {M8, M9} with DEMATEL.',
  },
  {
    id: 'M9',
    name: 'DEMATEL-based completion',
    shortName: 'M9 (DEMATEL)',
    category: 'Algorithmic (Non-Optimization)',
    paperName: 'DEMATEL-based optimal completion method',
    authors: 'Zhou, Hu, Deng, Chan, & Ishizaka (2018)',
    referenceYear: 2018,
    objectiveDescription:
      'Direct-relation matrix Dr normalized to N, computes total-relation matrix Tr = N(I-N)^(-1), and extracts completed c_ij = √(t_ij / t_ji).',
    equations: [
      'm = max(max_row_sum(Dr), max_col_sum(Dr))',
      'N = Dr / m, Tr = N(I - N)^(-1)',
      'c_ij = √(t_ij / t_ji)',
    ],
    paperClusterNote: 'Pairwise relation based on influential factor propagation.',
  },
  {
    id: 'M10',
    name: 'Harker’s eigenvalue method',
    shortName: 'M10 (Harker)',
    category: 'Prioritization-Derived',
    paperName: 'Harker’s eigenvalue method',
    authors: 'Harker (1987)',
    referenceYear: 1987,
    objectiveDescription:
      'Modifies diagonal entries b_ii = 1 + k_i (k_i = number of missing entries in row i), finds principal eigenvector w, estimates a_ij = w_i / w_j.',
    equations: [
      'b_ii = 1 + k_i; b_ij = 0 if missing; b_ij = a_ij if known',
      'B*w = λmax*w, ∑ w_i = 1',
      'a_ij = w_i / w_j',
    ],
    paperClusterNote: 'Direct prioritization method adapted for matrix completion.',
  },
  {
    id: 'M11',
    name: 'Incomplete logarithmic least squares',
    shortName: 'M11 (LLS)',
    category: 'Prioritization-Derived',
    paperName: 'Incomplete logarithmic least squares method (LLS)',
    authors: 'Bozóki, Fülöp, & Rónyai (2010)',
    referenceYear: 2010,
    objectiveDescription:
      'Solves graph Laplacian linear system to find priority vector w minimizing squared log errors on known entries, estimates a_ij = w_i / w_j.',
    equations: [
      'min ∑_{{i,j}∈E} (log a_ij - log(w_i/w_j))^2',
      'L*y = d (Laplacian formulation)',
      'w_i = exp(y_i) / ∑ exp(y_j), a_ij = w_i / w_j',
    ],
    paperClusterNote:
      'Part of the 5-method core cluster {M1, M2, M3, M5, M11}, very fast and numerically exact.',
  },
];

export const PRESET_MATRICES: PresetMatrix[] = [
  {
    id: 'paper-ex1',
    name: 'Paper Example 1 (n=4, k=3 missing)',
    description:
      'Example 1 from page 3 of Tekile et al. (2023). A 4x4 incomplete matrix with 3 missing entries (2,3), (2,4), and (3,4). Forms a star tree centered at node 1.',
    reference: 'Tekile et al. (2023), Section 3, Page 3',
    matrix: [
      [1, 3, 2, 9],
      [1 / 3, 1, null, null],
      [1 / 2, null, 1, null],
      [1 / 9, null, null, 1],
    ],
  },
  {
    id: 'paper-page10',
    name: 'Paper Page 10 Matrix (n=5, Inconsistency & Bias Demonstration)',
    description:
      'From Section 5 (Page 10) of the paper. Demonstrates the critical flaw in M4 where indirect paths sum to zero bias (-4 + 1 + 3 = 0) despite significant inconsistency.',
    reference: 'Tekile et al. (2023), Section 5, Page 10',
    matrix: [
      [1, 1 / 2, 3, 2, null], // a_15 is 5 in the paper text, set to null to test completion!
      [2, 1, 5, 4, 2],
      [1 / 3, 1 / 5, 1, 2, 2],
      [1 / 2, 1 / 4, 1 / 2, 1, 4],
      [null, 1 / 2, 1 / 2, 1 / 4, 1],
    ],
  },
  {
    id: 'paper-koczkodaj',
    name: 'Paper Eq. (5) Incomplete Matrix (n=4, 1 missing)',
    description:
      'Counterexample from page 3, Eq. (5) used to demonstrate why Koczkodaj inconsistency minimization produces infinitely many optimal solutions.',
    reference: 'Tekile et al. (2023), Section 3, Eq. (5)',
    matrix: [
      [1, null, 3, 1],
      [null, 1, 1 / 2, 4],
      [1 / 3, 2, 1, 5],
      [1, 1 / 4, 1 / 5, 1],
    ],
  },
  {
    id: 'complex-n5',
    name: 'Inconsistent 5x5 Matrix (n=5, k=3 missing)',
    description:
      'A realistic decision-making matrix with 3 missing comparisons and moderate inconsistency to compare all 11 methods.',
    reference: 'Typical MCDM Decision Matrix',
    matrix: [
      [1, 2, null, 4, null],
      [1 / 2, 1, 3, null, 2],
      [null, 1 / 3, 1, 2, 5],
      [1 / 4, null, 1 / 2, 1, 3],
      [null, 1 / 2, 1 / 5, 1 / 3, 1],
    ],
  },
  {
    id: 'complex-n6',
    name: 'Benchmark 6x6 Matrix (n=6, k=5 missing)',
    description:
      'A 6x6 incomplete PCM with connected graph and multiple alternative paths for comparing cluster behavior.',
    reference: 'AHP Multi-Criteria Benchmark',
    matrix: [
      [1, 3, null, 5, null, 7],
      [1 / 3, 1, 2, null, 4, null],
      [null, 1 / 2, 1, 3, null, 2],
      [1 / 5, null, 1 / 3, 1, 2, null],
      [null, 1 / 4, null, 1 / 2, 1, 3],
      [1 / 7, null, 1 / 2, null, 1 / 3, 1],
    ],
  },
];
