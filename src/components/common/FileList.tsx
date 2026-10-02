'use client';

/**
 * Unified file list with per-file remove and a total-size footer.
 *
 * Used by the ZIP tool and by every batch image tool. Keeps the three things
 * users actually need visible: name, type and size, plus the running total that
 * has to stay inside the device's memory budget.
 */

import { X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatBytes, truncateMiddle } from '@/lib/format';

export interface FileListEntry {
  id: string;
  name: string;
  /** Archive path when it differs from `name` (folder uploads). */
  path?: string;
  size: number;
  /** Short uppercase label such as `JPG` or `PDF`. */
  type: string;
  /** Optional data-URL thumbnail. */
  thumbnail?: string | null;
  /** Extra line, e.g. an output size after compression. */
  detail?: string;
  /** Per-file error/warning shown inline. */
  warning?: string;
  /** Reorder handle enabled. */
  reorderable?: boolean;
}

export interface FileListProps {
  entries: FileListEntry[];
  onRemove?: (id: string) => void;
  onClear?: () => void;
  /** Total size label; computed by the caller so it can reflect the device cap. */
  totalLabel?: string;
  /** Shown when the total exceeds a safe limit. */
  totalWarning?: string;
  /** Move an entry up/down; enables the reorder handles. */
  onMove?: (id: string, direction: -1 | 1) => void;
  emptyLabel?: string;
  className?: string;
}

export function FileList({
  entries,
  onRemove,
  onClear,
  totalLabel,
  totalWarning,
  onMove,
  emptyLabel = 'No files added yet.',
  className,
}: FileListProps) {
  if (entries.length === 0) {
    return (
      <p className={cn('rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600', className)}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">
          {entries.length} {entries.length === 1 ? 'file' : 'files'}
          {totalLabel ? <span className="ml-2 font-normal text-slate-600">{totalLabel}</span> : null}
        </h3>
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Remove all
          </button>
        ) : null}
      </div>

      {totalWarning ? (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          {totalWarning}
        </p>
      ) : null}

      <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
        {entries.map((entry, index) => (
          <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
            {onMove ? (
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  aria-label={`Move ${entry.name} up`}
                  disabled={index === 0}
                  onClick={() => onMove(entry.id, -1)}
                  className="rounded px-1 text-slate-400 transition hover:text-slate-700 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`Move ${entry.name} down`}
                  disabled={index === entries.length - 1}
                  onClick={() => onMove(entry.id, 1)}
                  className="rounded px-1 text-slate-400 transition hover:text-slate-700 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
            ) : (
              <GripVertical aria-hidden="true" className="hidden h-4 w-4 shrink-0 text-slate-300 sm:block" />
            )}

            {entry.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element -- data-URL thumbnail, not an optimizable asset
              <img
                src={entry.thumbnail}
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500"
              >
                {entry.type.slice(0, 4)}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900" title={entry.path ?? entry.name}>
                {truncateMiddle(entry.path ?? entry.name, 52)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {entry.type} · {formatBytes(entry.size)}
                {entry.detail ? ` · ${entry.detail}` : ''}
              </p>
              {entry.warning ? (
                <p className="mt-0.5 text-xs text-amber-700">{entry.warning}</p>
              ) : null}
            </div>

            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(entry.id)}
                aria-label={`Remove ${entry.name}`}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
