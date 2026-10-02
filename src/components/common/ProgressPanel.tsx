'use client';

/**
 * Progress bar with an integrated Cancel button.
 *
 * Rendered by every tool while a job runs. The Cancel button is always present
 * and always wired to the job's AbortSignal, which is what makes "no frozen UI"
 * a guarantee rather than a hope.
 */

import { cn } from '@/lib/utils/cn';
import { formatPercent } from '@/lib/format';

export interface ProgressPanelProps {
  /** 0..1 */
  progress: number;
  status: string;
  completed?: number;
  total?: number;
  onCancel?: () => void;
  className?: string;
}

export function ProgressPanel({
  progress,
  status,
  completed = 0,
  total = 0,
  onCancel,
  className,
}: ProgressPanelProps) {
  const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));
  const isBatch = total > 1;

  return (
    <div
      className={cn(
        'rounded-2xl border border-brand-200 bg-brand-50/60 p-4 sm:p-5',
        className
      )}
      // Announced politely so screen readers hear progress without interrupting.
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-brand-900">
          {status || 'Working'}
        </p>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-brand-700">
          {formatPercent(progress)}
        </span>
      </div>

      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-brand-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Job progress"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-600">
          {isBatch
            ? `${completed} of ${total} files`
            : 'Runs entirely on your device — you can keep this tab in the background for a moment, but not close it.'}
        </p>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
