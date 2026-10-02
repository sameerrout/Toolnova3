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
  Image as ImageIcon,
  Type,
  Sliders,
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface WatermarkPdfFileItem {
  file: File;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount: number;
  originalPdfBuffer: ArrayBuffer;
}

export type WatermarkType = 'text' | 'image';
export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type WatermarkColor = 'gray' | 'red' | 'blue' | 'black' | 'emerald';

export interface WatermarkSettings {
  type: WatermarkType;
  text: string;
  fontSize: number; // 24 to 80
  opacity: number; // 0.1 to 1.0
  rotation: number; // -45, 0, 45, 90
  color: WatermarkColor;
  position: WatermarkPosition;
  applyToAllPages: boolean;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  imageScale: number; // 20 to 80 percent of page width
}

export interface WatermarkedResult {
  blob: Blob;
  url: string;
  fileName: string;
  sizeFormatted: string;
  pageCount: number;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const DEFAULT_SETTINGS: WatermarkSettings = {
  type: 'text',
  text: 'CONFIDENTIAL',
  fontSize: 48,
  opacity: 0.3,
  rotation: 45,
  color: 'gray',
  position: 'center',
  applyToAllPages: true,
  imageFile: null,
  imagePreviewUrl: null,
  imageScale: 40,
};

const COLOR_RGB_MAP = {
  gray: rgb(0.5, 0.5, 0.5),
  red: rgb(0.85, 0.15, 0.15),
  blue: rgb(0.15, 0.35, 0.85),
  black: rgb(0.1, 0.1, 0.1),
  emerald: rgb(0.1, 0.65, 0.35),
};

const COLOR_CSS_MAP = {
  gray: '#64748b',
  red: '#ef4444',
  blue: '#2563eb',
  black: '#0f172a',
  emerald: '#059669',
};

const POSITION_LABELS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'center-left', label: 'Center Left' },
  { id: 'center', label: 'Center' },
  { id: 'center-right', label: 'Center Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

export function WatermarkPdfConverter() {
  const [fileItem, setFileItem] = useState<WatermarkPdfFileItem | null>(null);
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_SETTINGS);

  // Preview page navigation
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [renderedPageImages, setRenderedPageImages] = useState<string[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

  // Upload dropzone state
  const [isDragOverUpload, setIsDragOverUpload] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workflow states: 'edit' (configuring watermark) vs 'review' (watermark applied)
  const [workflowStage, setWorkflowStage] = useState<'edit' | 'review'>('edit');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('Preparing...');
  const [watermarkedResult, setWatermarkedResult] = useState<WatermarkedResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      if (watermarkedResult?.url) {
        URL.revokeObjectURL(watermarkedResult.url);
      }
      if (settings.imagePreviewUrl) {
        URL.revokeObjectURL(settings.imagePreviewUrl);
      }
    };
  }, [watermarkedResult, settings.imagePreviewUrl]);

  // Format bytes helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
          // If a page render fails, push empty string for fallback
          pageUrls.push('');
        }
      }
      setRenderedPageImages(pageUrls);
    } catch {
      // Fallback empty list triggers vector page representation
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
      setWatermarkedResult(null);

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

  // Handle watermark image selection
  const handleSelectWatermarkImage = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (settings.imagePreviewUrl) {
      URL.revokeObjectURL(settings.imagePreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSettings((prev) => ({
      ...prev,
      type: 'image',
      imageFile: file,
      imagePreviewUrl: previewUrl,
    }));
    setErrorMessage(null);
  };

  // Remove watermark image
  const handleRemoveWatermarkImage = () => {
    if (settings.imagePreviewUrl) {
      URL.revokeObjectURL(settings.imagePreviewUrl);
    }
    setSettings((prev) => ({
      ...prev,
      imageFile: null,
      imagePreviewUrl: null,
      type: 'text',
    }));
  };

  // Reset settings
  const handleResetSettings = () => {
    if (settings.imagePreviewUrl) {
      URL.revokeObjectURL(settings.imagePreviewUrl);
    }
    setSettings(DEFAULT_SETTINGS);
  };

  // Start over (clears everything)
  const handleStartOver = () => {
    if (watermarkedResult?.url) {
      URL.revokeObjectURL(watermarkedResult.url);
    }
    if (settings.imagePreviewUrl) {
      URL.revokeObjectURL(settings.imagePreviewUrl);
    }
    setFileItem(null);
    setSettings(DEFAULT_SETTINGS);
    setRenderedPageImages([]);
    setCurrentPageIndex(0);
    setWorkflowStage('edit');
    setWatermarkedResult(null);
    setErrorMessage(null);
  };

  // Validation
  const isValidConfig = useMemo<boolean>(() => {
    if (!fileItem) return false;
    if (settings.type === 'text') {
      return settings.text.trim().length > 0;
    }
    if (settings.type === 'image') {
      return settings.imageFile !== null;
    }
    return false;
  }, [fileItem, settings]);

  // Convert image to PNG array buffer if needed for pdf-lib
  const getImageBytesAsPngOrJpg = async (
    file: File
  ): Promise<{ bytes: Uint8Array; format: 'png' | 'jpg' }> => {
    const isJpg = file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

    if (isPng || isJpg) {
      const buf = await file.arrayBuffer();
      return { bytes: new Uint8Array(buf), format: isPng ? 'png' : 'jpg' };
    }

    // Convert other formats (SVG, WebP, GIF) to PNG via canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 400;
        canvas.height = img.naturalHeight || 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image to PNG'));
            return;
          }
          const buf = await blob.arrayBuffer();
          resolve({ bytes: new Uint8Array(buf), format: 'png' });
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = URL.createObjectURL(file);
    });
  };

  // --- APPLY WATERMARK & GENERATE PDF ---
  const handleApplyWatermark = async () => {
    if (!fileItem || !isValidConfig) return;

    try {
      setIsProcessing(true);
      setProcessingStatus('Reading PDF document...');
      trackToolEvent('watermark-pdf', 'tool_started');

      const pdfDoc = await PDFDocument.load(fileItem.originalPdfBuffer, {
        ignoreEncryption: true,
      });

      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      setProcessingStatus('Embedding watermark assets...');

      let font = null;
      let embeddedImage = null;

      if (settings.type === 'text') {
        font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      } else if (settings.type === 'image' && settings.imageFile) {
        const { bytes, format } = await getImageBytesAsPngOrJpg(settings.imageFile);
        if (format === 'png') {
          embeddedImage = await pdfDoc.embedPng(bytes);
        } else {
          embeddedImage = await pdfDoc.embedJpg(bytes);
        }
      }

      setProcessingStatus('Stamping watermark across pages...');

      const targetPageIndices = settings.applyToAllPages
        ? pages.map((_, idx) => idx)
        : [currentPageIndex];

      for (const idx of targetPageIndices) {
        const page = pages[idx];
        const { width, height } = page.getSize();
        const padding = 40;

        if (settings.type === 'text' && font) {
          const watermarkColor = COLOR_RGB_MAP[settings.color] || COLOR_RGB_MAP.gray;
          const text = settings.text.trim();
          const textWidth = font.widthOfTextAtSize(text, settings.fontSize);
          const textHeight = font.heightAtSize(settings.fontSize);

          // Calculate X & Y for 9-grid position
          let x = (width - textWidth) / 2;
          let y = (height - textHeight) / 2;

          if (settings.position.includes('left')) {
            x = padding;
          } else if (settings.position.includes('right')) {
            x = width - textWidth - padding;
          }

          if (settings.position.includes('top')) {
            y = height - textHeight - padding;
          } else if (settings.position.includes('bottom')) {
            y = padding;
          }

          page.drawText(text, {
            x,
            y,
            size: settings.fontSize,
            font,
            color: watermarkColor,
            opacity: settings.opacity,
            rotate: degrees(settings.rotation),
          });
        } else if (settings.type === 'image' && embeddedImage) {
          const maxDim = (width * settings.imageScale) / 100;
          const imgDims = embeddedImage.scaleToFit(maxDim, maxDim);

          let x = (width - imgDims.width) / 2;
          let y = (height - imgDims.height) / 2;

          if (settings.position.includes('left')) {
            x = padding;
          } else if (settings.position.includes('right')) {
            x = width - imgDims.width - padding;
          }

          if (settings.position.includes('top')) {
            y = height - imgDims.height - padding;
          } else if (settings.position.includes('bottom')) {
            y = padding;
          }

          page.drawImage(embeddedImage, {
            x,
            y,
            width: imgDims.width,
            height: imgDims.height,
            opacity: settings.opacity,
            rotate: degrees(settings.rotation),
          });
        }
      }

      setProcessingStatus('Saving watermarked PDF...');
      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = fileItem.name.replace(/\.[^/.]+$/, '').trim();
      const outputName = `${baseName}_watermarked.pdf`;

      const result: WatermarkedResult = {
        blob,
        url,
        fileName: outputName,
        sizeFormatted: formatFileSize(blob.size),
        pageCount: totalPages,
      };

      setWatermarkedResult(result);
      setWorkflowStage('review');
      trackToolEvent('watermark-pdf', 'tool_completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply watermark.';
      setErrorMessage(msg);
      trackToolEvent('watermark-pdf', 'tool_failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger download of generated PDF
  const handleDownloadPdf = () => {
    if (!watermarkedResult) return;
    const a = document.createElement('a');
    a.href = watermarkedResult.url;
    a.download = watermarkedResult.fileName;
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
      case 'center-left':
        return 'items-center justify-start text-left';
      case 'center':
        return 'items-center justify-center text-center';
      case 'center-right':
        return 'items-center justify-end text-right';
      case 'bottom-left':
        return 'items-end justify-start text-left';
      case 'bottom-center':
        return 'items-end justify-center text-center';
      case 'bottom-right':
        return 'items-end justify-end text-right';
      default:
        return 'items-center justify-center text-center';
    }
  }, [settings.position]);

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
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleSelectWatermarkImage(e.target.files);
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
            <span className="font-bold text-slate-900">Watermark PDF</span>
          </nav>

          {/* 2. Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <Sliders className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Watermark PDF</h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Add a text or image watermark to your PDF and preview the result before downloading.
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

        {/* MIDDLE SECTION: Upload Area OR Main Two-Section Workspace */}
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
            /* 2. WATERMARK WORKSPACE (TWO-SECTION BALANCED LAYOUT)                       */
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

              {/* Main Workspace: Left (Preview) + Right (Controls) */}
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
                {/* ------------------------------------------------------------- */}
                {/* LEFT: LIVE PDF PREVIEW WITH REAL-TIME WATERMARK OVERLAY        */}
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

                  {/* PDF Canvas Viewport with Live Watermark Overlay */}
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
                            Page {currentPageIndex + 1}
                          </div>
                        </div>
                      )}

                      {/* 2. REAL-TIME WATERMARK OVERLAY */}
                      <div
                        className={`absolute inset-0 pointer-events-none flex p-6 transition-all duration-150 ${positionClasses}`}
                      >
                        {settings.type === 'text' && settings.text.trim() ? (
                          <div
                            style={{
                              transform: `rotate(${settings.rotation}deg)`,
                              opacity: settings.opacity,
                              color: COLOR_CSS_MAP[settings.color] || '#64748b',
                              fontSize: `${Math.max(14, Math.round(settings.fontSize * 0.42))}px`,
                              fontWeight: 800,
                              letterSpacing: '0.05em',
                              userSelect: 'none',
                              whiteSpace: 'nowrap',
                              textShadow: '0 0 1px rgba(0,0,0,0.15)',
                              transition: 'transform 0.2s ease, opacity 0.15s ease',
                            }}
                          >
                            {settings.text.trim()}
                          </div>
                        ) : settings.type === 'image' && settings.imagePreviewUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={settings.imagePreviewUrl}
                            alt="Watermark Overlay"
                            style={{
                              transform: `rotate(${settings.rotation}deg)`,
                              opacity: settings.opacity,
                              maxWidth: `${settings.imageScale}%`,
                              maxHeight: `${settings.imageScale}%`,
                              objectFit: 'contain',
                              userSelect: 'none',
                              transition: 'transform 0.2s ease, opacity 0.15s ease',
                            }}
                          />
                        ) : null}
                      </div>

                      {/* Subtle Badge */}
                      <div className="absolute bottom-2 right-2 pointer-events-none">
                        <span className="text-[9px] font-bold text-slate-400 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs border border-slate-200">
                          {settings.rotation}° • {Math.round(settings.opacity * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT: WATERMARK SETTINGS & CONTROLS                          */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 flex flex-col min-h-0 bg-white p-3 sm:p-5 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        Watermark Settings
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

                    {/* 1. Watermark Type: Text vs Image */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Watermark Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSettings((prev) => ({ ...prev, type: 'text' }))}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            settings.type === 'text'
                              ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs ring-1 ring-blue-300'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Type className="w-3.5 h-3.5" />
                          Text Watermark
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!settings.imageFile) {
                              imageInputRef.current?.click();
                            } else {
                              setSettings((prev) => ({ ...prev, type: 'image' }));
                            }
                          }}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            settings.type === 'image'
                              ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs ring-1 ring-blue-300'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Image Watermark
                        </button>
                      </div>
                    </div>

                    {/* 2. Text Input OR Image Upload */}
                    {settings.type === 'text' ? (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">Watermark Text</label>
                        <input
                          type="text"
                          value={settings.text}
                          onChange={(e) => setSettings((prev) => ({ ...prev, text: e.target.value }))}
                          placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-hidden transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                        />

                        {/* Quick Text Preset Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'COPY', 'DO NOT COPY'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setSettings((prev) => ({ ...prev, text: preset }))}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition ${
                                settings.text === preset
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-slate-100 text-slate-600 border-slate-200/80 hover:bg-slate-200'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        {/* Text Color Selector */}
                        <div className="pt-1 space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Text Color</label>
                          <div className="flex items-center gap-2">
                            {(['gray', 'red', 'blue', 'black', 'emerald'] as WatermarkColor[]).map((c) => (
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
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Font Size Selector */}
                        <div className="pt-1 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <label className="font-bold text-slate-700">Font Size</label>
                            <span className="font-semibold text-slate-500 text-[11px]">{settings.fontSize} pt</span>
                          </div>
                          <input
                            type="range"
                            min="24"
                            max="80"
                            step="4"
                            value={settings.fontSize}
                            onChange={(e) =>
                              setSettings((prev) => ({ ...prev, fontSize: parseInt(e.target.value, 10) }))
                            }
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Image Watermark Settings */
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">Watermark Image</label>
                        {settings.imageFile ? (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {settings.imagePreviewUrl && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={settings.imagePreviewUrl}
                                  alt="Preview"
                                  className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0 bg-white"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {settings.imageFile.name}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {formatFileSize(settings.imageFile.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveWatermarkImage}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition"
                                title="Remove Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-slate-50 transition flex flex-col items-center justify-center gap-1 text-slate-600"
                          >
                            <ImageIcon className="w-5 h-5 text-blue-600" />
                            <span className="text-xs font-bold">Choose Watermark Image</span>
                            <span className="text-[10px] text-slate-400">PNG, JPG, SVG, WebP</span>
                          </button>
                        )}

                        {/* Image Size Scale */}
                        {settings.imageFile && (
                          <div className="pt-1 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <label className="font-bold text-slate-700">Image Scale</label>
                              <span className="font-semibold text-slate-500 text-[11px]">{settings.imageScale}%</span>
                            </div>
                            <input
                              type="range"
                              min="15"
                              max="85"
                              step="5"
                              value={settings.imageScale}
                              onChange={(e) =>
                                setSettings((prev) => ({ ...prev, imageScale: parseInt(e.target.value, 10) }))
                              }
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Position (Visual 9-Grid Selector) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-700">Position</label>
                        <span className="font-semibold text-blue-600 capitalize text-[11px]">
                          {settings.position.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {POSITION_LABELS.map((p) => (
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

                    {/* 4. Opacity Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-700">Opacity</label>
                        <span className="font-semibold text-slate-600 text-[11px]">
                          {Math.round(settings.opacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={settings.opacity}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, opacity: parseFloat(e.target.value) }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Light (10%)</span>
                        <span>Medium (50%)</span>
                        <span>Solid (100%)</span>
                      </div>
                    </div>

                    {/* 5. Rotation Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Rotation</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { deg: 0, label: '0°' },
                          { deg: 45, label: '45°' },
                          { deg: 90, label: '90°' },
                          { deg: -45, label: '-45°' },
                        ].map((rot) => (
                          <button
                            key={rot.deg}
                            type="button"
                            onClick={() => setSettings((prev) => ({ ...prev, rotation: rot.deg }))}
                            className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                              settings.rotation === rot.deg
                                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs ring-1 ring-blue-300'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {rot.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 6. Apply to All Pages vs Current Page */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Apply Watermark To</label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer text-xs font-medium text-slate-700">
                          <input
                            type="radio"
                            name="pageScope"
                            checked={settings.applyToAllPages}
                            onChange={() => setSettings((prev) => ({ ...prev, applyToAllPages: true }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          All {fileItem.pageCount} Pages
                        </label>
                        <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer text-xs font-medium text-slate-700">
                          <input
                            type="radio"
                            name="pageScope"
                            checked={!settings.applyToAllPages}
                            onChange={() => setSettings((prev) => ({ ...prev, applyToAllPages: false }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          Page {currentPageIndex + 1} Only
                        </label>
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
                      Configure your watermark
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isValidConfig
                        ? 'Check the live preview above, then apply your watermark.'
                        : settings.type === 'text'
                        ? 'Enter watermark text to continue.'
                        : 'Choose an image to continue.'}
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
                    onClick={handleApplyWatermark}
                    disabled={isProcessing || !isValidConfig}
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
                        <span>Apply Watermark</span>
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
                      ✓ Watermark applied
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {watermarkedResult?.fileName} • {watermarkedResult?.pageCount} pages • {watermarkedResult?.sizeFormatted}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setWorkflowStage('edit')}
                    className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                  >
                    Edit Watermark
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
