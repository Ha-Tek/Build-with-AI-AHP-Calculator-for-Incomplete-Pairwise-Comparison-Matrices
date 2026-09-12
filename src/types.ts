/**
 * Types and interfaces for AHP Incomplete Pairwise Comparison Matrix (PCM)
 * completion methods based on Tekile, Brunelli, & Fedrizzi (2023).
 */

export type MethodId =
  | 'M1'
  | 'M2'
  | 'M3'
  | 'M4'
  | 'M5'
  | 'M6'
  | 'M7'
  | 'M8'
  | 'M9'
  | 'M10'
  | 'M11';

export type MethodCategory =
  | 'Inconsistency Optimization'
  | 'Bias/Error Optimization'
  | 'Algorithmic (Non-Optimization)'
  | 'Prioritization-Derived';

export interface MethodInfo {
  id: MethodId;
  name: string;
  shortName: string;
  category: MethodCategory;
  paperName: string;
  authors: string;
  referenceYear: number;
  objectiveDescription: string;
  equations: string[];
  paperClusterNote: string;
}

export interface MissingEntry {
  row: number; // 0-indexed i
  col: number; // 0-indexed j (i < j)
  variableName: string; // e.g. x1, x2
}

export interface EstimatedValue {
  row: number;
  col: number;
  variableName: string;
  value: number;
  reciprocalValue: number;
}

export interface CompletionResult {
  methodId: MethodId;
  methodName: string;
  shortName: string;
  category: MethodCategory;
  completedMatrix: number[][];
  estimatedEntries: EstimatedValue[];
  weights: number[];
  rankings: number[]; // 1-based ranks for each alternative
  lambdaMax: number;
  ci: number;
  cr: number;
  isConsistent: boolean;
  computationTimeMs: number;
  objectiveValue?: number;
  notes?: string;
}

export interface MatrixValidationStatus {
  isValid: boolean;
  isConnected: boolean;
  n: number;
  missingCountUpper: number;
  knownCountUpper: number;
  components: number[][]; // Connected components (arrays of 0-based node indices)
  errorMessages: string[];
  warningMessages: string[];
}

export interface DistanceMatrixResult {
  matrixDistances: number[][]; // 11x11 Manhattan log-distance (Eq. 20)
  weightDistances: number[][]; // 11x11 weight vector Manhattan distance (Eq. 21)
  methodIds: MethodId[];
}

export interface PresetMatrix {
  id: string;
  name: string;
  description: string;
  matrix: (number | null)[][];
  reference: string;
}
