'use client';

import React from 'react';

export interface PdfToWordOptions {
  documentTitle: string;
  includePageBreaks: boolean;
  fontSize: number;
}

interface PdfToWordOptionsProps {
  options: PdfToWordOptions;
  onChange: (options: PdfToWordOptions) => void;
  disabled?: boolean;
}

export function PdfToWordOptionsComponent({
  options,
  onChange,
  disabled = false,
}: PdfToWordOptionsProps) {
  return (
    <div className="space-y-4">
      {/* Title Field */}
      <div className="max-w-md space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Document Title (Optional)</label>
        <input
          type="text"
          value={options.documentTitle}
          onChange={(e) => onChange({ ...options, documentTitle: e.target.value })}
          placeholder="Leave blank to use file name"
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white disabled:opacity-50"
        />
        <p className="text-[11px] text-slate-400">
          Will be added as a Word Heading at the beginning of the generated document.
        </p>
      </div>

      {/* Font Size Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Body Font Size</label>
        <div className="grid grid-cols-3 gap-2 max-w-xs">
          {[
            { label: 'Compact (10pt)', value: 10 },
            { label: 'Standard (11pt)', value: 11 },
            { label: 'Large (12pt)', value: 12 },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...options, fontSize: item.value })}
              className={`rounded-xl border p-2 text-xs font-semibold transition-all ${
                options.fontSize === item.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Page Breaks Toggle */}
      <div className="max-w-md">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-700 cursor-pointer hover:bg-slate-100">
          <input
            type="checkbox"
            checked={options.includePageBreaks}
            disabled={disabled}
            onChange={(e) => onChange({ ...options, includePageBreaks: e.target.checked })}
            className="rounded text-blue-600"
          />
          <div>
            <div className="font-semibold text-slate-800">Preserve PDF Page Breaks</div>
            <div className="text-[11px] text-slate-400">
              Inserts Word section/page breaks between each original PDF page.
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}

