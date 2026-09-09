'use client';

import React from 'react';

export interface WordToPdfOptions {
  pageSize: 'a4' | 'letter';
  fontSize: number;
  lineSpacing: number;
  margin: number;
}

interface WordToPdfOptionsProps {
  options: WordToPdfOptions;
  onChange: (options: WordToPdfOptions) => void;
  disabled?: boolean;
}

export function WordToPdfOptionsComponent({
  options,
  onChange,
  disabled = false,
}: WordToPdfOptionsProps) {
  return (
    <div className="space-y-4">
      {/* Page Size */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Page Size</label>
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, pageSize: 'a4' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.pageSize === 'a4'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            A4 Standard (210 × 297 mm)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, pageSize: 'letter' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.pageSize === 'letter'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            US Letter (8.5 × 11 in)
          </button>
        </div>
      </div>

      {/* Font Size & Line Spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Font Size</label>
          <select
            value={options.fontSize}
            disabled={disabled}
            onChange={(e) => onChange({ ...options, fontSize: Number(e.target.value) })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden focus:border-blue-500 focus:bg-white"
          >
            <option value={10}>10 pt (Compact)</option>
            <option value={11}>11 pt (Standard)</option>
            <option value={12}>12 pt (Large)</option>
            <option value={14}>14 pt (Presentation)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Line Spacing</label>
          <select
            value={options.lineSpacing}
            disabled={disabled}
            onChange={(e) => onChange({ ...options, lineSpacing: Number(e.target.value) })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden focus:border-blue-500 focus:bg-white"
          >
            <option value={1.2}>1.2 (Tight)</option>
            <option value={1.4}>1.4 (Standard)</option>
            <option value={1.6}>1.6 (Relaxed)</option>
            <option value={2.0}>2.0 (Double)</option>
          </select>
        </div>
      </div>

      {/* Page Margins */}
      <div className="space-y-1.5 max-w-md">
        <label className="text-xs font-bold text-slate-700">Page Margins</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Narrow', value: 36 },
            { label: 'Standard', value: 50 },
            { label: 'Wide', value: 72 },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...options, margin: item.value })}
              className={`rounded-xl border p-2 text-xs font-semibold transition-all ${
                options.margin === item.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label} ({item.value}pt)
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

