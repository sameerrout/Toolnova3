'use client';

import React from 'react';

export type RotationAngle = 90 | 180 | 270;
export type TargetPages = 'all' | 'odd' | 'even';

export interface RotatePdfOptions {
  angle: RotationAngle;
  targetPages: TargetPages;
}

interface RotatePdfOptionsProps {
  options: RotatePdfOptions;
  onChange: (options: RotatePdfOptions) => void;
  disabled?: boolean;
}

export function RotatePdfOptionsComponent({
  options,
  onChange,
  disabled = false,
}: RotatePdfOptionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">
          Rotation Angle
        </label>
        <select
          value={options.angle}
          onChange={(e) =>
            onChange({
              ...options,
              angle: parseInt(e.target.value, 10) as RotationAngle,
            })
          }
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="90">90° Clockwise</option>
          <option value="180">180° Half-Turn</option>
          <option value="270">270° Clockwise (90° Counter-Clockwise)</option>
        </select>
        <p className="text-[11px] text-slate-400">Direction to turn pages</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">
          Pages to Rotate
        </label>
        <select
          value={options.targetPages}
          onChange={(e) =>
            onChange({
              ...options,
              targetPages: e.target.value as TargetPages,
            })
          }
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="all">All Pages</option>
          <option value="odd">Odd Pages Only (1, 3, 5...)</option>
          <option value="even">Even Pages Only (2, 4, 6...)</option>
        </select>
        <p className="text-[11px] text-slate-400">Target specific pages</p>
      </div>
    </div>
  );
}

