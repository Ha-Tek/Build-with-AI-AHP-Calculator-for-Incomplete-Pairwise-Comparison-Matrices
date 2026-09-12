/**
 * Final Alternative Rankings Comparison Table
 * highlighting rank consensus, best alternatives, and ranking discrepancies.
 */

import React from 'react';
import { Trophy, CheckCircle } from 'lucide-react';
import { CompletionResult } from '../../types';

interface RankingsTableProps {
  results: CompletionResult[];
}

export const RankingsTable: React.FC<RankingsTableProps> = ({ results }) => {
  if (results.length === 0) return null;
  const n = results[0].weights.length;

  // Check consensus for #1 rank
  const topRanks = results.map((r) => {
    const topIdx = r.rankings.findIndex((rank) => rank === 1);
    return `A${topIdx + 1}`;
  });
  const allAgreeOnTop = topRanks.every((val) => val === topRanks[0]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Final Alternative Rankings Comparison</span>
          </h3>
          <p className="text-xs text-slate-500">
            Rank 1 corresponds to the highest priority alternative.
          </p>
        </div>

        {allAgreeOnTop ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Full Consensus: {topRanks[0]} is #1 across all methods!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            <span>Rank Inversion: Top alternative differs across methods</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3">Method</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-center">CR Status</th>
              {Array.from({ length: n }, (_, j) => (
                <th key={j} className="py-2.5 px-3 text-center font-bold">
                  A{j + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {results.map((r) => (
              <tr key={r.methodId} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">
                  {r.methodId} {r.shortName?.split(' ')[1] ? `— ${r.shortName.split(' ')[1]}` : ''}
                </td>
                <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px]">
                  {r.category}
                </td>
                <td className="py-2.5 px-3 text-center font-sans">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.isConsistent
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {r.isConsistent ? 'PASS' : 'FAIL'}
                  </span>
                </td>

                {r.rankings.map((rank, idx) => {
                  const weight = r.weights[idx];
                  return (
                    <td key={idx} className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-extrabold text-xs shadow-2xs ${
                          rank === 1
                            ? 'bg-amber-400 text-amber-950 font-black ring-2 ring-amber-300'
                            : rank === 2
                            ? 'bg-slate-200 text-slate-800 font-bold'
                            : rank === 3
                            ? 'bg-amber-700/20 text-amber-900 font-bold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        title={`A${idx + 1} weight: ${weight.toFixed(4)}`}
                      >
                        #{rank}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
