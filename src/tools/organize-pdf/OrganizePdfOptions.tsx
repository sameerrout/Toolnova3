'use client';

import React from 'react';

export interface OrganizePdfOptions {
  pageOrder: string; // Comma-separated 1-based page numbers e.g. "2, 1, 3, 4"
  mode: 'custom-order' | 'reverse';
}

interface OrganizePdfOptionsProps {
  options: OrganizePdfOptions;
  onChange: (options: OrganizePdfOptions) => void;
  disabled?: boolean;
}

export function OrganizePdfOptionsComponent({
  options,
  onChange,
  disabled = false,
}: OrganizePdfOptionsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Organization Mode</label>
          <select
            value={options.mode}
            onChange={(e) =>
              onChange({
                ...options,
                mode: e.target.value as any,
              })
            }
            disabled={disabled}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
          >
            <option value="custom-order">Custom Page Order</option>
            <option value="reverse">Reverse All Pages</option>
          </select>
        </div>

        {options.mode === 'custom-order' && (
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700">
              New Page Sequence (Comma-separated)
            </label>
            <input
              type="text"
              value={options.pageOrder}
              onChange={(e) => onChange({ ...options, pageOrder: e.target.value })}
              placeholder="e.g. 3, 1, 2, 4 (omit pages to delete, repeat to duplicate)"
              disabled={disabled}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
            />
            <p className="text-[11px] text-slate-400">
              Enter the desired page order. Leave out numbers to remove pages, or repeat numbers to duplicate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

