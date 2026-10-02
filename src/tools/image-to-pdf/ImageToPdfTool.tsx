'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, FileImage, Layers, RefreshCw } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { FileDropZone } from '@/components/common/FileDropZone';
import { FileList, type FileListEntry } from '@/components/common/FileList';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useDeviceProfile } from '@/hooks/useToolJob';
import { resolveLimits } from '@/lib/limits';
import { validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes } from '@/lib/format';
import { savePdf } from '@/lib/pdf';
import { decodeImage, closeBitmap } from '@/lib/imageClient';

type PageFormat = 'fit' | 'a4-portrait' | 'a4-landscape' | 'letter';
type MarginSize = 'none' | 'small' | 'large';

const PAGE_SIZES: Record<Exclude<PageFormat, 'fit'>, { width: number; height: number }> = {
  'a4-portrait': { width: 595.28, height: 841.89 },
  'a4-landscape': { width: 841.89, height: 595.28 },
  letter: { width: 612.0, height: 792.0 },
};

export function ImageToPdfTool() {
  const profile = useDeviceProfile();
  const limits = useMemo(() => resolveLimits('image-to-pdf', profile), [profile]);
  const { run, cancel, running, progress, status, error } = useToolJob();
  const urls = useObjectUrls();

  const [files, setFiles] = useState<File[]>([]);
  const [pageFormat, setPageFormat] = useState<PageFormat>('fit');
  const [margin, setMargin] = useState<MarginSize>('none');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useAdFreeZone(running || resultBlob !== null);

  const fileEntries: FileListEntry[] = useMemo(
    () =>
      files.map((file, idx) => ({
        id: `${file.name}-${file.size}-${idx}`,
        name: file.name,
        size: file.size,
        type: 'IMG',
        reorderable: true,
      })),
    [files]
  );

  const handleAddFiles = useCallback(
    async (incoming: File[]) => {
      const validation = await validateFiles(incoming, {
        limits,
        acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
        acceptAttribute: 'image/jpeg,image/png,image/webp,image/avif',
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

  const handleConvert = async () => {
    if (files.length === 0) return;
    urls.revokeAll();
    setResultBlob(null);
    setResultUrl(null);

    const res = await run(async (reporter) => {
      reporter.beginStage('Creating PDF document', 0.1);
      const pdfDoc = await PDFDocument.create();

      const marginPx = margin === 'small' ? 24 : margin === 'large' ? 48 : 0;

      for (let i = 0; i < files.length; i++) {
        reporter.throwIfCancelled();
        const file = files[i];
        reporter.reportItems(i, files.length, `Processing ${file.name}`);

        const bitmap = await decodeImage(file);
        const imgWidth = bitmap.width;
        const imgHeight = bitmap.height;

        // Convert image to JPEG buffer via offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas context');

        // Draw white background in case of transparent png/webp
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, imgWidth, imgHeight);
        ctx.drawImage(bitmap, 0, 0);

        const jpegBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/jpeg', 0.92);
        });

        const jpegBytes = await jpegBlob.arrayBuffer();
        const embeddedImage = await pdfDoc.embedJpg(jpegBytes);

        let pageWidth = imgWidth;
        let pageHeight = imgHeight;

        if (pageFormat !== 'fit') {
          const dims = PAGE_SIZES[pageFormat];
          pageWidth = dims.width;
          pageHeight = dims.height;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate fitted dimensions within margins
        const availWidth = Math.max(1, pageWidth - marginPx * 2);
        const availHeight = Math.max(1, pageHeight - marginPx * 2);

        const ratio = Math.min(availWidth / imgWidth, availHeight / imgHeight);
        const drawWidth = imgWidth * ratio;
        const drawHeight = imgHeight * ratio;

        const x = marginPx + (availWidth - drawWidth) / 2;
        const y = marginPx + (availHeight - drawHeight) / 2;

        page.drawImage(embeddedImage, {
          x,
          y,
          width: drawWidth,
          height: drawHeight,
        });

        closeBitmap(bitmap);
      }

      reporter.beginStage('Writing PDF document', 0.95);
      return await savePdf(pdfDoc, { title: 'Converted Images' });
    });

    if (res) {
      setResultBlob(res);
      setResultUrl(urls.create(res));
    }
  };

  const handleReset = () => {
    urls.revokeAll();
    setFiles([]);
    setResultBlob(null);
    setResultUrl(null);
  };

  return (
    <div className="space-y-6">
      {!resultBlob && (
        <FileDropZone
          onFiles={handleAddFiles}
          accept="image/jpeg,image/png,image/webp,image/avif"
          label="Drop images here to convert to PDF"
          hint="Supports JPG, PNG, WebP, and AVIF. Reorder images before generating."
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
          <p className="font-semibold">Unable to convert images to PDF</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      {!resultBlob && files.length > 0 && !running && (
        <div className="space-y-5">
          <FileList
            entries={fileEntries}
            onRemove={handleRemove}
            onMove={handleMove}
            onClear={handleReset}
            totalLabel={`${files.length} images ready`}
          />

          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">PDF Page Configuration</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label text-xs">Page Size</label>
                <select
                  value={pageFormat}
                  onChange={(e) => setPageFormat(e.target.value as PageFormat)}
                  className="field-input text-xs"
                >
                  <option value="fit">Fit to Image (Exact Dimensions)</option>
                  <option value="a4-portrait">A4 Portrait</option>
                  <option value="a4-landscape">A4 Landscape</option>
                  <option value="letter">US Letter</option>
                </select>
              </div>

              <div>
                <label className="field-label text-xs">Page Margin</label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(e.target.value as MarginSize)}
                  className="field-input text-xs"
                >
                  <option value="none">None (Full Bleed)</option>
                  <option value="small">Small Margin (0.3 in)</option>
                  <option value="large">Large Margin (0.6 in)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleConvert}
                className="btn-primary gap-2"
              >
                <Layers className="h-4 w-4" />
                Generate PDF ({files.length} pages)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Card */}
      {resultBlob && resultUrl && (
        <div className="card space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <FileImage className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">PDF Created Successfully!</h2>
            <p className="mt-1 text-sm text-slate-600">
              Combined {files.length} images into a {formatBytes(resultBlob.size)} PDF.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => triggerDownload(resultUrl, 'converted-images.pdf')}
              className="btn-primary gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Convert More Images
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
