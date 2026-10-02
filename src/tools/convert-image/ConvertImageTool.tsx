'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, FileImage, RefreshCw, Archive } from 'lucide-react';
import { FileDropZone } from '@/components/common/FileDropZone';
import { FileList, type FileListEntry } from '@/components/common/FileList';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useDeviceProfile } from '@/hooks/useToolJob';
import { resolveLimits } from '@/lib/limits';
import { validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes } from '@/lib/format';
import { replaceExtension } from '@/lib/filenames';
import type { OutputImageFormat } from '@/lib/imageClient';
import {
  processImageBatch,
  type ImageJobInput,
  type ImageJobOutput,
} from '@/tools/image/imageOps';

export function ConvertImageTool() {
  const profile = useDeviceProfile();
  const limits = useMemo(() => resolveLimits('convert-image', profile), [profile]);
  const { run, cancel, running, progress, status, error } = useToolJob();
  const urls = useObjectUrls();

  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<OutputImageFormat>('webp');
  const [quality, setQuality] = useState(85);
  const [results, setResults] = useState<(ImageJobOutput & { url: string })[]>([]);

  useAdFreeZone(running || results.length > 0);

  const fileEntries: FileListEntry[] = useMemo(
    () =>
      files.map((file, idx) => ({
        id: `${file.name}-${file.size}-${idx}`,
        name: file.name,
        size: file.size,
        type: 'IMG',
      })),
    [files]
  );

  const handleAddFiles = useCallback(
    async (incoming: File[]) => {
      const validation = await validateFiles(incoming, {
        limits,
        acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.svg'],
        acceptAttribute: 'image/*',
      });
      if (validation.accepted.length > 0) {
        setFiles((prev) => [...prev, ...validation.accepted]);
      }
    },
    [limits]
  );

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file, idx) => `${file.name}-${file.size}-${idx}` !== id));
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;
    urls.revokeAll();
    setResults([]);

    const inputs: ImageJobInput[] = files.map((file) => ({
      file,
      outputName: replaceExtension(file.name, `.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`),
    }));

    const res = await run(async (reporter) => {
      return await processImageBatch(
        inputs,
        {
          format: targetFormat,
          quality,
          maxEdge: limits.maxCanvasEdge,
          preserveTransparency: targetFormat === 'png' || targetFormat === 'webp',
        },
        reporter,
        limits.concurrency
      );
    });

    if (res) {
      const mapped = res.map((item) => ({
        ...item,
        url: urls.create(item.blob),
      }));
      setResults(mapped);
    }
  };

  const handleDownloadAllZip = async () => {
    if (results.length === 0) return;
    const { zipSync } = await import('fflate');
    const zipData: Record<string, Uint8Array> = {};

    for (const r of results) {
      const buf = new Uint8Array(await r.blob.arrayBuffer());
      zipData[r.fileName] = buf;
    }

    const compressed = zipSync(zipData, { level: 0 });
    const zipBlob = new Blob([compressed], { type: 'application/zip' });
    const zipUrl = urls.create(zipBlob);
    triggerDownload(zipUrl, 'converted-images.zip');
  };

  const handleReset = () => {
    urls.revokeAll();
    setFiles([]);
    setResults([]);
  };

  return (
    <div className="space-y-6">
      {results.length === 0 && (
        <FileDropZone
          onFiles={handleAddFiles}
          accept="image/*"
          label="Drop images here to convert"
          hint="Convert batches of images between JPG, PNG, WebP, and AVIF formats."
          disabled={running}
        />
      )}

      {running && (
        <ProgressPanel
          progress={progress}
          status={status}
          onCancel={cancel}
        />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Unable to convert images</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      {results.length === 0 && files.length > 0 && !running && (
        <div className="space-y-5">
          <FileList
            entries={fileEntries}
            onRemove={handleRemove}
            onClear={handleReset}
            totalLabel={`${files.length} images queued`}
          />

          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Conversion Target Format</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { id: 'webp', label: 'WebP (Modern & Small)' },
                { id: 'jpeg', label: 'JPG (Universal)' },
                { id: 'png', label: 'PNG (Lossless & Transparent)' },
                { id: 'avif', label: 'AVIF (High Efficiency)' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setTargetFormat(fmt.id as OutputImageFormat)}
                  className={`rounded-xl border p-3 text-left transition ${
                    targetFormat === fmt.id
                      ? 'border-brand-500 bg-brand-50 font-semibold text-brand-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm">{fmt.label}</div>
                </button>
              ))}
            </div>

            {targetFormat !== 'png' && (
              <div>
                <div className="flex justify-between">
                  <label className="field-label text-xs">Quality</label>
                  <span className="text-xs font-semibold text-brand-600">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleConvert}
                className="btn-primary gap-2"
              >
                <FileImage className="h-4 w-4" />
                Convert {files.length} Images to {targetFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Converted {results.length} {results.length === 1 ? 'Image' : 'Images'}
              </h3>
              <p className="text-xs text-slate-500">All processing completed 100% in your browser.</p>
            </div>
            {results.length > 1 && (
              <button
                type="button"
                onClick={handleDownloadAllZip}
                className="btn-primary gap-1.5 text-xs"
              >
                <Archive className="h-3.5 w-3.5" />
                Download All (ZIP)
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {results.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <FileImage className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.fileName}</p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(r.bytes)} ({r.width} × {r.height} px)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerDownload(r.url, r.fileName)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary gap-2 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Convert More Images
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
