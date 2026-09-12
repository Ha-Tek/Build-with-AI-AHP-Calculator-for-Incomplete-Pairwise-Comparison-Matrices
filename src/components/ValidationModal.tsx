/**
 * Paper Validation & Benchmark Suite Modal
 * verifies implementation against theoretical results and examples from Tekile et al. (2023).
 */

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  validatePaperExample1,
  validatePaperPage10,
  ValidationReport,
} from '../lib/paperValidation';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (presetId: string) => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  onLoadPreset,
}) => {
  const [activeTab, setActiveTab] = useState<'ex1' | 'page10'>('ex1');

  if (!isOpen) return null;

  const reportEx1: ValidationReport = validatePaperExample1();
  const reportPage10: ValidationReport = validatePaperPage10();
  const currentReport = activeTab === 'ex1' ? reportEx1 : reportPage10;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Paper Benchmark Validation Suite
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Verifying numerical accuracy against Tekile, Brunelli, & Fedrizzi
                (2023)
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

        {/* Tab Selection */}
        <div className="px-6 pt-4 pb-2 flex border-b border-slate-200 bg-slate-50/50 gap-2">
          <button
            onClick={() => setActiveTab('ex1')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'ex1'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paper Example 1 (n=4, 3 missing, Tree Graph)
          </button>
          <button
            onClick={() => setActiveTab('page10')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'page10'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Page 10 Matrix (Inconsistency vs. Bias Demo)
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              currentReport.passed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            {currentReport.passed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-bold">{currentReport.exampleName}</h4>
              <p className="text-xs mt-1 opacity-90 leading-relaxed">
                {currentReport.actualSummary}
              </p>
              <p className="text-[11px] font-mono mt-1 text-slate-600">
                Source: {currentReport.reference}
              </p>
            </div>
          </div>

          {/* Theoretical Expectation */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <span className="font-bold block text-slate-900 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Theoretical Expectation in the Paper:
            </span>
            <p>{currentReport.expectedBehavior}</p>
          </div>

          {/* Method Comparison Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Results Across All 11 Numerical Solvers
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5 text-center">λmax</th>
                    <th className="p-2.5 text-center">CR</th>
                    <th className="p-2.5">Estimated Values</th>
                    <th className="p-2.5 text-center">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {currentReport.details.map((d) => (
                    <tr key={d.methodId} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold font-sans text-slate-900">
                        {d.methodId}
                      </td>
                      <td className="p-2.5 text-center">{d.lambdaMax.toFixed(4)}</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            d.cr < 0.01
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'text-slate-800'
                          }`}
                        >
                          {d.cr.toFixed(4)}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {Object.entries(d.estimatedValues)
                          .map(
                            ([k, v]) =>
                              `${k} = ${Number(v.toFixed(3))}`
                          )
                          .join(', ')}
                      </td>
                      <td className="p-2.5 text-center">
                        {d.matchesExpected ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Verified ✓
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Minor Var.
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Research Notes */}
          <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block">
              Paper Scientific Notes:
            </span>
            {currentReport.notes.map((note, i) => (
              <p key={i} className="leading-relaxed">
                • {note}
              </p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onLoadPreset(activeTab === 'ex1' ? 'paper-ex1' : 'paper-page10');
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load this Example in Main Calculator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
