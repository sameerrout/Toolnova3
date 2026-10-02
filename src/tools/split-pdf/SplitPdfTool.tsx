'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, FileText, Scissors, Archive, RefreshCw } from 'lucide-react';
import { FileDropZone } from '@/components/common/FileDropZone';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useDeviceProfile } from '@/hooks/useToolJob';
import { resolveLimits } from '@/lib/limits';
import { validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes } from '@/lib/format';
import { countPdfPages, parsePageRanges } from '@/lib/pdf';
import { extractPages, splitEveryPage, type PdfFileResult } from '@/tools/pdf/pdfOps';

export function SplitPdfTool() {
  const profile = useDeviceProfile();
  const limits = useMemo(() => resolveLimits('split-pdf', profile), [profile]);
  const { run, cancel, running, progress, status, error } = useToolJob();
  const urls = useObjectUrls();

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<'ranges' | 'all'>('ranges');
  const [rangesInput, setRangesInput] = useState('1-');
  const [results, setResults] = useState<(PdfFileResult & { url: string })[]>([]);

  useAdFreeZone(running || results.length > 0);

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
          setRangesInput(`1-${count}`);
        } catch {
          setPageCount(0);
        }
      }
    },
    [limits]
  );

  const handleSplit = async () => {
    if (!file) return;
    urls.revokeAll();
    setResults([]);

    const res = await run(async (reporter) => {
      if (splitMode === 'all') {
        return await splitEveryPage(file, reporter);
      } else {
        // Parse user range into segments
        const indices = parsePageRanges(rangesInput, pageCount);
        if (indices.length === 0) {
          throw new Error('No valid pages selected to extract.');
        }
        // Group indices into contiguous ranges or individual files
        const ranges = [
          {
            from: indices[0],
            to: indices[indices.length - 1],
            label: rangesInput.replace(/\s+/g, ''),
          },
        ];
        return await extractPages(file, ranges, reporter);
      }
    });

    if (res && res.length > 0) {
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
    triggerDownload(zipUrl, `${file ? file.name.replace(/\.pdf$/i, '') : 'document'}-split.zip`);
  };

  const handleReset = () => {
    urls.revokeAll();
    setFile(null);
    setPageCount(0);
    setResults([]);
    setRangesInput('1-');
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropZone
          onFiles={handleFile}
          accept="application/pdf"
          label="Drop PDF document here to split"
          hint="Select a PDF to extract specific page ranges or extract each page individually."
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
          <p className="font-semibold">Unable to split document</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      {file && results.length === 0 && !running && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-brand-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{file.name}</h3>
                <p className="text-xs text-slate-500">
                  {pageCount > 0 ? `${pageCount} pages · ` : ''}
                  {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Choose different file
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSplitMode('ranges')}
              className={`rounded-xl border p-3 text-left transition ${
                splitMode === 'ranges'
                  ? 'border-brand-500 bg-brand-50 font-semibold text-brand-900'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm">Extract Page Range</div>
              <div className="text-xs text-slate-500">Select specific pages to save</div>
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('all')}
              className={`rounded-xl border p-3 text-left transition ${
                splitMode === 'all'
                  ? 'border-brand-500 bg-brand-50 font-semibold text-brand-900'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm">Split Every Page</div>
              <div className="text-xs text-slate-500">One PDF per page in the document</div>
            </button>
          </div>

          {splitMode === 'ranges' && (
            <div className="space-y-3">
              <label className="field-label text-xs">Page Selection (e.g. 1-3, 5, 8-10, odd, even)</label>
              <input
                type="text"
                value={rangesInput}
                onChange={(e) => setRangesInput(e.target.value)}
                className="field-input"
                placeholder="e.g. 1-5, 8"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRangesInput(`1-${pageCount}`)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  All Pages
                </button>
                <button
                  type="button"
                  onClick={() => setRangesInput('odd')}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Odd Pages
                </button>
                <button
                  type="button"
                  onClick={() => setRangesInput('even')}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Even Pages
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSplit}
              className="btn-primary gap-2"
            >
              <Scissors className="h-4 w-4" />
              {splitMode === 'all' ? `Split into ${pageCount} PDFs` : 'Extract Pages'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Split Completed ({results.length} {results.length === 1 ? 'file' : 'files'})
              </h3>
              <p className="text-xs text-slate-500">Download files individually or as a single ZIP.</p>
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
                  <FileText className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.fileName}</p>
                    <p className="text-xs text-slate-500">
                      {r.pageCount} {r.pageCount === 1 ? 'page' : 'pages'} · {formatBytes(r.bytes)}
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
              Split Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
