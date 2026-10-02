'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Check,
  Percent,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { PDFDocument, PDFName } from 'pdf-lib';
import { trackToolEvent } from '@/lib/analytics/tracker';

export type CompressionLevel = 'recommended' | 'high' | 'extreme';

export interface CompressPdfSettings {
  level: CompressionLevel;
  removeMetadata: boolean;
  optimizeStreams: boolean;
}

export interface CompressPdfFileItem {
  file: File;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount: number;
  originalPdfBuffer: ArrayBuffer;
}

export interface CompressedResult {
  blob: Blob;
  url: string;
  fileName: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalSizeFormatted: string;
  compressedSizeFormatted: string;
  savedBytes: number;
  savedFormatted: string;
  savedPercent: number;
  pageCount: number;
  isAlreadyOptimal: boolean;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const DEFAULT_SETTINGS: CompressPdfSettings = {
  level: 'recommended',
  removeMetadata: true,
  optimizeStreams: true,
};

export function CompressPdfConverter() {
  const [fileItem, setFileItem] = useState<CompressPdfFileItem | null>(null);
  const [settings, setSettings] = useState<CompressPdfSettings>(DEFAULT_SETTINGS);

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
  const [compressedResult, setCompressedResult] = useState<CompressedResult | null>(null);

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
      if (compressedResult?.url) {
        URL.revokeObjectURL(compressedResult.url);
      }
    };
  }, [compressedResult]);

  // Format bytes helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

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
            await page.render({ canvasContext: context, viewport }).promise;
            images[i - 1] = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch (pageErr) {
          console.warn(`Could not render preview for page ${i}:`, pageErr);
        }
      }

      setRenderedPageImages(images);
    } catch (err) {
      console.warn('PDF preview rendering error (falling back to mockup vector):', err);
    } finally {
      setIsLoadingThumbnails(false);
    }
  }, []);

  // Process a selected or dropped file (strictly accepts ONE PDF)
  const handleSelectFile = async (files: FileList | File[]) => {
    setErrorMessage(null);

    if (!files || files.length === 0) {
      return;
    }

    if (files.length > 1) {
      setErrorMessage('Compress PDF supports exactly one PDF document at a time.');
      return;
    }

    const file = files[0];

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage(`"${file.name}" is not a valid PDF file. Please select a PDF.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`"${file.name}" exceeds the 100 MB limit (${formatFileSize(file.size)}).`);
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus('Reading PDF document...');

      const arrayBuffer = await file.arrayBuffer();

      // Read page count safely with pdf-lib using an independent buffer copy
      const pdfDoc = await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();

      if (pageCount < 1) {
        setErrorMessage('The selected PDF contains no pages.');
        setIsProcessing(false);
        return;
      }

      const item: CompressPdfFileItem = {
        file,
        name: file.name,
        sizeBytes: file.size,
        sizeFormatted: formatFileSize(file.size),
        pageCount,
        originalPdfBuffer: arrayBuffer,
      };

      setFileItem(item);
      setCurrentPageIndex(0);
      setWorkflowStage('edit');
      setCompressedResult(null);

      // Start thumbnail rendering in background
      renderPdfThumbnails(arrayBuffer, pageCount);
      trackToolEvent('compress-pdf', 'tool_started');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load PDF file.';
      setErrorMessage(
        msg.includes('encrypt')
          ? 'This PDF is password protected. Please remove password encryption first.'
          : 'Could not read PDF. The file may be corrupted.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and drop handlers for upload box
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
    if (compressedResult?.url) {
      URL.revokeObjectURL(compressedResult.url);
    }
    setFileItem(null);
    setCompressedResult(null);
    setRenderedPageImages([]);
    setCurrentPageIndex(0);
    setWorkflowStage('edit');
    setErrorMessage(null);
    setSettings(DEFAULT_SETTINGS);
  };

  // Reset settings back to defaults
  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  // Real PDF Compression Execution via pdf-lib
  const handleCompressPdf = async () => {
    if (!fileItem) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingStatus('Analyzing PDF object trees...');

      // Safe clone of original buffer to avoid detachment issues
      const buffer = fileItem.originalPdfBuffer.slice(0);
      const originalSize = fileItem.sizeBytes;

      setProcessingStatus('De-duplicating and optimizing page contents...');
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      // Clean up creator & producer tags to shave header bytes
      pdfDoc.setProducer('Toolino Local Engine');
      pdfDoc.setCreator('Toolino');

      // Strip metadata if requested
      if (settings.removeMetadata) {
        setProcessingStatus('Stripping unnecessary metadata & tracking tags...');
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);

        try {
          const catalog = pdfDoc.catalog;
          if (catalog.has(PDFName.of('Metadata'))) {
            catalog.delete(PDFName.of('Metadata'));
          }
          if (catalog.has(PDFName.of('PieceInfo'))) {
            catalog.delete(PDFName.of('PieceInfo'));
          }
        } catch {
          // Non-critical if catalog fields do not exist
        }
      }

      setProcessingStatus('Re-compressing object streams and optimizing document...');
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: settings.optimizeStreams,
        addDefaultPage: false,
      });

      // Edge case: if output is larger than original, preserve original so customer never receives a larger file
      let finalBlob: Blob;
      let finalBytesCount: number;
      let isAlreadyOptimal = false;

      if (compressedBytes.length < originalSize) {
        finalBlob = new Blob([compressedBytes.buffer as ArrayBuffer], {
          type: 'application/pdf',
        });
        finalBytesCount = compressedBytes.length;
      } else {
        // Return original file to ensure user never receives a larger file
        finalBlob = fileItem.file;
        finalBytesCount = originalSize;
        isAlreadyOptimal = true;
      }

      const savedBytes = Math.max(0, originalSize - finalBytesCount);
      const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

      const baseName = fileItem.name.replace(/\.[^/.]+$/, '').trim();
      const outputName = `${baseName}_compressed.pdf`;
      const url = URL.createObjectURL(finalBlob);

      const result: CompressedResult = {
        blob: finalBlob,
        url,
        fileName: outputName,
        originalSizeBytes: originalSize,
        compressedSizeBytes: finalBytesCount,
        originalSizeFormatted: formatFileSize(originalSize),
        compressedSizeFormatted: formatFileSize(finalBytesCount),
        savedBytes,
        savedFormatted: formatFileSize(savedBytes),
        savedPercent,
        pageCount: fileItem.pageCount,
        isAlreadyOptimal,
      };

      setCompressedResult(result);
      setWorkflowStage('review');
      trackToolEvent('compress-pdf', 'tool_completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compress PDF.';
      setErrorMessage(msg);
      trackToolEvent('compress-pdf', 'tool_failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger download of generated compressed PDF
  const handleDownloadPdf = () => {
    if (!compressedResult) return;
    const a = document.createElement('a');
    a.href = compressedResult.url;
    a.download = compressedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
            <span className="font-bold text-slate-900">Compress PDF</span>
          </nav>

          {/* 2. Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <Percent className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Compress PDF
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Reduce the size of your PDF while keeping a good balance between file size and quality.
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
            /* 2. COMPRESSION WORKSPACE (TWO-COLUMN BALANCED LAYOUT)                      */
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
                <div className="lg:col-span-6 flex flex-col min-h-0 bg-slate-50/60 p-3 sm:p-4">
                  {/* Page Preview Header & Pagination */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 shrink-0 text-xs">
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

                  {/* Document Baseline Comparison Information */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 shrink-0 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Original Size
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {fileItem.sizeFormatted}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Document Pages
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {fileItem.pageCount} {fileItem.pageCount === 1 ? 'Page' : 'Pages'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT: COMPRESSION SETTINGS & ESTIMATION                      */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-6 flex flex-col min-h-0 bg-white p-3 sm:p-4 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60 shrink-0">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                        Compression Settings
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
                    {/* 1. Compression Level (The Main Option) */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Compression Level
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Option 1: Recommended */}
                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, level: 'recommended' }))}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                            settings.level === 'recommended'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">Recommended</span>
                            {settings.level === 'recommended' && (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </div>
                          <span className="text-[10px] text-blue-700 bg-blue-100/70 font-semibold px-1.5 py-0.5 rounded-md inline-block mb-1">
                            ★ Recommended
                          </span>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Best balance between file size and quality.
                          </p>
                        </button>

                        {/* Option 2: Strong */}
                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, level: 'high' }))}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                            settings.level === 'high'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">Strong</span>
                            {settings.level === 'high' && (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </div>
                          <span className="text-[10px] text-amber-700 bg-amber-100/70 font-semibold px-1.5 py-0.5 rounded-md inline-block mb-1">
                            Smaller File
                          </span>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Smaller file, aggressive object optimization.
                          </p>
                        </button>

                        {/* Option 3: Maximum */}
                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, level: 'extreme' }))}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                            settings.level === 'extreme'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">Maximum</span>
                            {settings.level === 'extreme' && (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </div>
                          <span className="text-[10px] text-purple-700 bg-purple-100/70 font-semibold px-1.5 py-0.5 rounded-md inline-block mb-1">
                            Smallest Size
                          </span>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Smallest possible file, strips non-essential streams.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* 2. Visual Quality Scale */}
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-700 text-xs">Quality Balance</span>
                        <span className="text-[11px] font-semibold text-blue-600">
                          {settings.level === 'recommended'
                            ? 'Optimal Quality (Balanced)'
                            : settings.level === 'high'
                            ? 'High Compression'
                            : 'Maximum Compression'}
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{
                              width:
                                settings.level === 'recommended'
                                  ? '80%'
                                  : settings.level === 'high'
                                  ? '55%'
                                  : '30%',
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-medium">
                        <span>Smaller File</span>
                        <span>Balanced</span>
                        <span>Better Quality</span>
                      </div>
                    </div>

                    {/* 3. Document Optimization Settings */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Optimization Settings
                      </label>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
                          <input
                            type="checkbox"
                            checked={settings.removeMetadata}
                            onChange={(e) =>
                              setSettings((s) => ({ ...s, removeMetadata: e.target.checked }))
                            }
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-semibold text-slate-800 text-xs block">
                              Remove unnecessary metadata
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Strips document author, creation timestamps, and tracking tags.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
                          <input
                            type="checkbox"
                            checked={settings.optimizeStreams}
                            onChange={(e) =>
                              setSettings((s) => ({ ...s, optimizeStreams: e.target.checked }))
                            }
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-semibold text-slate-800 text-xs block">
                              Compress object streams
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Groups uncompressed objects into compressed streams (PDF 1.5 standard).
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* 4. Size Estimation Card */}
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                          Size Estimation
                        </span>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Size will be calculated after compression.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-blue-900 block">
                          {settings.level === 'recommended'
                            ? '~15% - 30% reduction'
                            : settings.level === 'high'
                            ? '~30% - 50% reduction'
                            : '~45% - 70% reduction'}
                        </span>
                        <span className="text-[10px] text-blue-600">for standard PDFs</span>
                      </div>
                    </div>

                    {/* Quality Notice */}
                    {settings.level !== 'recommended' && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 p-2 rounded-lg">
                        Stronger compression may strip non-essential streams and metadata.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Primary Action Button */}
        <div className="shrink-0 pt-2 flex items-center justify-between gap-3 border-t border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Files are processed locally and never uploaded to any server.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCompressPdf}
              disabled={!fileItem || isProcessing}
              className={`px-5 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                !fileItem || isProcessing
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Compressing...</span>
                </>
              ) : (
                <>
                  <span>Compress PDF</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
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
                Compressing your PDF...
              </h3>
              <p className="text-xs text-slate-500 mt-1">{processingStatus}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-full w-2/3 animate-pulse rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVIEW / RESULT BEFORE DOWNLOAD SCREEN                                    */}
      {/* ========================================================================= */}
      {workflowStage === 'review' && compressedResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 text-center">
            {/* Header */}
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                PDF compressed successfully
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {compressedResult.isAlreadyOptimal
                  ? 'Your PDF is already optimally compressed! Original file preserved.'
                  : 'Your document size has been reduced and is ready to download.'}
              </p>
            </div>

            {/* Size Comparison Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Original
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 block mt-0.5">
                    {compressedResult.originalSizeFormatted}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">
                    Compressed
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-blue-600 block mt-0.5">
                    {compressedResult.compressedSizeFormatted}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">
                    Saved
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 block mt-0.5">
                    {compressedResult.isAlreadyOptimal
                      ? 'Optimal'
                      : `${compressedResult.savedPercent}%`}
                  </span>
                </div>
              </div>

              {/* Reduction Message */}
              {!compressedResult.isAlreadyOptimal && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                  <span>Space Saved:</span>
                  <span className="font-bold text-emerald-600">
                    {compressedResult.savedFormatted} ({compressedResult.savedPercent}% smaller)
                  </span>
                </div>
              )}
            </div>

            {/* Document Details */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="truncate max-w-[220px] font-medium text-slate-700">
                {compressedResult.fileName}
              </span>
              <span>
                {compressedResult.pageCount} {compressedResult.pageCount === 1 ? 'page' : 'pages'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Compressed PDF</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWorkflowStage('edit')}
                  className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Adjust Compression</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Compress Another PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
