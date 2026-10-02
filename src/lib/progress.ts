/**
 * Job progress + cancellation primitive.
 *
 * Every tool drives its UI from a {@link JobReporter}: it emits normalized
 * 0..1 progress plus a human status line, and it owns the `AbortSignal` that
 * workers and loops check. Keeping this in one place is what guarantees the
 * "progress indicator + cancel button + no frozen UI" requirement is identical
 * across all tools.
 *
 * Objects of this class are created *inside* the React component and disposed
 * in a `useEffect` cleanup, so an unmounted tool can never keep processing.
 */

import { AppError } from './errors';

export type JobPhase = 'idle' | 'reading' | 'processing' | 'writing' | 'done' | 'error';

export interface JobState {
  phase: JobPhase;
  /** 0..1, monotonic. */
  progress: number;
  status: string;
  /** Items completed / total, when the job is a batch. */
  completed: number;
  total: number;
  /** Milliseconds elapsed since the job started. */
  elapsedMs: number;
}

export interface JobReporterOptions {
  /** Throttle interval for React updates, ms. Default 80 ms. */
  throttleMs?: number;
  onUpdate: (state: JobState) => void;
}

/**
 * A single, cancelable unit of work.
 *
 * Progress is *weighted*: `beginStage('split', 0.3)` dedicates 30% of the bar to
 * that stage, so a job with a slow final write step still moves smoothly.
 */
export class JobReporter {
  private readonly controller = new AbortController();
  private readonly onUpdate: (state: JobState) => void;
  private readonly throttleMs: number;
  private readonly startedAt = Date.now();

  private lastEmit = 0;
  private pending: JobState;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stageStart = 0;
  private stageWeight = 1;
  private stageBase = 0;

  constructor(options: JobReporterOptions) {
    this.onUpdate = options.onUpdate;
    this.throttleMs = options.throttleMs ?? 80;
    this.pending = {
      phase: 'idle',
      progress: 0,
      status: 'Ready',
      completed: 0,
      total: 0,
      elapsedMs: 0,
    };
  }

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  get cancelled(): boolean {
    return this.controller.signal.aborted;
  }

  /** Throws `CANCELLED` when the user pressed Cancel. Call inside loops. */
  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new AppError('CANCELLED', 'Cancelled.');
    }
  }

  cancel(): void {
    this.controller.abort();
    this.flush({ phase: 'idle', status: 'Cancelled', progress: 0 });
  }

  /**
   * Declares a stage occupying `weight` (0..1) of the whole progress bar.
   * Passing no weight reuses the remaining space.
   */
  beginStage(status: string, weight?: number, phase: JobPhase = 'processing'): void {
    this.stageBase = this.stageBase + this.stageWeight * this.pending.progress;
    this.stageWeight = weight ?? Math.max(0.01, 1 - this.stageBase);
    this.stageStart = Date.now();
    this.emit({ phase, status, progress: this.stageBase });
  }

  /** Reports progress *within* the current stage. `ratio` is 0..1. */
  report(ratio: number, status?: string, completed?: number, total?: number): void {
    const clamped = Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));
    const overall = this.stageBase + this.stageWeight * clamped;
    this.emit({
      status: status ?? this.pending.status,
      progress: Math.max(this.pending.progress, overall),
      completed: completed ?? this.pending.completed,
      total: total ?? this.pending.total,
    });
  }

  /** Reports `completed / total` items of the current stage. */
  reportItems(completed: number, total: number, status?: string): void {
    const ratio = total > 0 ? completed / total : 0;
    this.report(ratio, status ?? `${completed} of ${total}`, completed, total);
  }

  /** Marks the job finished at 100%. */
  succeed(status = 'Done'): void {
    this.stageBase = 0;
    this.stageWeight = 1;
    this.emit({ phase: 'done', status, progress: 1 });
  }

  /** Flushes any throttled update immediately (call before teardown). */
  dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.controller.abort();
  }

  private emit(patch: Partial<JobState>): void {
    this.pending = { ...this.pending, ...patch, elapsedMs: Date.now() - this.startedAt };
    const now = Date.now();
    // Always deliver the final state immediately so the bar cannot stick at 99%.
    if (patch.phase === 'done' || patch.phase === 'error' || now - this.lastEmit >= this.throttleMs) {
      this.lastEmit = now;
      this.onUpdate(this.pending);
      return;
    }
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.lastEmit = Date.now();
      this.onUpdate(this.pending);
    }, this.throttleMs);
  }

  private flush(patch: Partial<JobState>): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pending = { ...this.pending, ...patch, elapsedMs: Date.now() - this.startedAt };
    this.onUpdate(this.pending);
  }
}

/**
 * Runs `task` for every item with bounded concurrency, reporting progress.
 * Cancellation is cooperative: it stops scheduling new items and throws.
 */
export async function runPool<T, R>(
  items: T[],
  concurrency: number,
  task: (item: T, index: number) => Promise<R>,
  reporter?: JobReporter
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));

  const runners = Array.from({ length: workerCount }, async () => {
    for (;;) {
      reporter?.throwIfCancelled();
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      const item = items[index] as T;
      results[index] = await task(item, index);
      completed += 1;
      reporter?.reportItems(completed, items.length);
    }
  });

  await Promise.all(runners);
  return results;
}

/** Yields to the event loop so the UI can paint between CPU-heavy batches. */
export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}

/** Runs `count` iterations, yielding to the browser every `chunkSize` items. */
export async function forEachChunked<T>(
  items: T[],
  chunkSize: number,
  iterate: (item: T, index: number) => Promise<void> | void,
  reporter?: JobReporter
): Promise<void> {
  const size = Math.max(1, chunkSize);
  for (let index = 0; index < items.length; index += 1) {
    reporter?.throwIfCancelled();
    await iterate(items[index] as T, index);
    if ((index + 1) % size === 0) {
      reporter?.reportItems(index + 1, items.length);
      await yieldToBrowser();
    }
  }
  reporter?.reportItems(items.length, items.length);
}
