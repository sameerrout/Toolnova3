'use client';

import React from 'react';

export interface EditPdfOptions {
  annotationText: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  fontSize: number;
  textColor: 'black' | 'blue' | 'red';
  applyTo: 'first-page' | 'all-pages';
}

interface EditPdfOptionsProps {
  options: EditPdfOptions;
  onChange: (options: EditPdfOptions) => void;
  disabled?: boolean;
}

export function EditPdfOptionsComponent({
  options,
  onChange,
  disabled = false,
}: EditPdfOptionsProps) {
  const updateOption = <K extends keyof EditPdfOptions>(
    key: K,
    val: EditPdfOptions[K]
  ) => {
    onChange({
      ...options,
      [key]: val,
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div className="space-y-1.5 sm:col-span-2">
        <label className="text-xs font-bold text-slate-700">Annotation / Text Note</label>
        <input
          type="text"
          value={options.annotationText}
          onChange={(e) => updateOption('annotationText', e.target.value)}
          placeholder="e.g. APPROVED, REVISED, Notes..."
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        />
        <p className="text-[11px] text-slate-400">Text to stamp into the PDF</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Position</label>
        <select
          value={options.position}
          onChange={(e) => updateOption('position', e.target.value as any)}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="top-left">Top Left Corner</option>
          <option value="top-right">Top Right Corner</option>
          <option value="bottom-left">Bottom Left Corner</option>
          <option value="bottom-right">Bottom Right Corner</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Font Size</label>
        <select
          value={options.fontSize}
          onChange={(e) => updateOption('fontSize', parseInt(e.target.value, 10))}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="12">Normal (12pt)</option>
          <option value="16">Medium (16pt)</option>
          <option value="22">Large (22pt)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Text Color</label>
        <select
          value={options.textColor}
          onChange={(e) => updateOption('textColor', e.target.value as any)}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="black">Black</option>
          <option value="blue">Blue</option>
          <option value="red">Red</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Target Pages</label>
        <select
          value={options.applyTo}
          onChange={(e) => updateOption('applyTo', e.target.value as any)}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="first-page">First Page Only</option>
          <option value="all-pages">All Pages</option>
        </select>
      </div>
    </div>
  );
}

