'use client';

/**
 * Resize Image — change dimensions by exact pixels, a percentage, or a
 * ready-made social/print preset.
 *
 * Notable behaviour:
 *   - the aspect-ratio lock works from the real shape of the first image
 *   - percentage mode measures each image and resizes it against its own size,
 *     grouping images that share a shape so the maths stays exact
 *   - every target is checked against the device's canvas ceiling before the
 *     job starts, rather than failing file by file
 *   - results come back as object URLs, with a per-file download and a ZIP
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { Archive, Download, Info, Loader2, Scaling, TriangleAlert } from 'lucide-react';

import { FileDropZone } from '@/components/common/FileDropZone';
import { FileList, type FileListEntry } from '@/components/common/FileList';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useDeviceProfile, useHydrated } from '@/hooks/useToolJob';
import { resolveLimits } from '@/lib/limits';
import { readImageDimensions, validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes, formatDelta, formatPercent } from '@/lib/format';
import { mapBrowserError } from '@/lib/errors';
import { JobReporter } from '@/lib/progress';
import { allocateUniqueName, describeFileType, getExtension } from '@/lib/filenames';
import {
  createThumbnail,
  detectEncodeSupport,
  fitWithin,
  type OutputImageFormat,
} from '@/lib/imageClient';
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

const MIN_SIDE = 1;
const MIN_PERCENT = 1;
const MAX_PERCENT = 400;
const PERCENT_PRESETS = [25, 50, 75, 200];
const RESIZE_QUALITY = 0.92;

type Mode = 'pixels' | 'percentage' | 'preset';
type FormatChoice = 'original' | OutputImageFormat;

/** Format choices for this tool: no AVIF, which the registry does not list. */
const RESIZE_FORMATS: OutputImageFormat[] = ['jpeg', 'png', 'webp'];

const FORMAT_LABELS: Record<OutputImageFormat, string> = {
  jpeg: 'JPG',
  png: 'PNG',
  webp: 'WebP',
  avif: 'AVIF',
};

interface SizePreset {
  key: string;
  label: string;
  width: number;
  height: number;
}

/** Exact pixel sizes, labelled the way the platform documents them. */
const PRESETS: SizePreset[] = [
  { key: 'instagram-square', label: 'Instagram square 1080 × 1080', width: 1080, height: 1080 },
  { key: 'instagram-portrait', label: 'Instagram portrait 1080 × 1350', width: 1080, height: 1350 },
  { key: 'instagram-story', label: 'Instagram story 1080 × 1920', width: 1080, height: 1920 },
  { key: 'twitter-post', label: 'Twitter/X post 1600 × 900', width: 1600, height: 900 },
  { key: 'facebook-cover', label: 'Facebook cover 820 × 312', width: 820, height: 312 },
  { key: 'youtube-thumbnail', label: 'YouTube thumbnail 1280 × 720', width: 1280, height: 720 },
  { key: 'linkedin-banner', label: 'LinkedIn banner 1584 × 396', width: 1584, height: 396 },
  { key: 'a4-300dpi', label: 'A4 at 300 DPI 2480 × 3508', width: 2480, height: 3508 },
  { key: 'uhd-4k', label: '4K UHD 3840 × 2160', width: 3840, height: 2160 },
  { key: 'hd-1080p', label: 'HD 1920 × 1080', width: 1920, height: 1080 },
];

interface SourceImage {
  id: string;
  file: File;
  thumbnail: string | null;
}

interface ResultRow extends ImageJobOutput {
  url: string | null;
}

interface SizeGroup {
  /** Exact output size, shared by every image in the group. */
  width: number;
  height: number;
  format: OutputImageFormat;
  items: ImageJobInput[];
  /** True when the device ceiling shrank this group's target. */
  capped: boolean;
}

interface Measured {
  file: File;
  width: number;
  height: number;
}

function originalFormatOf(file: File): OutputImageFormat {
  const extension = getExtension(file.name);
  if (extension === '.png') return 'png';
  if (extension === '.webp') return 'webp';
  if (extension === '.avif') return 'avif';
  return 'jpeg';
}

function clampSide(value: number): number {
  if (!Number.isFinite(value)) return MIN_SIDE;
  return Math.min(20000, Math.max(MIN_SIDE, Math.round(value)));
}

/**
 * Runs one `processImageBatch` per output size.
 *
 * Percentage mode has to work per image — 50% of a 4000 px photo is not 50% of
 * a 1200 px one — so images that share a shape are grouped and each group gets
 * its own exact target. A child reporter per group maps that group's completed
 * count onto the whole batch, which keeps one honest bar for the job and lets a
 * Cancel stop the running group immediately.
 */
async function processSizeGroups(
  groups: SizeGroup[],
  reporter: JobReporter,
  concurrency: number,
  totalCount: number,
  progressFor: (done: number) => number
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
          progressFor(done),
          `Resizing ${Math.min(done + 1, totalCount)} of ${totalCount}`,
          done,
          totalCount
        );
      },
    });

    const spec: ImageTransformSpec = {
      format: group.format,
      quality: RESIZE_QUALITY,
      width: group.width,
      height: group.height,
      background: '#ffffff',
      preserveTransparency: group.format === 'png',
      maxEdge: 0,
    };

    const forwardCancel = () => child.cancel();
    reporter.signal.addEventListener('abort', forwardCancel);

    try {
      const batch = await processImageBatch(group.items, spec, child, concurrency);
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

  const zipped = zipSync(payload, { level: 0 });
  return new Blob([zipped as unknown as BlobPart], { type: 'application/zip' });
}

export function ResizeImageTool() {
  const profile = useDeviceProfile();
  const limits = useMemo(() => resolveLimits('resize-image', profile), [profile]);
  const hydrated = useHydrated();
  const { run, cancel, running, progress, status, completed, total, error, cancelled } = useToolJob();
  const urls = useObjectUrls();

  const [sources, setSources] = useState<SourceImage[]>([]);
  const [baseSize, setBaseSize] = useState<{ width: number; height: number } | null>(null);
  const [baseId, setBaseId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('pixels');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [lockAspect, setLockAspect] = useState(true);
  const [percent, setPercent] = useState(50);
  const [presetKey, setPresetKey] = useState(PRESETS[0]?.key ?? 'instagram-square');
  const [formatChoice, setFormatChoice] = useState<FormatChoice>('original');
  const [results, setResults] = useState<ResultRow[]>([]);
  const [cappedCount, setCappedCount] = useState(0);
  const [rejected, setRejected] = useState<string[]>([]);
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);

  const idRef = useRef(0);
  const sizeEdited = useRef(false);

  useAdFreeZone(running || results.length > 0);

  const support = useMemo(
    () => (hydrated ? detectEncodeSupport() : { jpeg: true, png: true, webp: true, avif: true }),
    [hydrated]
  );

  const totalSize = useMemo(
    () => sources.reduce((sum, item) => sum + item.file.size, 0),
    [sources]
  );

  const preset = useMemo(
    () => PRESETS.find((entry) => entry.key === presetKey) ?? PRESETS[0],
    [presetKey]
  );

  /** The exact size the current settings ask for, or null in percentage mode. */
  const requestedSize = useMemo(() => {
    if (mode === 'pixels') return { width: clampSide(width), height: clampSide(height) };
    if (mode === 'preset' && preset) return { width: preset.width, height: preset.height };
    return null;
  }, [mode, preset, width, height]);

  const deviceCeiling = limits.maxCanvasEdge;
  const overDeviceLimit =
    requestedSize !== null &&
    deviceCeiling > 0 &&
    Math.max(requestedSize.width, requestedSize.height) > deviceCeiling;

  const percentValid =
    mode !== 'percentage' ||
    (Number.isFinite(percent) && percent >= MIN_PERCENT && percent <= MAX_PERCENT);

  const summary = useMemo(() => summariseBatch(results), [results]);

  const loadBaseSize = useCallback(async (item: SourceImage) => {
    try {
      const size = await readImageDimensions(item.file);
      setBaseSize(size);
      setBaseId(item.id);
    } catch {
      // The run will report a proper error for an unreadable file.
      setBaseSize(null);
      setBaseId(null);
    }
  }, []);

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

      urls.revokeAll();
      setResults([]);
      setCappedCount(0);
      setSources((current) => [...current, ...added]);

      const first = added[0];
      if (!baseSize && first) {
        const size = await readImageDimensions(first.file).catch(() => null);
        if (size) {
          setBaseSize(size);
          setBaseId(first.id);
          // Start from the picture's own size unless the user already typed one.
          if (!sizeEdited.current) {
            setWidth(size.width);
            setHeight(size.height);
          }
        }
      }

      for (const item of added) {
        const thumbnail = await createThumbnail(item.file);
        if (!thumbnail) continue;
        setSources((current) =>
          current.map((entry) => (entry.id === item.id ? { ...entry, thumbnail } : entry))
        );
      }
    },
    [baseSize, limits, urls]
  );

  const removeSource = useCallback(
    (id: string) => {
      const next = sources.filter((item) => item.id !== id);
      setSources(next);
      urls.revokeAll();
      setResults([]);
      setCappedCount(0);

      if (next.length === 0) {
        setBaseSize(null);
        setBaseId(null);
        return;
      }
      const first = next[0];
      if (first && id === baseId) void loadBaseSize(first);
    },
    [baseId, loadBaseSize, sources, urls]
  );

  const clearAll = useCallback(() => {
    setSources([]);
    setBaseSize(null);
    setBaseId(null);
    setRejected([]);
    setResults([]);
    setCappedCount(0);
    setZipError(null);
    sizeEdited.current = false;
    urls.revokeAll();
  }, [urls]);

  const handleWidthChange = useCallback(
    (next: number) => {
      sizeEdited.current = true;
      const value = clampSide(next);
      setWidth(value);
      if (lockAspect && baseSize && baseSize.width > 0) {
        setHeight(clampSide((value * baseSize.height) / baseSize.width));
      }
    },
    [baseSize, lockAspect]
  );

  const handleHeightChange = useCallback(
    (next: number) => {
      sizeEdited.current = true;
      const value = clampSide(next);
      setHeight(value);
      if (lockAspect && baseSize && baseSize.height > 0) {
        setWidth(clampSide((value * baseSize.width) / baseSize.height));
      }
    },
    [baseSize, lockAspect]
  );

  const handleRun = useCallback(async () => {
    urls.revokeAll();
    setResults([]);
    setZipError(null);
    setCappedCount(0);

    const chosen = formatChoice;

    const finished = await run(async (reporter) => {
      let groups: SizeGroup[] = [];
      let capped = 0;
      // Images that could not even be measured still get a row of their own.
      const unreadable: ImageJobOutput[] = [];

      if (mode === 'percentage') {
        // Measure first: a percentage has to be applied to each image's own size,
        // so the images are grouped by shape and each group gets exact pixels.
        const measured: Measured[] = [];
        for (const item of sources) {
          reporter.throwIfCancelled();
          try {
            const size = await readImageDimensions(item.file);
            measured.push({ file: item.file, width: size.width, height: size.height });
          } catch (measureError) {
            // One unreadable file must not stop the rest of the batch.
            unreadable.push({
              source: item.file,
              blob: item.file,
              fileName: item.file.name,
              width: 0,
              height: 0,
              bytes: item.file.size,
              saved: 0,
              error: mapBrowserError(measureError, item.file.name).message,
            });
          }
          reporter.report(
            ((measured.length + unreadable.length) / sources.length) * 0.15,
            `Measuring images ${measured.length + unreadable.length} of ${sources.length}`,
            measured.length + unreadable.length,
            sources.length
          );
        }

        const byShape = new Map<string, SizeGroup>();
        for (const item of measured) {
          const format = chosen === 'original' ? originalFormatOf(item.file) : chosen;
          const scaled = fitWithin(
            Math.max(1, Math.round((item.width * percent) / 100)),
            Math.max(1, Math.round((item.height * percent) / 100)),
            { maxEdge: deviceCeiling > 0 ? deviceCeiling : undefined }
          );
          if (scaled.scaled) capped += 1;

          const key = `${scaled.width}x${scaled.height}:${format}`;
          const input: ImageJobInput = {
            file: item.file,
            outputName: imageOutputName(item.file.name, format, 'resized'),
          };
          const existing = byShape.get(key);
          if (existing) existing.items.push(input);
          else
            byShape.set(key, {
              width: scaled.width,
              height: scaled.height,
              format,
              items: [input],
              capped: scaled.scaled,
            });
        }
        groups = [...byShape.values()];
      } else {
        const target = requestedSize;
        if (target) {
          const byFormat = new Map<OutputImageFormat, ImageJobInput[]>();
          for (const item of sources) {
            const format = chosen === 'original' ? originalFormatOf(item.file) : chosen;
            const input: ImageJobInput = {
              file: item.file,
              outputName: imageOutputName(item.file.name, format, 'resized'),
            };
            const existing = byFormat.get(format);
            if (existing) existing.push(input);
            else byFormat.set(format, [input]);
          }
          groups = [...byFormat].map(([format, items]) => ({
            width: target.width,
            height: target.height,
            format,
            items,
            capped: false,
          }));
        }
      }

      const outputs = await processSizeGroups(
        groups,
        reporter,
        limits.concurrency,
        sources.length,
        (done) => 0.15 + 0.85 * (sources.length > 0 ? done / sources.length : 0)
      );

      // Files that could not even be measured report their own error row and
      // never get an object URL.
      const failedSources = new Set(unreadable.map((entry) => entry.source));
      const rows: ResultRow[] = [...unreadable, ...outputs].map((output) => ({
        ...output,
        url: output.error || failedSources.has(output.source) ? null : urls.create(output.blob),
      }));

      setCappedCount(capped);
      setResults(rows);
      return rows;
    });

    if (!finished) setResults([]);
  }, [
    deviceCeiling,
    formatChoice,
    limits.concurrency,
    mode,
    percent,
    requestedSize,
    run,
    sources,
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
      triggerDownload(url, 'resized-images.zip');
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

  const canRun = sources.length > 0 && !running && !overDeviceLimit && percentValid;

  return (
    <div className="space-y-6">
      <FileDropZone
        onFiles={(files) => void addFiles(files)}
        accept={ACCEPT_ATTRIBUTE}
        multiple
        disabled={running}
        label="Drop the images you want to resize"
        hint="JPG, PNG, WebP and AVIF, several at once. Everything is resized in this tab — nothing is uploaded."
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
            <h2 className="text-sm font-semibold text-slate-900">New size</h2>

            <fieldset className="mt-4">
              <legend className="field-label">Resize method</legend>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                  <input
                    type="radio"
                    name="resize-mode"
                    value="pixels"
                    checked={mode === 'pixels'}
                    disabled={running}
                    onChange={() => setMode('pixels')}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">Exact pixels</span>
                    <span className="mt-0.5 block text-xs text-slate-600">
                      Type a width and height, with the original proportions locked if you want them.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                  <input
                    type="radio"
                    name="resize-mode"
                    value="percentage"
                    checked={mode === 'percentage'}
                    disabled={running}
                    onChange={() => setMode('percentage')}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">Percentage</span>
                    <span className="mt-0.5 block text-xs text-slate-600">
                      Each image is scaled against its own size, from 1% to 400%.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                  <input
                    type="radio"
                    name="resize-mode"
                    value="preset"
                    checked={mode === 'preset'}
                    disabled={running}
                    onChange={() => setMode('preset')}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">Ready-made preset</span>
                    <span className="mt-0.5 block text-xs text-slate-600">
                      Social media and print sizes, already in pixels.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            {mode === 'pixels' ? (
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="resize-width" className="field-label">
                      Width (px)
                    </label>
                    <input
                      id="resize-width"
                      type="number"
                      inputMode="numeric"
                      min={MIN_SIDE}
                      max={20000}
                      value={Number.isFinite(width) ? width : ''}
                      disabled={running}
                      onChange={(event) => handleWidthChange(Number(event.target.value))}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="resize-height" className="field-label">
                      Height (px)
                    </label>
                    <input
                      id="resize-height"
                      type="number"
                      inputMode="numeric"
                      min={MIN_SIDE}
                      max={20000}
                      value={Number.isFinite(height) ? height : ''}
                      disabled={running}
                      onChange={(event) => handleHeightChange(Number(event.target.value))}
                      className="field-input"
                    />
                  </div>
                </div>

                <label className="mt-3 flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={lockAspect}
                    disabled={running}
                    onChange={(event) => setLockAspect(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    <span className="font-medium text-slate-900">Lock the aspect ratio</span>
                    <span className="mt-0.5 block text-xs text-slate-600">
                      {baseSize
                        ? `Changing one side updates the other, using the shape of the first image (${baseSize.width} × ${baseSize.height}).`
                        : 'Waiting for the first image so the original proportions are known.'}
                    </span>
                  </span>
                </label>
              </div>
            ) : null}

            {mode === 'percentage' ? (
              <div className="mt-4">
                <label htmlFor="resize-percent" className="field-label">
                  Scale in per cent
                </label>
                <input
                  id="resize-percent"
                  type="number"
                  inputMode="numeric"
                  min={MIN_PERCENT}
                  max={MAX_PERCENT}
                  value={Number.isFinite(percent) ? percent : ''}
                  disabled={running}
                  onChange={(event) => setPercent(Number(event.target.value))}
                  className="field-input"
                  aria-describedby="resize-percent-help"
                />

                <div className="mt-2 flex flex-wrap gap-2">
                  {PERCENT_PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={running}
                      onClick={() => setPercent(value)}
                      aria-pressed={percent === value}
                      className={
                        percent === value
                          ? 'rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800'
                          : 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50'
                      }
                    >
                      {value}%
                    </button>
                  ))}
                </div>

                <p id="resize-percent-help" className="mt-2 text-xs text-slate-500">
                  Between {MIN_PERCENT}% and {MAX_PERCENT}%. Values above 100% enlarge the image,
                  which cannot add detail that was never captured.
                </p>

                {!percentValid ? (
                  <p role="alert" className="mt-2 text-xs font-medium text-red-700">
                    Enter a percentage between {MIN_PERCENT} and {MAX_PERCENT}.
                  </p>
                ) : null}
              </div>
            ) : null}

            {mode === 'preset' ? (
              <div className="mt-4">
                <label htmlFor="resize-preset" className="field-label">
                  Preset size
                </label>
                <select
                  id="resize-preset"
                  value={presetKey}
                  disabled={running}
                  onChange={(event) => setPresetKey(event.target.value)}
                  className="field-input"
                >
                  {PRESETS.map((entry) => (
                    <option key={entry.key} value={entry.key}>
                      {entry.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  A preset sets exact pixels. An image with a different shape is stretched to fit it,
                  so use the aspect lock in the pixel method if you would rather keep the
                  proportions.
                </p>
              </div>
            ) : null}

            <div className="mt-4">
              <label htmlFor="resize-format" className="field-label">
                Output format
              </label>
              <select
                id="resize-format"
                value={formatChoice}
                disabled={running}
                onChange={(event) => setFormatChoice(event.target.value as FormatChoice)}
                className="field-input"
              >
                <option value="original">Keep each file&rsquo;s original format</option>
                {RESIZE_FORMATS.map((format) => (
                  <option key={format} value={format} disabled={!support[format]}>
                    {FORMAT_LABELS[format]}
                    {support[format] ? '' : ' — not supported by this browser'}
                  </option>
                ))}
              </select>
              {formatChoice === 'jpeg' ? (
                <p className="mt-2 text-xs text-slate-500">
                  JPG cannot store transparency, so transparent areas are filled with white.
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
                <dt className="text-slate-600">Output size</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {requestedSize
                    ? `${requestedSize.width} × ${requestedSize.height} px`
                    : `${percent}% of each image`}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Device ceiling</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {deviceCeiling > 0 ? `${deviceCeiling} px` : 'no limit'}
                </dd>
              </div>
            </dl>

            {overDeviceLimit ? (
              <p
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
              >
                <TriangleAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  This device caps a canvas at {deviceCeiling} px on the longest edge, so{' '}
                  {requestedSize ? `${requestedSize.width} × ${requestedSize.height}` : 'this size'}{' '}
                  cannot be produced here. Choose a smaller size or open the tool on a desktop.
                </span>
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleRun()}
              disabled={!canRun}
              className="btn-primary mt-5 w-full"
            >
              {running ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Scaling aria-hidden="true" className="h-4 w-4" />
              )}
              {running ? 'Resizing…' : `Resize ${sources.length === 1 ? 'image' : `${sources.length} images`}`}
            </button>

            <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
              <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Enlarging cannot invent detail. For print, aim for 300 DPI at the final size: an A4
                page needs 2480 × 3508 px.
              </span>
            </p>
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
            {results.length === 1 ? 'image' : 'images'} resized ·{' '}
            {formatBytes(summary.inputBytes)} → {formatBytes(summary.outputBytes)}
            {summary.inputBytes > 0
              ? ` (${formatDelta(summary.inputBytes, summary.outputBytes)}, ${formatPercent(
                  summary.savedBytes / summary.inputBytes
                )} smaller)`
              : ''}
            {summary.failed > 0 ? ` · ${summary.failed} could not be read` : ''}
          </p>

          {cappedCount > 0 ? (
            <p className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <TriangleAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {cappedCount} {cappedCount === 1 ? 'image was' : 'images were'} capped at{' '}
                {deviceCeiling} px on the longest edge to stay inside this device&rsquo;s memory
                budget.
              </span>
            </p>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <caption className="sr-only">
                Size of every image before and after resizing, with a download button per file
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
