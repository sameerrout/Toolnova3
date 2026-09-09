'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';

export interface ProtectPdfOptions {
  password: string;
  confirmPassword: string;
  algorithm: 'AES-256' | 'RC4';
  allowPrinting: boolean;
  allowCopying: boolean;
  allowModifying: boolean;
  allowAnnotating: boolean;
}

interface ProtectPdfOptionsProps {
  options: ProtectPdfOptions;
  onChange: (options: ProtectPdfOptions) => void;
  disabled?: boolean;
}

export function ProtectPdfOptionsComponent({
  options,
  onChange,
  disabled = false,
}: ProtectPdfOptionsProps) {
  const [showPassword, setShowPassword] = useState(false);

  const passwordsMatch =
    options.password.length > 0 &&
    options.password === options.confirmPassword;
  const isWeak = options.password.length > 0 && options.password.length < 6;

  return (
    <div className="space-y-5">
      {/* Password Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            Set Document Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={options.password}
              onChange={(e) => onChange({ ...options, password: e.target.value })}
              placeholder="Enter password (min 6 chars)"
              disabled={disabled}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 pr-10 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {isWeak && (
            <p className="text-[11px] text-amber-600">Password should be at least 6 characters.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Confirm Password *</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={options.confirmPassword}
            onChange={(e) => onChange({ ...options, confirmPassword: e.target.value })}
            placeholder="Re-enter password"
            disabled={disabled}
            className={`w-full rounded-xl border p-2.5 text-xs outline-hidden transition-all disabled:opacity-50 ${
              options.confirmPassword && !passwordsMatch
                ? 'border-red-400 bg-red-50/30 text-red-800 focus:border-red-500'
                : 'border-slate-200 bg-slate-50/50 text-slate-800 focus:border-blue-500 focus:bg-white'
            }`}
          />
          {options.confirmPassword && !passwordsMatch && (
            <p className="text-[11px] text-red-600">Passwords do not match.</p>
          )}
        </div>
      </div>

      {/* Security Standard */}
      <div className="space-y-1.5 max-w-xl">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Encryption Standard
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, algorithm: 'AES-256' })}
            className={`rounded-xl border p-2.5 text-left transition-all ${
              options.algorithm === 'AES-256'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="text-xs font-bold">AES-256 (Recommended)</div>
            <div className="text-[10px] text-slate-500">Military-grade PDF 2.0 encryption</div>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, algorithm: 'RC4' })}
            className={`rounded-xl border p-2.5 text-left transition-all ${
              options.algorithm === 'RC4'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="text-xs font-bold">RC4 (128-bit)</div>
            <div className="text-[10px] text-slate-500">Legacy reader compatibility</div>
          </button>
        </div>
      </div>

      {/* Permissions */}
      <div className="space-y-2 max-w-xl">
        <label className="text-xs font-bold text-slate-700">Document Permissions</label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-slate-700 cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={options.allowPrinting}
              disabled={disabled}
              onChange={(e) => onChange({ ...options, allowPrinting: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Allow Printing</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-slate-700 cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={options.allowCopying}
              disabled={disabled}
              onChange={(e) => onChange({ ...options, allowCopying: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Allow Content Copying</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-slate-700 cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={options.allowModifying}
              disabled={disabled}
              onChange={(e) => onChange({ ...options, allowModifying: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Allow Modifying</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-slate-700 cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={options.allowAnnotating}
              disabled={disabled}
              onChange={(e) => onChange({ ...options, allowAnnotating: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Allow Annotations</span>
          </label>
        </div>
      </div>
    </div>
  );
}

