'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, FileImage, FileText, Archive, RefreshCw } from 'lucide-react';
import { FileDropZone } from '@/components/common/FileDropZone';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useDeviceProfile } from '@/hooks/useToolJob';
import { resolveLimits } from '@/lib/limits';
import { validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes } from '@/lib/format';
import {
  openPdfDocument,
  destroyPdfDocument,
  renderPageToBlob,
  type PdfDocumentProxy,
} from '@/lib/pdfjs';

interface RenderedImageRow {
  pageNumber: number;
  fileName: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
}

export function PdfToImageTool() {
  const profile = useDeviceProfile();
  const limits = useMemo(() => resolveLimits('pdf-to-image', profile), [profile]);
  const { run, cancel, running, progress, status, error } = useToolJob();
  const urls = useObjectUrls();

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [scale, setScale] = useState(1.5);
  const [rows, setRows] = useState<RenderedImageRow[]>([]);

  useAdFreeZone(running || rows.length > 0);

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
        let doc: PdfDocumentProxy | null = null;
        try {
          doc = await openPdfDocument(await chosen.arrayBuffer());
          setPageCount(doc.numPages);
        } catch {
          setPageCount(0);
        } finally {
          await destroyPdfDocument(doc);
        }
      }
    },
    [limits]
  );

  const handleConvert = async () => {
    if (!file) return;
    urls.revokeAll();
    setRows([]);

    const res = await run(async (reporter) => {
      reporter.beginStage('Opening PDF document', 0.1);
      let doc: PdfDocumentProxy | null = null;
      try {
        doc = await openPdfDocument(await file.arrayBuffer());
        const total = doc.numPages;
        const outputs: RenderedImageRow[] = [];

        reporter.beginStage('Rendering pages to images', 0.9);
        const ext = format === 'png' ? 'png' : 'jpg';

        for (let i = 1; i <= total; i++) {
          reporter.throwIfCancelled();
          reporter.reportItems(i, total, `Rendering page ${i} of ${total}`);

          const page = await doc.getPage(i);
          const { blob, width, height } = await renderPageToBlob(page, {
            scale,
            format,
            quality: 0.9,
            maxEdge: 3000,
          });

          const url = urls.create(blob);
          const fileName = `${file.name.replace(/\.pdf$/i, '')}-page-${i}.${ext}`;
          outputs.push({
            pageNumber: i,
            fileName,
            blob,
            url,
            width,
            height,
            size: blob.size,
          });
        }

        return outputs;
      } finally {
        await destroyPdfDocument(doc);
      }
    });

    if (res) {
      setRows(res);
    }
  };

  const handleDownloadAllZip = async () => {
    if (rows.length === 0) return;
    const { zipSync } = await import('fflate');
    const zipData: Record<string, Uint8Array> = {};

    for (const r of rows) {
      const buf = new Uint8Array(await r.blob.arrayBuffer());
      zipData[r.fileName] = buf;
    }

    const compressed = zipSync(zipData, { level: 0 });
    const zipBlob = new Blob([compressed], { type: 'application/zip' });
    const zipUrl = urls.create(zipBlob);
    triggerDownload(zipUrl, `${file ? file.name.replace(/\.pdf$/i, '') : 'document'}-images.zip`);
  };

  const handleReset = () => {
    urls.revokeAll();
    setFile(null);
    setPageCount(0);
    setRows([]);
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropZone
          onFiles={handleFile}
          accept="application/pdf"
          label="Drop PDF document here to convert to images"
          hint="Convert each page of a PDF into high-resolution PNG or JPG images."
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
          <p className="font-semibold">Unable to convert document to images</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      {file && rows.length === 0 && !running && (
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label text-xs">Output Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
                className="field-input text-xs"
              >
                <option value="png">PNG (Lossless, sharpest text)</option>
                <option value="jpeg">JPG (Smaller file size)</option>
              </select>
            </div>

            <div>
              <label className="field-label text-xs">Resolution / DPI</label>
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="field-input text-xs"
              >
                <option value={1.0}>1x Standard (72 DPI)</option>
                <option value={1.5}>1.5x Crisp (108 DPI - Recommended)</option>
                <option value={2.0}>2x High Res (144 DPI - Print ready)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleConvert}
              className="btn-primary gap-2"
            >
              <FileImage className="h-4 w-4" />
              Convert {pageCount} Pages to Images
            </button>
          </div>
        </div>
      )}

      {/* Rendered Result Grid */}
      {rows.length > 0 && (
        <div className="space-y-5">
          <div className="card flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Converted {rows.length} {rows.length === 1 ? 'Page' : 'Pages'}
              </h3>
              <p className="text-xs text-slate-500">Download single images or all images in a ZIP archive.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadAllZip}
                className="btn-primary gap-1.5 text-xs"
              >
                <Archive className="h-3.5 w-3.5" />
                Download All (ZIP)
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary gap-1.5 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                New PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {rows.map((row) => (
              <div
                key={row.pageNumber}
                className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-3 shadow-xs"
              >
                <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  <img
                    src={row.url}
                    alt={`Page ${row.pageNumber}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="mt-2.5 flex w-full items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">Page {row.pageNumber}</p>
                    <p className="text-[10px] text-slate-500">{formatBytes(row.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerDownload(row.url, row.fileName)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-50"
                    title="Download this page image"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
