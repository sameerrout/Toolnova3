'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Trash2,
  Download,
  AlertCircle,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Check,
  Plus,
  Loader2,
  Archive,
  Lock,
  Unlock,
  Maximize2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  resizeSingleImage,
  formatBytes,
  RESIZE_PRESETS,
  ResizeOptions,
  ResizedImageResult,
  ResizePreset,
} from '@/core/engine/imageResizerEngine';

interface ImageItemState {
  id: string;
  file: File;
  originalSizeFormatted: string;
  originalWidth: number;
  originalHeight: number;
  previewUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: ResizedImageResult;
  errorMessage?: string;
}

export function ImageResizer() {
  const [items, setItems] = useState<ImageItemState[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);

  // Resizing Controls State
  const [mode, setMode] = useState<'dimensions' | 'percentage' | 'preset'>('dimensions');
  const [targetWidth, setTargetWidth] = useState<number>(1920);
  const [targetHeight, setTargetHeight] = useState<number>(1080);
  const [percentage, setPercentage] = useState<number>(50);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('fhd');
  const [unit, setUnit] = useState<'px' | 'percent' | 'in' | 'cm'>('px');
  const [fitMode, setFitMode] = useState<'scale' | 'cover' | 'contain'>('scale');
  const [outputFormat, setOutputFormat] = useState<string>('original');
  const [quality, setQuality] = useState<number>(0.92);

  // Active base aspect ratio (from first uploaded image)
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        if (item.result?.resizedPreviewUrl) {
          URL.revokeObjectURL(item.result.resizedPreviewUrl);
        }
      });
    };
  }, [items]);

  // Construct current options payload
  const getCurrentOptions = useCallback((): ResizeOptions => {
    return {
      mode,
      targetWidth,
      targetHeight,
      percentage,
      lockAspectRatio,
      fitMode,
      outputFormat: outputFormat as any,
      quality,
    };
  }, [mode, targetWidth, targetHeight, percentage, lockAspectRatio, fitMode, outputFormat, quality]);

  // Process a single item
  const processItem = async (item: ImageItemState, opts: ResizeOptions): Promise<ImageItemState> => {
    try {
      const result = await resizeSingleImage(item.file, opts);
      return {
        ...item,
        status: 'done',
        result,
        errorMessage: undefined,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        errorMessage: err?.message || 'Resize failed',
      };
    }
  };

  // Re-resize all items
  const reprocessAll = async (targetItems = items) => {
    if (targetItems.length === 0) return;
    setIsProcessingAll(true);
    const opts = getCurrentOptions();

    const updated = await Promise.all(
      targetItems.map(async (item) => {
        return await processItem(item, opts);
      })
    );

    setItems(updated);
    setIsProcessingAll(false);
  };

  // Handle incoming files
  const addFiles = async (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const filesArray = Array.from(incomingFiles);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

    const newItems: ImageItemState[] = [];

    for (const file of filesArray) {
      const lowerName = file.name.toLowerCase();
      const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
      const hasValidMime =
        file.type.startsWith('image/jpeg') ||
        file.type.startsWith('image/png') ||
        file.type.startsWith('image/webp') ||
        file.type.startsWith('image/avif');

      if (!hasValidExt && !hasValidMime) {
        setErrorMessage(`"${file.name}" has an unsupported format. Supported formats: JPG, PNG, WEBP, AVIF.`);
        continue;
      }

      if (file.size === 0) {
        setErrorMessage(`"${file.name}" is empty (0 bytes).`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);

      // Extract image dimensions
      let width = 0;
      let height = 0;
      try {
        const img = new Image();
        img.src = previewUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        width = img.naturalWidth;
        height = img.naturalHeight;
      } catch {
        // fallback
      }

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        originalSizeFormatted: formatBytes(file.size),
        originalWidth: width,
        originalHeight: height,
        previewUrl,
        status: 'pending',
      });
    }

    if (newItems.length > 0) {
      // If this is the first batch, auto-initialize target dimensions from first image
      if (items.length === 0 && newItems[0].originalWidth > 0) {
        const firstW = newItems[0].originalWidth;
        const firstH = newItems[0].originalHeight;
        setTargetWidth(firstW);
        setTargetHeight(firstH);
        setAspectRatio(firstW / firstH);
      }

      setIsProcessingAll(true);
      const opts = getCurrentOptions();
      const processedNewItems = await Promise.all(
        newItems.map(async (it) => {
          return await processItem(it, opts);
        })
      );
      setItems((prev) => [...prev, ...processedNewItems]);
      setIsProcessingAll(false);
      showToast(`Added and resized ${processedNewItems.length} image(s)`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Adjust width with aspect ratio lock
  const handleWidthChange = (val: number) => {
    const newW = Math.max(1, val);
    setTargetWidth(newW);
    if (lockAspectRatio && aspectRatio > 0) {
      setTargetHeight(Math.max(1, Math.round(newW / aspectRatio)));
    }
  };

  // Adjust height with aspect ratio lock
  const handleHeightChange = (val: number) => {
    const newH = Math.max(1, val);
    setTargetHeight(newH);
    if (lockAspectRatio && aspectRatio > 0) {
      setTargetWidth(Math.max(1, Math.round(newH * aspectRatio)));
    }
  };

  // Preset selected
  const handleSelectPreset = (preset: ResizePreset) => {
    setSelectedPresetId(preset.id);
    setTargetWidth(preset.width);
    setTargetHeight(preset.height);
    setAspectRatio(preset.width / preset.height);
    setMode('preset');
  };

  // Trigger re-resize debounce on control changes
  useEffect(() => {
    if (items.length > 0) {
      const timer = setTimeout(() => {
        reprocessAll();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [mode, targetWidth, targetHeight, percentage, lockAspectRatio, fitMode, outputFormat, quality]);

  // Remove single image
  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.result?.resizedPreviewUrl) {
          URL.revokeObjectURL(target.result.resizedPreviewUrl);
        }
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  // Clear all
  const clearAll = () => {
    items.forEach((it) => {
      URL.revokeObjectURL(it.previewUrl);
      if (it.result?.resizedPreviewUrl) {
        URL.revokeObjectURL(it.result.resizedPreviewUrl);
      }
    });
    setItems([]);
    setErrorMessage(null);
  };

  // Download individual image
  const downloadSingle = (item: ImageItemState) => {
    if (!item.result) return;
    const blob = item.result.resizedBlob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    let ext = '.jpg';
    if (item.result.outputFormat === 'image/png') ext = '.png';
    else if (item.result.outputFormat === 'image/webp') ext = '.webp';

    const baseName = item.file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}-${item.result.resizedWidth}x${item.result.resizedHeight}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded "${a.download}"`);
  };

  // Download all as ZIP
  const downloadAllZip = async () => {
    const readyItems = items.filter((it) => it.status === 'done' && it.result);
    if (readyItems.length === 0) return;

    try {
      setIsZipping(true);
      showToast('Creating ZIP archive...');
      const zip = new JSZip();

      readyItems.forEach((item, idx) => {
        if (!item.result) return;
        let ext = '.jpg';
        if (item.result.outputFormat === 'image/png') ext = '.png';
        else if (item.result.outputFormat === 'image/webp') ext = '.webp';

        const baseName = item.file.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}-${item.result.resizedWidth}x${item.result.resizedHeight}-${idx + 1}${ext}`;
        zip.file(filename, item.result.resizedBlob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `toolino-resized-images-${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded ZIP package successfully!');
    } catch (err: any) {
      setErrorMessage(`Failed creating ZIP: ${err?.message || 'Error bundling files'}`);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
        }}
      />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <nav aria-label="Breadcrumb" className="inline-flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/image-tools" className="hover:text-blue-600 transition-colors">
              Image Tools
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Image Resizer</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Image Resizer
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Resize JPG, PNG, WEBP, and AVIF photos by exact pixels, percentage, or social media presets.
            Lock aspect ratios with zero server uploads.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: EMPTY STATE / UPLOAD DROPZONE                                     */}
        {/* ========================================================================= */}
        {items.length === 0 && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/60 scale-[1.01] shadow-lg'
                : 'border-slate-300 hover:border-blue-400 bg-white shadow-xs hover:shadow-md'
            }`}
          >
            <div className="space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-xs">
                <Maximize2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Drag &amp; drop images to resize
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Supports multiple JPG, PNG, WEBP, and AVIF photos up to 100MB each
                </p>
              </div>

              <div>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Choose Image Files</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Client-Side • Your images are never uploaded to any remote server</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ACTIVE IMAGES LIST & RESIZE CONTROLS                              */}
        {/* ========================================================================= */}
        {items.length > 0 && (
          <div className="space-y-6">
            {/* RESIZING CONTROLS CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Resize Options</h2>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Add More</span>
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'dimensions', label: 'By Dimensions (px)', desc: 'Exact pixel sizing' },
                  { id: 'percentage', label: 'By Percentage (%)', desc: 'Scale up or down' },
                  { id: 'preset', label: 'Social & Presets', desc: 'Pre-configured sizes' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMode(tab.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      mode === tab.id
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-100 shadow-2xs'
                        : 'border-slate-200/80 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-slate-900">{tab.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{tab.desc}</div>
                  </button>
                ))}
              </div>

              {/* Dynamic Controls based on selected mode */}
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 space-y-4">
                {/* A. Dimensions Mode */}
                {mode === 'dimensions' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      {/* Width Input */}
                      <div className="flex-1 min-w-[130px]">
                        <label className="block font-bold text-slate-700 mb-1">Width (pixels)</label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={targetWidth}
                          onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 1)}
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 bg-white"
                        />
                      </div>

                      {/* Lock Aspect Ratio Button */}
                      <div className="flex flex-col items-center justify-end pb-1">
                        <button
                          type="button"
                          onClick={() => setLockAspectRatio(!lockAspectRatio)}
                          className={`p-2 rounded-xl border transition-all ${
                            lockAspectRatio
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-400 border-slate-300 hover:text-slate-700'
                          }`}
                          title={lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                        >
                          {lockAspectRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <span className="text-[9px] text-slate-500 font-semibold mt-1">
                          {lockAspectRatio ? 'Locked' : 'Unlocked'}
                        </span>
                      </div>

                      {/* Height Input */}
                      <div className="flex-1 min-w-[130px]">
                        <label className="block font-bold text-slate-700 mb-1">Height (pixels)</label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={targetHeight}
                          onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 1)}
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 bg-white"
                        />
                      </div>

                      {/* Fit Mode */}
                      <div className="min-w-[160px]">
                        <label className="block font-bold text-slate-700 mb-1">Fitting Strategy</label>
                        <select
                          value={fitMode}
                          onChange={(e) => setFitMode(e.target.value as any)}
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="scale">Exact Scale / Stretch</option>
                          <option value="cover">Crop Center to Fill</option>
                          <option value="contain">Contain with Letterbox</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick Quick-Picks */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-slate-500 font-medium">Quick dimensions:</span>
                      {[
                        { w: 1080, h: 1080, label: '1080 × 1080' },
                        { w: 1920, h: 1080, label: '1920 × 1080 (FHD)' },
                        { w: 1280, h: 720, label: '1280 × 720 (HD)' },
                        { w: 500, h: 500, label: '500 × 500' },
                        { w: 200, h: 200, label: '200 × 200' },
                      ].map((q) => (
                        <button
                          key={q.label}
                          type="button"
                          onClick={() => {
                            setTargetWidth(q.w);
                            setTargetHeight(q.h);
                            setAspectRatio(q.w / q.h);
                          }}
                          className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-semibold transition-colors"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* B. Percentage Mode */}
                {mode === 'percentage' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">Scaling Percentage</span>
                      <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                        {percentage}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="5"
                      value={percentage}
                      onChange={(e) => setPercentage(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                      {[25, 50, 75, 100, 125, 150, 200].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setPercentage(pct)}
                          className={`px-3 py-1 rounded-xl border font-semibold transition-all ${
                            percentage === pct
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* C. Preset Mode */}
                {mode === 'preset' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-800">
                      Select Platform or Standard Preset
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                      {RESIZE_PRESETS.map((p) => {
                        const isSelected = selectedPresetId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPreset(p)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-100 font-bold'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="text-slate-900 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {p.width} × {p.height} px
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Output Format Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/60 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Output Format</label>
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="original">Keep Original Format</option>
                      <option value="image/png">Convert to PNG (Lossless)</option>
                      <option value="image/jpeg">Convert to JPEG</option>
                      <option value="image/webp">Convert to WebP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Quality Level</label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="0.95">High Fidelity (95%)</option>
                      <option value="0.92">Standard (92%)</option>
                      <option value="0.80">Compact (80%)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION & DOWNLOAD ALL BAR */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-blue-200 uppercase tracking-wider font-bold">
                  Queue Summary ({items.length} image{items.length !== 1 ? 's' : ''})
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg sm:text-xl font-extrabold text-white">
                    Target: {mode === 'percentage' ? `${percentage}% scale` : `${targetWidth} × ${targetHeight} px`}
                  </span>
                  <span className="text-xs text-blue-200">
                    Mode: {mode === 'dimensions' ? 'Exact Pixels' : mode === 'percentage' ? 'Percentage' : 'Preset'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={downloadAllZip}
                  disabled={isZipping || isProcessingAll}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  <span>Download All as ZIP</span>
                </button>
              </div>
            </div>

            {/* IMAGES LIST GRID */}
            <div className="space-y-3">
              {items.map((item) => {
                const res = item.result;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    {/* Left: Thumbnail & Name */}
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative flex items-center justify-center">
                        <img
                          src={res?.resizedPreviewUrl || item.previewUrl}
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                        />
                        {item.status === 'processing' && (
                          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[220px] sm:max-w-xs">
                          {item.file.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-medium text-slate-600">Original:</span>
                          <span>
                            {item.originalWidth} × {item.originalHeight} px
                          </span>
                          <span>•</span>
                          <span>{item.originalSizeFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Resized Dimensions & Upscaling Notice */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                      {res ? (
                        <div className="flex items-center gap-3">
                          <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                          <div className="text-left sm:text-right">
                            <div className="text-xs font-bold text-slate-900">
                              {res.resizedWidth} × {res.resizedHeight} px
                            </div>
                            <div className="text-[10px] text-slate-500">
                              New size: {formatBytes(res.resizedSize)}
                            </div>
                          </div>

                          {res.isUpscaled ? (
                            <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Upscaled</span>
                            </div>
                          ) : (
                            <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Resized
                            </div>
                          )}
                        </div>
                      ) : item.status === 'error' ? (
                        <span className="text-xs text-red-600 font-semibold">{item.errorMessage}</span>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Resizing...</span>
                        </span>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <button
                        onClick={() => downloadSingle(item)}
                        disabled={!res}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                        title="Download resized image"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
