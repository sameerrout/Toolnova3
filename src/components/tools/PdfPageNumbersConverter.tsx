'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Trash2,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  FileText,
  Sparkles,
  Undo2,
  ChevronLeft,
  ChevronRight,
  Hash,
  Sliders,
  ArrowRight,
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface PageNumbersFileItem {
  file: File;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount: number;
  originalPdfBuffer: ArrayBuffer;
}

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export type PageNumberFormat =
  | 'page-of-total'
  | 'simple-slash'
  | 'number-only'
  | 'page-number'
  | 'hyphen';

export type PageNumberColor = 'dark-gray' | 'black' | 'navy' | 'muted-gray' | 'red';

export interface PageNumberSettings {
  position: PageNumberPosition;
  format: PageNumberFormat;
  startNumber: number;
  fontSize: number; // 9, 11, 14, 18
  margin: number; // 18, 28, 42 pt
  color: PageNumberColor;
  skipFirstPage: boolean;
}

export interface NumberedResult {
  blob: Blob;
  url: string;
  fileName: string;
  sizeFormatted: string;
  pageCount: number;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const DEFAULT_SETTINGS: PageNumberSettings = {
  position: 'bottom-center',
  format: 'page-of-total',
  startNumber: 1,
  fontSize: 11,
  margin: 28,
  color: 'dark-gray',
  skipFirstPage: false,
};

const COLOR_RGB_MAP = {
  'dark-gray': rgb(0.28, 0.33, 0.41),
  black: rgb(0.06, 0.09, 0.16),
  navy: rgb(0.12, 0.23, 0.54),
  'muted-gray': rgb(0.58, 0.64, 0.72),
  red: rgb(0.86, 0.15, 0.15),
};

const COLOR_CSS_MAP = {
  'dark-gray': '#475569',
  black: '#0f172a',
  navy: '#1e3a8a',
  'muted-gray': '#94a3b8',
  red: '#dc2626',
};

const POSITION_LABELS: { id: PageNumberPosition; label: string; short: string }[] = [
  { id: 'top-left', label: 'Top Left', short: 'TL' },
  { id: 'top-center', label: 'Top Center', short: 'TC' },
  { id: 'top-right', label: 'Top Right', short: 'TR' },
  { id: 'bottom-left', label: 'Bottom Left', short: 'BL' },
  { id: 'bottom-center', label: 'Bottom Center', short: 'BC' },
  { id: 'bottom-right', label: 'Bottom Right', short: 'BR' },
];

export function PdfPageNumbersConverter() {
  const [fileItem, setFileItem] = useState<PageNumbersFileItem | null>(null);
  const [settings, setSettings] = useState<PageNumberSettings>(DEFAULT_SETTINGS);

  // Preview page navigation
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [renderedPageImages, setRenderedPageImages] = useState<string[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

  // Upload dropzone state
  const [isDragOverUpload, setIsDragOverUpload] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workflow states: 'edit' vs 'review' (applied before download)
  const [workflowStage, setWorkflowStage] = useState<'edit' | 'review'>('edit');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('Preparing...');
  const [numberedResult, setNumberedResult] = useState<NumberedResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Lock desktop body and html scrolling on desktop viewports (fits completely in one screen)
  useEffect(() => {
    const applyOverflow = () => {
      if (window.innerWidth >= 1024) {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      } else {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    };

    applyOverflow();
    window.addEventListener('resize', applyOverflow);

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.removeEventListener('resize', applyOverflow);
    };
  }, []);

  // Cleanup object URLs on unmount or new run
  useEffect(() => {
    return () => {
      if (numberedResult?.url) {
        URL.revokeObjectURL(numberedResult.url);
      }
    };
  }, [numberedResult]);

  // Format bytes helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper to format a page number label based on page index and total pages
  const getPageLabel = (
    pageIndex: number,
    totalPages: number,
    currentSettings: PageNumberSettings
  ): string => {
    if (currentSettings.skipFirstPage && pageIndex === 0) {
      return '';
    }

    const effectiveIndex = currentSettings.skipFirstPage ? pageIndex - 1 : pageIndex;
    const effectiveTotal = currentSettings.skipFirstPage ? totalPages - 1 : totalPages;
    const currentNumber = currentSettings.startNumber + effectiveIndex;
    const maxNumber = currentSettings.startNumber + effectiveTotal - 1;

    switch (currentSettings.format) {
      case 'page-of-total':
        return `Page ${currentNumber} of ${maxNumber}`;
      case 'simple-slash':
        return `${currentNumber} / ${maxNumber}`;
      case 'number-only':
        return `${currentNumber}`;
      case 'page-number':
        return `Page ${currentNumber}`;
      case 'hyphen':
        return `- ${currentNumber} -`;
      default:
        return `Page ${currentNumber} of ${maxNumber}`;
    }
  };

  // Render preview pages using pdfjs-dist
  const renderPdfPreviews = async (buffer: ArrayBuffer) => {
    setIsLoadingThumbnails(true);
    setRenderedPageImages([]);
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
      if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
          pdfjs.version || '3.11.174'
        }/pdf.worker.min.js`;
      }

      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });

      const loadedPdf = await loadingTask.promise;
      const numPages = loadedPdf.numPages;
      const pageUrls: string[] = [];

      // Render first 5 pages for rapid interactive preview
      const maxPreviewPages = Math.min(numPages, 10);
      for (let p = 1; p <= maxPreviewPages; p++) {
        try {
          const page = await loadedPdf.getPage(p);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = Math.min(1.5, 600 / unscaledViewport.width);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            pageUrls.push(canvas.toDataURL('image/jpeg', 0.85));
          }
        } catch {
          pageUrls.push('');
        }
      }
      setRenderedPageImages(pageUrls);
    } catch {
      setRenderedPageImages([]);
    } finally {
      setIsLoadingThumbnails(false);
    }
  };

  // Handle PDF file selection
  const handleSelectFile = async (incoming: FileList | File[]) => {
    setErrorMessage(null);
    const filesArray = Array.from(incoming);
    if (filesArray.length === 0) return;

    const file = filesArray[0];
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (!isPdf) {
      setErrorMessage(`"${file.name}" is not a PDF file. Please select a valid PDF.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`"${file.name}" exceeds the 100 MB file size limit.`);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      if (count === 0) {
        setErrorMessage('The selected PDF contains no pages.');
        return;
      }

      setFileItem({
        file,
        name: file.name,
        sizeBytes: file.size,
        sizeFormatted: formatFileSize(file.size),
        pageCount: count,
        originalPdfBuffer: buffer,
      });

      setCurrentPageIndex(0);
      setWorkflowStage('edit');
      setNumberedResult(null);

      // Render actual visual page previews
      renderPdfPreviews(buffer);
    } catch {
      setErrorMessage('Unable to load or parse the PDF document. It may be password-protected or corrupted.');
    }
  };

  // Drag and drop handlers for upload area
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUpload(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUpload(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUpload(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files);
    }
  };

  // Reset settings
  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  // Start over
  const handleStartOver = () => {
    if (numberedResult?.url) {
      URL.revokeObjectURL(numberedResult.url);
    }
    setFileItem(null);
    setSettings(DEFAULT_SETTINGS);
    setRenderedPageImages([]);
    setCurrentPageIndex(0);
    setWorkflowStage('edit');
    setNumberedResult(null);
    setErrorMessage(null);
  };

  // --- APPLY PAGE NUMBERS & GENERATE PDF ---
  const handleApplyPageNumbers = async () => {
    if (!fileItem) return;

    try {
      setIsProcessing(true);
      setProcessingStatus('Reading PDF document...');
      trackToolEvent('pdf-page-numbers', 'tool_started');

      const pdfDoc = await PDFDocument.load(fileItem.originalPdfBuffer, {
        ignoreEncryption: true,
      });

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      setProcessingStatus('Calculating positions and stamping page numbers...');

      const margin = settings.margin;
      const numColor = COLOR_RGB_MAP[settings.color] || COLOR_RGB_MAP['dark-gray'];

      for (let i = 0; i < totalPages; i++) {
        // Check if skipping first page
        if (settings.skipFirstPage && i === 0) {
          continue;
        }

        const page = pages[i];
        const { width, height } = page.getSize();
        const label = getPageLabel(i, totalPages, settings);

        const textWidth = font.widthOfTextAtSize(label, settings.fontSize);
        const textHeight = font.heightAtSize(settings.fontSize);

        let x = margin;
        let y = margin;

        // Calculate X coordinate
        if (settings.position.includes('center')) {
          x = (width - textWidth) / 2;
        } else if (settings.position.includes('right')) {
          x = width - margin - textWidth;
        } else {
          x = margin;
        }

        // Calculate Y coordinate
        if (settings.position.startsWith('top')) {
          y = height - margin - textHeight;
        } else {
          y = margin;
        }

        page.drawText(label, {
          x,
          y,
          size: settings.fontSize,
          font,
          color: numColor,
        });
      }

      setProcessingStatus('Saving numbered PDF...');
      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = fileItem.name.replace(/\.[^/.]+$/, '').trim();
      const outputName = `${baseName}_numbered.pdf`;

      const result: NumberedResult = {
        blob,
        url,
        fileName: outputName,
        sizeFormatted: formatFileSize(blob.size),
        pageCount: totalPages,
      };

      setNumberedResult(result);
      setWorkflowStage('review');
      trackToolEvent('pdf-page-numbers', 'tool_completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add page numbers.';
      setErrorMessage(msg);
      trackToolEvent('pdf-page-numbers', 'tool_failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger download of generated PDF
  const handleDownloadPdf = () => {
    if (!numberedResult) return;
    const a = document.createElement('a');
    a.href = numberedResult.url;
    a.download = numberedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Compute CSS alignment classes for live preview overlay
  const positionClasses = useMemo<string>(() => {
    switch (settings.position) {
      case 'top-left':
        return 'items-start justify-start text-left';
      case 'top-center':
        return 'items-start justify-center text-center';
      case 'top-right':
        return 'items-start justify-end text-right';
      case 'bottom-left':
        return 'items-end justify-start text-left';
      case 'bottom-center':
        return 'items-end justify-center text-center';
      case 'bottom-right':
        return 'items-end justify-end text-right';
      default:
        return 'items-end justify-center text-center';
    }
  }, [settings.position]);

  const currentPreviewLabel = fileItem
    ? getPageLabel(currentPageIndex, fileItem.pageCount, settings)
    : '';

  return (
    <div className="bg-[#f8fafc] w-full min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden flex flex-col font-sans">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleSelectFile(e.target.files);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleSelectFile(e.target.files);
          }
          e.target.value = '';
        }}
      />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-3 flex-1 flex flex-col justify-between min-h-0">
        {/* TOP SECTION: Breadcrumb + Header + Alert */}
        <div className="shrink-0 space-y-1.5">
          {/* 1. Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/pdf-tools" className="hover:text-blue-600 transition-colors">
              PDF Tools
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">PDF Page Numbers</span>
          </nav>

          {/* 2. Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <Hash className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    PDF Page Numbers
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Add page numbers to your PDF and customize their position and appearance before downloading.
                </p>
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">Files stay on your device</span>
              <span className="text-[11px] text-emerald-700 font-medium sm:before:content-['•_'] sm:before:mr-1">
                100% secure
              </span>
            </div>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 text-red-800 text-xs shrink-0 animate-in fade-in"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-semibold truncate">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-900 font-bold text-xs shrink-0 ml-2"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* MIDDLE SECTION: Upload Area OR Main Two-Column Workspace */}
        <div className="flex-1 flex flex-col min-h-0 my-2">
          {!fileItem ? (
            /* ========================================================================= */
            /* 1. INITIAL UPLOAD STATE                                                   */
            /* ========================================================================= */
            <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-xl mx-auto rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center bg-white shadow-xs ${
                  isDragOverUpload
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-2xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1.5">
                  Upload your PDF
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-xs">
                  Drag &amp; drop a PDF here, or click to choose from your device.
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FileText className="w-4 h-4" />
                  Choose PDF
                </button>
                <div className="flex items-center gap-3 mt-6 text-[11px] text-slate-400 font-medium">
                  <span>PDF files only</span>
                  <span>•</span>
                  <span>Single file</span>
                  <span>•</span>
                  <span>Up to 100 MB</span>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. PDF PAGE NUMBERS WORKSPACE (TWO-COLUMN BALANCED LAYOUT)                */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Document Summary Bar */}
              <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {fileItem.name}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{fileItem.sizeFormatted}</span>
                      <span>•</span>
                      <span>
                        {fileItem.pageCount} {fileItem.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Document Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replace PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition shadow-2xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove PDF
                  </button>
                </div>
              </div>

              {/* Main Workspace: Left (Preview) + Right (Settings) */}
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
                {/* ------------------------------------------------------------- */}
                {/* LEFT: LIVE PDF PREVIEW WITH REAL-TIME NUMBER OVERLAY           */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-50/60 p-3 sm:p-4">
                  {/* Page Preview Header & Pagination */}
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200/60 shrink-0 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">Live Preview</span>
                      <span className="text-[11px] text-slate-400">
                        Page {currentPageIndex + 1} of {fileItem.pageCount}
                      </span>
                    </div>

                    {fileItem.pageCount > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                          disabled={currentPageIndex === 0}
                          className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <span className="px-2 font-semibold text-[11px] text-slate-700">
                          {currentPageIndex + 1} / {fileItem.pageCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPageIndex((prev) => Math.min(fileItem.pageCount - 1, prev + 1))}
                          disabled={currentPageIndex >= fileItem.pageCount - 1}
                          className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          title="Next page"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* PDF Canvas Viewport with Live Page Number Overlay */}
                  <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                    <div className="relative max-h-full max-w-full aspect-[1/1.38] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex items-center justify-center">
                      {/* 1. Underlying Rendered PDF Page */}
                      {renderedPageImages[currentPageIndex] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={renderedPageImages[currentPageIndex]}
                          alt={`Page ${currentPageIndex + 1}`}
                          className="w-full h-full object-contain select-none pointer-events-none"
                        />
                      ) : isLoadingThumbnails ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-8">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          <span className="text-xs font-medium">Rendering PDF page...</span>
                        </div>
                      ) : (
                        /* Clean SVG Mockup Page Fallback */
                        <div className="w-full h-full p-6 flex flex-col justify-between select-none">
                          <div className="space-y-3">
                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                            <div className="h-2 w-full bg-slate-100 rounded"></div>
                            <div className="h-2 w-5/6 bg-slate-100 rounded"></div>
                            <div className="h-2 w-4/6 bg-slate-100 rounded"></div>
                            <div className="h-2 w-full bg-slate-100 rounded"></div>
                            <div className="h-2 w-3/4 bg-slate-100 rounded"></div>
                          </div>
                          <div className="text-center font-bold text-slate-300 text-xs">
                            Document Content
                          </div>
                        </div>
                      )}

                      {/* 2. REAL-TIME PAGE NUMBER OVERLAY */}
                      <div
                        className={`absolute inset-0 pointer-events-none flex transition-all duration-150 ${positionClasses}`}
                        style={{
                          padding: `${Math.max(12, Math.round(settings.margin * 0.65))}px`,
                        }}
                      >
                        {currentPreviewLabel ? (
                          <div
                            style={{
                              color: COLOR_CSS_MAP[settings.color] || '#475569',
                              fontSize: `${Math.max(11, Math.round(settings.fontSize * 0.95))}px`,
                              fontWeight: 600,
                              fontFamily: 'Helvetica, Arial, sans-serif',
                              userSelect: 'none',
                              whiteSpace: 'nowrap',
                              backgroundColor: 'rgba(255, 255, 255, 0.75)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              border: '1px solid rgba(0,0,0,0.08)',
                            }}
                          >
                            {currentPreviewLabel}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic bg-white/80 px-2 py-0.5 rounded">
                            (First page skipped)
                          </div>
                        )}
                      </div>

                      {/* Subtle Position Badge */}
                      <div className="absolute top-2 right-2 pointer-events-none">
                        <span className="text-[9px] font-bold text-slate-500 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs border border-slate-200 uppercase">
                          {settings.position.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT: PAGE NUMBER SETTINGS & CONTROLS                        */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 flex flex-col min-h-0 bg-white p-3 sm:p-5 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        Page Number Settings
                      </h2>
                      <button
                        type="button"
                        onClick={handleResetSettings}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
                        title="Reset settings to defaults"
                      >
                        <Undo2 className="w-3 h-3" />
                        Reset
                      </button>
                    </div>

                    {/* 1. Position Selector (Prioritizing bottom positions) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-700">Position</label>
                        <span className="font-semibold text-blue-600 capitalize text-[11px]">
                          {settings.position.replace('-', ' ')}
                        </span>
                      </div>

                      {/* Visual Position Cards */}
                      <div className="space-y-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {/* Top Row */}
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Header (Top)
                          </p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {POSITION_LABELS.slice(0, 3).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSettings((prev) => ({ ...prev, position: p.id }))}
                                className={`py-1.5 px-2 text-[10px] font-semibold rounded-lg border transition text-center ${
                                  settings.position === p.id
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Bottom Row (Recommended) */}
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Footer (Bottom — Recommended)
                          </p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {POSITION_LABELS.slice(3, 6).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSettings((prev) => ({ ...prev, position: p.id }))}
                                className={`py-1.5 px-2 text-[10px] font-semibold rounded-lg border transition text-center ${
                                  settings.position === p.id
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Numbering Format */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Numbering Format</label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          { id: 'page-of-total', title: 'Page 1 of 12', desc: 'Standard formal layout' },
                          { id: 'simple-slash', title: '1 / 12', desc: 'Clean compact format' },
                          { id: 'number-only', title: '1', desc: 'Minimalist single number' },
                          { id: 'page-number', title: 'Page 1', desc: 'Prefixed without total count' },
                          { id: 'hyphen', title: '- 1 -', desc: 'Decorative book style' },
                        ].map((fmt) => (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() =>
                              setSettings((prev) => ({ ...prev, format: fmt.id as PageNumberFormat }))
                            }
                            className={`p-2 rounded-xl border text-left flex items-center justify-between transition ${
                              settings.format === fmt.id
                                ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs ring-1 ring-blue-300'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-bold">{fmt.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{fmt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Starting Number & Skip First Page */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Start Numbering From</label>
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={settings.startNumber}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              startNumber: Math.max(1, parseInt(e.target.value, 10) || 1),
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-bold text-slate-800 outline-hidden transition focus:border-blue-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Cover Page</label>
                        <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer text-xs font-medium text-slate-700 hover:bg-slate-100 transition">
                          <input
                            type="checkbox"
                            checked={settings.skipFirstPage}
                            onChange={(e) =>
                              setSettings((prev) => ({ ...prev, skipFirstPage: e.target.checked }))
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>Skip first page</span>
                        </label>
                      </div>
                    </div>

                    {/* 4. Font Size & Color */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-700">Font Size</label>
                        <span className="font-semibold text-slate-500 text-[11px]">{settings.fontSize} pt</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { size: 9, label: 'Small (9)' },
                          { size: 11, label: 'Standard (11)' },
                          { size: 14, label: 'Large (14)' },
                          { size: 18, label: 'XL (18)' },
                        ].map((sz) => (
                          <button
                            key={sz.size}
                            type="button"
                            onClick={() => setSettings((prev) => ({ ...prev, fontSize: sz.size }))}
                            className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                              settings.fontSize === sz.size
                                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs ring-1 ring-blue-300'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 5. Color Selector */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-slate-700">Text Color</label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(['dark-gray', 'black', 'navy', 'muted-gray', 'red'] as PageNumberColor[]).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSettings((prev) => ({ ...prev, color: c }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize border transition flex items-center gap-1.5 ${
                              settings.color === c
                                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: COLOR_CSS_MAP[c] }}
                            ></span>
                            {c.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 6. Edge Margin */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-700">Edge Margin</label>
                        <span className="font-semibold text-slate-500 text-[11px]">
                          {settings.margin === 18 ? 'Compact (18pt)' : settings.margin === 28 ? 'Standard (28pt)' : 'Spacious (42pt)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { val: 18, label: 'Compact' },
                          { val: 28, label: 'Standard' },
                          { val: 42, label: 'Spacious' },
                        ].map((m) => (
                          <button
                            key={m.val}
                            type="button"
                            onClick={() => setSettings((prev) => ({ ...prev, margin: m.val }))}
                            className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                              settings.margin === m.val
                                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs ring-1 ring-blue-300'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Review State & Action Bar */}
        {fileItem && (
          <div className="shrink-0 bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {workflowStage === 'edit' ? (
              /* Editing Stage Bottom Bar */
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      Ready to add page numbers
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Check the live preview above, then apply page numbers to your document.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleStartOver}
                    disabled={isProcessing}
                    className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition shadow-2xs"
                  >
                    Start Over
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyPageNumbers}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{processingStatus}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Apply Page Numbers</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Review / Ready State Bottom Bar (BEFORE DOWNLOAD) */
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      ✓ Page numbers applied
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {numberedResult?.fileName} • {numberedResult?.pageCount} pages • {numberedResult?.sizeFormatted}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setWorkflowStage('edit')}
                    className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                  >
                    Edit Settings
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
