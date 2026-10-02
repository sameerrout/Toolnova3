'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  FileText,
  Type,
  PenTool,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { FileDropZone } from '@/components/common/FileDropZone';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob } from '@/hooks/useToolJob';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes } from '@/lib/format';
import { openPdfDocument, destroyPdfDocument, type PdfDocumentProxy } from '@/lib/pdfjs';

interface TextAnnotation {
  id: string;
  pageIndex: number;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

interface PathAnnotation {
  pageIndex: number;
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

export function EditPdfTool() {
  const { run, cancel, running, progress, status, error } = useToolJob();
  const urls = useObjectUrls();

  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  // Editor mode: 'select' | 'text' | 'draw'
  const [activeTool, setActiveTool] = useState<'text' | 'draw'>('text');
  const [drawColor, setDrawColor] = useState('#2563eb');
  const [brushSize, setBrushSize] = useState(4);
  const [textSize, setTextSize] = useState(16);

  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [pathAnnotations, setPathAnnotations] = useState<PathAnnotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<PdfDocumentProxy | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useAdFreeZone(running || resultBlob !== null);

  // Load PDF when file is selected
  const handleFile = useCallback(async (incoming: File[]) => {
    const chosen = incoming[0];
    if (!chosen) return;
    setFile(chosen);
    setCurrentPage(1);
    setTextAnnotations([]);
    setPathAnnotations([]);
    setResultBlob(null);
    setResultUrl(null);

    try {
      const buffer = await chosen.arrayBuffer();
      const doc = await openPdfDocument(buffer);
      pdfDocRef.current = doc;
      setPageCount(doc.numPages);
    } catch (e) {
      console.error('Failed to load PDF for editing:', e);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyPdfDocument(pdfDocRef.current);
    };
  }, []);

  // Render current page onto canvas
  useEffect(() => {
    let active = true;

    async function renderPage() {
      if (!pdfDocRef.current || !canvasRef.current) return;
      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.25 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport, canvas }).promise;
        if (!active) return;

        // Render drawings on top
        context.lineCap = 'round';
        context.lineJoin = 'round';

        pathAnnotations
          .filter((p) => p.pageIndex === currentPage - 1)
          .forEach((p) => {
            if (p.points.length < 2) return;
            context.strokeStyle = p.color;
            context.lineWidth = p.size;
            context.beginPath();
            context.moveTo(p.points[0].x, p.points[0].y);
            for (let i = 1; i < p.points.length; i++) {
              context.lineTo(p.points[i].x, p.points[i].y);
            }
            context.stroke();
          });
      } catch (err) {
        console.error('Error rendering page in editor:', err);
      }
    }

    renderPage();
    return () => {
      active = false;
    };
  }, [currentPage, pathAnnotations]);

  // Click on canvas to add text annotation or start drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'text') {
      const input = prompt('Enter text to add to document:', 'Note');
      if (input && input.trim()) {
        setTextAnnotations((prev) => [
          ...prev,
          {
            id: `text-${Date.now()}`,
            pageIndex: currentPage - 1,
            text: input.trim(),
            x,
            y,
            fontSize: textSize,
            color: drawColor,
          },
        ]);
      }
    } else if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'draw' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPath((prev) => [...prev, { x, y }]);

    // Live draw on canvas
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const last = currentPath[currentPath.length - 1];
      if (last) {
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && activeTool === 'draw') {
      setIsDrawing(false);
      if (currentPath.length > 1) {
        setPathAnnotations((prev) => [
          ...prev,
          {
            pageIndex: currentPage - 1,
            points: currentPath,
            color: drawColor,
            size: brushSize,
          },
        ]);
      }
      setCurrentPath([]);
    }
  };

  // Export modified PDF
  const handleExport = async () => {
    if (!file) return;
    urls.revokeAll();
    setResultBlob(null);
    setResultUrl(null);

    const res = await run(async (reporter) => {
      reporter.beginStage('Loading document for export', 0.2);
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      reporter.beginStage('Writing text annotations', 0.7);
      const pages = pdfDoc.getPages();

      textAnnotations.forEach((ann) => {
        if (ann.pageIndex < pages.length) {
          const targetPage = pages[ann.pageIndex];
          const { height } = targetPage.getSize();
          // Adjust canvas coordinates to PDF point coordinates (y inverted in PDF)
          const scaleFactor = targetPage.getWidth() / (canvasRef.current?.width || targetPage.getWidth());
          const pdfX = ann.x * scaleFactor;
          const pdfY = height - ann.y * scaleFactor;

          targetPage.drawText(ann.text, {
            x: pdfX,
            y: pdfY,
            size: ann.fontSize,
            font: helvetica,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
      });

      reporter.beginStage('Saving edited PDF', 0.95);
      const bytes = await pdfDoc.save();
      return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
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
    setTextAnnotations([]);
    setPathAnnotations([]);
    setResultBlob(null);
    setResultUrl(null);
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropZone
          onFiles={handleFile}
          accept="application/pdf"
          label="Drop PDF document here to edit"
          hint="Add text notes, draw annotations, and export your updated PDF."
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
          <p className="font-semibold">Unable to edit document</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      {file && !resultBlob && !running && (
        <div className="space-y-4">
          {/* Horizontal Top Toolbar */}
          <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTool('text')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTool === 'text'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                Add Text
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('draw')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTool === 'draw'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                Draw / Pen
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={drawColor}
                  onChange={(e) => setDrawColor(e.target.value)}
                  className="h-7 w-8 cursor-pointer rounded border border-slate-200"
                  title="Annotation color"
                />
              </div>

              {activeTool === 'draw' && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span>Size:</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-16"
                  />
                </div>
              )}

              {activeTool === 'text' && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span>Font:</span>
                  <select
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                    className="rounded border border-slate-200 px-1 py-0.5 text-xs"
                  >
                    <option value={12}>12pt</option>
                    <option value={16}>16pt</option>
                    <option value={20}>20pt</option>
                    <option value={24}>24pt</option>
                  </select>
                </div>
              )}
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage >= pageCount}
                className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="btn-primary gap-1.5 text-xs py-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Save & Download
              </button>
            </div>
          </div>

          {/* Centered Canvas Canvas Board */}
          <div
            ref={containerRef}
            className="flex min-h-[500px] items-center justify-center overflow-auto rounded-2xl border border-slate-200 bg-slate-100/70 p-6"
          >
            <div className="relative shadow-xl">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="cursor-crosshair rounded-sm bg-white"
              />

              {/* Render overlay text annotations on current page */}
              {textAnnotations
                .filter((ann) => ann.pageIndex === currentPage - 1)
                .map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      left: ann.x,
                      top: ann.y,
                      fontSize: `${ann.fontSize}px`,
                      color: ann.color,
                    }}
                    className="pointer-events-none absolute font-sans font-medium whitespace-nowrap"
                  >
                    {ann.text}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Result Card */}
      {resultBlob && resultUrl && file && (
        <div className="card space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">PDF Edited Successfully!</h2>
            <p className="mt-1 text-sm text-slate-600">
              Annotations saved ({formatBytes(resultBlob.size)}).
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => triggerDownload(resultUrl, `${file.name.replace(/\.pdf$/i, '')}-edited.pdf`)}
              className="btn-primary gap-2"
            >
              <Download className="h-4 w-4" />
              Download Edited PDF
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Edit Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
