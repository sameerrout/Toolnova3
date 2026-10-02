'use client';

/**
 * Compress Image — shrink a batch of photos on this device.
 *
 * Two honest ways to hit a size budget:
 *   - by quality: one encoder setting for the whole batch, shown as a
 *     percentage, with the output format defaulting to each file's own format
 *   - by target size: a real binary search over encoder quality, so "under
 *     200 KB" means what it says instead of being estimated from a ratio table
 *
 * Everything stays local: files come from the picker, results come from
 * `URL.createObjectURL`, and each file gets a small data-URL thumbnail that is
 * generated once when it is added.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { Archive, Download, ImageDown, Info, Loader2, TriangleAlert } from 'lucide-react';

import { FileDropZone } from '@/components/common/FileDropZone';
import { FileList, type FileListEntry } from '@/components/common/FileList';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useDeviceProfile, useHydrated } from '@/hooks/useToolJob';
import { resolveLimits } from '@/lib/limits';
import { validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes, formatDelta, formatPercent } from '@/lib/format';
import { JobReporter } from '@/lib/progress';
import { allocateUniqueName, describeFileType, getExtension } from '@/lib/filenames';
import { createThumbnail, detectEncodeSupport, type OutputImageFormat } from '@/lib/imageClient';
import {
  describeImageResult,
  imageOutputName,
  processImageBatch,
  summariseBatch,
  type ImageJobInput,
  type ImageJobOutput,
  type ImageTransformSpec,
} from '@/tools/image/imageOps';

/** Mirrors the `accept` values in `TOOL_REGISTRY` for this slug. */
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const ACCEPT_ATTRIBUTE = 'image/jpeg,image/png,image/webp,image/avif';

const QUALITY_MIN = 10;
const QUALITY_MAX = 100;
const TARGET_MIN_KB = 5;
const TARGET_MAX_KB = 10240;
/** Preset row for the target-size mode. 1024 KB is shown as 1 MB. */
const TARGET_PRESETS_KB = [50, 100, 200, 500, 1024];

const FORMAT_LABELS: Record<OutputImageFormat, string> = {
  jpeg: 'JPG',
  png: 'PNG',
  webp: 'WebP',
  avif: 'AVIF',
};

/** Formats whose encoder takes a quality setting, so a size target is possible. */
const LOSSY_FORMATS: OutputImageFormat[] = ['jpeg', 'webp', 'avif'];

/** Every format the batch tools can write, in the order they are offered. */
const ALL_FORMATS: OutputImageFormat[] = ['jpeg', 'png', 'webp', 'avif'];

type FormatChoice = 'original' | OutputImageFormat;
type Mode = 'quality' | 'target';

interface SourceImage {
  id: string;
  file: File;
  thumbnail: string | null;
}

interface ResultRow extends ImageJobOutput {
  /** Object URL for the download button; null when this item failed. */
  url: string | null;
  /** True when the binary search could not get under the requested size. */
  missedTarget: boolean;
}

interface FormatGroup {
  format: OutputImageFormat;
  items: ImageJobInput[];
}

/** The format a file already uses, so "keep original" is true to the file. */
function originalFormatOf(file: File): OutputImageFormat {
  const extension = getExtension(file.name);
  if (extension === '.png') return 'png';
  if (extension === '.webp') return 'webp';
  if (extension === '.avif') return 'avif';
  return 'jpeg';
}

function presetLabel(kb: number): string {
  return kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`;
}

/**
 * Runs one `processImageBatch` per output format.
 *
 * "Keep original format" can mean up to four different targets inside one
 * batch, and `processImageBatch` takes a single spec. A child reporter per
 * group keeps the bar honest: the group's own completed count is mapped onto
 * the whole batch, so a mixed batch produces one smooth bar instead of four
 * restarts. Cancelling the outer job cancels the running group immediately.
 */
async function processFormatGroups(
  groups: FormatGroup[],
  buildSpec: (format: OutputImageFormat) => ImageTransformSpec,
  reporter: JobReporter,
  concurrency: number,
  totalCount: number
): Promise<ImageJobOutput[]> {
  const outputs: ImageJobOutput[] = [];
  let offset = 0;

  for (const group of groups) {
    reporter.throwIfCancelled();

    const child = new JobReporter({
      throttleMs: 60,
      onUpdate: (state) => {
        const done = Math.min(totalCount, offset + state.completed);
        reporter.report(
          totalCount > 0 ? done / totalCount : 0,
          `Compressing ${Math.min(done + 1, totalCount)} of ${totalCount}`,
          done,
          totalCount
        );
      },
    });

    const forwardCancel = () => child.cancel();
    reporter.signal.addEventListener('abort', forwardCancel);

    try {
      const batch = await processImageBatch(group.items, buildSpec(group.format), child, concurrency);
      outputs.push(...batch);
    } finally {
      reporter.signal.removeEventListener('abort', forwardCancel);
      child.dispose();
    }

    offset += group.items.length;
  }

  return outputs;
}

/** Zips the finished images with `fflate`, stored rather than deflated. */
async function buildZip(outputs: ResultRow[]): Promise<Blob | null> {
  const { zipSync } = await import('fflate');
  const payload: Record<string, Uint8Array> = {};
  const taken = new Set<string>();

  for (const output of outputs) {
    if (output.error) continue;
    const name = allocateUniqueName(output.fileName, taken);
    payload[name] = new Uint8Array(await output.blob.arrayBuffer());
  }

  if (Object.keys(payload).length === 0) return null;

  // Images are already compressed, so level 0 stores them and finishes at once.
  const zipped = zipSync(payload, { level: 0 });
  return new Blob([zipped as unknown as BlobPart], { type: 'application/zip' });
}

export function CompressImageTool() {
  const profile = useDeviceProfile();
  const limits = useMemo(() => resolveLimits('compress-image', profile), [profile]);
  const hydrated = useHydrated();
  const { run, cancel, running, progress, status, completed, total, error, cancelled } = useToolJob();
  const urls = useObjectUrls();

  const [sources, setSources] = useState<SourceImage[]>([]);
  const [mode, setMode] = useState<Mode>('quality');
  const [quality, setQuality] = useState(75);
  const [formatChoice, setFormatChoice] = useState<FormatChoice>('original');
  const [targetKb, setTargetKb] = useState(200);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);

  const idRef = useRef(0);

  // Suppress ads while a job is running or while results are on screen.
  useAdFreeZone(running || results.length > 0);

  // Encoding support can only be probed in the browser, so the first paint
  // assumes everything works and the real answer arrives after hydration. That
  // keeps the server markup and the first client render identical.
  const support = useMemo(
    () => (hydrated ? detectEncodeSupport() : { jpeg: true, png: true, webp: true, avif: true }),
    [hydrated]
  );

  const totalSize = useMemo(
    () => sources.reduce((sum, item) => sum + item.file.size, 0),
    [sources]
  );

  const targetBytes = useMemo(
    () => (mode === 'target' ? Math.round(targetKb * 1024) : undefined),
    [mode, targetKb]
  );

  const targetValid =
    mode === 'quality' ||
    (Number.isFinite(targetKb) && targetKb >= TARGET_MIN_KB && targetKb <= TARGET_MAX_KB);

  const summary = useMemo(() => summariseBatch(results), [results]);

  const addFiles = useCallback(
    async (files: File[]) => {
      const validation = await validateFiles(files, {
        limits,
        acceptedExtensions: ACCEPTED_EXTENSIONS,
        acceptAttribute: ACCEPT_ATTRIBUTE,
      });

      setRejected(validation.rejected.map((issue) => `${issue.fileName}: ${issue.message}`));

      if (validation.accepted.length === 0) return;

      const added: SourceImage[] = validation.accepted.map((file) => {
        idRef.current += 1;
        return { id: `image-${idRef.current}`, file, thumbnail: null };
      });

      // A new file means the previous batch's results no longer describe what is
      // on screen, so they go before anything else is measured.
      urls.revokeAll();
      setResults([]);
      setSources((current) => [...current, ...added]);

      // Thumbnails are built one at a time so a 60-file drop cannot block paint.
      for (const item of added) {
        const thumbnail = await createThumbnail(item.file);
        if (!thumbnail) continue;
        setSources((current) =>
          current.map((entry) => (entry.id === item.id ? { ...entry, thumbnail } : entry))
        );
      }
    },
    [limits, urls]
  );

  const removeSource = useCallback(
    (id: string) => {
      setSources((current) => current.filter((item) => item.id !== id));
      urls.revokeAll();
      setResults([]);
    },
    [urls]
  );

  const clearAll = useCallback(() => {
    setSources([]);
    setRejected([]);
    setResults([]);
    setZipError(null);
    urls.revokeAll();
  }, [urls]);

  const handleRun = useCallback(async () => {
    // Release the previous batch before the new one allocates anything.
    urls.revokeAll();
    setResults([]);
    setZipError(null);

    // A target size needs a quality knob, so a "keep original" choice falls back
    // to JPG here; the UI mirrors this rule when the mode changes.
    const chosen: FormatChoice =
      mode === 'target' && (formatChoice === 'original' || formatChoice === 'png')
        ? 'jpeg'
        : formatChoice;

    const grouped = new Map<OutputImageFormat, ImageJobInput[]>();
    for (const item of sources) {
      const format = chosen === 'original' ? originalFormatOf(item.file) : chosen;
      const input: ImageJobInput = {
        file: item.file,
        outputName: imageOutputName(item.file.name, format, 'compressed'),
      };
      const existing = grouped.get(format);
      if (existing) existing.push(input);
      else grouped.set(format, [input]);
    }

    const groups: FormatGroup[] = [...grouped].map(([format, items]) => ({ format, items }));

    const finished = await run(async (reporter) => {
      const outputs = await processFormatGroups(
        groups,
        (format) => ({
          format,
          quality: quality / 100,
          targetBytes,
          background: '#ffffff',
          // PNG keeps its alpha; the lossy formats are flattened onto white.
          preserveTransparency: format === 'png',
          maxEdge: limits.maxCanvasEdge,
        }),
        reporter,
        limits.concurrency,
        sources.length
      );

      // Object URLs are created inside the job so a failed or cancelled run can
      // never leave a half-filled result table behind.
      const rows: ResultRow[] = outputs.map((output) => ({
        ...output,
        url: output.error ? null : urls.create(output.blob),
        missedTarget:
          targetBytes !== undefined && !output.error && output.bytes > targetBytes,
      }));

      setResults(rows);
      return rows;
    });

    if (!finished) setResults([]);
  }, [
    formatChoice,
    limits.concurrency,
    limits.maxCanvasEdge,
    mode,
    quality,
    run,
    sources,
    targetBytes,
    urls,
  ]);

  const downloadOne = useCallback((row: ResultRow) => {
    if (row.url) triggerDownload(row.url, row.fileName);
  }, []);

  const downloadAll = useCallback(async () => {
    setZipError(null);
    setZipping(true);
    try {
      const blob = await buildZip(results);
      if (!blob) {
        setZipError('None of the images finished, so there is nothing to zip.');
        return;
      }
      const url = urls.create(blob);
      triggerDownload(url, 'compressed-images.zip');
      // Safari and Firefox may still be reading the blob when the click returns,
      // but holding a ZIP of a whole batch forever costs more than a short delay.
      window.setTimeout(() => urls.revoke(url), 15_000);
    } catch {
      setZipError('The ZIP could not be built on this device. Try downloading the images one by one.');
    } finally {
      setZipping(false);
    }
  }, [results, urls]);

  const listEntries: FileListEntry[] = sources.map((item) => ({
    id: item.id,
    name: item.file.name,
    size: item.file.size,
    type: describeFileType(item.file),
    thumbnail: item.thumbnail,
  }));

  const canRun = sources.length > 0 && !running && targetValid;

  return (
    <div className="space-y-6">
      <FileDropZone
        onFiles={(files) => void addFiles(files)}
        accept={ACCEPT_ATTRIBUTE}
        multiple
        disabled={running}
        label="Drop your images here"
        hint="JPG, PNG, WebP and AVIF. Up to the device limit below, in one batch. Nothing is uploaded — compression happens in this tab."
      />

      {rejected.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <TriangleAlert aria-hidden="true" className="h-4 w-4" />
            {rejected.length} {rejected.length === 1 ? 'file was' : 'files were'} skipped
          </p>
          <ul className="mt-2 space-y-1 text-xs text-amber-900">
            {rejected.slice(0, 6).map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          {rejected.length > 6 ? (
            <p className="mt-1 text-xs text-amber-800">and {rejected.length - 6} more…</p>
          ) : null}
        </div>
      ) : null}

      <FileList
        entries={listEntries}
        onRemove={removeSource}
        onClear={clearAll}
        totalLabel={sources.length > 0 ? `· ${formatBytes(totalSize)} total` : undefined}
        emptyLabel="No images added yet. Drop them above, or choose them with the picker."
      />

      {sources.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-900">How should the size be reduced?</h2>

            <fieldset className="mt-4">
              <legend className="field-label">Compression mode</legend>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                  <input
                    type="radio"
                    name="compress-mode"
                    value="quality"
                    checked={mode === 'quality'}
                    disabled={running}
                    onChange={() => setMode('quality')}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">By quality</span>
                    <span className="mt-0.5 block text-xs text-slate-600">
                      One quality level for the whole batch. Predictable, and the fastest option.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                  <input
                    type="radio"
                    name="compress-mode"
                    value="target"
                    checked={mode === 'target'}
                    disabled={running}
                    onChange={() => {
                      setMode('target');
                      // PNG has no quality setting, so a size target needs a lossy format.
                      setFormatChoice((current) =>
                        current === 'original' || current === 'png' ? 'jpeg' : current
                      );
                    }}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">To a target size</span>
                    <span className="mt-0.5 block text-xs text-slate-600">
                      Searches for the highest quality that still fits your size limit.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            {mode === 'quality' ? (
              <div className="mt-4">
                <label htmlFor="compress-quality" className="field-label">
                  Quality: {quality}%
                </label>
                <input
                  id="compress-quality"
                  type="range"
                  min={QUALITY_MIN}
                  max={QUALITY_MAX}
                  step={1}
                  value={quality}
                  disabled={running}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="mt-1 w-full"
                />
                <p className="mt-1 text-xs text-slate-500">
                  80-90% is visually identical for most photos. Below 60% the blockiness shows on
                  gradients and skin tones.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <label htmlFor="compress-target" className="field-label">
                  Target size in kilobytes
                </label>
                <input
                  id="compress-target"
                  type="number"
                  inputMode="numeric"
                  min={TARGET_MIN_KB}
                  max={TARGET_MAX_KB}
                  step={5}
                  value={Number.isFinite(targetKb) ? targetKb : ''}
                  disabled={running}
                  onChange={(event) => setTargetKb(Number(event.target.value))}
                  className="field-input"
                  aria-describedby="compress-target-help"
                />

                <div className="mt-2 flex flex-wrap gap-2">
                  {TARGET_PRESETS_KB.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={running}
                      onClick={() => setTargetKb(preset)}
                      aria-pressed={targetKb === preset}
                      className={
                        targetKb === preset
                          ? 'rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800'
                          : 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50'
                      }
                    >
                      {presetLabel(preset)}
                    </button>
                  ))}
                </div>

                <p id="compress-target-help" className="mt-2 text-xs text-slate-500">
                  Between {TARGET_MIN_KB} KB and {TARGET_MAX_KB / 1024} MB. Very small targets are
                  only reachable by shrinking the picture as well, which this tool does not do —
                  it lowers quality only.
                </p>

                {!targetValid ? (
                  <p className="mt-2 text-xs font-medium text-red-700" role="alert">
                    Enter a target between {TARGET_MIN_KB} KB and {TARGET_MAX_KB / 1024} MB.
                  </p>
                ) : null}
              </div>
            )}

            <div className="mt-4">
              <label htmlFor="compress-format" className="field-label">
                Output format
              </label>
              <select
                id="compress-format"
                value={formatChoice}
                disabled={running}
                onChange={(event) => setFormatChoice(event.target.value as FormatChoice)}
                className="field-input"
              >
                {mode === 'quality' ? (
                  <option value="original">Keep each file&rsquo;s original format</option>
                ) : null}
                {(mode === 'target' ? LOSSY_FORMATS : ALL_FORMATS).map((format) => (
                  <option key={format} value={format} disabled={!support[format]}>
                    {FORMAT_LABELS[format]}
                    {support[format] ? '' : ' — not supported by this browser'}
                  </option>
                ))}
              </select>
              {mode === 'target' ? (
                <p className="mt-2 text-xs text-slate-500">
                  A target size needs a format with a quality setting, so PNG is not offered here.
                </p>
              ) : null}
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-slate-900">What you will get</h2>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Images</dt>
                <dd className="font-medium tabular-nums text-slate-900">{sources.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Total input</dt>
                <dd className="font-medium tabular-nums text-slate-900">{formatBytes(totalSize)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Quality</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {mode === 'quality' ? `${quality}%` : `under ${presetLabel(targetKb)}`}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => void handleRun()}
              disabled={!canRun}
              className="btn-primary mt-5 w-full"
            >
              {running ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <ImageDown aria-hidden="true" className="h-4 w-4" />
              )}
              {running ? 'Compressing…' : `Compress ${sources.length === 1 ? 'image' : `${sources.length} images`}`}
            </button>

            <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
              <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Re-encoding with a canvas drops EXIF data, including the GPS location a phone camera
                writes into every photo. The original files on your device are never modified.
              </span>
            </p>

            {limits.maxCanvasEdge > 0 ? (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  On this device, images longer than {limits.maxCanvasEdge} px on the longest edge
                  are scaled down first so the tab stays inside its memory budget.
                </span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {running ? (
        <ProgressPanel
          progress={progress}
          status={status}
          completed={completed}
          total={total}
          onCancel={cancel}
        />
      ) : null}

      {cancelled ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Cancelled. Nothing was saved and the images you added are still listed above.
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          <p className="font-semibold">{error.message}</p>
          {error.hint ? <p className="mt-1 text-red-800">{error.hint}</p> : null}
        </div>
      ) : null}

      {results.length > 0 && !running ? (
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-900">Before and after</h2>

          <p className="mt-1 text-sm text-slate-600">
            {summary.succeeded} of {results.length}{' '}
            {results.length === 1 ? 'image' : 'images'} compressed ·{' '}
            {formatBytes(summary.inputBytes)} → {formatBytes(summary.outputBytes)}{' '}
            {summary.inputBytes > 0
              ? `(${formatDelta(summary.inputBytes, summary.outputBytes)}, ${formatPercent(
                  summary.savedBytes / summary.inputBytes
                )} smaller)`
              : ''}
            {summary.failed > 0 ? ` · ${summary.failed} could not be read` : ''}
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <caption className="sr-only">
                Size of every image before and after compression, with a download button per file
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    File
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Before
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    After
                  </th>
                  <th scope="col" className="py-2 font-semibold">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((row) => (
                  <tr key={`${row.fileName}-${row.source.lastModified}`}>
                    <th scope="row" className="py-3 pr-4 font-normal">
                      <span className="block max-w-[16rem] truncate font-medium text-slate-900">
                        {row.fileName}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        from {row.source.name}
                      </span>
                      {row.error ? (
                        <span className="mt-0.5 block text-xs font-medium text-red-700">
                          {row.error}
                        </span>
                      ) : null}
                      {row.missedTarget ? (
                        <span className="mt-0.5 block text-xs font-medium text-amber-700">
                          Could not reach the target size without shrinking the picture. This is the
                          smallest file the encoder produced.
                        </span>
                      ) : null}
                    </th>
                    <td className="py-3 pr-4 tabular-nums text-slate-700">
                      {formatBytes(row.source.size)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{describeImageResult(row)}</td>
                    <td className="py-3">
                      {row.url ? (
                        <button
                          type="button"
                          onClick={() => downloadOne(row)}
                          className="btn-secondary px-3 py-1.5"
                        >
                          <Download aria-hidden="true" className="h-3.5 w-3.5" />
                          Download
                          <span className="sr-only"> {row.fileName}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Not produced</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 text-slate-900">
                  <th scope="row" className="py-3 pr-4 text-left font-semibold">
                    Total ({summary.succeeded})
                  </th>
                  <td className="py-3 pr-4 font-semibold tabular-nums">
                    {formatBytes(summary.inputBytes)}
                  </td>
                  <td className="py-3 pr-4 font-semibold tabular-nums">
                    {formatBytes(summary.outputBytes)} ({formatDelta(summary.inputBytes, summary.outputBytes)})
                  </td>
                  <td className="py-3" />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void downloadAll()}
              disabled={zipping || summary.succeeded === 0}
              className="btn-primary"
            >
              {zipping ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Archive aria-hidden="true" className="h-4 w-4" />
              )}
              {zipping ? 'Building the ZIP…' : 'Download all as ZIP'}
            </button>
            <button type="button" onClick={clearAll} className="btn-secondary">
              Start a new batch
            </button>
          </div>

          {zipError ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {zipError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
