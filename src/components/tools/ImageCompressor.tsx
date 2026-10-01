'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import JSZip from 'jszip';
import {
  compressSingleImage,
  formatBytes,
  isAvifEncodingSupported,
  CompressionOptions,
  CompressedImageResult,
} from '@/core/engine/imageCompressorEngine';

interface ImageItemState {
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

export function ImageCompressor() {
  const [items, setItems] = useState<ImageItemState[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);

  // Compression options
  const [presetLevel, setPresetLevel] = useState<'high' | 'medium' | 'low' | 'custom' | 'target'>('medium');
  const [quality, setQuality] = useState<number>(0.75); // 75%
  const [mode, setMode] = useState<'quality' | 'target-size'>('quality');
  const [targetSizeKb, setTargetSizeKb] = useState<number>(250);
  const [targetUnit, setTargetUnit] = useState<'kb' | 'mb'>('kb');
  const [outputFormat, setOutputFormat] = useState<string>('original');
  const [maxDimension, setMaxDimension] = useState<number>(0); // 0 = no resize

  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avifSupported = typeof window !== 'undefined' ? isAvifEncodingSupported() : false;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Revoke object URLs on unmount
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

  // Compress a single item
  const processItem = async (item: ImageItemState, opts: CompressionOptions): Promise<ImageItemState> => {
    try {
      const result = await compressSingleImage(item.file, opts);
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
        errorMessage: err?.message || 'Compression failed',
      };
    }
  };

  // Recompress all items whenever options change or user hits Recompress
  const recompressAll = async (targetItems = items) => {
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
      setIsProcessingAll(true);
      const opts = getCurrentOptions();
      const processedNewItems = await Promise.all(
        newItems.map(async (it) => {
          return await processItem(it, opts);
        })
      );
      setItems((prev) => [...prev, ...processedNewItems]);
      setIsProcessingAll(false);
      showToast(`Added and compressed ${processedNewItems.length} image(s)`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Change preset level
  const handlePresetChange = (lvl: 'high' | 'medium' | 'low' | 'custom' | 'target') => {
    setPresetLevel(lvl);
    if (lvl === 'high') {
      setMode('quality');
      setQuality(0.9);
    } else if (lvl === 'medium') {
      setMode('quality');
      setQuality(0.75);
    } else if (lvl === 'low') {
      setMode('quality');
      setQuality(0.5);
    } else if (lvl === 'target') {
      setMode('target-size');
    } else {
      setMode('quality');
    }
  };

  // Trigger compression update after slider change
  useEffect(() => {
    if (items.length > 0) {
      const timer = setTimeout(() => {
        recompressAll();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [quality, mode, targetSizeKb, targetUnit, outputFormat, maxDimension]);

  // Remove single image
  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.result?.compressedPreviewUrl) {
          URL.revokeObjectURL(target.result.compressedPreviewUrl);
        }
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  // Clear all
  const clearAll = () => {
    items.forEach((it) => {
      URL.revokeObjectURL(it.previewUrl);
      if (it.result?.compressedPreviewUrl) {
        URL.revokeObjectURL(it.result.compressedPreviewUrl);
      }
    });
    setItems([]);
    setErrorMessage(null);
  };

  // Download individual image
  const downloadSingle = (item: ImageItemState) => {
    if (!item.result) return;
    const blob = item.result.compressedBlob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Resolve extension
    let ext = '.jpg';
    if (item.result.outputFormat === 'image/png') ext = '.png';
    else if (item.result.outputFormat === 'image/webp') ext = '.webp';
    else if (item.result.outputFormat === 'image/avif') ext = '.avif';

    const baseName = item.file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}-compressed${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded "${a.download}"`);
  };

  // Download all compressed images as ZIP
  const downloadAllZip = async () => {
    const readyItems = items.filter((it) => it.status === 'done' && it.result);
    if (readyItems.length === 0) return;

    try {
      setIsZipping(true);
      showToast('Bundling compressed images into ZIP...');
      const zip = new JSZip();

      readyItems.forEach((item, idx) => {
        if (!item.result) return;
        let ext = '.jpg';
        if (item.result.outputFormat === 'image/png') ext = '.png';
        else if (item.result.outputFormat === 'image/webp') ext = '.webp';
        else if (item.result.outputFormat === 'image/avif') ext = '.avif';

        const baseName = item.file.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}-compressed-${idx + 1}${ext}`;
        zip.file(filename, item.result.compressedBlob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `toolino-compressed-images-${dateStr}.zip`;
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

  // Calculate totals
  const totalOriginalSize = items.reduce((acc, it) => acc + it.file.size, 0);
  const totalCompressedSize = items.reduce((acc, it) => acc + (it.result?.compressedSize || it.file.size), 0);
  const overallSavedPct =
    totalOriginalSize > totalCompressedSize
      ? (((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100).toFixed(1)
      : '0.0';

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
            <span className="font-semibold text-slate-800">Image Compressor</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Image Compressor
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Compress JPG, PNG, WEBP, and AVIF images directly in your browser. Reduce file size by up to
            90% without compromising visual clarity.
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
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Drag &amp; drop images here, or browse
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
        {/* VIEW 2: ACTIVE IMAGES LIST & COMPRESSION CONTROLS                         */}
        {/* ========================================================================= */}
        {items.length > 0 && (
          <div className="space-y-6">
            {/* COMPRESSION CONTROLS CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Compression Settings</h2>
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

              {/* Compression Mode Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { id: 'medium', label: 'Balanced (75%)', desc: 'Recommended' },
                  { id: 'high', label: 'High Quality (90%)', desc: 'Minimum loss' },
                  { id: 'low', label: 'Maximum (50%)', desc: 'Smallest size' },
                  { id: 'custom', label: 'Custom Slider', desc: 'Exact quality' },
                  { id: 'target', label: 'Target Size', desc: 'e.g. 200 KB' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handlePresetChange(tab.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      presetLevel === tab.id
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
                {mode === 'quality' ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">Quality Level</span>
                      <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                        {Math.round(quality * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.01"
                      value={quality}
                      onChange={(e) => {
                        setQuality(parseFloat(e.target.value));
                        setPresetLevel('custom');
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Smaller File (5%)</span>
                      <span>Balanced (75%)</span>
                      <span>Best Quality (100%)</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">Target File Size</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="10"
                        max="10000"
                        value={targetSizeKb}
                        onChange={(e) => setTargetSizeKb(Math.max(1, parseInt(e.target.value, 10) || 100))}
                        className="w-40 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 bg-white"
                      />
                      <select
                        value={targetUnit}
                        onChange={(e) => setTargetUnit(e.target.value as any)}
                        className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="kb">Kilobytes (KB)</option>
                        <option value="mb">Megabytes (MB)</option>
                      </select>
                      <button
                        onClick={() => recompressAll()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        Apply Target
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      The engine automatically iterates quality and scale parameters to produce a compressed file close
                      to your specified target.
                    </p>
                  </div>
                )}

                {/* Additional Options: Output Format & Dimension Constraint */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Convert Output Format</label>
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="original">Keep Original Format</option>
                      <option value="image/webp">Convert to WebP (High Efficiency)</option>
                      <option value="image/jpeg">Convert to JPEG</option>
                      <option value="image/png">Convert to PNG</option>
                      {avifSupported && <option value="image/avif">Convert to AVIF (Next-Gen)</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Max Resolution Constraint</label>
                    <select
                      value={maxDimension}
                      onChange={(e) => setMaxDimension(parseInt(e.target.value, 10))}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="0">Original Resolution (No Resize)</option>
                      <option value="1920">Max 1920px (Full HD)</option>
                      <option value="1280">Max 1280px (Standard Web)</option>
                      <option value="800">Max 800px (Mobile / Email)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* TOTAL STATS & DOWNLOAD ALL BAR */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-blue-200 uppercase tracking-wider font-bold">
                  Compression Summary ({items.length} image{items.length !== 1 ? 's' : ''})
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xl sm:text-2xl font-extrabold text-white">
                    {formatBytes(totalCompressedSize)}
                  </span>
                  <span className="text-xs text-blue-300 line-through">{formatBytes(totalOriginalSize)}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                    Saved: {overallSavedPct}%
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
                          src={res?.compressedPreviewUrl || item.previewUrl}
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
                          <span>
                            {item.originalWidth} × {item.originalHeight} px
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-600">{item.originalSizeFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Compressed Result & Savings Badge */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                      {res ? (
                        <div className="flex items-center gap-3">
                          <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                          <div className="text-left sm:text-right">
                            <div className="text-xs font-bold text-slate-900">
                              {formatBytes(res.compressedSize)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {res.compressedWidth} × {res.compressedHeight} px
                            </div>
                          </div>

                          <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            Saved: {res.reductionPercentage}%
                          </div>
                        </div>
                      ) : item.status === 'error' ? (
                        <span className="text-xs text-red-600 font-semibold">{item.errorMessage}</span>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Compressing...</span>
                        </span>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <button
                        onClick={() => downloadSingle(item)}
                        disabled={!res}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                        title="Download compressed image"
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
