/**
 * Interactive SVG/HTML Bar Chart for CR Comparison across all 11 Methods
 * with Saaty threshold reference line and Pass/Fail visual badges.
 */

import React from 'react';
import { CompletionResult } from '../../types';

interface CRComparisonChartProps {
  results: CompletionResult[];
  crThreshold: number;
}

export const CRComparisonChart: React.FC<CRComparisonChartProps> = ({
  results,
  crThreshold,
}) => {
  if (results.length === 0) return null;

  const maxCR = Math.max(...results.map((r) => r.cr), crThreshold * 1.5, 0.15);
  // Cap chart height scale at maxCR
  const chartHeight = 240;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Consistency Ratio (CR) Comparison Across Methods
          </h3>
          <p className="text-xs text-slate-500">
            Methods with CR ≤ {crThreshold.toFixed(2)} satisfy Saaty’s
            consistency requirement. Core cluster {'{M1, M2, M3, M5, M11}'} typically achieves minimum CR.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span className="text-slate-600 font-medium">Pass (CR ≤ {crThreshold})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-rose-500" />
            <span className="text-slate-600 font-medium">Fail (CR &gt; {crThreshold})</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="relative pt-6 pb-2">
        {/* Threshold Line */}
        <div
          className="absolute left-10 right-0 border-b-2 border-dashed border-amber-500 z-10 pointer-events-none flex items-center justify-end pr-2"
          style={{
            bottom: `${(crThreshold / maxCR) * chartHeight + 40}px`,
          }}
        >
          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded shadow-2xs -translate-y-3">
            Threshold: {crThreshold.toFixed(2)}
          </span>
        </div>

        {/* Bars Container */}
        <div className="h-[240px] flex items-end justify-between gap-1 sm:gap-2 px-2 border-b border-slate-200 ml-10">
          {results.map((res) => {
            const isPassing = res.cr <= crThreshold;
            const barHeightPct = Math.min(100, Math.max(4, (res.cr / maxCR) * 100));

            return (
              <div
                key={res.methodId}
                className="flex-1 flex flex-col items-center group relative h-full justify-end"
              >
                {/* Value tooltip on hover / always visible text */}
                <div className="text-[10px] font-mono font-bold text-slate-600 mb-1 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                  {res.cr.toFixed(3)}
                </div>

                {/* Bar */}
                <div
                  style={{ height: `${barHeightPct}%` }}
                  className={`w-full max-w-[42px] rounded-t-md transition-all duration-300 relative ${
                    isPassing
                      ? 'bg-emerald-500 group-hover:bg-emerald-600 shadow-2xs shadow-emerald-200'
                      : 'bg-rose-500 group-hover:bg-rose-600 shadow-2xs shadow-rose-200'
                  }`}
                >
                  {/* Subtle inner top glow */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 rounded-t-md" />
                </div>

                {/* Method Label */}
                <div className="mt-2 text-center">
                  <span className="block text-[11px] font-extrabold text-slate-800">
                    {res.methodId}
                  </span>
                  <span className="block text-[9px] text-slate-400 truncate max-w-[48px]">
                    {res.methodName?.split(' ')[0] || res.methodId}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
