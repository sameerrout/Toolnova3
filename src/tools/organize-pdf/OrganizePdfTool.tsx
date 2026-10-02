'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, FileText, ArrowLeft, ArrowRight, Trash2, Copy, RefreshCw, Check } from 'lucide-react';
import { FileDropZone } from '@/components/common/FileDropZone';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useDeviceProfile } from '@/hooks/useToolJob';
import { resolveLimits } from '@/lib/limits';
import { validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes } from '@/lib/format';
import { countPdfPages } from '@/lib/pdf';
import { reorderPdfPages, type PdfFileResult } from '@/tools/pdf/pdfOps';

interface PageItem {
  id: string;
  originalIndex: number;
}

export function OrganizePdfTool() {
  const profile = useDeviceProfile();
  const limits = useMemo(() => resolveLimits('organize-pdf', profile), [profile]);
  const { run, cancel, running, progress, status, error } = useToolJob();
  const urls = useObjectUrls();

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
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
          const initial = Array.from({ length: count }, (_, i) => ({
            id: `p-${i}-${Date.now()}`,
            originalIndex: i,
          }));
          setPages(initial);
        } catch {
          setPages([]);
        }
      }
    },
    [limits]
  );

  const movePage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  };

  const removePage = (index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicatePage = (index: number) => {
    setPages((prev) => {
      const copy = [...prev];
      const target = copy[index];
      copy.splice(index + 1, 0, {
        id: `p-dup-${Date.now()}-${Math.random()}`,
        originalIndex: target.originalIndex,
      });
      return copy;
    });
  };

  const handleSave = async () => {
    if (!file || pages.length === 0) return;
    urls.revokeAll();
    setResult(null);
    setResultUrl(null);

    const order = pages.map((p) => p.originalIndex);

    const res = await run(async (reporter) => {
      return await reorderPdfPages(file, order, reporter);
    });

    if (res) {
      setResult(res);
      setResultUrl(urls.create(res.blob));
    }
  };

  const handleReset = () => {
    urls.revokeAll();
    setFile(null);
    setPages([]);
    setResult(null);
    setResultUrl(null);
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropZone
          onFiles={handleFile}
          accept="application/pdf"
          label="Drop PDF document here to organize"
          hint="Reorder, duplicate, or delete pages with interactive controls."
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
          <p className="font-semibold">Unable to organize document</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      {file && !result && !running && (
        <div className="space-y-5">
          <div className="card flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-brand-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{file.name}</h3>
                <p className="text-xs text-slate-500">
                  {pages.length} {pages.length === 1 ? 'page' : 'pages'} in output · {formatBytes(file.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={pages.length === 0}
                className="btn-primary gap-1.5 text-xs"
              >
                <Check className="h-3.5 w-3.5" />
                Save Organized PDF
              </button>
            </div>
          </div>

          {/* Grid of Pages */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-3 shadow-xs transition hover:border-brand-300"
              >
                <div className="flex h-36 w-full items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex h-24 w-18 flex-col items-center justify-center rounded-sm border border-slate-300 bg-white shadow-xs">
                    <span className="text-xs font-bold text-slate-700">P. {p.originalIndex + 1}</span>
                    <span className="mt-1 text-[10px] text-slate-400">Position {idx + 1}</span>
                  </div>
                </div>

                <div className="mt-3 flex w-full items-center justify-between border-t border-slate-100 pt-2 text-xs">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => movePage(idx, -1)}
                      disabled={idx === 0}
                      title="Move left"
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePage(idx, 1)}
                      disabled={idx === pages.length - 1}
                      title="Move right"
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => duplicatePage(idx)}
                      title="Duplicate page"
                      className="rounded p-1 text-slate-500 hover:bg-slate-100"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePage(idx)}
                      title="Delete page"
                      className="rounded p-1 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
            <h2 className="text-xl font-bold text-slate-900">PDF Successfully Organized!</h2>
            <p className="mt-1 text-sm text-slate-600">
              Output has {result.pageCount} pages ({formatBytes(result.bytes)}).
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => triggerDownload(resultUrl, result.fileName)}
              className="btn-primary gap-2"
            >
              <Download className="h-4 w-4" />
              Download Organized PDF
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Organize Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
