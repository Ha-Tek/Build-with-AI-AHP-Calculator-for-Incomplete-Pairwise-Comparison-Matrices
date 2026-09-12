/**
 * Priority Weights Visualizer across Methods
 * with interactive grouped bars and weight distributions.
 */

import React from 'react';
import { CompletionResult } from '../../types';

interface WeightsComparisonChartProps {
  results: CompletionResult[];
}

const ALTERNATIVE_COLORS = [
  '#4f46e5', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#64748b', // slate
];

export const WeightsComparisonChart: React.FC<WeightsComparisonChartProps> = ({
  results,
}) => {
  if (results.length === 0) return null;
  const n = results[0].weights.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Priority Weights (w) Distribution Across Methods
          </h3>
          <p className="text-xs text-slate-500">
            Normalized right eigenvectors (∑ wi = 1.0) derived after matrix
            completion.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {Array.from({ length: n }, (_, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-xs"
                style={{
                  backgroundColor:
                    ALTERNATIVE_COLORS[idx % ALTERNATIVE_COLORS.length],
                }}
              />
              <span className="font-semibold text-slate-700">A{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stacked Proportional Distribution Bars */}
      <div className="space-y-2.5">
        {results.map((r) => (
          <div key={r.methodId} className="flex items-center gap-3 text-xs">
            <div className="w-16 font-extrabold text-slate-800 shrink-0 flex items-center justify-between">
              <span>{r.methodId}</span>
              <span
                className={`text-[9px] px-1 rounded font-normal ${
                  r.isConsistent
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-rose-700 bg-rose-50'
                }`}
              >
                {r.cr <= 0.1 ? 'PASS' : 'FAIL'}
              </span>
            </div>

            {/* Stacked bar */}
            <div className="flex-1 h-7 rounded-lg overflow-hidden flex bg-slate-100 p-0.5 border border-slate-200 shadow-2xs">
              {r.weights.map((w, idx) => {
                const pct = Math.max(0, w * 100);
                return (
                  <div
                    key={idx}
                    style={{
                      width: `${pct}%`,
                      backgroundColor:
                        ALTERNATIVE_COLORS[idx % ALTERNATIVE_COLORS.length],
                    }}
                    className="h-full first:rounded-l-md last:rounded-r-md flex items-center justify-center text-white font-mono text-[10px] font-bold overflow-hidden transition-all duration-300 hover:brightness-110"
                    title={`A${idx + 1}: ${(w * 100).toFixed(1)}% (weight: ${w.toFixed(4)})`}
                  >
                    {pct > 7 ? `${w.toFixed(2)}` : ''}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
