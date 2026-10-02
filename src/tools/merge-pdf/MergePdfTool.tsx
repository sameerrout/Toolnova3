'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, FileText, Layers, RefreshCw } from 'lucide-react';
import { FileDropZone } from '@/components/common/FileDropZone';
import { FileList, type FileListEntry } from '@/components/common/FileList';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useDeviceProfile } from '@/hooks/useToolJob';
import { resolveLimits } from '@/lib/limits';
import { validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes } from '@/lib/format';
import { mergePdfs, sumBytes, type PdfFileResult } from '@/tools/pdf/pdfOps';

export function MergePdfTool() {
  const profile = useDeviceProfile();
  const limits = useMemo(() => resolveLimits('merge-pdf', profile), [profile]);
  const { run, cancel, running, progress, status, error } = useToolJob();
  const urls = useObjectUrls();

  const [files, setFiles] = useState<File[]>([]);
  const [outputTitle, setOutputTitle] = useState('');
  const [result, setResult] = useState<PdfFileResult | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useAdFreeZone(running || result !== null);

  const totalInputBytes = useMemo(() => sumBytes(files), [files]);

  const fileListEntries: FileListEntry[] = useMemo(
    () =>
      files.map((file, idx) => ({
        id: `${file.name}-${file.size}-${idx}`,
        name: file.name,
        size: file.size,
        type: 'PDF',
        reorderable: true,
      })),
    [files]
  );

  const handleAddFiles = useCallback(
    async (incoming: File[]) => {
      const validation = await validateFiles(incoming, {
        limits,
        acceptedExtensions: ['.pdf'],
        acceptAttribute: 'application/pdf',
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

  const handleMove = useCallback((id: string, direction: -1 | 1) => {
    setFiles((prev) => {
      const index = prev.findIndex((file, idx) => `${file.name}-${file.size}-${idx}` === id);
      if (index < 0) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }, []);

  const handleMerge = async () => {
    if (files.length < 2) return;
    urls.revokeAll();
    setResult(null);
    setResultUrl(null);

    const res = await run(async (reporter) => {
      return await mergePdfs(files, reporter, {
        title: outputTitle.trim() || undefined,
      });
    });

    if (res) {
      setResult(res);
      const url = urls.create(res.blob);
      setResultUrl(url);
    }
  };

  const handleDownload = () => {
    if (resultUrl && result) {
      triggerDownload(resultUrl, result.fileName);
    }
  };

  const handleReset = () => {
    urls.revokeAll();
    setFiles([]);
    setResult(null);
    setResultUrl(null);
    setOutputTitle('');
  };

  return (
    <div className="space-y-6">
      {/* File Drop Zone */}
      {!result && (
        <FileDropZone
          onFiles={handleAddFiles}
          accept="application/pdf"
          label="Drop PDF files here to merge"
          hint="Select 2 or more PDF documents. You can reorder them before merging."
          disabled={running}
        />
      )}

      {/* Progress */}
      {running && (
        <ProgressPanel
          progress={progress}
          status={status}
          onCancel={cancel}
        />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Unable to merge documents</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      {/* Working File List */}
      {!result && files.length > 0 && !running && (
        <div className="space-y-4">
          <FileList
            entries={fileListEntries}
            onRemove={handleRemove}
            onMove={handleMove}
            onClear={handleReset}
            totalLabel={`Total size: ${formatBytes(totalInputBytes)}`}
          />

          <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <label className="field-label text-xs">Merged Document Title (Optional)</label>
              <input
                type="text"
                value={outputTitle}
                onChange={(e) => setOutputTitle(e.target.value)}
                className="field-input"
                placeholder="e.g. Combined Contract"
              />
            </div>
            <button
              type="button"
              onClick={handleMerge}
              disabled={files.length < 2}
              className="btn-primary justify-center gap-2 sm:self-end"
            >
              <Layers className="h-4 w-4" />
              Merge {files.length} PDFs
            </button>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && resultUrl && (
        <div className="card space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">PDFs Successfully Merged!</h2>
            <p className="mt-1 text-sm text-slate-600">
              Combined {files.length} files into {result.pageCount} pages ({formatBytes(result.bytes)}).
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="btn-primary gap-2"
            >
              <Download className="h-4 w-4" />
              Download Merged PDF
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Merge More Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
