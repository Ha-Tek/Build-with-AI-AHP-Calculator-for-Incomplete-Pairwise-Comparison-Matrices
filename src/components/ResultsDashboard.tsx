/**
 * Comprehensive Results Dashboard comparing all 11 methods
 * with stats cards, comparison table, charts, and cluster distance analysis.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  BarChart3,
  ListOrdered,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { CompletionResult, DistanceMatrixResult } from '../types';
import { CRComparisonChart } from './charts/CRComparisonChart';
import { MissingValuesChart } from './charts/MissingValuesChart';
import { WeightsComparisonChart } from './charts/WeightsComparisonChart';
import { RankingsTable } from './charts/RankingsTable';
import { DistanceHeatmap } from './charts/DistanceHeatmap';
import { computeDistanceMatrices } from '../lib/clusterEngine';
import { formatAHPValue } from '../lib/matrixMath';

interface ResultsDashboardProps {
  results: CompletionResult[];
  originalMatrix: (number | null)[][];
  crThreshold: number;
  onInspectMethod: (result: CompletionResult) => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  originalMatrix,
  crThreshold,
  onInspectMethod,
}) => {
  const [activeTab, setActiveTab] = useState<
    'table' | 'charts' | 'rankings' | 'distances'
  >('table');

  if (results.length === 0) return null;

  // Compute stats
  const passCount = results.filter((r) => r.cr <= crThreshold).length;
  const bestCRResult = [...results].sort((a, b) => a.cr - b.cr)[0];
  const avgCR =
    results.reduce((acc, r) => acc + r.cr, 0) / (results.length || 1);

  // Compute 11x11 distances if multiple methods are run
  const distanceData: DistanceMatrixResult | null =
    results.length > 1 ? computeDistanceMatrices(results) : null;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Best CR */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Optimal Consistency (Min CR)
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              {bestCRResult.methodId}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900">
              {bestCRResult.cr.toFixed(4)}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              (λmax = {bestCRResult.lambdaMax.toFixed(3)})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {bestCRResult.methodName}
          </p>
        </div>

        {/* Card 2: Pass Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Acceptable (CR ≤ {crThreshold.toFixed(2)})
            </span>
            <div className="flex items-center gap-1">
              {passCount === results.length ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900">
              {passCount} / {results.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({Math.round((passCount / results.length) * 100)}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Methods passing Saaty consistency threshold
          </p>
        </div>

        {/* Card 3: Average CR */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Average CR (All Solvers)
            </span>
            <BarChart3 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900">
              {avgCR.toFixed(4)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mean consistency ratio across evaluated methods
          </p>
        </div>

        {/* Card 4: Paper Core Cluster */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-indigo-100/50 rounded-xl border border-indigo-200/70 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900">
              Core 5 Cluster
            </span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1.5 font-bold text-xs text-indigo-950">
            {'{M1, M2, M3, M5, M11}'}
          </div>
          <p className="text-[11px] text-indigo-800/80 mt-1 leading-tight">
            Identified by Tekile et al. (2023) as mutually interchangeable with
            minimal variance.
          </p>
        </div>
      </div>

      {/* Dashboard Sub-Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 pt-3 border-b border-slate-200 flex flex-wrap gap-2 bg-slate-50/60">
          <button
            onClick={() => setActiveTab('table')}
            id="tab-btn-table"
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'table'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Comparative Table ({results.length} Methods)</span>
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            id="tab-btn-charts"
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'charts'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>CR & Estimated Values Charts</span>
          </button>

          <button
            onClick={() => setActiveTab('rankings')}
            id="tab-btn-rankings"
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'rankings'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Priority Weights & Rankings</span>
          </button>

          {distanceData && (
            <button
              onClick={() => setActiveTab('distances')}
              id="tab-btn-distances"
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'distances'
                  ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Inter-Method Distances [Eq. 20]</span>
            </button>
          )}
        </div>

        {/* Tab 1: Comprehensive Comparison Table */}
        {activeTab === 'table' && (
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-2 text-center">λmax</th>
                    <th className="py-3 px-2 text-center">CI</th>
                    <th className="py-3 px-2 text-center">CR</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Estimated Missing Comparisons</th>
                    <th className="py-3 px-2 text-right">Time</th>
                    <th className="py-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => {
                    const isPassing = r.cr <= crThreshold;

                    return (
                      <tr
                        key={r.methodId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {r.methodId}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {r.methodName}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-500 font-medium">
                          {r.category}
                        </td>

                        <td className="py-3 px-2 text-center font-mono font-semibold text-slate-800">
                          {r.lambdaMax.toFixed(4)}
                        </td>

                        <td className="py-3 px-2 text-center font-mono text-slate-600">
                          {r.ci.toFixed(4)}
                        </td>

                        <td className="py-3 px-2 text-center font-mono font-bold">
                          <span
                            className={
                              isPassing ? 'text-emerald-700' : 'text-rose-700'
                            }
                          >
                            {r.cr.toFixed(4)}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isPassing
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPassing ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                PASS
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                FAIL
                              </>
                            )}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                          {r.estimatedEntries.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {r.estimatedEntries.map((e) => (
                                <span
                                  key={`${e.row}-${e.col}`}
                                  className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  {e.variableName}={formatAHPValue(e.value)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">Complete</span>
                          )}
                        </td>

                        <td className="py-3 px-2 text-right font-mono text-slate-400 text-[11px]">
                          {r.computationTimeMs.toFixed(1)}ms
                        </td>

                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => onInspectMethod(r)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            <Search className="w-3 h-3" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Charts & Estimated Values */}
        {activeTab === 'charts' && (
          <div className="p-5 space-y-6">
            <CRComparisonChart results={results} crThreshold={crThreshold} />
            <MissingValuesChart results={results} />
          </div>
        )}

        {/* Tab 3: Rankings & Priority Vectors */}
        {activeTab === 'rankings' && (
          <div className="p-5 space-y-6">
            <RankingsTable results={results} />
            <WeightsComparisonChart results={results} />
          </div>
        )}

        {/* Tab 4: Distance Matrices & Clustering */}
        {activeTab === 'distances' && distanceData && (
          <div className="p-5 space-y-6">
            <DistanceHeatmap distanceData={distanceData} />

            {/* Scientific Explanation of the Paper's Findings */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Paper Insights: Clustering and Interchangeability</span>
              </h4>
              <p className="leading-relaxed">
                In Section 5 of Tekile, Brunelli, & Fedrizzi (2023), hierarchical
                clustering across 1000 simulated PCMs revealed that:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                <li>
                  <strong className="text-slate-800">
                    Core 5-Method Cluster {'{M1, M2, M3, M5, M11}'}:
                  </strong>{' '}
                  Demonstrate minimal mutual distance regardless of matrix size
                  or number of missing comparisons. In practice, these methods can
                  be used interchangeably without affecting decision outcomes.
                </li>
                <li>
                  <strong className="text-slate-800">Method M4 Outlier:</strong>{' '}
                  Because M4 minimizes average directional bias rather than
                  inconsistency, positive and negative judgment errors cancel
                  each other out, leading to diverging matrix completions.
                </li>
                <li>
                  <strong className="text-slate-800">
                    Algorithmic Cluster {'{M8, M9}'}:
                  </strong>{' '}
                  Group together as non-optimization approaches propagating
                  indirect influence.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
