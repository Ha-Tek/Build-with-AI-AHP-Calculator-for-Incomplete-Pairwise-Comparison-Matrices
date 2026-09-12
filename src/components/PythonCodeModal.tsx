/**
 * Modal to view, copy, and download the Python / Streamlit implementation script
 */

import React, { useState } from 'react';
import { X, Copy, Check, Download, Code2, Terminal } from 'lucide-react';
import { generatePythonScript } from '../lib/exportUtils';
import { MethodId } from '../types';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  matrix: (number | null)[][];
  selectedMethod?: MethodId;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({
  isOpen,
  onClose,
  matrix,
  selectedMethod,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonCode = generatePythonScript(matrix, selectedMethod);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'incomplete_pcm_solver.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Python + NumPy + SciPy + Streamlit Solver Script
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Self-contained runnable Python code with your current matrix
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

        {/* Action bar */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>
              Requires: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">pip install numpy scipy pandas streamlit</code>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Python Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs shadow-indigo-100"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .py Script</span>
            </button>
          </div>
        </div>

        {/* Code view */}
        <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-950 font-mono text-xs text-slate-100">
          <pre className="overflow-x-auto whitespace-pre leading-relaxed">
            {pythonCode}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
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
