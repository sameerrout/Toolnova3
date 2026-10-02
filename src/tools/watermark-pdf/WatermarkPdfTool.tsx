'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, FileText, Stamp, RefreshCw } from 'lucide-react';
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
  type TextStampOptions,
} from '@/lib/pdf';

export function WatermarkPdfTool() {
  const profile = useDeviceProfile();
  const limits = useMemo(() => resolveLimits('watermark-pdf', profile), [profile]);
  const { run, cancel, running, progress, status, error } = useToolJob();
  const urls = useObjectUrls();

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);

  // Watermark parameters
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#dc2626');
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(45);
  const [position, setPosition] = useState<TextStampOptions['position']>('center');

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
    if (!file || !text.trim()) return;
    urls.revokeAll();
    setResultBlob(null);
    setResultUrl(null);

    const res = await run(async (reporter) => {
      reporter.beginStage('Loading document', 0.2);
      const buffer = await file.arrayBuffer();
      const doc = await loadPdf(buffer, file.name);

      reporter.beginStage('Embedding fonts', 0.3);
      const fonts = await embedStampFonts(doc);

      const stampOptions: TextStampOptions = {
        text: text.trim(),
        fontSize,
        color,
        opacity,
        rotation,
        position,
      };

      reporter.beginStage('Applying watermark', 0.8);
      const pages = doc.getPages();
      pages.forEach((page, idx) => {
        reporter.throwIfCancelled();
        stampText(page, stampOptions, fonts);
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
          label="Drop PDF document here to watermark"
          hint="Add custom text watermarks with custom opacity, position, and rotation."
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
          <p className="font-semibold">Unable to apply watermark</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      {file && !resultBlob && !running && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Controls */}
          <div className="card space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-brand-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{file.name}</h3>
                  <p className="text-xs text-slate-500">
                    {pageCount} pages · {formatBytes(file.size)}
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

            <div>
              <label className="field-label">Watermark Text</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="field-input"
                placeholder="e.g. CONFIDENTIAL, DRAFT"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="field-label text-xs">Font Size ({fontSize}pt)</label>
                <input
                  type="range"
                  min="16"
                  max="96"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="field-label text-xs">Opacity ({Math.round(opacity * 100)}%)</label>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="field-label text-xs">Rotation ({rotation}°)</label>
                <select
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="field-input text-xs"
                >
                  <option value={0}>Horizontal (0°)</option>
                  <option value={45}>Diagonal (45°)</option>
                  <option value={-45}>Reverse Diagonal (-45°)</option>
                  <option value={90}>Vertical (90°)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label text-xs">Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as 'center' | 'tile' | 'top-center' | 'bottom-center')}
                  className="field-input text-xs"
                >
                  <option value="center">Center</option>
                  <option value="tile">Tile Across Page</option>
                  <option value="top-center">Top Center</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>

              <div>
                <label className="field-label text-xs">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200"
                  />
                  <span className="font-mono text-xs">{color}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleApply}
                disabled={!text.trim()}
                className="btn-primary gap-2"
              >
                <Stamp className="h-4 w-4" />
                Apply Watermark
              </button>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="card flex flex-col items-center justify-center p-6 text-center lg:col-span-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Stamp Preview Simulation
            </h3>
            <div className="relative flex h-64 w-48 items-center justify-center overflow-hidden rounded-xl border border-slate-300 bg-white shadow-md">
              <div className="space-y-2 p-3 text-[7px] leading-tight text-slate-300 select-none">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
              </div>

              {/* Watermark text visual */}
              <div
                style={{
                  color,
                  opacity,
                  fontSize: `${fontSize / 3.5}px`,
                  transform: `rotate(${rotation}deg)`,
                }}
                className="pointer-events-none absolute font-bold whitespace-nowrap"
              >
                {text || 'PREVIEW'}
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              Applied consistently to all {pageCount} pages.
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {resultBlob && resultUrl && (
        <div className="card space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Stamp className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">PDF Watermarked Successfully!</h2>
            <p className="mt-1 text-sm text-slate-600">
              Ready for download ({formatBytes(resultBlob.size)}).
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => triggerDownload(resultUrl, `${file?.name.replace(/\.pdf$/i, '')}-watermarked.pdf`)}
              className="btn-primary gap-2"
            >
              <Download className="h-4 w-4" />
              Download Watermarked PDF
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Watermark Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
