/**
 * Main Application Component for AHP Incomplete PCM Completion Calculator
 * Implementing 11 scientific methods from Tekile, Brunelli, & Fedrizzi (2023).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { MatrixInputGrid } from './components/MatrixInputGrid';
import { RunControls } from './components/RunControls';
import { ResultsDashboard } from './components/ResultsDashboard';
import { MethodDetailModal } from './components/MethodDetailModal';
import { ValidationModal } from './components/ValidationModal';
import { PythonCodeModal } from './components/PythonCodeModal';
import { CompletionResult, MethodId } from './types';
import { PRESET_MATRICES } from './lib/constants';
import {
  validateIncompleteMatrix,
  clampToSaatyRange,
} from './lib/matrixMath';
import {
  executeAll11Methods,
  executeSingleMethod,
  extractMissingEntries,
} from './lib/methodsEngine';
import { exportToExcel, exportToCSV } from './lib/exportUtils';

export default function App() {
  // Initial state with Paper Example 1
  const initialPreset = PRESET_MATRICES[0];
  const [n, setN] = useState<number>(initialPreset.matrix.length);
  const [matrix, setMatrix] = useState<(number | null)[][]>(
    initialPreset.matrix.map((r) => [...r])
  );

  const [runMode, setRunMode] = useState<'all' | 'single'>('all');
  const [selectedMethod, setSelectedMethod] = useState<MethodId>('M1');
  const [crThreshold, setCrThreshold] = useState<number>(0.1);

  const [results, setResults] = useState<CompletionResult[]>([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [inspectedResult, setInspectedResult] =
    useState<CompletionResult | null>(null);

  // Modals
  const [isValidationOpen, setIsValidationOpen] = useState<boolean>(false);
  const [isPythonOpen, setIsPythonOpen] = useState<boolean>(false);

  // Matrix analysis & validation
  const validation = useMemo(() => {
    return validateIncompleteMatrix(matrix);
  }, [matrix]);

  const missingEntries = useMemo(() => {
    return extractMissingEntries(matrix);
  }, [matrix]);

  // Execute computation
  const handleExecute = useCallback(() => {
    if (!validation.isConnected) return;
    setIsCalculating(true);

    // Yield to UI loop for smooth spinner
    setTimeout(() => {
      try {
        if (runMode === 'all') {
          const res = executeAll11Methods(matrix);
          setResults(res);
        } else {
          const single = executeSingleMethod(selectedMethod, matrix);
          setResults([single]);
        }
      } catch (err) {
        console.error('Computation error:', err);
      } finally {
        setIsCalculating(false);
      }
    }, 40);
  }, [matrix, runMode, selectedMethod, validation.isConnected]);

  // Run initial calculation on mount
  useEffect(() => {
    handleExecute();
  }, []);

  // Handler for changing matrix size
  const handleSizeChange = (newN: number) => {
    if (newN === n) return;
    setN(newN);
    const newMatrix: (number | null)[][] = Array.from({ length: newN }, (_, i) =>
      Array.from({ length: newN }, (_, j) => {
        if (i === j) return 1.0;
        if (i < matrix.length && j < matrix.length) {
          return matrix[i][j];
        }
        return null;
      })
    );

    // Connect with a tree if new nodes were added
    for (let j = 1; j < newN; j++) {
      if (newMatrix[0][j] === null) {
        newMatrix[0][j] = 2.0;
        newMatrix[j][0] = 0.5;
      }
    }

    setMatrix(newMatrix);
  };

  // Generate random perturbed incomplete matrix matching paper Section 4 (sigma = 0.7)
  const handleGenerateRandom = () => {
    const dim = n;
    // 1. Generate consistent matrix from random weights w_i in [1, 9]
    const w = Array.from({ length: dim }, () => 1 + Math.random() * 8);
    const perturbed: (number | null)[][] = Array.from({ length: dim }, () =>
      Array(dim).fill(1.0)
    );

    for (let i = 0; i < dim; i++) {
      for (let j = i + 1; j < dim; j++) {
        const ratio = w[i] / w[j];
        // Lognormal perturbation beta ~ Lognormal(0, sigma^2) with sigma = 0.7
        const u1 = Math.max(1e-7, Math.random());
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const beta = Math.exp(0.7 * z);
        const val = clampToSaatyRange(ratio * beta);

        perturbed[i][j] = val;
        perturbed[j][i] = 1.0 / val;
      }
    }

    // 2. Remove random comparisons while guaranteeing tree connectivity
    // Ensure spanning tree is kept
    const inTree = new Set<number>([0]);
    const treeEdges = new Set<string>();

    while (inTree.size < dim) {
      const u = Array.from(inTree)[Math.floor(Math.random() * inTree.size)];
      const notInTree = Array.from({ length: dim }, (_, i) => i).filter(
        (i) => !inTree.has(i)
      );
      const v = notInTree[Math.floor(Math.random() * notInTree.length)];

      const minIdx = Math.min(u, v);
      const maxIdx = Math.max(u, v);
      treeEdges.add(`${minIdx}-${maxIdx}`);
      inTree.add(v);
    }

    // Remove non-tree edges with 50% probability
    for (let i = 0; i < dim; i++) {
      for (let j = i + 1; j < dim; j++) {
        if (!treeEdges.has(`${i}-${j}`) && Math.random() > 0.4) {
          perturbed[i][j] = null;
          perturbed[j][i] = null;
        }
      }
    }

    setMatrix(perturbed);
  };

  const handleLoadPreset = (presetId: string) => {
    const p = PRESET_MATRICES.find((item) => item.id === presetId);
    if (p) {
      setN(p.matrix.length);
      setMatrix(p.matrix.map((r) => [...r]));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Top Header */}
      <Header
        onOpenValidation={() => setIsValidationOpen(true)}
        onOpenPython={() => setIsPythonOpen(true)}
        onExportExcel={() => exportToExcel(results, matrix)}
        onExportCSV={() => exportToCSV(results)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 w-full space-y-6">
        {/* Matrix Editor */}
        <MatrixInputGrid
          n={n}
          matrix={matrix}
          onMatrixChange={setMatrix}
          onSizeChange={handleSizeChange}
          validation={validation}
          missingEntries={missingEntries}
          onGenerateRandom={handleGenerateRandom}
        />

        {/* Solver Execution Controls */}
        <RunControls
          runMode={runMode}
          selectedMethod={selectedMethod}
          crThreshold={crThreshold}
          isCalculating={isCalculating}
          canRun={validation.isConnected}
          onRunModeChange={setRunMode}
          onSelectedMethodChange={setSelectedMethod}
          onCrThresholdChange={setCrThreshold}
          onExecute={handleExecute}
        />

        {/* Results Dashboard */}
        <ResultsDashboard
          results={results}
          originalMatrix={matrix}
          crThreshold={crThreshold}
          onInspectMethod={(res) => setInspectedResult(res)}
        />
      </main>

      {/* Modal: Method Details */}
      <MethodDetailModal
        result={inspectedResult}
        originalMatrix={matrix}
        onClose={() => setInspectedResult(null)}
      />

      {/* Modal: Paper Validation */}
      <ValidationModal
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        onLoadPreset={handleLoadPreset}
      />

      {/* Modal: Python / Streamlit Script */}
      <PythonCodeModal
        isOpen={isPythonOpen}
        onClose={() => setIsPythonOpen(false)}
        matrix={matrix}
        selectedMethod={selectedMethod}
      />
    </div>
  );
}
