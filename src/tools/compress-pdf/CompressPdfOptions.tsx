'use client';

import React from 'react';

export interface CompressPdfOptions {
  level: 'recommended' | 'high' | 'extreme';
}

interface CompressPdfOptionsProps {
  options: CompressPdfOptions;
  onChange: (options: CompressPdfOptions) => void;
  disabled?: boolean;
}

export function CompressPdfOptionsComponent({
  options,
  onChange,
  disabled = false,
}: CompressPdfOptionsProps) {
  return (
    <div className="max-w-md space-y-3">
      <label className="text-xs font-bold text-slate-700">Compression Strength</label>
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...options, level: 'recommended' })}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            options.level === 'recommended'
              ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold">Recommended</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Optimal quality</div>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...options, level: 'high' })}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            options.level === 'high'
              ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold">High</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Smaller size</div>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...options, level: 'extreme' })}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            options.level === 'extreme'
              ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold">Extreme</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Smallest file</div>
        </button>
      </div>
      <p className="text-[11px] text-slate-400">
        Optimizes document structure, flattens redundant streams, and compresses objects.
      </p>
    </div>
  );
}

