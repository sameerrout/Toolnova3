'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileImage,
  Trash2,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Plus,
  Loader2,
  Archive,
  Lock,
  Maximize2,
  RotateCcw,
  Eye,
  Percent,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  compressSingleImage,
  formatBytes,
  isAvifEncodingSupported,
  CompressionOptions,
  CompressedImageResult,
} from '@/core/engine/imageCompressorEngine';
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface ImageItemState {
  id: string;
  file: File;
  originalSizeFormatted: string;
  originalWidth: number;
  originalHeight: number;
  previewUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: CompressedImageResult;
  errorMessage?: string;
}

export type PresetLevel = 'recommended' | 'high' | 'extreme' | 'target';

const MAX_FILES = 20;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function ImageCompressor() {
  const [items, setItems] = useState<ImageItemState[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workflow Stage: 'upload' (empty) | 'edit' (workspace) | 'review' (results screen)
  const [workflowStage, setWorkflowStage] = useState<'upload' | 'edit' | 'review'>('upload');
  const [previewTab, setPreviewTab] = useState<'original' | 'compressed'>('original');

  // Compression options
  const [presetLevel, setPresetLevel] = useState<PresetLevel>('recommended');
  const [quality, setQuality] = useState<number>(0.75); // 75% default for recommended
  const [mode, setMode] = useState<'quality' | 'target-size'>('quality');
  const [targetSizeKb, setTargetSizeKb] = useState<number>(200);
  const [targetUnit, setTargetUnit] = useState<'kb' | 'mb'>('kb');
  const [outputFormat, setOutputFormat] = useState<string>('original');
  const [maxDimension, setMaxDimension] = useState<number>(0); // 0 = no resize
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('Preparing...');
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const avifSupported = typeof window !== 'undefined' ? isAvifEncodingSupported() : false;

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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        if (item.result?.compressedPreviewUrl) {
          URL.revokeObjectURL(item.result.compressedPreviewUrl);
        }
      });
    };
  }, [items]);

  // Construct current options payload
  const getCurrentOptions = useCallback((): CompressionOptions => {
    let targetSizeBytes: number | undefined;
    if (mode === 'target-size') {
      targetSizeBytes = targetUnit === 'mb' ? targetSizeKb * 1024 * 1024 : targetSizeKb * 1024;
    }

    return {
      quality,
      mode,
      targetSizeBytes,
      outputFormat: outputFormat as any,
      maxDimension: maxDimension > 0 ? maxDimension : undefined,
    };
  }, [quality, mode, targetSizeKb, targetUnit, outputFormat, maxDimension]);

  // Helper to read image dimensions
  const readImageDimensions = (file: File): Promise<{ width: number; height: number; previewUrl: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const previewUrl = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight, previewUrl });
      };
      img.onerror = () => {
        URL.revokeObjectURL(previewUrl);
        reject(new Error(`Failed to load "${file.name}". Invalid image.`));
      };
      img.src = previewUrl;
    });
  };

  // Add files to list (accepts 1 or more files seamlessly)
  const handleAddFiles = async (fileList: FileList | File[]) => {
    setErrorMessage(null);
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

    const newItems: ImageItemState[] = [];
    let rejectedCount = 0;

    for (const file of filesArray) {
      if (items.length + newItems.length >= MAX_FILES) {
        setErrorMessage(`Maximum limit of ${MAX_FILES} images reached.`);
        break;
      }

      const lowerName = file.name.toLowerCase();
      const isImage = file.type.startsWith('image/') || validExtensions.some((ext) => lowerName.endsWith(ext));

      if (!isImage) {
        rejectedCount++;
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`"${file.name}" exceeds the 25 MB limit.`);
        continue;
      }

      try {
        const { width, height, previewUrl } = await readImageDimensions(file);
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          file,
          originalSizeFormatted: formatBytes(file.size),
          originalWidth: width,
          originalHeight: height,
          previewUrl,
          status: 'pending',
        });
      } catch (err) {
        console.warn(`Could not read dimensions for ${file.name}:`, err);
      }
    }

    if (rejectedCount > 0) {
      setErrorMessage(`${rejectedCount} unsupported file(s) were skipped. Please select JPG, PNG, or WebP.`);
    }

    if (newItems.length > 0) {
      setItems((prev) => {
        const updated = [...prev, ...newItems];
        if (!selectedItemId || !prev.find((p) => p.id === selectedItemId)) {
          setSelectedItemId(newItems[0].id);
        }
        return updated;
      });
      setWorkflowStage('edit');
      trackToolEvent('image-compressor', 'tool_started');
    }
  };

  // Remove single image
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.result?.compressedPreviewUrl) {
          URL.revokeObjectURL(target.result.compressedPreviewUrl);
        }
      }
      const filtered = prev.filter((it) => it.id !== id);
      if (selectedItemId === id) {
        setSelectedItemId(filtered.length > 0 ? filtered[0].id : null);
      }
      if (filtered.length === 0) {
        setWorkflowStage('upload');
      }
      return filtered;
    });
  };

  // Clear all images
  const handleStartOver = () => {
    items.forEach((it) => {
      URL.revokeObjectURL(it.previewUrl);
      if (it.result?.compressedPreviewUrl) {
        URL.revokeObjectURL(it.result.compressedPreviewUrl);
      }
    });
    setItems([]);
    setSelectedItemId(null);
    setWorkflowStage('upload');
    setErrorMessage(null);
    setPresetLevel('recommended');
    setQuality(0.75);
    setMode('quality');
    setOutputFormat('original');
    setMaxDimension(0);
  };

  // Preset level switcher
  const handlePresetSelect = (lvl: PresetLevel) => {
    setPresetLevel(lvl);
    if (lvl === 'recommended') {
      setMode('quality');
      setQuality(0.75);
    } else if (lvl === 'high') {
      setMode('quality');
      setQuality(0.55);
    } else if (lvl === 'extreme') {
      setMode('quality');
      setQuality(0.35);
    } else if (lvl === 'target') {
      setMode('target-size');
    }
  };

  // Reset settings back to defaults
  const handleResetSettings = () => {
    setPresetLevel('recommended');
    setQuality(0.75);
    setMode('quality');
    setOutputFormat('original');
    setMaxDimension(0);
    setTargetSizeKb(200);
    setTargetUnit('kb');
  };

  // Real Image Compression Execution across all images
  const handleCompressAll = async () => {
    if (items.length === 0 || isProcessing) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProcessedCount(0);
      setProcessingStatus(`Compressing 1 of ${items.length} images...`);

      const opts = getCurrentOptions();
      const updatedItems: ImageItemState[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setProcessedCount(i + 1);
        setProcessingStatus(`Compressing ${i + 1} of ${items.length}: ${item.file.name}`);

        try {
          const result = await compressSingleImage(item.file, opts);
          updatedItems.push({
            ...item,
            status: 'done',
            result,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Compression failed';
          updatedItems.push({
            ...item,
            status: 'error',
            errorMessage: msg,
          });
        }
      }

      setItems(updatedItems);
      setWorkflowStage('review');
      setPreviewTab('compressed');
      trackToolEvent('image-compressor', 'tool_completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compress images.';
      setErrorMessage(msg);
      trackToolEvent('image-compressor', 'tool_failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download a single compressed image
  const handleDownloadSingle = (item: ImageItemState) => {
    if (!item.result) return;
    const blob = item.result.compressedBlob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    let ext = '.jpg';
    if (item.result.outputFormat === 'image/png') ext = '.png';
    else if (item.result.outputFormat === 'image/webp') ext = '.webp';
    else if (item.result.outputFormat === 'image/avif') ext = '.avif';

    const baseName = item.file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_compressed${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download all compressed images as ZIP
  const handleDownloadAllZip = async () => {
    const readyItems = items.filter((it) => it.status === 'done' && it.result);
    if (readyItems.length === 0) return;

    if (readyItems.length === 1) {
      handleDownloadSingle(readyItems[0]);
      return;
    }

    try {
      setIsZipping(true);
      const zip = new JSZip();

      readyItems.forEach((item) => {
        if (!item.result) return;
        let ext = '.jpg';
        if (item.result.outputFormat === 'image/png') ext = '.png';
        else if (item.result.outputFormat === 'image/webp') ext = '.webp';
        else if (item.result.outputFormat === 'image/avif') ext = '.avif';

        const baseName = item.file.name.replace(/\.[^/.]+$/, '');
        zip.file(`${baseName}_compressed${ext}`, item.result.compressedBlob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toolino_compressed_images_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      setErrorMessage('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  // Computed summary metrics
  const totalOriginalBytes = useMemo(() => {
    return items.reduce((acc, it) => acc + it.file.size, 0);
  }, [items]);

  const totalCompressedBytes = useMemo(() => {
    return items.reduce((acc, it) => {
      return acc + (it.result ? it.result.compressedSize : it.file.size);
    }, 0);
  }, [items]);

  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes);
  const totalSavedPercent =
    totalOriginalBytes > 0 ? Math.round((totalSavedBytes / totalOriginalBytes) * 100) : 0;

  const selectedItem = useMemo(() => {
    return items.find((it) => it.id === selectedItemId) || items[0] || null;
  }, [items, selectedItemId]);

  return (
    <div className="bg-[#f8fafc] w-full min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden flex flex-col font-sans">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-3 flex-1 flex flex-col justify-between min-h-0">
        {/* ========================================================================= */}
        {/* TOP SECTION: Breadcrumb + Header + Privacy Badge                          */}
        {/* ========================================================================= */}
        <div className="shrink-0 space-y-1.5">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/image-tools" className="hover:text-blue-600 transition-colors">
              Image Tools
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">Image Compressor</span>
          </nav>

          {/* Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <FileImage className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Image Compressor
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Compress your images quickly while balancing file size and image quality.
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
                100% private
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
                className="text-red-600 hover:text-red-900 font-bold text-xs shrink-0 ml-2 cursor-pointer"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MIDDLE SECTION: Upload Area OR Main Two-Column Workspace                  */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-h-0 my-2">
          {items.length === 0 ? (
            /* 1. INITIAL UPLOAD STATE */
            <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-xl mx-auto rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center bg-white shadow-xs ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-2xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1.5">
                  Upload your images
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-xs">
                  Drag &amp; drop images here, or click to choose from your device.
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <FileImage className="w-4 h-4" />
                  Choose Images
                </button>
                <div className="flex items-center gap-3 mt-6 text-[11px] text-slate-400 font-medium">
                  <span>JPG • PNG • WEBP {avifSupported && '• AVIF'}</span>
                  <span>•</span>
                  <span>1 to 20 files</span>
                  <span>•</span>
                  <span>Up to 25 MB each</span>
                </div>
              </div>
            </div>
          ) : (
            /* 2. COMPACT IMAGE MANAGEMENT & MAIN WORKSPACE */
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Document Summary Bar */}
              <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                    {items.length}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      Your Images
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{items.length} {items.length === 1 ? 'image' : 'images'}</span>
                      <span>•</span>
                      <span>{formatBytes(totalOriginalBytes)} total</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => addMoreInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    Add More Images
                  </button>
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                </div>
              </div>

              {/* Main Workspace: Left (Preview & Image List) + Right (Settings) */}
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
                {/* ------------------------------------------------------------- */}
                {/* LEFT: LIVE PREVIEW & IMAGE THUMBNAIL STRIP                    */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-50/60 p-3 sm:p-4">
                  {/* Selected Image Metadata & Preview Tabs */}
                  {selectedItem && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 shrink-0 text-xs flex-wrap gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 truncate block max-w-[240px]">
                          {selectedItem.file.name}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>{selectedItem.originalWidth} × {selectedItem.originalHeight}</span>
                          <span>•</span>
                          <span>{selectedItem.originalSizeFormatted}</span>
                        </span>
                      </div>

                      {/* Before / After Preview Toggle */}
                      {selectedItem.result && (
                        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setPreviewTab('original')}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                              previewTab === 'original'
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Original
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewTab('compressed')}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                              previewTab === 'compressed'
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Compressed
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Image Graphic Display Viewport */}
                  <div className="flex-1 min-h-0 flex items-center justify-center p-2 relative">
                    {selectedItem && (
                      <div className="relative max-h-full max-w-full aspect-[4/3] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            previewTab === 'compressed' && selectedItem.result?.compressedPreviewUrl
                              ? selectedItem.result.compressedPreviewUrl
                              : selectedItem.previewUrl
                          }
                          alt={selectedItem.file.name}
                          className="w-full h-full object-contain select-none transition-all duration-200"
                        />

                        {/* Compression status badge overlay */}
                        {selectedItem.result && (
                          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                            <span className="font-semibold">
                              {previewTab === 'compressed' ? 'Compressed' : 'Original'}:
                            </span>
                            <span>
                              {previewTab === 'compressed'
                                ? formatBytes(selectedItem.result.compressedSize)
                                : selectedItem.originalSizeFormatted}
                            </span>
                            {selectedItem.result.reductionPercentage > 0 && (
                              <span className="text-emerald-400 font-bold">
                                ({selectedItem.result.reductionPercentage}% saved)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Multiple Images Thumbnail Strip */}
                  {items.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 shrink-0">
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                        {items.map((it) => (
                          <div
                            key={it.id}
                            onClick={() => setSelectedItemId(it.id)}
                            className={`w-14 h-14 rounded-lg border-2 p-0.5 shrink-0 cursor-pointer transition relative group bg-white overflow-hidden ${
                              selectedItemId === it.id
                                ? 'border-blue-600 ring-2 ring-blue-600/30'
                                : 'border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={it.previewUrl}
                              alt={it.file.name}
                              className="w-full h-full object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(it.id);
                              }}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-2xs cursor-pointer text-[10px]"
                              title="Delete image"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT: COMPRESSION SETTINGS                                   */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 flex flex-col min-h-0 bg-white p-3 sm:p-4 overflow-y-auto">
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
                      className="text-[11px] font-medium text-slate-500 hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>

                  <div className="space-y-3.5 flex-1 text-xs">
                    {/* 1. Compression Level Cards */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Compression Level
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Recommended */}
                        <button
                          type="button"
                          onClick={() => handlePresetSelect('recommended')}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                            presetLevel === 'recommended'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">Recommended</span>
                            {presetLevel === 'recommended' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <span className="text-[10px] text-blue-700 bg-blue-100/70 font-semibold px-1.5 py-0.5 rounded-md inline-block mb-1">
                            ★ Balanced
                          </span>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Optimal quality with strong size reduction.
                          </p>
                        </button>

                        {/* Strong */}
                        <button
                          type="button"
                          onClick={() => handlePresetSelect('high')}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                            presetLevel === 'high'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">Strong</span>
                            {presetLevel === 'high' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <span className="text-[10px] text-amber-700 bg-amber-100/70 font-semibold px-1.5 py-0.5 rounded-md inline-block mb-1">
                            Smaller File
                          </span>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            High compression for web uploads and emails.
                          </p>
                        </button>

                        {/* Maximum */}
                        <button
                          type="button"
                          onClick={() => handlePresetSelect('extreme')}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                            presetLevel === 'extreme'
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">Maximum</span>
                            {presetLevel === 'extreme' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <span className="text-[10px] text-purple-700 bg-purple-100/70 font-semibold px-1.5 py-0.5 rounded-md inline-block mb-1">
                            Smallest Size
                          </span>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Smallest possible file size.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* 2. Quality Slider */}
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 text-xs">
                          Image Quality
                        </label>
                        <span className="text-xs font-bold text-blue-600">
                          {Math.round(quality * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="0.95"
                        step="0.05"
                        value={quality}
                        onChange={(e) => {
                          setQuality(parseFloat(e.target.value));
                          setPresetLevel('recommended'); // Switch to custom quality
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Lower Size</span>
                        <span>Balanced (75%)</span>
                        <span>Better Quality</span>
                      </div>
                    </div>

                    {/* 3. Output Format Selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Output Format
                      </label>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="original">Original Format (Preserve JPG/PNG/WebP)</option>
                        <option value="image/jpeg">Convert to JPG (Best for photos)</option>
                        <option value="image/png">Convert to PNG (Lossless)</option>
                        <option value="image/webp">Convert to WebP (Next-gen format)</option>
                        {avifSupported && <option value="image/avif">Convert to AVIF</option>}
                      </select>
                    </div>

                    {/* 4. Optional Max Dimension (Resize) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Max Dimensions
                        </label>
                        <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={keepAspectRatio}
                            onChange={(e) => setKeepAspectRatio(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600"
                          />
                          <span>Keep aspect ratio</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: 0, label: 'Original' },
                          { id: 1920, label: '1920px' },
                          { id: 1280, label: '1280px' },
                          { id: 800, label: '800px' },
                        ].map((dim) => (
                          <button
                            key={dim.id}
                            type="button"
                            onClick={() => setMaxDimension(dim.id)}
                            className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition cursor-pointer text-center ${
                              maxDimension === dim.id
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                            }`}
                          >
                            {dim.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 5. Size Estimation Card */}
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                          Size Estimation
                        </span>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {formatBytes(totalOriginalBytes)} total input
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-900 block">
                          {presetLevel === 'recommended'
                            ? '~40% - 60% reduction'
                            : presetLevel === 'high'
                            ? '~60% - 75% reduction'
                            : '~70% - 85% reduction'}
                        </span>
                        <span className="text-[10px] text-blue-600">Calculated upon compression</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM SECTION: Primary Action Button                                     */}
        {/* ========================================================================= */}
        <div className="shrink-0 pt-2 flex items-center justify-between gap-3 border-t border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Files are processed locally in your browser memory and never uploaded.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCompressAll}
              disabled={items.length === 0 || isProcessing}
              className={`px-5 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                items.length === 0 || isProcessing
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
                  <span>
                    Compress {items.length > 1 ? `${items.length} Images` : 'Image'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PROCESSING STATE OVERLAY                                                  */}
      {/* ========================================================================= */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Compressing your images...
              </h3>
              <p className="text-xs text-slate-500 mt-1">{processingStatus}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${items.length > 0 ? (processedCount / items.length) * 100 : 50}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVIEW / RESULTS BEFORE FINAL DOWNLOAD                                    */}
      {/* ========================================================================= */}
      {workflowStage === 'review' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="text-center shrink-0">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xs mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Images compressed successfully
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your optimized images before downloading.
              </p>
            </div>

            {/* Overall Comparison Card */}
            <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 border border-slate-200/80 shrink-0">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Original
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 block mt-0.5">
                    {formatBytes(totalOriginalBytes)}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">
                    Compressed
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-blue-600 block mt-0.5">
                    {formatBytes(totalCompressedBytes)}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">
                    Saved
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 block mt-0.5">
                    {totalSavedPercent}%
                  </span>
                </div>
              </div>

              {totalSavedBytes > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                  <span>Total space saved:</span>
                  <span className="font-bold text-emerald-600">
                    {formatBytes(totalSavedBytes)} ({totalSavedPercent}% smaller)
                  </span>
                </div>
              )}
            </div>

            {/* Individual Compressed Files List */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.result?.compressedPreviewUrl || item.previewUrl}
                      alt={item.file.name}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {item.file.name}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span>{item.originalSizeFormatted}</span>
                        <span>→</span>
                        <span className="font-bold text-blue-600">
                          {item.result ? formatBytes(item.result.compressedSize) : 'N/A'}
                        </span>
                        {item.result && item.result.reductionPercentage > 0 && (
                          <span className="text-emerald-600 font-bold">
                            ({item.result.reductionPercentage}% saved)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(item)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-2 shrink-0 border-t border-slate-200/80">
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isZipping ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating ZIP Archive...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      <span>Download All as ZIP ({items.length} Images)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => items[0] && handleDownloadSingle(items[0])}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Compressed Image</span>
                </button>
              )}

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
                  <span>Compress More Images</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
