import React from 'react';
import { ShieldCheck, CloudUpload, Info } from 'lucide-react';
import { ExecutionMode } from '@/core/types/tool';
import { cn } from '@/lib/utils/cn';

interface PrivacyNoticeProps {
  executionMode: ExecutionMode;
  className?: string;
  detailed?: boolean;
}

export function PrivacyNotice({
  executionMode,
  className,
  detailed = false,
}: PrivacyNoticeProps) {
  if (executionMode === 'LOCAL') {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-emerald-800',
          className
        )}
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
        <div className="text-xs">
          <span className="font-semibold">Privacy First:</span>{' '}
          Your files are processed locally in your browser and never leave your device.
          {detailed && (
            <p className="mt-1 text-[11px] text-emerald-700/90 leading-tight">
              All transformations happen inside client Web Workers with zero server transmission.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (executionMode === 'SERVER') {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-amber-800',
          className
        )}
      >
        <CloudUpload className="h-4 w-4 shrink-0 text-amber-600" />
        <div className="text-xs">
          <span className="font-semibold">Server Processing:</span>{' '}
          This tool requires temporary server-side conversion.
          {detailed && (
            <p className="mt-1 text-[11px] text-amber-700/90 leading-tight">
              Files are automatically purged immediately after the conversion job finishes.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-blue-800',
        className
      )}
    >
      <Info className="h-4 w-4 shrink-0 text-blue-600" />
      <div className="text-xs">
        <span className="font-semibold">Hybrid Tool:</span>{' '}
        Processes client-side when possible, falling back to secure processing only if necessary.
      </div>
    </div>
  );
}

