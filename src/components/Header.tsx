/**
 * Application Header with paper citation, metadata, and quick navigation.
 */

import React from 'react';
import { BookOpen, Layers, Award, FileSpreadsheet, Code2 } from 'lucide-react';

interface HeaderProps {
  onOpenValidation: () => void;
  onOpenPython: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenValidation,
  onOpenPython,
  onExportExcel,
  onExportCSV,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title & Paper Reference */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
                  AHP Incomplete PCM Completion Calculator
                </h1>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    Based on Tekile, Brunelli, & Fedrizzi (2023) •{' '}
                    <span className="text-slate-600 font-semibold">
                      Operations Research Perspectives 10 (2023) 100272
                    </span>
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Badges & Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onOpenValidation}
              id="btn-nav-validation"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Validate Paper Examples</span>
            </button>

            <button
              onClick={onOpenPython}
              id="btn-nav-python"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors shadow-2xs"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Python / Streamlit Code</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            <button
              onClick={onExportExcel}
              id="btn-nav-export-excel"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs shadow-indigo-100"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={onExportCSV}
              id="btn-nav-export-csv"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
