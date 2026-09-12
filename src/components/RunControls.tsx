/**
 * Execution controls: Run All 11 vs Single Method, CR threshold slider, and Run button.
 */

import React from 'react';
import { Play, Sliders, CheckCircle, RefreshCw } from 'lucide-react';
import { MethodId } from '../types';
import { METHOD_INFO_LIST } from '../lib/constants';

interface RunControlsProps {
  runMode: 'all' | 'single';
  selectedMethod: MethodId;
  crThreshold: number;
  isCalculating: boolean;
  canRun: boolean;
  onRunModeChange: (mode: 'all' | 'single') => void;
  onSelectedMethodChange: (method: MethodId) => void;
  onCrThresholdChange: (threshold: number) => void;
  onExecute: () => void;
}

export const RunControls: React.FC<RunControlsProps> = ({
  runMode,
  selectedMethod,
  crThreshold,
  isCalculating,
  canRun,
  onRunModeChange,
  onSelectedMethodChange,
  onCrThresholdChange,
  onExecute,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Mode Selection & Method Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onRunModeChange('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                runMode === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Run All 11 Methods (Comparative)
            </button>
            <button
              onClick={() => onRunModeChange('single')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                runMode === 'single'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Method
            </button>
          </div>

          {runMode === 'single' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Method:</span>
              <select
                value={selectedMethod}
                onChange={(e) => onSelectedMethodChange(e.target.value as MethodId)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {METHOD_INFO_LIST.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.shortName} — {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Middle: CR Threshold Slider */}
        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200">
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <div className="flex items-center gap-2">
            <label htmlFor="cr-threshold-input" className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Acceptability Cutoff (CR ≤):
            </label>
            <input
              id="cr-threshold-input"
              type="range"
              min="0.05"
              max="0.20"
              step="0.01"
              value={crThreshold}
              onChange={(e) => onCrThresholdChange(parseFloat(e.target.value))}
              className="w-24 accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs font-bold font-mono text-indigo-700 w-10">
              {crThreshold.toFixed(2)}
            </span>
          </div>
          {crThreshold === 0.1 && (
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded">
              Saaty Standard (10%)
            </span>
          )}
        </div>

        {/* Right: Primary Run Button */}
        <div>
          <button
            onClick={onExecute}
            disabled={!canRun || isCalculating}
            id="btn-run-completion"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-sm ${
              canRun && !isCalculating
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-md cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isCalculating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Computing Numerical Solvers...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {runMode === 'all'
                    ? 'Execute All 11 Methods'
                    : `Execute ${selectedMethod}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
