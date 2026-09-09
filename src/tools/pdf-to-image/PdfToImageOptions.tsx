'use client';

import React from 'react';

export interface PdfToImageOptions {
  format: 'png' | 'jpeg';
  scale: number; // 1.0, 1.5, 2.0, 3.0
  pageRanges: string; // e.g. "" for all, or "1-3, 5"
}

interface PdfToImageOptionsProps {
  options: PdfToImageOptions;
  onChange: (options: PdfToImageOptions) => void;
  disabled?: boolean;
}

export function PdfToImageOptionsComponent({
  options,
  onChange,
  disabled = false,
}: PdfToImageOptionsProps) {
  return (
    <div className="space-y-4">
      {/* Output Format */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Image Format</label>
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, format: 'png' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.format === 'png'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            PNG (Lossless & Sharp)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, format: 'jpeg' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.format === 'jpeg'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            JPG (Smaller Size)
          </button>
        </div>
      </div>

      {/* Resolution Scale */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Resolution & Clarity</label>
        <div className="grid grid-cols-3 gap-2 max-w-md">
          {[
            { label: 'Standard (1x)', value: 1.0, desc: '72 DPI' },
            { label: 'High (2x)', value: 2.0, desc: '150 DPI' },
            { label: 'Ultra (3x)', value: 3.0, desc: '220 DPI' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...options, scale: item.value })}
              className={`rounded-xl border p-2.5 text-left transition-all ${
                options.scale === item.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs font-bold">{item.label}</div>
              <div className="text-[10px] text-slate-400">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Page Selection */}
      <div className="max-w-md space-y-1.5">
        <label className="text-xs font-bold text-slate-700">
          Page Range (Optional)
        </label>
        <input
          type="text"
          value={options.pageRanges}
          onChange={(e) => onChange({ ...options, pageRanges: e.target.value })}
          placeholder="Leave blank for all pages, or e.g. 1-3, 5"
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white disabled:opacity-50"
        />
        <p className="text-[11px] text-slate-400">
          Leave blank to extract all pages into a ZIP archive, or enter specific pages.
        </p>
      </div>
    </div>
  );
}

