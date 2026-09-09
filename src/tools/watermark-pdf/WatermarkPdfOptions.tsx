'use client';

import React from 'react';

export interface WatermarkPdfOptions {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  color: 'gray' | 'red' | 'blue';
}

interface WatermarkPdfOptionsProps {
  options: WatermarkPdfOptions;
  onChange: (options: WatermarkPdfOptions) => void;
  disabled?: boolean;
}

export function WatermarkPdfOptionsComponent({
  options,
  onChange,
  disabled = false,
}: WatermarkPdfOptionsProps) {
  const updateOption = <K extends keyof WatermarkPdfOptions>(
    key: K,
    val: WatermarkPdfOptions[K]
  ) => {
    onChange({
      ...options,
      [key]: val,
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Watermark Text */}
      <div className="space-y-1.5 sm:col-span-2">
        <label className="text-xs font-bold text-slate-700">Watermark Text</label>
        <input
          type="text"
          value={options.text}
          onChange={(e) => updateOption('text', e.target.value)}
          placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        />
        <p className="text-[11px] text-slate-400">The stamp text displayed across each page</p>
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
          <option value="32">Small (32pt)</option>
          <option value="48">Medium (48pt)</option>
          <option value="64">Large (64pt)</option>
          <option value="80">Extra Large (80pt)</option>
        </select>
      </div>

      {/* Opacity */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Opacity</label>
        <select
          value={options.opacity}
          onChange={(e) => updateOption('opacity', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="0.15">Very Light (15%)</option>
          <option value="0.3">Subtle / Standard (30%)</option>
          <option value="0.5">Moderate (50%)</option>
          <option value="0.75">Prominent (75%)</option>
        </select>
      </div>

      {/* Rotation */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Rotation</label>
        <select
          value={options.rotation}
          onChange={(e) => updateOption('rotation', parseInt(e.target.value, 10))}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="45">Diagonal (45°)</option>
          <option value="0">Horizontal (0°)</option>
          <option value="90">Vertical (90°)</option>
          <option value="-45">Reverse Diagonal (-45°)</option>
        </select>
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Color</label>
        <select
          value={options.color}
          onChange={(e) => updateOption('color', e.target.value as any)}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        >
          <option value="gray">Neutral Gray</option>
          <option value="red">Alert Red</option>
          <option value="blue">Brand Blue</option>
        </select>
      </div>
    </div>
  );
}

