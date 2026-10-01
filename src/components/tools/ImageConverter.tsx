'use client';

import React, { useState, useRef, useCallback } from 'react';
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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Plus,
  Loader2,
  Archive,
  ArrowLeftRight,
  Palette,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  SUPPORTED_OUTPUT_FORMATS,
  SupportedOutputFormat,
  convertSingleImage,
  formatBytes,
  ConvertedResult,
  isAvifExportSupported,
} from '@/core/engine/imageConverterEngine';

interface ImageItemState {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalFormat: string;
  targetFormat: SupportedOutputFormat;
  status: 'pending' | 'converting' | 'done' | 'error';
  result?: ConvertedResult;
  errorMessage?: string;
}

export function ImageConverter() {
  const [items, setItems] = useState<ImageItemState[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConvertingAll, setIsConvertingAll] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Global Conversion Settings
  const [globalFormat, setGlobalFormat] = useState<SupportedOutputFormat>('webp');
  const [quality, setQuality] = useState<number>(0.85); // 85%
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [icoSize, setIcoSize] = useState<16 | 32 | 48 | 64 | 128 | 256>(64);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse original format from file extension or mime
  const getFormatFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'IMG';
    return ext === 'JPEG' ? 'JPG' : ext;
  };

  // Add files to the queue
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setErrorMessage(null);
      const newItems: ImageItemState[] = [];

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|avif|bmp|ico|gif|svg|tiff)$/i)) {
          return;
        }

        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const previewUrl = URL.createObjectURL(file);

        // Preload to get dimensions
        const img = new Image();
        img.onload = () => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === id
                ? {
                    ...it,
                    originalWidth: img.naturalWidth,
                    originalHeight: img.naturalHeight,
                  }
                : it
            )
          );
        };
        img.src = previewUrl;

        newItems.push({
          id,
          file,
          previewUrl,
          originalSize: file.size,
          originalWidth: 0,
          originalHeight: 0,
          originalFormat: getFormatFromExtension(file.name),
          targetFormat: globalFormat,
          status: 'pending',
        });
      });

      if (newItems.length === 0 && files.length > 0) {
        setErrorMessage('None of the selected files are supported image formats.');
        return;
      }

      setItems((prev) => [...prev, ...newItems]);
    },
    [globalFormat]
  );

  // Update global target format and propagate to all pending items
  const handleGlobalFormatChange = (fmt: SupportedOutputFormat) => {
    setGlobalFormat(fmt);
    setItems((prev) =>
      prev.map((item) => (item.status === 'pending' ? { ...item, targetFormat: fmt } : item))
    );
  };

  // Update target format for a specific item
  const handleItemFormatChange = (id: string, fmt: SupportedOutputFormat) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, targetFormat: fmt, status: 'pending', result: undefined } : item))
    );
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((it) => it.id !== id);
    });
  };

  // Clear all
  const handleClearAll = () => {
    items.forEach((it) => {
      URL.revokeObjectURL(it.previewUrl);
      if (it.result?.dataUrl) URL.revokeObjectURL(it.result.dataUrl);
    });
    setItems([]);
    setErrorMessage(null);
  };

  // Convert a single item
  const convertItem = async (item: ImageItemState): Promise<ImageItemState> => {
    try {
      const result = await convertSingleImage(item.file, {
        targetFormat: item.targetFormat,
        quality,
        backgroundColor,
        icoSize,
      });

      return {
        ...item,
        status: 'done',
        result,
        errorMessage: undefined,
      };
    } catch (err: any) {
      console.error(err);
      return {
        ...item,
        status: 'error',
        errorMessage: err?.message || 'Conversion failed',
      };
    }
  };

  // Convert All Pending Items
  const handleConvertAll = async () => {
    if (items.length === 0 || isConvertingAll) return;

    setIsConvertingAll(true);
    setErrorMessage(null);

    const pendingOrReset = items.map((it) => ({
      ...it,
      status: 'converting' as const,
    }));
    setItems(pendingOrReset);

    const updatedItems: ImageItemState[] = [];

    for (const item of items) {
      const converted = await convertItem(item);
      updatedItems.push(converted);
      setItems((prev) => prev.map((it) => (it.id === converted.id ? converted : it)));
    }

    setIsConvertingAll(false);
  };

  // Single Item Download
  const handleDownloadItem = (item: ImageItemState) => {
    if (!item.result) return;
    const baseName = item.file.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = item.result.dataUrl;
    a.download = `${baseName}.${item.result.outputExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download All as ZIP
  const handleDownloadAllZip = async () => {
    const doneItems = items.filter((it) => it.status === 'done' && it.result);
    if (doneItems.length === 0 || isZipping) return;

    try {
      setIsZipping(true);
      const zip = new JSZip();

      for (let i = 0; i < doneItems.length; i++) {
        const item = doneItems[i];
        if (item.result) {
          const baseName = item.file.name.replace(/\.[^.]+$/, '');
          const filename = `${baseName}.${item.result.outputExtension}`;
          zip.file(filename, item.result.blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `Toolino_Converted_Images_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  const doneCount = items.filter((it) => it.status === 'done').length;
  const currentFormatMeta = SUPPORTED_OUTPUT_FORMATS.find((f) => f.id === globalFormat) || SUPPORTED_OUTPUT_FORMATS[0];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Breadcrumb & Status Header */}
      <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <span>Toolino</span>
              <span className="text-slate-300">/</span>
            </Link>
            <Link
              href="/image-tools"
              className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <span>Image Tools</span>
              <span className="text-slate-300">/</span>
            </Link>
            <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              Image Converter
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Client-Side • Zero Data Uploaded
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Universal Multi-Format In-Browser Converter
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Free Online Image Converter
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Convert JPG, PNG, WEBP, AVIF, BMP, and ICO images in seconds. Preserve transparency, batch process multiple files, and download individually or as a ZIP.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 max-w-4xl mx-auto">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-800">Conversion Warning</p>
              <p className="text-sm text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* State 1: Dropzone (Always visible or primary when empty) */}
        {items.length === 0 ? (
          <div className="max-w-3xl mx-auto">
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
              className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                  : 'border-slate-300 bg-white/70 hover:border-blue-400 hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.ico,.bmp,.tiff"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />

              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                <UploadCloud className="w-10 h-10" />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Choose images or drag and drop here
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Supports JPG, PNG, WEBP, AVIF, BMP, GIF, SVG, ICO up to 100MB per file. Convert unlimited photos directly in your browser.
              </p>

              <button
                type="button"
                className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                Select Image Files
              </button>
            </div>

            {/* Formats Overview Cards */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUPPORTED_OUTPUT_FORMATS.map((fmt) => (
                <div
                  key={fmt.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">{fmt.label}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        fmt.supportsAlpha ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {fmt.supportsAlpha ? 'Alpha OK' : 'Solid'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{fmt.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* State 2: Conversion Workspace with Queue and Settings */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Images Queue */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Queue Header Actions */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">
                    Image Queue ({items.length})
                  </span>
                  {doneCount > 0 && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      {doneCount} / {items.length} Converted
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.ico,.bmp,.tiff"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
                  >
                    {/* Thumbnail & Metadata */}
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-full h-full object-contain"
                        />
                        <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] font-mono px-1 rounded-tl">
                          {item.originalFormat}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[240px]">
                          {item.file.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{formatBytes(item.originalSize)}</span>
                          {item.originalWidth > 0 && (
                            <>
                              <span>•</span>
                              <span>
                                {item.originalWidth} × {item.originalHeight} px
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Format Target & Arrow */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                        <select
                          value={item.targetFormat}
                          onChange={(e) => handleItemFormatChange(item.id, e.target.value as SupportedOutputFormat)}
                          className="text-xs font-bold text-blue-700 bg-blue-50/70 border border-blue-200 rounded-xl px-2.5 py-1.5 focus:outline-blue-500 cursor-pointer"
                        >
                          {SUPPORTED_OUTPUT_FORMATS.map((f) => (
                            <option key={f.id} value={f.id}>
                              to {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Result metrics if converted */}
                      {item.status === 'done' && item.result && (
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-700 block">
                            {formatBytes(item.result.outputSize)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.result.outputSize <= item.originalSize
                              ? `${Math.round((1 - item.result.outputSize / item.originalSize) * 100)}% smaller`
                              : `${Math.round((item.result.outputSize / item.originalSize - 1) * 100)}% larger`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions: Download / Convert / Delete */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {item.status === 'done' && item.result ? (
                        <button
                          onClick={() => handleDownloadItem(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      ) : item.status === 'converting' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Converting...</span>
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            setItems((prev) =>
                              prev.map((it) => (it.id === item.id ? { ...it, status: 'converting' } : it))
                            );
                            const converted = await convertItem(item);
                            setItems((prev) => prev.map((it) => (it.id === item.id ? converted : it)));
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Convert</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        title="Remove from queue"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 4 Cols: Global Settings & Batch Action */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Settings Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">Conversion Settings</h3>
                  </div>
                </div>

                {/* Target Format Quick Buttons */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Convert All Images To:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SUPPORTED_OUTPUT_FORMATS.map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => handleGlobalFormatChange(fmt.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                          globalFormat === fmt.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {currentFormatMeta.description}
                  </p>
                </div>

                {/* Quality Slider for Lossy formats (WEBP, JPG, AVIF) */}
                {currentFormatMeta.lossy && (
                  <div>
                    <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                      <span className="text-slate-700 font-semibold">Quality Level</span>
                      <span className="text-blue-600 font-mono font-bold">
                        {Math.round(quality * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Smaller File (60%)</span>
                      <span>Balanced (85%)</span>
                      <span>Maximum (100%)</span>
                    </div>
                  </div>
                )}

                {/* Background color for non-alpha formats (JPG, BMP) */}
                {!currentFormatMeta.supportsAlpha && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Palette className="w-3.5 h-3.5 text-blue-600" />
                      <label className="text-xs font-semibold text-slate-700">
                        Matte Background (for transparent images):
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="text-xs font-mono px-2.5 py-1.5 border border-slate-200 rounded-lg flex-1 font-semibold uppercase"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Fills transparent backgrounds when converting PNG/WEBP into JPG or BMP.
                    </p>
                  </div>
                )}

                {/* ICO Size Selector */}
                {globalFormat === 'ico' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Favicon / Icon Size:
                    </label>
                    <select
                      value={icoSize}
                      onChange={(e) => setIcoSize(parseInt(e.target.value, 10) as any)}
                      className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-blue-500"
                    >
                      <option value={16}>16 × 16 px (Browser Tab Favicon)</option>
                      <option value={32}>32 × 32 px (Standard Desktop Favicon)</option>
                      <option value={48}>48 × 48 px (Windows Taskbar)</option>
                      <option value={64}>64 × 64 px (High DPI Favicon)</option>
                      <option value={128}>128 × 128 px (Application Icon)</option>
                      <option value={256}>256 × 256 px (Windows High-Res Icon)</option>
                    </select>
                  </div>
                )}

                {/* Batch Process CTA */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <button
                    onClick={handleConvertAll}
                    disabled={isConvertingAll || items.length === 0}
                    className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    {isConvertingAll ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Converting Queue...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Convert All ({items.length})</span>
                      </>
                    )}
                  </button>

                  {doneCount > 0 && (
                    <button
                      onClick={handleDownloadAllZip}
                      disabled={isZipping}
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                    >
                      {isZipping ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating ZIP...</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          <span>Download All as ZIP ({doneCount})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
