/**
 * Interactive Pairwise Comparison Matrix Input Grid
 * with automatic reciprocal enforcement, fraction parsing, presets, and graph status.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Shuffle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { MatrixValidationStatus, MissingEntry } from '../types';
import { PRESET_MATRICES } from '../lib/constants';
import { formatAHPValue } from '../lib/matrixMath';

interface MatrixInputGridProps {
  n: number;
  matrix: (number | null)[][];
  onMatrixChange: (newMatrix: (number | null)[][]) => void;
  onSizeChange: (newN: number) => void;
  validation: MatrixValidationStatus;
  missingEntries: MissingEntry[];
  onGenerateRandom: () => void;
}

export const MatrixInputGrid: React.FC<MatrixInputGridProps> = ({
  n,
  matrix,
  onMatrixChange,
  onSizeChange,
  validation,
  missingEntries,
  onGenerateRandom,
}) => {
  // Local string state for smooth editing of fractions and decimals
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
    text: string;
  } | null>(null);

  // Helper: map (row, col) to missing variable name (e.g. x1, x2)
  const missingMap = new Map<string, string>();
  missingEntries.forEach((m) => {
    missingMap.set(`${m.row}-${m.col}`, m.variableName);
  });

  // Parse input string into number or null
  const parseInputValue = (text: string): number | null => {
    const trimmed = text.trim();
    if (
      trimmed === '' ||
      trimmed === '*' ||
      trimmed === '?' ||
      trimmed.toLowerCase() === 'x' ||
      trimmed.toLowerCase() === 'null' ||
      trimmed === '-'
    ) {
      return null;
    }

    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 2) {
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          return num / den;
        }
      }
    }

    const val = parseFloat(trimmed);
    return isNaN(val) ? null : val;
  };

  const handleCellChange = (r: number, c: number, rawText: string) => {
    setEditingCell({ row: r, col: c, text: rawText });

    const val = parseInputValue(rawText);
    const newMatrix = matrix.map((row) => [...row]);

    if (val === null) {
      newMatrix[r][c] = null;
      newMatrix[c][r] = null;
    } else {
      newMatrix[r][c] = val;
      newMatrix[c][r] = val !== 0 ? 1.0 / val : null;
    }

    onMatrixChange(newMatrix);
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const loadPreset = (presetId: string) => {
    const preset = PRESET_MATRICES.find((p) => p.id === presetId);
    if (preset) {
      const pN = preset.matrix.length;
      if (pN !== n) {
        onSizeChange(pN);
      }
      onMatrixChange(preset.matrix.map((row) => [...row]));
    }
  };

  const clearMatrix = () => {
    const empty = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1.0 : null))
    );
    onMatrixChange(empty);
  };

  const makeSpanningTree = () => {
    // Connect node 0 to all other nodes (star graph)
    const tree = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1.0 : null))
    );
    const values = [2, 3, 4, 1 / 2, 5, 1 / 3, 6];
    for (let j = 1; j < n; j++) {
      const v = values[(j - 1) % values.length];
      tree[0][j] = v;
      tree[j][0] = 1 / v;
    }
    onMatrixChange(tree);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Toolbar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Incomplete Pairwise Comparison Matrix (A)</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Order n = {n}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter judgment values in Saaty scale [1/9, 9]. Type fractions like{' '}
            <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-[11px]">1/3</code>,{' '}
            <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-[11px]">2/5</code>, or{' '}
            <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded text-[11px]">*</code> for missing.
            Reciprocals and diagonal = 1 are enforced automatically.
          </p>
        </div>

        {/* Presets & Size Control */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Dimension Selector */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-xs font-medium text-slate-500">Dimension n:</span>
            <div className="flex gap-1">
              {[3, 4, 5, 6, 7, 8].map((size) => (
                <button
                  key={size}
                  onClick={() => onSizeChange(size)}
                  className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
                    n === size
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title={`Set matrix order to ${size}x${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Select Dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                loadPreset(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="" disabled>
              Load Paper Preset...
            </option>
            {PRESET_MATRICES.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>

          {/* Random Generator */}
          <button
            onClick={onGenerateRandom}
            id="btn-random-generator"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Generate random connected matrix with lognormal perturbation (σ = 0.7) matching paper Section 4"
          >
            <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Random (σ=0.7)</span>
          </button>

          {/* Clear */}
          <button
            onClick={clearMatrix}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
            title="Clear all comparisons"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="p-5 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs font-bold text-slate-400 text-center w-12"></th>
              {Array.from({ length: n }, (_, j) => (
                <th
                  key={j}
                  className="p-2 text-xs font-extrabold text-slate-700 text-center bg-slate-50/80 rounded-t-md"
                >
                  A{j + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="p-2 text-xs font-extrabold text-slate-700 text-center bg-slate-50/80 rounded-l-md w-12">
                  A{i + 1}
                </td>

                {Array.from({ length: n }, (_, j) => {
                  const isDiag = i === j;
                  const isUpper = i < j;
                  const val = matrix[i][j];
                  const isMissing = val === null || isNaN(val);
                  const isBeingEdited =
                    editingCell?.row === i && editingCell?.col === j;

                  let displayStr = '';
                  if (isBeingEdited) {
                    displayStr = editingCell.text;
                  } else if (isDiag) {
                    displayStr = '1';
                  } else if (isMissing) {
                    displayStr = '*';
                  } else {
                    displayStr = formatAHPValue(val);
                  }

                  const varName = isUpper ? missingMap.get(`${i}-${j}`) : null;

                  return (
                    <td key={j} className="p-1.5 text-center min-w-[72px]">
                      {isDiag ? (
                        <div className="h-10 w-full flex items-center justify-center bg-slate-100/70 border border-slate-200 rounded-lg text-slate-500 font-mono text-sm font-semibold cursor-not-allowed">
                          <span>1</span>
                          <Lock className="w-2.5 h-2.5 ml-1 text-slate-400" />
                        </div>
                      ) : isMissing ? (
                        <div className="relative group">
                          <input
                            type="text"
                            value={displayStr}
                            onChange={(e) =>
                              handleCellChange(i, j, e.target.value)
                            }
                            onBlur={handleCellBlur}
                            placeholder="*"
                            className="h-10 w-full text-center font-mono font-bold text-sm bg-amber-50/60 text-amber-900 border-2 border-dashed border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
                          />
                          {varName && (
                            <span className="absolute -top-2 -right-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-white shadow-2xs pointer-events-none">
                              {varName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={displayStr}
                            onChange={(e) =>
                              handleCellChange(i, j, e.target.value)
                            }
                            onBlur={handleCellBlur}
                            className={`h-10 w-full text-center font-mono text-sm rounded-lg border transition-all ${
                              isUpper
                                ? 'bg-white text-slate-900 font-semibold border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
                                : 'bg-slate-50 text-slate-700 font-medium border-slate-200 focus:bg-white focus:border-indigo-600'
                            }`}
                          />
                          {!isUpper && (
                            <span
                              title="Mirror reciprocal value automatically calculated as 1 / a_ji"
                              className="absolute bottom-1 right-1 text-[9px] text-slate-400 font-mono pointer-events-none"
                            >
                              ⇌
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Graph Status & Feedback Bar */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            {validation.isConnected ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Comparison Graph: Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-100/70 px-2.5 py-0.5 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5" />
                Comparison Graph: Disconnected ({validation.components.length} components)
              </span>
            )}
          </div>

          <div className="text-slate-500">
            <span className="font-semibold text-slate-700">
              {validation.missingCountUpper}
            </span>{' '}
            missing comparisons ({validation.knownCountUpper} known pairs)
          </div>
        </div>

        {!validation.isConnected && (
          <div className="flex items-center gap-2">
            <button
              onClick={makeSpanningTree}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Auto-connect with Star Tree
            </button>
          </div>
        )}
      </div>

      {/* Disconnection explanation if needed */}
      {!validation.isConnected && (
        <div className="px-5 py-2.5 bg-amber-50 border-t border-amber-100 text-xs text-amber-800 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Graph Disconnected:</span> The paper
            states that for mathematical uniqueness of completion methods, the
            undirected comparison graph must be connected (i.e. every alternative
            must have a path of comparisons to every other alternative). Current
            independent components:{' '}
            {validation.components
              .map((c) => `[${c.map((idx) => `A${idx + 1}`).join(', ')}]`)
              .join(' and ')}
            . Please add at least one comparison bridging these groups.
          </div>
        </div>
      )}
    </div>
  );
};
