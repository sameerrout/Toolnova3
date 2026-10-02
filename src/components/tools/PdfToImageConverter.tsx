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
  ZoomIn,
  Eye,
  Archive,
  Sliders,
  X,
  FileImage,
  ImageIcon,
  Layers,
  HelpCircle,
} from 'lucide-react';
import JSZip from 'jszip';
import { trackToolEvent } from '@/lib/analytics/tracker';

export type ImageFormat = 'jpg' | 'png' | 'webp';
export type ImageQuality = 'standard' | 'high' | 'maximum';
export type ImageResolution = 'standard' | 'high' | 'print';
export type PagesSelection = 'all' | 'selected';

export interface PdfFileItem {
  file: File;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount: number;
  originalPdfBuffer: ArrayBuffer;
}

export interface ConvertedImageItem {
  pageNum: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
  sizeFormatted: string;
  fileName: string;
  format: ImageFormat;
}

export interface ConversionResult {
  images: ConvertedImageItem[];
  totalSizeBytes: number;
  totalSizeFormatted: string;
  zipBlob: Blob | null;
  zipUrl: string | null;
  zipFileName: string;
  format: ImageFormat;
  resolution: ImageResolution;
  quality: ImageQuality;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const RESOLUTION_SCALES: Record<ImageResolution, { scale: number; dpi: number; label: string; desc: string }> = {
  standard: { scale: 1.5, dpi: 150, label: 'Standard (150 DPI)', desc: 'Balanced speed & compact file size' },
  high: { scale: 2.0, dpi: 200, label: 'High (200 DPI)', desc: 'Crisp details for screens & documents' },
  print: { scale: 3.0, dpi: 300, label: 'Print Quality (300 DPI)', desc: 'Ultra-sharp fidelity for printing' },
};

const QUALITY_VALUES: Record<ImageQuality, { value: number; label: string; desc: string }> = {
  standard: { value: 0.85, label: 'Standard (85%)', desc: 'Good balance of quality & size' },
  high: { value: 0.92, label: 'High (92%)', desc: 'Better quality with fine detail' },
  maximum: { value: 0.98, label: 'Maximum (98%)', desc: 'Highest quality, larger file' },
};

export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr.trim()) return [];
  const pages = new Set<number>();
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
          pages.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pages.add(p);
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export function PdfToImageConverter() {
  const [fileItem, setFileItem] = useState<PdfFileItem | null>(null);

  // Settings
  const [format, setFormat] = useState<ImageFormat>('jpg');
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [resolution, setResolution] = useState<ImageResolution>('standard');
  const [pagesSelection, setPagesSelection] = useState<PagesSelection>('all');
  const [customPageRange, setCustomPageRange] = useState<string>('');

  // Live PDF preview state
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Workflow stages: 'settings' | 'converting' | 'review'
  const [stage, setStage] = useState<'settings' | 'review'>('settings');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [conversionStatusText, setConversionStatusText] = useState<string>('');
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState<ConvertedImageItem | null>(null);

  // UI interaction states
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const trackedUrlsRef = useRef<string[]>([]);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Lock desktop body and html scrolling on desktop viewports for clean single-screen UI
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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      trackedUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      trackedUrlsRef.current = [];
    };
  }, []);

  // Track an object URL for memory cleanup
  const trackUrl = useCallback((url: string) => {
    trackedUrlsRef.current.push(url);
    return url;
  }, []);

  // Cleanup existing result URLs
  const cleanupResultUrls = useCallback(() => {
    if (conversionResult) {
      conversionResult.images.forEach((img) => {
        try {
          URL.revokeObjectURL(img.url);
        } catch {
          // ignore
        }
      });
      if (conversionResult.zipUrl) {
        try {
          URL.revokeObjectURL(conversionResult.zipUrl);
        } catch {
          // ignore
        }
      }
    }
  }, [conversionResult]);

  // Load and render page preview from PDF buffer
  const loadPagePreview = useCallback(
    async (buffer: ArrayBuffer, pageIndex: number) => {
      setIsLoadingPreview(true);
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
        if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/pdf.worker.min.js`;
        }

        // Clone buffer to prevent detachment
        const bufferCopy = buffer.slice(0);
        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(bufferCopy),
          disableAutoFetch: true,
          disableStream: true,
          useSystemFonts: true,
        });

        const pdfDoc = await loadingTask.promise;
        const pageNum = pageIndex + 1;
        const page = await pdfDoc.getPage(pageNum);

        // Preview at standard scale
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // White background for preview
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPreviewDataUrl(dataUrl);
        }
      } catch (err) {
        console.warn('PDF page preview rendering error:', err);
      } finally {
        setIsLoadingPreview(false);
      }
    },
    []
  );

  // When active preview page changes, render preview
  useEffect(() => {
    if (fileItem) {
      loadPagePreview(fileItem.originalPdfBuffer, previewPageIndex);
    } else {
      setPreviewDataUrl(null);
    }
  }, [fileItem, previewPageIndex, loadPagePreview]);

  // Handle PDF file upload
  const handleSelectFile = async (files: FileList | File[]) => {
    setErrorMessage(null);

    if (!files || files.length === 0) {
      return;
    }

    if (files.length > 1) {
      setErrorMessage('PDF to Image supports exactly one PDF document at a time.');
      return;
    }

    const file = files[0];

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid PDF file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`This PDF is too large (${formatFileSize(file.size)}). Maximum supported size is 100 MB.`);
      return;
    }

    try {
      cleanupResultUrls();
      setConversionResult(null);
      setStage('settings');

      const buffer = await file.arrayBuffer();
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
      if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/pdf.worker.min.js`;
      }

      // Safe buffer copy to inspect
      const inspectBuffer = buffer.slice(0);
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(inspectBuffer),
        disableAutoFetch: true,
        disableStream: true,
      });

      const pdfDoc = await loadingTask.promise;
      const count = pdfDoc.numPages;

      if (count <= 0) {
        setErrorMessage('This PDF does not contain any readable pages.');
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

      setPreviewPageIndex(0);
      setCustomPageRange(`1-${count}`);
      trackToolEvent('pdf-to-image', 'tool_started');
    } catch (err: unknown) {
      console.error('Failed to parse uploaded PDF:', err);
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.toLowerCase().includes('password')) {
        setErrorMessage('This PDF is password-protected. Please unlock it before converting.');
      } else {
        setErrorMessage("We couldn't read this PDF. Please try another file.");
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files);
    }
  };

  // Reset to initial state
  const handleStartOver = () => {
    cleanupResultUrls();
    setFileItem(null);
    setConversionResult(null);
    setStage('settings');
    setErrorMessage(null);
    setPreviewPageIndex(0);
    setPreviewDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
  };

  // Adjust settings (preserves current PDF and choices)
  const handleAdjustSettings = () => {
    setStage('settings');
  };

  // Determine pages to convert
  const getSelectedPagesList = (): number[] => {
    if (!fileItem) return [];
    if (pagesSelection === 'all') {
      return Array.from({ length: fileItem.pageCount }, (_, i) => i + 1);
    }
    return parsePageRange(customPageRange, fileItem.pageCount);
  };

  const selectedPagesList = getSelectedPagesList();
  const isSelectionValid = selectedPagesList.length > 0;

  // Execute PDF to Image conversion
  const handleConvert = async () => {
    if (!fileItem || !isSelectionValid || isConverting) return;

    setIsConverting(true);
    setConversionProgress(5);
    setConversionStatusText('Initializing rendering engine...');
    setErrorMessage(null);

    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
      if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/pdf.worker.min.js`;
      }

      setConversionProgress(15);
      setConversionStatusText('Loading PDF document structure...');

      // Safe clone of ArrayBuffer
      const safeBuffer = fileItem.originalPdfBuffer.slice(0);
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(safeBuffer),
        disableAutoFetch: true,
        disableStream: true,
        useSystemFonts: true,
      });

      const pdfDoc = await loadingTask.promise;
      const targetPages = selectedPagesList;
      const totalToConvert = targetPages.length;

      const scaleConfig = RESOLUTION_SCALES[resolution];
      const scale = scaleConfig.scale;

      const mimeType =
        format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
      const ext = format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpg';
      const qualityFactor =
        format === 'png' ? undefined : QUALITY_VALUES[quality].value;

      const renderedImages: ConvertedImageItem[] = [];
      const baseCleanName = fileItem.name.replace(/\.[^/.]+$/, '').replace(/[\s_]+/g, '-');

      for (let i = 0; i < totalToConvert; i++) {
        const pageNum = targetPages[i];
        const percent = Math.round(20 + ((i + 1) / totalToConvert) * 70);
        setConversionProgress(percent);
        setConversionStatusText(`Processing page ${pageNum} (${i + 1} of ${totalToConvert})...`);

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Unable to initialize HTML5 Canvas rendering context.');
        }

        // Fill background with solid white for JPEG and clean rendering
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        const blob = await new Promise<Blob | null>((resolve) => {
          if (format === 'png') {
            canvas.toBlob((b) => resolve(b), 'image/png');
          } else if (format === 'webp') {
            canvas.toBlob((b) => resolve(b), 'image/webp', qualityFactor);
          } else {
            canvas.toBlob((b) => resolve(b), 'image/jpeg', qualityFactor);
          }
        });

        if (!blob) {
          throw new Error(`Failed to generate ${format.toUpperCase()} image for page ${pageNum}.`);
        }

        const paddedPage = String(pageNum).padStart(3, '0');
        const fileName = `${baseCleanName}_page_${paddedPage}.${ext}`;
        const objectUrl = trackUrl(URL.createObjectURL(blob));

        renderedImages.push({
          pageNum,
          blob,
          url: objectUrl,
          width: canvas.width,
          height: canvas.height,
          sizeBytes: blob.size,
          sizeFormatted: formatFileSize(blob.size),
          fileName,
          format,
        });
      }

      setConversionProgress(95);
      setConversionStatusText('Preparing download package...');

      // Calculate total size
      const totalSizeBytes = renderedImages.reduce((sum, img) => sum + img.sizeBytes, 0);

      // Create ZIP package for instant 1-click batch download
      let zipBlob: Blob | null = null;
      let zipUrl: string | null = null;
      const dateStamp = new Date().toISOString().slice(0, 10);
      const zipFileName = `${baseCleanName}-images-${dateStamp}.zip`;

      if (renderedImages.length > 1) {
        const zip = new JSZip();
        for (const img of renderedImages) {
          zip.file(img.fileName, img.blob);
        }
        zipBlob = await zip.generateAsync({
          type: 'blob',
          mimeType: 'application/zip',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        });
        zipUrl = trackUrl(URL.createObjectURL(zipBlob));
      }

      setConversionProgress(100);
      setConversionStatusText('Conversion complete!');

      // Set results and transition to review stage
      setConversionResult({
        images: renderedImages,
        totalSizeBytes,
        totalSizeFormatted: formatFileSize(totalSizeBytes),
        zipBlob,
        zipUrl,
        zipFileName,
        format,
        resolution,
        quality,
      });

      setStage('review');
      trackToolEvent('pdf-to-image', 'tool_completed');
    } catch (err: unknown) {
      console.error('PDF to Image conversion error:', err);
      trackToolEvent('pdf-to-image', 'tool_failed');
      setErrorMessage('Unable to convert PDF to images. Please try again or choose another PDF.');
    } finally {
      setIsConverting(false);
    }
  };

  // Download a single image
  const handleDownloadSingle = (image: ConvertedImageItem) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    trackToolEvent('pdf-to-image', 'tool_completed');
  };

  // Download all as ZIP (or single image if only 1)
  const handleDownloadAll = () => {
    if (!conversionResult) return;

    if (conversionResult.images.length === 1) {
      handleDownloadSingle(conversionResult.images[0]);
      return;
    }

    if (conversionResult.zipUrl) {
      const link = document.createElement('a');
      link.href = conversionResult.zipUrl;
      link.download = conversionResult.zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      trackToolEvent('pdf-to-image', 'tool_completed');
    }
  };

  return (
    <main
      className="bg-slate-50/50 flex flex-col justify-between select-none relative overflow-x-hidden min-h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
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
        accept="application/pdf,.pdf"
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
            <span className="font-bold text-slate-900">PDF to Image</span>
          </nav>

          {/* 2. Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <ImageIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    PDF to Image
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Convert PDF pages into high-quality images and download them individually or together.
                </p>
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                Files stay on your device
              </span>
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

        {/* MIDDLE SECTION: Upload Card OR Document Bar + Workspace / Review */}
        <div className="flex-1 flex flex-col justify-center min-h-0 my-1 sm:my-2">
          {!fileItem ? (
            /* 1. INITIAL UPLOAD STATE: Compact Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-xl mx-auto border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-xs ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-2xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                Convert PDF to Image
              </h2>
              <p className="text-xs text-slate-500 mb-4 max-w-xs">
                Drag &amp; drop your PDF here or click to browse.
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors pointer-events-none"
              >
                Choose PDF
              </button>
              <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-400">
                <FileText className="w-3.5 h-3.5" />
                <span>PDF files only • Up to 100 MB</span>
              </div>
            </div>
          ) : stage === 'settings' ? (
            /* 2. MAIN WORKSPACE: Document Info Bar + Two-Column Settings */
            <div className="h-full flex flex-col justify-between min-h-0 space-y-2">
              {/* Document Information Bar */}
              <div className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-1.5 sm:py-2 flex items-center justify-between gap-3 shadow-2xs shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate" title={fileItem.name}>
                      {fileItem.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {fileItem.sizeFormatted} • {fileItem.pageCount}{' '}
                      {fileItem.pageCount === 1 ? 'page' : 'pages'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Choose a different PDF"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span className="hidden sm:inline">Replace PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Remove this PDF"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>

              {/* Two-Column Conversion Workspace */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
                {/* LEFT: Live PDF Preview / Page Navigation (5 cols) */}
                <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-3 flex flex-col justify-between shadow-xs min-h-[260px] lg:min-h-0">
                  {/* Preview Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">PDF Preview</span>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 rounded-md">
                      Page {previewPageIndex + 1} of {fileItem.pageCount}
                    </span>
                  </div>

                  {/* Centered Page Canvas Display */}
                  <div className="flex-1 flex items-center justify-center p-2 min-h-0 relative overflow-hidden bg-slate-50/70 rounded-xl my-2 border border-slate-100">
                    {isLoadingPreview ? (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-xs font-medium">Loading page preview...</span>
                      </div>
                    ) : previewDataUrl ? (
                      <div className="relative max-h-full flex items-center justify-center shadow-md rounded-md overflow-hidden bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewDataUrl}
                          alt={`PDF Page ${previewPageIndex + 1}`}
                          className="max-h-[220px] lg:max-h-[300px] w-auto object-contain pointer-events-none"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400">
                        <FileText className="w-8 h-8 stroke-1" />
                        <span className="text-xs">No preview available</span>
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between pt-1 shrink-0">
                    <button
                      type="button"
                      disabled={previewPageIndex === 0 || isLoadingPreview}
                      onClick={() => setPreviewPageIndex((p) => Math.max(0, p - 1))}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <span className="text-[11px] font-medium text-slate-500">
                      {previewPageIndex + 1} / {fileItem.pageCount}
                    </span>

                    <button
                      type="button"
                      disabled={
                        previewPageIndex >= fileItem.pageCount - 1 || isLoadingPreview
                      }
                      onClick={() =>
                        setPreviewPageIndex((p) => Math.min(fileItem.pageCount - 1, p + 1))
                      }
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* RIGHT: Image Conversion Settings (7 cols) */}
                <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs min-h-0">
                  <div className="space-y-3 overflow-y-auto pr-1">
                    {/* 1. Output Format Cards */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Output Format
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* JPG */}
                        <button
                          type="button"
                          onClick={() => setFormat('jpg')}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            format === 'jpg'
                              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-2xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-extrabold text-slate-900">JPG</span>
                            {format === 'jpg' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Best for photos &amp; smaller files
                          </p>
                        </button>

                        {/* PNG */}
                        <button
                          type="button"
                          onClick={() => setFormat('png')}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            format === 'png'
                              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-2xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-extrabold text-slate-900">PNG</span>
                            {format === 'png' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Sharp quality for text &amp; graphics
                          </p>
                        </button>

                        {/* WEBP */}
                        <button
                          type="button"
                          onClick={() => setFormat('webp')}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            format === 'webp'
                              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-2xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-extrabold text-slate-900">WEBP</span>
                            {format === 'webp' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Smaller modern image format
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* 2. Image Quality (for JPG and WEBP) or Lossless (for PNG) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-900">Image Quality</label>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {format === 'png' ? 'Lossless' : QUALITY_VALUES[quality].label}
                        </span>
                      </div>

                      {format === 'png' ? (
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Lossless quality preserves 100% crisp fidelity for text and vectors.</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {(['standard', 'high', 'maximum'] as ImageQuality[]).map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => setQuality(q)}
                              className={`py-2 px-2 rounded-xl border text-center transition-all ${
                                quality === q
                                  ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-bold'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                              }`}
                            >
                              <span className="text-xs capitalize">{q}</span>
                              <span className="block text-[10px] text-slate-500 mt-0.5">
                                {QUALITY_VALUES[q].desc.split(' ')[0]} quality
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. Resolution / DPI */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-900">Resolution (DPI)</label>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {RESOLUTION_SCALES[resolution].label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['standard', 'high', 'print'] as ImageResolution[]).map((res) => (
                          <button
                            key={res}
                            type="button"
                            onClick={() => setResolution(res)}
                            className={`py-2 px-2 rounded-xl border text-center transition-all ${
                              resolution === res
                                ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-bold'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                            }`}
                          >
                            <span className="text-xs capitalize">
                              {res === 'print' ? 'Print' : res}
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              {RESOLUTION_SCALES[res].dpi} DPI
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. Pages to Convert */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Pages to Convert
                      </label>
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setPagesSelection('all')}
                          className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                            pagesSelection === 'all'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          All Pages ({fileItem.pageCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPagesSelection('selected')}
                          className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                            pagesSelection === 'selected'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          Selected Pages
                        </button>
                      </div>

                      {pagesSelection === 'selected' && (
                        <div className="space-y-1 animate-in fade-in">
                          <input
                            type="text"
                            value={customPageRange}
                            onChange={(e) => setCustomPageRange(e.target.value)}
                            placeholder="e.g. 1-3, 5, 8"
                            className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-hidden transition-colors ${
                              isSelectionValid
                                ? 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                : 'border-red-300 bg-red-50/40 text-red-900'
                            }`}
                          />
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Example: 1-3, 5, 8-10</span>
                            <span
                              className={`font-semibold ${
                                isSelectionValid ? 'text-blue-600' : 'text-red-500'
                              }`}
                            >
                              {isSelectionValid
                                ? `${selectedPagesList.length} pages selected`
                                : 'Enter valid page numbers'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Convert Button */}
                  <div className="pt-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      disabled={!isSelectionValid || isConverting}
                      onClick={handleConvert}
                      className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Converting PDF...</span>
                        </>
                      ) : (
                        <>
                          <span>Convert to Images</span>
                          <span className="text-[11px] opacity-90">
                            ({selectedPagesList.length}{' '}
                            {selectedPagesList.length === 1 ? 'page' : 'pages'})
                          </span>
                          <ArrowRight className="w-4 h-4 ml-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 3. REVIEW SCREEN (BEFORE DOWNLOAD): Success Summary + Images Grid + Lightbox */
            <div className="h-full flex flex-col justify-between min-h-0 space-y-2">
              {/* Success Result Summary Header */}
              <div className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        ✓ PDF converted successfully
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full">
                        {conversionResult?.images.length}{' '}
                        {conversionResult?.images.length === 1 ? 'image' : 'images'} created
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Format: {conversionResult?.format.toUpperCase()} • Total Size:{' '}
                      {conversionResult?.totalSizeFormatted}
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadAll}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    title={
                      (conversionResult?.images.length ?? 0) > 1
                        ? 'Download all images in a single ZIP file'
                        : 'Download image'
                    }
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {(conversionResult?.images.length ?? 0) > 1
                        ? 'Download All as ZIP'
                        : 'Download Image'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAdjustSettings}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    title="Change image format, quality, or resolution"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Adjust Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    title="Convert another PDF document"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Convert Another</span>
                  </button>
                </div>
              </div>

              {/* Converted Images Responsive Gallery Grid */}
              <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs min-h-0 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Generated Images ({conversionResult?.images.length})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Click any thumbnail to preview full resolution
                  </span>
                </div>

                {/* Scrollable Gallery */}
                <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {conversionResult?.images.map((img) => (
                      <div
                        key={img.pageNum}
                        className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between hover:border-blue-400 hover:shadow-xs transition-all group"
                      >
                        {/* Thumbnail Container */}
                        <div
                          onClick={() => setLightboxImage(img)}
                          className="w-full h-32 sm:h-36 bg-white rounded-lg border border-slate-200/80 flex items-center justify-center overflow-hidden cursor-pointer relative mb-2 shadow-2xs group-hover:border-blue-300"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={`Converted Page ${img.pageNum}`}
                            className="max-h-full max-w-full object-contain pointer-events-none group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="p-1.5 bg-white/90 rounded-full text-blue-600 shadow-xs">
                              <ZoomIn className="w-4 h-4" />
                            </span>
                          </div>
                        </div>

                        {/* Image Metadata */}
                        <div className="space-y-1 mb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              Page {img.pageNum}
                            </span>
                            <span className="px-1.5 py-0.2 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded uppercase">
                              {img.format}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>
                              {img.width} × {img.height}
                            </span>
                            <span className="font-medium text-slate-700">{img.sizeFormatted}</span>
                          </div>
                        </div>

                        {/* Individual Download Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(img)}
                          className="w-full py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3 h-3 text-slate-500 group-hover:text-blue-600" />
                          <span>Download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Bar in Review Screen */}
                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
                  <div className="text-[11px] text-slate-500">
                    Showing {conversionResult?.images.length}{' '}
                    {conversionResult?.images.length === 1 ? 'image' : 'images'} • Ready to
                    download
                  </div>
                  {(conversionResult?.images.length ?? 0) > 1 && (
                    <button
                      type="button"
                      onClick={handleDownloadAll}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download All as ZIP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Guarantee & Processing Modal */}
        <div className="shrink-0 pt-1 pb-1 flex items-center justify-center text-[11px] text-slate-500 gap-4">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>High-Fidelity Client-Side Rendering</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Zero server upload — 100% private</span>
          </div>
        </div>
      </div>

      {/* Real-time Conversion Progress Modal Overlay */}
      {isConverting && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Converting your PDF...</h3>
            <p className="text-xs text-slate-500 mb-4">{conversionStatusText}</p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${conversionProgress}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-blue-600">{conversionProgress}%</span>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95"
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  Page {lightboxImage.pageNum} Preview
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded uppercase">
                  {lightboxImage.format}
                </span>
                <span className="text-xs text-slate-500">
                  • {lightboxImage.width} × {lightboxImage.height} • {lightboxImage.sizeFormatted}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image View */}
            <div className="p-4 flex-1 flex items-center justify-center min-h-[300px] max-h-[65vh] bg-slate-100 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage.url}
                alt={`Page ${lightboxImage.pageNum}`}
                className="max-h-[60vh] max-w-full object-contain rounded-md shadow-lg bg-white"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-white">
              <span className="text-xs text-slate-500 truncate max-w-xs" title={lightboxImage.fileName}>
                {lightboxImage.fileName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSingle(lightboxImage)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
