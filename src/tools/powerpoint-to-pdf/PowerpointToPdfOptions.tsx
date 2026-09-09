'use client';

import React from 'react';

export interface PowerpointToPdfOptions {
  orientation: 'landscape' | 'portrait';
  theme: 'light' | 'dark';
  includeSlideNumbers: boolean;
}

interface PowerpointToPdfOptionsProps {
  options: PowerpointToPdfOptions;
  onChange: (options: PowerpointToPdfOptions) => void;
  disabled?: boolean;
}

export function PowerpointToPdfOptionsComponent({
  options,
  onChange,
  disabled = false,
}: PowerpointToPdfOptionsProps) {
  return (
    <div className="space-y-4">
      {/* Slide Orientation */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">PDF Orientation</label>
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, orientation: 'landscape' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.orientation === 'landscape'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Landscape (Presentation)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, orientation: 'portrait' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.orientation === 'portrait'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Portrait (Print)
          </button>
        </div>
      </div>

      {/* Slide Theme */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Slide Theme Styling</label>
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, theme: 'light' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.theme === 'light'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Light Theme (Clean White)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, theme: 'dark' })}
            className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
              options.theme === 'dark'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Dark Theme (Executive Slate)
          </button>
        </div>
      </div>

      {/* Slide Numbers */}
      <div className="max-w-md">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-700 cursor-pointer hover:bg-slate-100">
          <input
            type="checkbox"
            checked={options.includeSlideNumbers}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...options, includeSlideNumbers: e.target.checked })
            }
            className="rounded text-blue-600"
          />
          <div>
            <div className="font-semibold text-slate-800">Include Slide Number Indicators</div>
            <div className="text-[11px] text-slate-400">
              Renders "Slide X of Y" in the bottom-right corner of each page.
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}

