/**
 * Comparative Visualizer for Estimated Missing Values across all 11 Methods
 */

import React, { useState } from 'react';
import { CompletionResult } from '../../types';
import { formatAHPValue } from '../../lib/matrixMath';

interface MissingValuesChartProps {
  results: CompletionResult[];
}

export const MissingValuesChart: React.FC<MissingValuesChartProps> = ({
  results,
}) => {
  const [displayMode, setDisplayMode] = useState<'decimal' | 'fraction'>(
    'decimal'
  );

  if (results.length === 0 || results[0].estimatedEntries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-sm">
        No missing comparisons were present in the matrix.
      </div>
    );
  }

  const missingVars = results[0].estimatedEntries;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Estimated Missing Values Comparison
          </h3>
          <p className="text-xs text-slate-500">
            Comparing the completed entries (x1, x2, ...) across all 11 methods.
            Notice high agreement within the core cluster {'{M1, M2, M3, M5, M11}'}.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setDisplayMode('decimal')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              displayMode === 'decimal'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Decimals
          </button>
          <button
            onClick={() => setDisplayMode('fraction')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              displayMode === 'fraction'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fractions
          </button>
        </div>
      </div>

      {/* Table of Estimated Missing Values */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3">Variable</th>
              <th className="py-2.5 px-3">Position</th>
              {results.map((r) => (
                <th key={r.methodId} className="py-2.5 px-2.5 text-center">
                  <span className="block font-extrabold text-slate-800">
                    {r.methodId}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-normal">
                    {r.shortName?.split(' ')[1]?.replace(/[()]/g, '') || r.methodId}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {missingVars.map((mVar) => {
              // Collect values across methods to calculate spread (min, max, mean)
              const vals = results.map(
                (r) =>
                  r.estimatedEntries.find(
                    (e) => e.row === mVar.row && e.col === mVar.col
                  )?.value ?? 1.0
              );
              const minV = Math.min(...vals);
              const maxV = Math.max(...vals);

              return (
                <tr key={`${mVar.row}-${mVar.col}`} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-bold text-indigo-700">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                      {mVar.variableName}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-600">
                    a_{mVar.row + 1},{mVar.col + 1}
                  </td>
                  {results.map((r) => {
                    const entry = r.estimatedEntries.find(
                      (e) => e.row === mVar.row && e.col === mVar.col
                    );
                    const v = entry?.value ?? 1.0;
                    const isExtreme = Math.abs(v - maxV) < 1e-4 && maxV - minV > 0.5;

                    return (
                      <td
                        key={r.methodId}
                        className="py-2.5 px-2.5 text-center font-mono font-medium"
                      >
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded ${
                            isExtreme
                              ? 'bg-amber-100 text-amber-900 font-bold'
                              : 'text-slate-800'
                          }`}
                        >
                          {displayMode === 'decimal'
                            ? v.toFixed(3)
                            : formatAHPValue(v)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
