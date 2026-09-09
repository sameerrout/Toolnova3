'use client';

import React from 'react';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export type PageNumberFormat = 'page-of-total' | 'simple-slash' | 'number-only';

export interface PdfPageNumbersOptions {
  position: PageNumberPosition;
  format: PageNumberFormat;
  startNumber: number;
  fontSize: number;
}

interface PdfPageNumbersOptionsProps {
  options: PdfPageNumbersOptions;
  onChange: (options: PdfPageNumbersOptions) => void;
  disabled?: boolean;
}

export function PdfPageNumbersOptionsComponent({
  options,
  onChange,
  disabled = false,
}: PdfPageNumbersOptionsProps) {
  const updateOption = <K extends keyof PdfPageNumbersOptions>(
    key: K,
    val: PdfPageNumbersOptions[K]
  ) => {
    onChange({
      ...options,
      [key]: val,
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Position */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Position</label>
        <select
          value={options.position}
          onChange={(e) =>
            updateOption('position', e.target.value as PageNumberPosition)
          }
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-right">Bottom Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="top-center">Top Center</option>
          <option value="top-right">Top Right</option>
          <option value="top-left">Top Left</option>
        </select>
      </div>

      {/* Format */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Numbering Format</label>
        <select
          value={options.format}
          onChange={(e) =>
            updateOption('format', e.target.value as PageNumberFormat)
          }
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="page-of-total">Page 1 of 10</option>
          <option value="simple-slash">1 / 10</option>
          <option value="number-only">1 (Number only)</option>
        </select>
      </div>

      {/* Starting Number */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Starting Number</label>
        <input
          type="number"
          min={1}
          value={options.startNumber}
          onChange={(e) =>
            updateOption('startNumber', parseInt(e.target.value, 10) || 1)
          }
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        />
      </div>

      {/* Font Size */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Font Size</label>
        <select
          value={options.fontSize}
          onChange={(e) => updateOption('fontSize', parseInt(e.target.value, 10))}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="9">Small (9pt)</option>
          <option value="11">Standard (11pt)</option>
          <option value="14">Large (14pt)</option>
        </select>
      </div>
    </div>
  );
}

