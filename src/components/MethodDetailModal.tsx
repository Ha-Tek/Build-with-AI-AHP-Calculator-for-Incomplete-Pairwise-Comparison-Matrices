/**
 * Method Detail Modal: In-depth inspection of a method's completed matrix,
 * mathematical equations, and consistency metrics.
 */

import React from 'react';
import { X, CheckCircle, AlertCircle, BookOpen, Clock, Layers } from 'lucide-react';
import { CompletionResult } from '../types';
import { METHOD_INFO_LIST } from '../lib/constants';
import { formatAHPValue } from '../lib/matrixMath';

interface MethodDetailModalProps {
  result: CompletionResult | null;
  onClose: () => void;
  originalMatrix: (number | null)[][];
}

export const MethodDetailModal: React.FC<MethodDetailModalProps> = ({
  result,
  onClose,
  originalMatrix,
}) => {
  if (!result) return null;

  const info = METHOD_INFO_LIST.find((m) => m.id === result.methodId)!;
  const n = result.completedMatrix.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black px-2.5 py-1 rounded-lg bg-indigo-600 text-white shadow-xs">
              {result.methodId}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {result.methodName}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {info.category} • {info.authors} ({info.referenceYear})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block">
                λmax (Perron Eigen)
              </span>
              <span className="text-lg font-extrabold font-mono text-slate-900 mt-0.5 block">
                {result.lambdaMax.toFixed(4)}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block">
                CI (Consistency Index)
              </span>
              <span className="text-lg font-extrabold font-mono text-slate-900 mt-0.5 block">
                {result.ci.toFixed(4)}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                result.isConsistent
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <span className="text-[11px] font-semibold opacity-75 block">
                Consistency Ratio (CR)
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-lg font-black font-mono">
                  {result.cr.toFixed(4)}
                </span>
                {result.isConsistent ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Solve Time
              </span>
              <span className="text-lg font-extrabold font-mono text-slate-900 mt-0.5 block">
                {result.computationTimeMs.toFixed(1)} ms
              </span>
            </div>
          </div>

          {/* Mathematical Formulation & Paper Notes */}
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Paper Formulation & Equation</span>
            </div>
            <p className="text-indigo-900/80 leading-relaxed">
              {info.objectiveDescription}
            </p>
            <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-200/60 font-mono text-[11px] text-indigo-900 space-y-1">
              {info.equations.map((eq, i) => (
                <div key={i}>{eq}</div>
              ))}
            </div>
            <p className="text-[11px] text-indigo-700 italic">
              {info.paperClusterNote}
            </p>
          </div>

          {/* Completed Matrix */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Completed Matrix (Green cells = estimated)</span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full text-xs text-center">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <th className="p-2 w-10"></th>
                    {Array.from({ length: n }, (_, j) => (
                      <th key={j} className="p-2">
                        A{j + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {result.completedMatrix.map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 font-bold bg-slate-50 text-slate-600">
                        A{i + 1}
                      </td>
                      {row.map((val, j) => {
                        const wasMissing =
                          originalMatrix[i]?.[j] === null ||
                          isNaN(originalMatrix[i]?.[j] as number);
                        const isDiag = i === j;

                        return (
                          <td
                            key={j}
                            className={`p-2 font-medium ${
                              isDiag
                                ? 'bg-slate-100/60 text-slate-500 font-bold'
                                : wasMissing
                                ? 'bg-emerald-50 text-emerald-900 font-extrabold ring-1 ring-emerald-200/80'
                                : 'text-slate-800'
                            }`}
                          >
                            {formatAHPValue(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Priority Weights and Rankings */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Derived Priority Vector (w) & Rankings
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {result.weights.map((w, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-700">A{idx + 1}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      w = {w.toFixed(4)}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                      result.rankings[idx] === 1
                        ? 'bg-amber-400 text-amber-950 shadow-2xs'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{result.rankings[idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
