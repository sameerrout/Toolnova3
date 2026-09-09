'use client';

import React from 'react';

export interface PdfToPowerpointOptions {
  slideLayout: '16x9' | '4x3';
  presentationTitle: string;
  resolution: 'standard' | 'high';
}

interface PdfToPowerpointOptionsProps {
  options: PdfToPowerpointOptions;
  onChange: (options: PdfToPowerpointOptions) => void;
  disabled?: boolean;
}

export function PdfToPowerpointOptionsComponent({
  options,
  onChange,
  disabled = false,
}: PdfToPowerpointOptionsProps) {
  return (
    <div className="space-y-4">
      {/* Slide Layout */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Slide Aspect Ratio</label>
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, slideLayout: '16x9' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.slideLayout === '16x9'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            16:9 Widescreen (Modern)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, slideLayout: '4x3' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.slideLayout === '4x3'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            4:3 Standard (Classic)
          </button>
        </div>
      </div>

      {/* Presentation Title */}
      <div className="max-w-md space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Deck Title (Optional)</label>
        <input
          type="text"
          value={options.presentationTitle}
          onChange={(e) => onChange({ ...options, presentationTitle: e.target.value })}
          placeholder="Leave blank to use file name"
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white disabled:opacity-50"
        />
      </div>

      {/* Slide Quality */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Render Quality</label>
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, resolution: 'high' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.resolution === 'high'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            High Resolution (Crisp)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, resolution: 'standard' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.resolution === 'standard'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Standard (Faster)
          </button>
        </div>
      </div>
    </div>
  );
}

