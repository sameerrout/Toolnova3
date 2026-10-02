'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, FileText, Hash, RefreshCw } from 'lucide-react';
import { FileDropZone } from '@/components/common/FileDropZone';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useDeviceProfile } from '@/hooks/useToolJob';
import { resolveLimits } from '@/lib/limits';
import { validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes } from '@/lib/format';
import {
  loadPdf,
  savePdf,
  embedStampFonts,
  stampText,
  countPdfPages,
  formatPageNumber,
  type TextStampOptions,
} from '@/lib/pdf';

type NumberFormat = 'n' | 'n-of-total' | 'page-n' | 'page-n-of-total' | 'i' | 'I';

export function PdfPageNumbersTool() {
  const profile = useDeviceProfile();
  const limits = useMemo(() => resolveLimits('pdf-page-numbers', profile), [profile]);
  const { run, cancel, running, progress, status, error } = useToolJob();
  const urls = useObjectUrls();

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);

  // Numbering options
  const [format, setFormat] = useState<NumberFormat>('n-of-total');
  const [position, setPosition] = useState<TextStampOptions['position']>('bottom-center');
  const [startNumber, setStartNumber] = useState(1);
  const [skipFirstPage, setSkipFirstPage] = useState(false);
  const fontSize = 10;
  const color = '#475569';

  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useAdFreeZone(running || resultBlob !== null);

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
        } catch {
          setPageCount(0);
        }
      }
    },
    [limits]
  );

  const handleApply = async () => {
    if (!file) return;
    urls.revokeAll();
    setResultBlob(null);
    setResultUrl(null);

    const res = await run(async (reporter) => {
      reporter.beginStage('Loading document', 0.2);
      const buffer = await file.arrayBuffer();
      const doc = await loadPdf(buffer, file.name);

      reporter.beginStage('Embedding fonts', 0.3);
      const fonts = await embedStampFonts(doc);

      reporter.beginStage('Numbering pages', 0.85);
      const pages = doc.getPages();

      pages.forEach((page, idx) => {
        reporter.throwIfCancelled();
        if (skipFirstPage && idx === 0) return;

        const effectiveIndex = skipFirstPage ? idx : idx + 1;
        const totalEffective = skipFirstPage ? pageCount - 1 : pageCount;
        const label = formatPageNumber(format, effectiveIndex, totalEffective, startNumber);

        stampText(
          page,
          {
            text: label,
            fontSize,
            color,
            opacity: 0.9,
            rotation: 0,
            position,
          },
          fonts
        );

        reporter.reportItems(idx + 1, pages.length, `Page ${idx + 1}`);
      });

      reporter.beginStage('Saving document', 0.95);
      return await savePdf(doc);
    });

    if (res) {
      setResultBlob(res);
      setResultUrl(urls.create(res));
    }
  };

  const handleReset = () => {
    urls.revokeAll();
    setFile(null);
    setPageCount(0);
    setResultBlob(null);
    setResultUrl(null);
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropZone
          onFiles={handleFile}
          accept="application/pdf"
          label="Drop PDF document here to add page numbers"
          hint="Customize numbering style, position, font size, and cover page exclusions."
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
          <p className="font-semibold">Unable to add page numbers</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      {file && !resultBlob && !running && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-brand-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{file.name}</h3>
                <p className="text-xs text-slate-500">
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'} · {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Change File
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="field-label text-xs">Numbering Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as NumberFormat)}
                className="field-input text-xs"
              >
                <option value="n-of-total">Page 1 / 10</option>
                <option value="page-n-of-total">Page 1 of 10</option>
                <option value="page-n">Page 1</option>
                <option value="n">1 (Number only)</option>
                <option value="i">i, ii, iii (Roman lower)</option>
                <option value="I">I, II, III (Roman upper)</option>
              </select>
            </div>

            <div>
              <label className="field-label text-xs">Position on Page</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as TextStampOptions['position'])}
                className="field-input text-xs"
              >
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-center">Top Center</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>

            <div>
              <label className="field-label text-xs">Starting Page Number</label>
              <input
                type="number"
                min="1"
                value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="field-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={skipFirstPage}
                onChange={(e) => setSkipFirstPage(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Do not number first page (Cover page)
            </label>

            <button
              type="button"
              onClick={handleApply}
              className="btn-primary gap-2 text-xs"
            >
              <Hash className="h-3.5 w-3.5" />
              Add Numbers to All Pages
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {resultBlob && resultUrl && (
        <div className="card space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Hash className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Page Numbers Added!</h2>
            <p className="mt-1 text-sm text-slate-600">
              {pageCount} pages formatted ({formatBytes(resultBlob.size)}).
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => triggerDownload(resultUrl, `${file?.name.replace(/\.pdf$/i, '')}-numbered.pdf`)}
              className="btn-primary gap-2"
            >
              <Download className="h-4 w-4" />
              Download Numbered PDF
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Number Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
