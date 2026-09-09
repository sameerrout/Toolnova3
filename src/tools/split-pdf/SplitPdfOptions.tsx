'use client';

import React from 'react';

export interface SplitPdfOptions {
  pageRanges: string; // e.g. "1-3, 5"
}

interface SplitPdfOptionsProps {
  options: SplitPdfOptions;
  onChange: (options: SplitPdfOptions) => void;
  disabled?: boolean;
}

export function SplitPdfOptionsComponent({
  options,
  onChange,
  disabled = false,
}: SplitPdfOptionsProps) {
  return (
    <div className="space-y-4">
      <div className="max-w-md space-y-1.5">
        <label className="text-xs font-bold text-slate-700">
          Pages to Extract
        </label>
        <input
          type="text"
          value={options.pageRanges}
          onChange={(e) => onChange({ ...options, pageRanges: e.target.value })}
          placeholder="e.g. 1-3, 5, 8-10"
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white disabled:opacity-50"
        />
        <p className="text-[11px] text-slate-400">
          Specify single pages or comma-separated ranges (e.g. 1-3, 5, 8).
        </p>
      </div>
    </div>
  );
}

