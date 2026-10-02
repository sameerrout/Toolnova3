'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Trash2,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sliders,
  RotateCcw,
  Presentation,
  Layers,
  Sparkles,
  FileCode,
} from 'lucide-react';
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface PdfToPowerpointFileItem {
  file: File;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount: number;
  originalPdfBuffer: ArrayBuffer;
}

export type SlideLayout = '16x9' | '4x3';
export type RenderResolution = 'high' | 'standard';
export type PageSelectionMode = 'all' | 'selected';

export interface PdfToPowerpointSettings {
  slideLayout: SlideLayout;
  resolution: RenderResolution;
  pageMode: PageSelectionMode;
  selectedPagesStr: string;
  outputFileName: string;
}

export interface ConvertedPowerpointResult {
  blob: Blob;
  url: string;
  fileName: string;
  sizeBytes: number;
  sizeFormatted: string;
  slideCount: number;
  originalPageCount: number;
  slideLayout: SlideLayout;
  resolution: RenderResolution;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const DEFAULT_SETTINGS: PdfToPowerpointSettings = {
  slideLayout: '16x9',
  resolution: 'high',
  pageMode: 'all',
  selectedPagesStr: '',
  outputFileName: '',
};

/**
 * Parses user page range input such as "1-3, 5, 8-10" into a sorted array of unique valid 1-based page numbers.
 */
export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) return [];
  const pages = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          pages.add(p);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
        pages.add(pageNum);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export function PdfToPowerpointConverter() {
  const [fileItem, setFileItem] = useState<PdfToPowerpointFileItem | null>(null);
  const [settings, setSettings] = useState<PdfToPowerpointSettings>(DEFAULT_SETTINGS);

  // Preview page navigation
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [renderedPageImages, setRenderedPageImages] = useState<string[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

  // Upload dropzone state
  const [isDragOverUpload, setIsDragOverUpload] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workflow states: 'edit' vs 'review'
  const [workflowStage, setWorkflowStage] = useState<'edit' | 'review'>('edit');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('Preparing...');
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [convertedResult, setConvertedResult] = useState<ConvertedPowerpointResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Lock desktop body and html scrolling on desktop viewports to ensure single-screen fit
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
      if (convertedResult?.url) {
        URL.revokeObjectURL(convertedResult.url);
      }
    };
  }, [convertedResult]);

  // Format bytes helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Compute selected pages list
  const targetedPages = useMemo(() => {
    if (!fileItem) return [];
    if (settings.pageMode === 'all') {
      return Array.from({ length: fileItem.pageCount }, (_, i) => i + 1);
    }
    return parsePageRange(settings.selectedPagesStr, fileItem.pageCount);
  }, [fileItem, settings.pageMode, settings.selectedPagesStr]);

  const isValidPageSelection = targetedPages.length > 0;

  // Render thumbnail previews for PDF pages via pdfjs-dist
  const renderPdfThumbnails = useCallback(async (buffer: ArrayBuffer, pageCount: number) => {
    setIsLoadingThumbnails(true);
    const images: string[] = new Array(pageCount).fill('');

    try {
      const pdfjs = await import('pdfjs-dist');
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      }

      // Safe clone to prevent ArrayBuffer detachment
      const safeBufferCopy = buffer.slice(0);
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(safeBufferCopy),
        disableAutoFetch: true,
        disableStream: true,
      });

      const pdf = await loadingTask.promise;
      const pagesToRender = Math.min(pageCount, 10); // Render first 10 pages for preview

      for (let i = 1; i <= pagesToRender; i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (context) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (page.render({ canvasContext: context, viewport } as any).promise);
            images[i - 1] = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch {
          // Fallback handled gracefully
        }
      }

      setRenderedPageImages(images);
    } catch {
      // PDF.js render fallback
    } finally {
      setIsLoadingThumbnails(false);
    }
  }, []);

  // Process and load an uploaded PDF file
  const handleSelectFile = async (files: FileList | File[]) => {
    setErrorMessage(null);

    if (files.length === 0) return;
    if (files.length > 1) {
      setErrorMessage('Please upload a single PDF document to convert.');
      return;
    }

    const file = files[0];

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Invalid file format. Please upload a PDF document (.pdf).');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File size exceeds the 100 MB limit. Please select a smaller PDF.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();

      // Read page count using pdf-lib
      const { PDFDocument } = await import('pdf-lib');
      let pageCount = 0;

      try {
        const testDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: false });
        pageCount = testDoc.getPageCount();
      } catch (docErr: unknown) {
        const errStr = String(docErr);
        if (errStr.includes('encrypted') || errStr.includes('EncryptedPDFError')) {
          setErrorMessage(
            'This PDF is password-protected. Please unlock it before converting to PowerPoint.'
          );
          return;
        }
        // Fallback with ignoreEncryption
        const testDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
        pageCount = testDoc.getPageCount();
      }

      if (pageCount === 0) {
        setErrorMessage('The uploaded PDF does not contain any pages.');
        return;
      }

      const baseName = file.name.replace(/\.[^/.]+$/, '').trim();
      const defaultPptxName = `${baseName}.pptx`;

      const newItem: PdfToPowerpointFileItem = {
        file,
        name: file.name,
        sizeBytes: file.size,
        sizeFormatted: formatFileSize(file.size),
        pageCount,
        originalPdfBuffer: buffer,
      };

      setFileItem(newItem);
      setSettings((prev) => ({
        ...prev,
        outputFileName: defaultPptxName,
        selectedPagesStr: `1-${pageCount}`,
      }));
      setCurrentPageIndex(0);
      setWorkflowStage('edit');
      if (convertedResult) setConvertedResult(null);

      // Render page previews safely
      renderPdfThumbnails(buffer, pageCount);
      trackToolEvent('pdf-to-powerpoint', 'tool_opened');
    } catch (err: unknown) {
      console.error('Error loading PDF:', err);
      setErrorMessage('Unable to load or parse the PDF document. Please verify the file is not corrupted.');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files);
    }
  };

  // Reset to initial upload state
  const handleStartOver = () => {
    if (convertedResult?.url) {
      URL.revokeObjectURL(convertedResult.url);
    }
    setFileItem(null);
    setSettings(DEFAULT_SETTINGS);
    setWorkflowStage('edit');
    setConvertedResult(null);
    setRenderedPageImages([]);
    setErrorMessage(null);
    setCurrentPageIndex(0);
    setConversionProgress(0);
  };

  // Reset settings to defaults while keeping file
  const handleResetSettings = () => {
    if (!fileItem) return;
    const baseName = fileItem.name.replace(/\.[^/.]+$/, '').trim();
    setSettings({
      slideLayout: '16x9',
      resolution: 'high',
      pageMode: 'all',
      selectedPagesStr: `1-${fileItem.pageCount}`,
      outputFileName: `${baseName}.pptx`,
    });
  };

  // Primary Action: Convert PDF to PowerPoint
  const handleConvertToPowerpoint = async () => {
    if (!fileItem || targetedPages.length === 0) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setConversionProgress(5);
      setProcessingStatus('Initializing PowerPoint presentation engine...');
      trackToolEvent('pdf-to-powerpoint', 'tool_started');

      // 1. Initialize PptxGenJS
      const pptxModule = await import('pptxgenjs');
      const PptxGenJS = pptxModule.default || pptxModule;
      const pptx = new PptxGenJS();

      pptx.layout = settings.slideLayout === '4x3' ? 'LAYOUT_4x3' : 'LAYOUT_16x9';
      const deckTitle = settings.outputFileName.replace(/\.pptx$/i, '') || fileItem.name.replace(/\.[^/.]+$/, '');
      pptx.title = deckTitle;
      pptx.subject = 'Converted from PDF with Toolino';

      setConversionProgress(15);
      setProcessingStatus('Loading PDF document pages...');

      // 2. Load PDF with pdfjs
      const pdfjs = await import('pdfjs-dist');
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      }

      const safeBuffer = fileItem.originalPdfBuffer.slice(0);
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(safeBuffer),
        disableAutoFetch: true,
        disableStream: true,
      });

      const pdfDoc = await loadingTask.promise;
      const pagesToProcess = targetedPages;
      const totalSlides = pagesToProcess.length;

      const scale = settings.resolution === 'high' ? 2.0 : 1.5;

      // 3. Render each target page to a slide
      for (let idx = 0; idx < totalSlides; idx++) {
        const pageNum = pagesToProcess[idx];
        const progressPercent = Math.round(15 + ((idx + 1) / totalSlides) * 70);
        setConversionProgress(progressPercent);
        setProcessingStatus(`Rendering slide ${idx + 1} of ${totalSlides} (PDF page ${pageNum})...`);

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Unable to allocate canvas 2D rendering context.');
        }

        // Draw solid background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render PDF page onto canvas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (page.render({ canvasContext: ctx, viewport } as any).promise);

        // Extract text for presenter notes
        let notesText = '';
        try {
          const textContent = await page.getTextContent();
          const strings: string[] = [];
          for (const item of textContent.items) {
            if ('str' in item && typeof item.str === 'string' && item.str.trim()) {
              strings.push(item.str);
            }
          }
          notesText = strings.join(' ');
        } catch {
          // Non-fatal if text content extraction fails
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        // Add slide to presentation deck
        const slide = pptx.addSlide();
        slide.addImage({
          data: imgData,
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
        });

        if (notesText) {
          slide.addNotes(notesText);
        }
      }

      setConversionProgress(90);
      setProcessingStatus('Packaging PowerPoint (.pptx) file...');

      // 4. Generate PPTX blob
      const rawBlob = (await pptx.write({ outputType: 'blob' })) as Blob;
      const pptxBlob = new Blob([rawBlob], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
      const url = URL.createObjectURL(pptxBlob);

      const finalFileName = settings.outputFileName.trim().toLowerCase().endsWith('.pptx')
        ? settings.outputFileName.trim()
        : `${settings.outputFileName.trim()}.pptx`;

      const result: ConvertedPowerpointResult = {
        blob: pptxBlob,
        url,
        fileName: finalFileName,
        sizeBytes: pptxBlob.size,
        sizeFormatted: formatFileSize(pptxBlob.size),
        slideCount: totalSlides,
        originalPageCount: fileItem.pageCount,
        slideLayout: settings.slideLayout,
        resolution: settings.resolution,
      };

      setConversionProgress(100);
      setConvertedResult(result);
      setWorkflowStage('review');
      trackToolEvent('pdf-to-powerpoint', 'tool_completed');
    } catch (err: unknown) {
      console.error('PDF to PowerPoint conversion error:', err);
      trackToolEvent('pdf-to-powerpoint', 'tool_failed');
      setErrorMessage('Unable to convert PDF to PowerPoint. Please try again or choose another PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download the converted PowerPoint presentation
  const handleDownloadPowerpoint = () => {
    if (!convertedResult) return;
    const a = document.createElement('a');
    a.href = convertedResult.url;
    a.download = convertedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Return to editing mode without re-uploading
  const handleConvertAgain = () => {
    setWorkflowStage('edit');
  };

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
        {/* TOP SECTION: Breadcrumb + Header + Privacy Badge + Alert */}
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
            <span className="font-bold text-slate-900">PDF to PowerPoint</span>
          </nav>

          {/* 2. Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <Presentation className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    PDF to PowerPoint
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Convert your PDF into a PowerPoint presentation and download the result.
                </p>
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">Your PDF stays on your device</span>
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
                  Convert PDF to PowerPoint
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-xs">
                  Drag &amp; drop your PDF here, or click to choose from your device.
                </p>
                <button
                  type="button"
                  id="choose-pdf-button"
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
          ) : workflowStage === 'edit' ? (
            /* ========================================================================= */
            /* 2. MAIN WORKSPACE (TWO-COLUMN BALANCED LAYOUT)                             */
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
                {/* LEFT: LIVE PDF PREVIEW & METADATA CARD                        */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 flex flex-col min-h-0 bg-slate-50/60 p-3 sm:p-4">
                  {/* Page Preview Header & Pagination */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 shrink-0 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">Document Preview</span>
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

                  {/* PDF Canvas Viewport */}
                  <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                    <div className="relative max-h-full max-w-full aspect-[1/1.38] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex items-center justify-center">
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
                            Page {currentPageIndex + 1}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Baseline Details */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 shrink-0 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        File Size
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {fileItem.sizeFormatted}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Page Count
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {fileItem.pageCount} {fileItem.pageCount === 1 ? 'Page' : 'Pages'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT: POWERPOINT SETTINGS & CONVERSION PREVIEW               */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-7 flex flex-col min-h-0 bg-white p-3 sm:p-4 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60 shrink-0">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                        PowerPoint Settings
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetSettings}
                      className="text-[11px] font-medium text-slate-500 hover:text-blue-600 transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Settings
                    </button>
                  </div>

                  <div className="space-y-3.5 flex-1 text-xs">
                    {/* 1. CONVERSION TYPE (TRUTHFUL & ACCURATE EXPLANATION) */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1.5">
                        Conversion Type
                      </label>
                      <div className="p-3 rounded-xl border border-blue-500 bg-blue-50/50 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            Original Appearance (Visual Fidelity)
                          </span>
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                            1 Page = 1 Slide
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Each PDF page is converted into a high-fidelity PowerPoint slide to preserve exact fonts, graphics, charts, and formatting.
                        </p>
                        <p className="text-[10px] text-blue-700 mt-1.5 flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3 text-blue-600 shrink-0" />
                          Extracts searchable page text into slide speaker notes.
                        </p>
                      </div>
                    </div>

                    {/* 2. PAGES TO CONVERT */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          Pages to Convert
                        </label>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {targetedPages.length} {targetedPages.length === 1 ? 'slide' : 'slides'} will be created
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, pageMode: 'all' }))}
                          className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                            settings.pageMode === 'all'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          All Pages ({fileItem.pageCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, pageMode: 'selected' }))}
                          className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                            settings.pageMode === 'selected'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          Selected Pages
                        </button>
                      </div>

                      {settings.pageMode === 'selected' && (
                        <div className="space-y-1 animate-in fade-in-50">
                          <input
                            type="text"
                            value={settings.selectedPagesStr}
                            onChange={(e) =>
                              setSettings((s) => ({ ...s, selectedPagesStr: e.target.value }))
                            }
                            placeholder="Example: 1-3, 5, 8-10"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-800 outline-hidden transition focus:border-blue-500 focus:bg-white"
                          />
                          <p className="text-[10px] text-slate-400">
                            Enter specific pages or ranges. Example: 1-3, 5
                          </p>
                          {!isValidPageSelection && (
                            <p className="text-[11px] text-red-600 font-semibold">
                              Please specify at least one valid page number.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3. SLIDE SIZE (ASPECT RATIO) */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1.5">
                        PowerPoint Slide Size
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, slideLayout: '16x9' }))}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            settings.slideLayout === '16x9'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="text-xs">16:9 Widescreen (Modern)</div>
                          <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                            Standard for monitors and projectors
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, slideLayout: '4x3' }))}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            settings.slideLayout === '4x3'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="text-xs">4:3 Standard (Classic)</div>
                          <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                            Traditional slide deck format
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* 4. RENDER QUALITY & RESOLUTION */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1.5">
                        Slide Render Quality
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, resolution: 'high' }))}
                          className={`p-2 rounded-xl border text-left transition ${
                            settings.resolution === 'high'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="text-xs">High Resolution</div>
                          <div className="text-[10px] font-normal text-slate-500">2.0x scale (Crisp)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, resolution: 'standard' }))}
                          className={`p-2 rounded-xl border text-left transition ${
                            settings.resolution === 'standard'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="text-xs">Standard</div>
                          <div className="text-[10px] font-normal text-slate-500">1.5x scale (Faster)</div>
                        </button>
                      </div>
                    </div>

                    {/* 5. OUTPUT FILE NAME */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Output File Name
                      </label>
                      <input
                        type="text"
                        value={settings.outputFileName}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, outputFileName: e.target.value }))
                        }
                        placeholder="presentation.pptx"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-800 outline-hidden transition focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    {/* 6. CONVERSION SUMMARY CARD */}
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-600" />
                          Presentation Summary
                        </span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-600">
                          <div>
                            <span className="text-slate-400">Source:</span>{' '}
                            <span className="font-semibold text-slate-800">{fileItem.pageCount} pages</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Output:</span>{' '}
                            <span className="font-bold text-blue-700">{targetedPages.length} slides</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Aspect Ratio:</span>{' '}
                            <span className="font-medium text-slate-700">
                              {settings.slideLayout === '16x9' ? '16:9 Widescreen' : '4:3 Standard'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Resolution:</span>{' '}
                            <span className="font-medium text-slate-700">
                              {settings.resolution === 'high' ? 'High Quality' : 'Standard'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 3. SUCCESS & REVIEW STATE (STAGE === 'review')                            */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col justify-center items-center p-2 sm:p-4 min-h-0 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-lg border border-slate-200/90 text-center space-y-5 animate-in zoom-in-95">
                {/* Success Icon */}
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    PowerPoint created successfully
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your PDF presentation has been converted into a PowerPoint (.pptx) deck.
                  </p>
                </div>

                {/* File Details Card */}
                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 text-left flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Presentation className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {convertedResult?.fileName}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {convertedResult?.slideCount} {convertedResult?.slideCount === 1 ? 'slide' : 'slides'} • {convertedResult?.sizeFormatted}
                    </p>
                  </div>
                </div>

                {/* Truthful Conversion Relationship Summary */}
                <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-100/80 text-left space-y-2">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Presentation Breakdown
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Source Document</span>
                      <span className="font-bold text-slate-800">
                        {convertedResult?.originalPageCount} {convertedResult?.originalPageCount === 1 ? 'page' : 'pages'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Converted Slides</span>
                      <span className="font-bold text-blue-700">
                        {convertedResult?.slideCount} {convertedResult?.slideCount === 1 ? 'slide' : 'slides'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Slide Layout</span>
                      <span className="font-bold text-slate-800">
                        {convertedResult?.slideLayout === '16x9' ? '16:9 Widescreen' : '4:3 Standard'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Fidelity Mode</span>
                      <span className="font-bold text-emerald-700">
                        Original Appearance ✓
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 pt-1">
                    Opens seamlessly in Microsoft PowerPoint, Google Slides, Apple Keynote, and LibreOffice Impress.
                  </p>
                </div>

                {/* Primary Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    id="download-powerpoint-button"
                    onClick={handleDownloadPowerpoint}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PowerPoint</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleConvertAgain}
                      className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Convert Again</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartOver}
                      className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Convert Another PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Primary Action Button (in Edit Stage) */}
        {fileItem && workflowStage === 'edit' && (
          <div className="shrink-0 pt-2 flex items-center justify-between gap-3 border-t border-slate-200/80">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Files are processed locally and never uploaded to any server.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="convert-powerpoint-button"
                onClick={handleConvertToPowerpoint}
                disabled={!isValidPageSelection || isProcessing}
                className={`px-5 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                  !isValidPageSelection || isProcessing
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <span>Convert to PowerPoint</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PROCESSING STATE MODAL / OVERLAY                                          */}
      {/* ========================================================================= */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Converting PDF to PowerPoint...
              </h3>
              <p className="text-xs text-slate-500 mt-1">{processingStatus}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${conversionProgress}%` }}
              ></div>
            </div>
            <p className="text-[11px] font-semibold text-slate-400">
              {conversionProgress}% complete
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
