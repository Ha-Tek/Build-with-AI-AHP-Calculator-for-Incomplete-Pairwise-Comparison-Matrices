/**
 * Inter-Method Distance Heatmap (Eq. 20 and Eq. 21 from Tekile et al., 2023)
 * Reproduces the paper's Fig. 3 heatmaps and clustering insights.
 */

import React, { useState } from 'react';
import { DistanceMatrixResult } from '../../types';

interface DistanceHeatmapProps {
  distanceData: DistanceMatrixResult;
}

export const DistanceHeatmap: React.FC<DistanceHeatmapProps> = ({
  distanceData,
}) => {
  const [metric, setMetric] = useState<'matrix' | 'weights'>('matrix');
  const [hoveredCell, setHoveredCell] = useState<{
    s: number;
    t: number;
    val: number;
  } | null>(null);

  const { matrixDistances, weightDistances, methodIds } = distanceData;
  const currentDist = metric === 'matrix' ? matrixDistances : weightDistances;
  const m = methodIds.length;

  // Find max value in upper triangle for scaling
  let maxVal = 0;
  for (let i = 0; i < m; i++) {
    for (let j = i + 1; j < m; j++) {
      if (currentDist[i][j] > maxVal) {
        maxVal = currentDist[i][j];
      }
    }
  }
  if (maxVal === 0) maxVal = 1.0;

  // Heatmap color generator (light blue to dark blue, matching Fig. 3)
  const getCellColor = (val: number, isDiag: boolean, isUpper: boolean) => {
    if (isDiag) return '#f8fafc';
    if (!isUpper) return '#f1f5f9';

    const ratio = Math.min(1, Math.max(0, val / maxVal));
    // Interpolate from light cyan-blue (230, 245, 255) to deep navy (15, 45, 120)
    const r = Math.round(225 - ratio * 195);
    const g = Math.round(240 - ratio * 180);
    const b = Math.round(255 - ratio * 120);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const getTextColor = (val: number, isUpper: boolean) => {
    if (!isUpper) return '#94a3b8';
    const ratio = val / maxVal;
    return ratio > 0.5 ? '#ffffff' : '#0f172a';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Inter-Method Distance Heatmap D(Ms, Mt)
          </h3>
          <p className="text-xs text-slate-500">
            Based on Eq. (20) Manhattan log-distance ||log(L) - log(B)||. Smaller
            values indicate high similarity. Notice the 5-method core cluster{' '}
            {'{M1, M2, M3, M5, M11}'} has near-zero distances!
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setMetric('matrix')}
            className={`px-3 py-1 rounded-md transition-colors ${
              metric === 'matrix'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matrix Distance D(L,B) [Eq. 20]
          </button>
          <button
            onClick={() => setMetric('weights')}
            className={`px-3 py-1 rounded-md transition-colors ${
              metric === 'weights'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weight Distance d^(u,v) [Eq. 21]
          </button>
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-center font-bold text-slate-400 w-10"></th>
              {methodIds.map((id) => (
                <th
                  key={id}
                  className="p-1.5 text-center font-bold text-slate-700 bg-slate-50/60"
                >
                  {id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {methodIds.map((rowId, i) => (
              <tr key={rowId}>
                <td className="p-1.5 font-bold text-slate-700 bg-slate-50/60 text-center">
                  {rowId}
                </td>
                {methodIds.map((colId, j) => {
                  const isDiag = i === j;
                  const isUpper = i < j;
                  const val = currentDist[i][j];

                  return (
                    <td
                      key={colId}
                      style={{
                        backgroundColor: getCellColor(val, isDiag, isUpper),
                        color: getTextColor(val, isUpper),
                      }}
                      onMouseEnter={() =>
                        isUpper && setHoveredCell({ s: i, t: j, val })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`p-1.5 text-center font-mono text-[11px] font-semibold border border-white transition-colors duration-150 ${
                        isUpper ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500' : ''
                      }`}
                    >
                      {isDiag ? '0.00' : isUpper ? val.toFixed(2) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover Information / Cluster Insight */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          {hoveredCell ? (
            <span className="font-semibold text-slate-800">
              Distance between {methodIds[hoveredCell.s]} and{' '}
              {methodIds[hoveredCell.t]}:{' '}
              <span className="text-indigo-600 font-mono font-bold">
                {hoveredCell.val.toFixed(4)}
              </span>
            </span>
          ) : (
            <span className="text-slate-500">
              Hover over upper triangle cells to inspect exact inter-method distance.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">0.0 (Identical)</span>
          <div className="w-28 h-3 rounded bg-gradient-to-r from-[rgb(225,240,255)] to-[rgb(15,45,120)] shadow-2xs" />
          <span className="text-[11px] text-slate-400">{maxVal.toFixed(1)} (Dissimilar)</span>
        </div>
      </div>
    </div>
  );
};
