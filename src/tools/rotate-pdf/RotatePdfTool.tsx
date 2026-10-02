'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, FileText, RotateCw, RotateCcw, RefreshCw } from 'lucide-react';
import { FileDropZone } from '@/components/common/FileDropZone';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useDeviceProfile } from '@/hooks/useToolJob';
import { resolveLimits } from '@/lib/limits';
import { validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes } from '@/lib/format';
import { countPdfPages } from '@/lib/pdf';
import { rotatePdf, type PdfFileResult } from '@/tools/pdf/pdfOps';

export function RotatePdfTool() {
  const profile = useDeviceProfile();
  const limits = useMemo(() => resolveLimits('rotate-pdf', profile), [profile]);
  const { run, cancel, running, progress, status, error } = useToolJob();
  const urls = useObjectUrls();

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rotations, setRotations] = useState<Map<number, number>>(new Map());
  const [result, setResult] = useState<PdfFileResult | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useAdFreeZone(running || result !== null);

  const handleFile = useCallback(
    async (incoming: File[]) => {
      const validation = await validateFiles(incoming, {
        limits,
        acceptedExtensions: ['.pdf'],
        acceptAttribute: 'application/pdf',
      });
      const chosen = validation.accepted[0];
      if (chosen) {
        setFile(chosen);
        try {
          const count = await countPdfPages(chosen);
          setPageCount(count);
          setRotations(new Map());
        } catch {
          setPageCount(0);
        }
      }
    },
    [limits]
  );

  const rotatePage = (index: number, delta: number) => {
    setRotations((prev) => {
      const next = new Map(prev);
      const current = next.get(index) ?? 0;
      const updated = (current + delta + 360) % 360;
      if (updated === 0) next.delete(index);
      else next.set(index, updated);
      return next;
    });
  };

  const rotateAll = (delta: number) => {
    setRotations((prev) => {
      const next = new Map(prev);
      for (let i = 0; i < pageCount; i++) {
        const current = next.get(i) ?? 0;
        const updated = (current + delta + 360) % 360;
        if (updated === 0) next.delete(i);
        else next.set(i, updated);
      }
      return next;
    });
  };

  const handleApply = async () => {
    if (!file) return;
    urls.revokeAll();
    setResult(null);
    setResultUrl(null);

    const res = await run(async (reporter) => {
      return await rotatePdf(file, rotations, reporter);
    });

    if (res) {
      setResult(res);
      setResultUrl(urls.create(res.blob));
    }
  };

  const handleReset = () => {
    urls.revokeAll();
    setFile(null);
    setPageCount(0);
    setRotations(new Map());
    setResult(null);
    setResultUrl(null);
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropZone
          onFiles={handleFile}
          accept="application/pdf"
          label="Drop PDF document here to rotate"
          hint="Rotate individual pages or all pages clockwise / counter-clockwise."
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
          <p className="font-semibold">Unable to rotate document</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      {file && !result && !running && (
        <div className="space-y-5">
          {/* Top toolbar */}
          <div className="card flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-brand-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{file.name}</h3>
                <p className="text-xs text-slate-500">
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'} · {formatBytes(file.size)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => rotateAll(90)}
                className="btn-secondary gap-1.5 text-xs"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Rotate All Right 90°
              </button>
              <button
                type="button"
                onClick={() => rotateAll(-90)}
                className="btn-secondary gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Rotate All Left 90°
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={rotations.size === 0}
                className="btn-primary gap-1.5 text-xs"
              >
                Apply & Save PDF
              </button>
            </div>
          </div>

          {/* Grid of Pages */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: pageCount }, (_, index) => {
              const rot = rotations.get(index) ?? 0;
              return (
                <div
                  key={index}
                  className="group relative flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-3 shadow-xs transition hover:border-brand-300"
                >
                  <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    <div
                      style={{ transform: `rotate(${rot}deg)` }}
                      className="flex h-24 w-18 flex-col items-center justify-center rounded-sm border border-slate-300 bg-white shadow-xs transition-transform duration-200"
                    >
                      <span className="text-xs font-bold text-slate-400">P. {index + 1}</span>
                      {rot !== 0 && (
                        <span className="mt-1 rounded bg-brand-50 px-1 py-0.5 text-[10px] font-semibold text-brand-700">
                          {rot}°
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 flex w-full items-center justify-between px-1">
                    <span className="text-xs font-semibold text-slate-700">Page {index + 1}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => rotatePage(index, -90)}
                        title="Rotate left 90°"
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => rotatePage(index, 90)}
                        title="Rotate right 90°"
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <RotateCw className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && resultUrl && (
        <div className="card space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <RotateCw className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">PDF Successfully Rotated!</h2>
            <p className="mt-1 text-sm text-slate-600">
              Rotated {result.pageCount} pages ({formatBytes(result.bytes)}).
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => triggerDownload(resultUrl, result.fileName)}
              className="btn-primary gap-2"
            >
              <Download className="h-4 w-4" />
              Download Rotated PDF
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Rotate Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
