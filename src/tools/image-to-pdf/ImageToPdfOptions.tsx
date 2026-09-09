'use client';

import React from 'react';
import {
  ImageToPdfOptions,
  PageSizeOption,
  PageOrientationOption,
  MarginOption,
  ImageFitOption,
} from '@/core/engine/pdfEngine';

interface ImageToPdfOptionsProps {
  options: ImageToPdfOptions;
  onChange: (options: ImageToPdfOptions) => void;
  disabled?: boolean;
}

export function ImageToPdfOptionsComponent({
  options,
  onChange,
  disabled = false,
}: ImageToPdfOptionsProps) {
  const updateOption = <K extends keyof ImageToPdfOptions>(
    key: K,
    val: ImageToPdfOptions[K]
  ) => {
    onChange({
      ...options,
      [key]: val,
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Page Size */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">
          Page Size
        </label>
        <select
          value={options.pageSize}
          onChange={(e) => updateOption('pageSize', e.target.value as PageSizeOption)}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="fit">Fit to Image Size</option>
          <option value="a4">A4 (210 x 297 mm)</option>
          <option value="letter">US Letter (8.5 x 11 in)</option>
          <option value="legal">US Legal (8.5 x 14 in)</option>
        </select>
        <p className="text-[11px] text-slate-400">Standard document dimensions</p>
      </div>

      {/* 2. Page Orientation */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">
          Orientation
        </label>
        <select
          value={options.orientation}
          onChange={(e) =>
            updateOption('orientation', e.target.value as PageOrientationOption)
          }
          disabled={disabled || options.pageSize === 'fit'}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white disabled:opacity-50"
        >
          <option value="auto">Auto (Detect from image)</option>
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
        <p className="text-[11px] text-slate-400">Page display direction</p>
      </div>

      {/* 3. Margins */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">
          Page Margins
        </label>
        <select
          value={options.margin}
          onChange={(e) => updateOption('margin', e.target.value as MarginOption)}
          disabled={disabled || options.pageSize === 'fit'}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white disabled:opacity-50"
        >
          <option value="none">No Margin (0)</option>
          <option value="small">Small (20pt)</option>
          <option value="medium">Medium (36pt)</option>
          <option value="large">Large (54pt)</option>
        </select>
        <p className="text-[11px] text-slate-400">Spacing around page edges</p>
      </div>

      {/* 4. Compression & Quality */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">
          Image Quality
        </label>
        <select
          value={options.quality}
          onChange={(e) => updateOption('quality', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="0.95">Original Quality (95%)</option>
          <option value="0.85">High Quality (85%)</option>
          <option value="0.70">Balanced / Smaller (70%)</option>
        </select>
        <p className="text-[11px] text-slate-400">Controls output PDF file size</p>
      </div>
    </div>
  );
}

