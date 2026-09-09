'use client';

import React from 'react';
import { Lock } from 'lucide-react';

export interface UnlockPdfOptions {
  password: string;
}

interface UnlockPdfOptionsProps {
  options: UnlockPdfOptions;
  onChange: (options: UnlockPdfOptions) => void;
  disabled?: boolean;
}

export function UnlockPdfOptionsComponent({
  options,
  onChange,
  disabled = false,
}: UnlockPdfOptionsProps) {
  return (
    <div className="max-w-md space-y-2">
      <label className="text-xs font-bold text-slate-700">Document Password</label>
      <div className="relative">
        <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="password"
          value={options.password}
          onChange={(e) => onChange({ ...options, password: e.target.value })}
          placeholder="Enter the password to unlock this PDF"
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:bg-white"
        />
      </div>
      <p className="text-[11px] text-slate-400">
        The password stays inside your browser and is never stored or sent anywhere.
      </p>
    </div>
  );
}

