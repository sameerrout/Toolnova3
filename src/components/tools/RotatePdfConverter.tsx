'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Trash2,
  RotateCcw,
  RotateCw,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  FileText,
  Sparkles,
  Undo2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface RotatePdfFileItem {
  file: File;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount: number;
  originalPdfBuffer: ArrayBuffer;
}

export interface RotatePdfPageItem {
  pageNumber: number; // 1-indexed
  rotation: number; // user-applied delta: 0, 90, 180, 270
  originalRotation: number; // from PDF metadata
  thumbnailDataUrl?: string;
  aspectRatio: number; // width / height
  isLoading: boolean;
}

export interface RotatedResult {
  blob: Blob;
  url: string;
  fileName: string;
  sizeFormatted: string;
  pageCount: number;
  rotatedCount: number;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export function RotatePdfConverter() {
  const [fileItem, setFileItem] = useState<RotatePdfFileItem | null>(null);
  const [pages, setPages] = useState<RotatePdfPageItem[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);

  // Upload dropzone state
  const [isDragOverUpload, setIsDragOverUpload] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Thumbnail loading progress
  const [isRenderingThumbnails, setIsRenderingThumbnails] = useState<boolean>(false);

  // Processing & result states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('Preparing...');
  const [rotatedResult, setRotatedResult] = useState<RotatedResult | null>(null);

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
      if (rotatedResult?.url) {
        URL.revokeObjectURL(rotatedResult.url);
      }
    };
  }, [rotatedResult]);

  // Format bytes helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Render thumbnails using pdfjs-dist with graceful fallback
  const renderThumbnails = async (buffer: ArrayBuffer, initialPages: RotatePdfPageItem[]) => {
    setIsRenderingThumbnails(true);
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

      for (let p = 1; p <= numPages; p++) {
        try {
          const page = await loadedPdf.getPage(p);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const targetWidth = 320;
          const scale = Math.min(1.5, targetWidth / unscaledViewport.width);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            setPages((prevPages) =>
              prevPages.map((item, idx) =>
                idx === p - 1
                  ? {
                      ...item,
                      thumbnailDataUrl: dataUrl,
                      aspectRatio: viewport.width / viewport.height,
                      isLoading: false,
                    }
                  : item
              )
            );
          }
        } catch {
          // If a single page render fails, mark it non-loading so fallback renders
          setPages((prevPages) =>
            prevPages.map((item, idx) =>
              idx === p - 1 ? { ...item, isLoading: false } : item
            )
          );
        }
      }
    } catch {
      // Fallback: mark all pages as loaded so clean vector mockup cards show
      setPages((prevPages) =>
        prevPages.map((item) => ({ ...item, isLoading: false }))
      );
    } finally {
      setIsRenderingThumbnails(false);
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
      const docPages = pdfDoc.getPages();
      const count = docPages.length;

      if (count === 0) {
        setErrorMessage('The selected PDF contains no pages.');
        return;
      }

      const initialPages: RotatePdfPageItem[] = docPages.map((p, idx) => ({
        pageNumber: idx + 1,
        rotation: 0,
        originalRotation: p.getRotation().angle || 0,
        aspectRatio: p.getWidth() / p.getHeight() || 0.707,
        isLoading: true,
      }));

      setFileItem({
        file,
        name: file.name,
        sizeBytes: file.size,
        sizeFormatted: formatFileSize(file.size),
        pageCount: count,
        originalPdfBuffer: buffer,
      });

      setPages(initialPages);
      setSelectedPageIndex(0);
      setRotatedResult(null);

      // Render actual visual page thumbnails
      renderThumbnails(buffer, initialPages);
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

  // --- ROTATION OPERATIONS ---

  // Rotate individual page right (+90 degrees)
  const handleRotatePageRight = (index: number) => {
    setPages((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const newRotation = (item.rotation + 90) % 360;
        return { ...item, rotation: newRotation };
      })
    );
    if (rotatedResult) setRotatedResult(null);
  };

  // Rotate individual page left (-90 degrees)
  const handleRotatePageLeft = (index: number) => {
    setPages((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const newRotation = (item.rotation - 90 + 360) % 360;
        return { ...item, rotation: newRotation };
      })
    );
    if (rotatedResult) setRotatedResult(null);
  };

  // Reset individual page rotation to 0
  const handleResetPage = (index: number) => {
    setPages((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, rotation: 0 } : item))
    );
    if (rotatedResult) setRotatedResult(null);
  };

  // Rotate ALL pages right (+90 degrees)
  const handleRotateAllRight = () => {
    setPages((prev) =>
      prev.map((item) => ({
        ...item,
        rotation: (item.rotation + 90) % 360,
      }))
    );
    if (rotatedResult) setRotatedResult(null);
  };

  // Rotate ALL pages left (-90 degrees)
  const handleRotateAllLeft = () => {
    setPages((prev) =>
      prev.map((item) => ({
        ...item,
        rotation: (item.rotation - 90 + 360) % 360,
      }))
    );
    if (rotatedResult) setRotatedResult(null);
  };

  // Reset ALL pages rotation to 0
  const handleResetAll = () => {
    setPages((prev) => prev.map((item) => ({ ...item, rotation: 0 })));
    if (rotatedResult) setRotatedResult(null);
  };

  // Count how many pages have non-zero rotation
  const rotatedCount = pages.filter((p) => p.rotation !== 0).length;

  // --- PDF GENERATION & EXPORT ---

  const handleDownloadRotatedPdf = async () => {
    if (!fileItem || pages.length === 0) return;

    try {
      setIsProcessing(true);
      setProcessingStatus('Rotating PDF pages...');
      trackToolEvent('rotate-pdf', 'tool_started');

      const pdfDoc = await PDFDocument.load(fileItem.originalPdfBuffer, {
        ignoreEncryption: true,
      });
      const docPages = pdfDoc.getPages();

      for (let i = 0; i < docPages.length; i++) {
        const page = docPages[i];
        const pageState = pages[i];
        if (pageState) {
          const originalAngle = pageState.originalRotation || page.getRotation().angle || 0;
          const userDelta = pageState.rotation;
          const finalAngle = (originalAngle + userDelta) % 360;
          page.setRotation(degrees(finalAngle));
        }
      }

      setProcessingStatus('Saving rotated document...');
      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = fileItem.name.replace(/\.[^/.]+$/, '').trim();
      const outputName = `${baseName}_rotated.pdf`;

      const result: RotatedResult = {
        blob,
        url,
        fileName: outputName,
        sizeFormatted: formatFileSize(blob.size),
        pageCount: docPages.length,
        rotatedCount,
      };

      setRotatedResult(result);
      trackToolEvent('rotate-pdf', 'tool_completed');

      // Trigger instant browser download
      const a = document.createElement('a');
      a.href = url;
      a.download = outputName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to rotate PDF.';
      setErrorMessage(msg);
      trackToolEvent('rotate-pdf', 'tool_failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to initial upload state
  const handleStartOver = () => {
    if (rotatedResult?.url) {
      URL.revokeObjectURL(rotatedResult.url);
    }
    setFileItem(null);
    setPages([]);
    setSelectedPageIndex(null);
    setRotatedResult(null);
    setErrorMessage(null);
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
            <span className="font-bold text-slate-900">Rotate PDF</span>
          </nav>

          {/* 2. Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <RotateCw className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Rotate PDF</h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Rotate your PDF pages left or right and preview the changes before downloading.
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

        {/* MIDDLE SECTION: Upload Area OR Workspace */}
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
            /* 2. PDF WORKSPACE (AFTER UPLOAD)                                           */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Document Summary Bar */}
              <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
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

              {/* Toolbar Above Page Previews */}
              <div className="px-4 py-2 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap text-xs">
                {/* Left: Info & Selected status */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
                  </span>

                  {selectedPageIndex !== null && pages[selectedPageIndex] && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[11px]">
                      Page {pages[selectedPageIndex].pageNumber} selected
                    </span>
                  )}

                  {rotatedCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {rotatedCount} {rotatedCount === 1 ? 'page' : 'pages'} rotated
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px] hidden sm:inline">
                      Original orientation
                    </span>
                  )}
                </div>

                {/* Right: Rotation Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Selected Page Quick Controls */}
                  {selectedPageIndex !== null && (
                    <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleRotatePageLeft(selectedPageIndex)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition flex items-center gap-1"
                        title={`Rotate Page ${pages[selectedPageIndex].pageNumber} Left`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="hidden md:inline">Rotate Page</span> Left
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotatePageRight(selectedPageIndex)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition flex items-center gap-1"
                        title={`Rotate Page ${pages[selectedPageIndex].pageNumber} Right`}
                      >
                        <RotateCw className="w-3 h-3" />
                        <span className="hidden md:inline">Rotate Page</span> Right
                      </button>
                    </div>
                  )}

                  {/* Rotate All Pages Controls */}
                  <button
                    type="button"
                    onClick={handleRotateAllLeft}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-1 shadow-2xs"
                  >
                    <RotateCcw className="w-3 h-3 text-blue-600" />
                    Rotate All Left
                  </button>

                  <button
                    type="button"
                    onClick={handleRotateAllRight}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-1 shadow-2xs"
                  >
                    <RotateCw className="w-3 h-3 text-blue-600" />
                    Rotate All Right
                  </button>

                  {/* Reset All */}
                  <button
                    type="button"
                    onClick={handleResetAll}
                    disabled={rotatedCount === 0}
                    className={`px-2 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                      rotatedCount > 0
                        ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200'
                        : 'text-slate-300 border border-slate-100 cursor-not-allowed'
                    }`}
                  >
                    <Undo2 className="w-3 h-3" />
                    Reset All
                  </button>
                </div>
              </div>

              {/* Scrollable Page Preview Grid */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {pages.map((p, index) => {
                    const isSelected = selectedPageIndex === index;
                    const isRotated = p.rotation !== 0;

                    return (
                      <div
                        key={`page-${p.pageNumber}`}
                        onClick={() => setSelectedPageIndex(index)}
                        className={`bg-white rounded-xl border p-3 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-xs relative select-none cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                            : 'border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        {/* Page Card Header */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800">
                              Page {p.pageNumber}
                            </span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {isRotated ? (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 rounded-md">
                                {p.rotation}°
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                0°
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Page Preview Thumbnail Container */}
                        <div className="h-44 sm:h-48 w-full my-2 bg-slate-100/70 rounded-lg overflow-hidden flex items-center justify-center relative p-2 border border-slate-200/50">
                          {p.thumbnailDataUrl ? (
                            /* Rendered Thumbnail with Smooth Visual CSS Rotation */
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{
                                transform: `rotate(${p.rotation}deg) scale(${
                                  p.rotation % 180 !== 0 ? 0.72 : 1
                                })`,
                                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.thumbnailDataUrl}
                                alt={`Page ${p.pageNumber} preview`}
                                className="max-h-full max-w-full object-contain shadow-xs rounded border border-slate-200/70 bg-white"
                              />
                            </div>
                          ) : p.isLoading ? (
                            /* Skeleton while generating high-res canvas */
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                              <span className="text-[11px] font-medium">Loading preview...</span>
                            </div>
                          ) : (
                            /* Fallback Vector Card when browser canvas/worker is unavailable */
                            <div
                              className="w-24 h-32 bg-white rounded shadow-xs border border-slate-300 p-2 flex flex-col justify-between"
                              style={{
                                transform: `rotate(${p.rotation}deg) scale(${
                                  p.rotation % 180 !== 0 ? 0.72 : 1
                                })`,
                                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            >
                              <div className="space-y-1">
                                <div className="h-1.5 w-12 bg-slate-200 rounded"></div>
                                <div className="h-1 w-16 bg-slate-100 rounded"></div>
                                <div className="h-1 w-14 bg-slate-100 rounded"></div>
                              </div>
                              <span className="text-center font-bold text-slate-400 text-xs">
                                {p.pageNumber}
                              </span>
                            </div>
                          )}

                          {/* Quick Orientation Compass indicator */}
                          <div className="absolute top-1.5 right-1.5 pointer-events-none">
                            <span className="text-[9px] font-bold text-slate-400 bg-white/90 backdrop-blur-xs px-1 py-0.5 rounded shadow-2xs border border-slate-200">
                              {p.rotation === 0
                                ? 'TOP'
                                : p.rotation === 90
                                ? 'RIGHT'
                                : p.rotation === 180
                                ? 'DOWN'
                                : 'LEFT'}
                            </span>
                          </div>
                        </div>

                        {/* Page Bottom Controls */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRotatePageLeft(index);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200/80 transition flex items-center justify-center gap-1 active:scale-95"
                            title="Rotate this page left"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                            <span>Left</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRotatePageRight(index);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200/80 transition flex items-center justify-center gap-1 active:scale-95"
                            title="Rotate this page right"
                          >
                            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                            <span>Right</span>
                          </button>

                          {isRotated && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetPage(index);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
                              title="Reset page rotation"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Review State & Download Bar */}
        {fileItem && (
          <div className="shrink-0 bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Review Status Indicator */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  rotatedCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {rotatedCount > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Sparkles className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                  {rotatedCount > 0 ? '✓ Changes applied' : 'Review the pages above'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {rotatedCount > 0
                    ? `${rotatedCount} of ${pages.length} pages rotated. Ready to download.`
                    : 'Click Rotate Left or Right on any page before downloading.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
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
                onClick={handleDownloadRotatedPdf}
                disabled={isProcessing}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{processingStatus}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Rotated PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
