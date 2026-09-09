import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ProgressBarProps {
  progress: number; // 0 to 100
  statusText?: string;
  currentStep?: string;
  onCancel?: () => void;
  className?: string;
}

export function ProgressBar({
  progress,
  statusText = 'Processing...',
  currentStep,
  onCancel,
  className,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3',
        className
      )}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={statusText}
    >
      <div className="flex items-center justify-between text-xs font-medium text-slate-700">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="font-semibold text-slate-900">{statusText}</span>
          {currentStep && (
            <span className="text-slate-400">({currentStep})</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums font-bold text-blue-600">
            {clampedProgress}%
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Cancel operation"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

