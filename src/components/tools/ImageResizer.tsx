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
  Unlock,
  Maximize2,
  RotateCcw,
  Eye,
  Percent,
  AlertTriangle,
  Image as ImageIcon,
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
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface ImageItemState {
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

const MAX_FILES = 20;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function ImageResizer() {
  const [items, setItems] = useState<ImageItemState[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workflow Stage: 'upload' (empty) | 'edit' (workspace) | 'review' (results screen)
  const [workflowStage, setWorkflowStage] = useState<'upload' | 'edit' | 'review'>('upload');
  const [previewTab, setPreviewTab] = useState<'resized' | 'original'>('resized');

  // Resize Options
  const [mode, setMode] = useState<'dimensions' | 'percentage' | 'preset'>('dimensions');
  const [targetWidth, setTargetWidth] = useState<number>(1920);
  const [targetHeight, setTargetHeight] = useState<number>(1080);
  const [percentage, setPercentage] = useState<number>(50);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('fhd');
  const [fitMode, setFitMode] = useState<'scale' | 'cover' | 'contain'>('scale');
  const [outputFormat, setOutputFormat] = useState<string>('original');
  const [quality, setQuality] = useState<number>(0.92);

  // Processing & Review State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('Preparing...');
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Track active Object URLs to prevent memory leaks
  const activeUrlsRef = useRef<Set<string>>(new Set());

  const registerUrl = useCallback((url: string) => {
    activeUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeRegisteredUrl = useCallback((url: string) => {
    if (url && activeUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      activeUrlsRef.current.delete(url);
    }
  }, []);

  // Lock desktop body and html scrolling on desktop viewports
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
      window.removeEventListener('resize', applyOverflow);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // Revoke all Object URLs on unmount
  useEffect(() => {
    const urls = activeUrlsRef.current;
    return () => {
      urls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      urls.clear();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Currently selected item
  const activeItem = useMemo(() => {
    if (!items.length) return null;
    return items.find((i) => i.id === selectedItemId) || items[0];
  }, [items, selectedItemId]);

  // Base aspect ratio of active item
  const activeAspect = useMemo(() => {
    if (!activeItem || activeItem.originalWidth <= 0 || activeItem.originalHeight <= 0) {
      return 16 / 9;
    }
    return activeItem.originalWidth / activeItem.originalHeight;
  }, [activeItem]);

  // Effective target dimensions based on current mode
  const effectiveDimensions = useMemo(() => {
    const origW = activeItem?.originalWidth || 1920;
    const origH = activeItem?.originalHeight || 1080;

    if (mode === 'percentage') {
      const scale = percentage / 100;
      return {
        width: Math.max(1, Math.round(origW * scale)),
        height: Math.max(1, Math.round(origH * scale)),
      };
    }

    return {
      width: Math.max(1, Math.round(targetWidth || origW)),
      height: Math.max(1, Math.round(targetHeight || origH)),
    };
  }, [mode, percentage, targetWidth, targetHeight, activeItem]);

  const isUpscaled = useMemo(() => {
    if (!activeItem) return false;
    return (
      effectiveDimensions.width > activeItem.originalWidth ||
      effectiveDimensions.height > activeItem.originalHeight
    );
  }, [activeItem, effectiveDimensions]);

  // Helper to load natural dimensions from an image file
  const inspectImageDimensions = (
    file: File,
    url: string
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
        });
      };
      img.onerror = () => {
        resolve({ width: 800, height: 600 });
      };
      img.src = url;
    });
  };

  // Handle incoming files
  const addFiles = async (incomingFiles: FileList | File[], isReplace = false) => {
    setErrorMessage(null);
    const filesArray = Array.from(incomingFiles);

    if (filesArray.length === 0) return;

    if (!isReplace && items.length + filesArray.length > MAX_FILES) {
      setErrorMessage(`You can resize a maximum of ${MAX_FILES} images at once.`);
      return;
    }

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
        setErrorMessage(
          `"${file.name}" has an unsupported format. Supported formats: JPG, PNG, WEBP, AVIF.`
        );
        continue;
      }

      if (file.size === 0) {
        setErrorMessage(`"${file.name}" is empty (0 bytes).`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          `"${file.name}" exceeds the maximum allowed file size of 50 MB.`
        );
        continue;
      }

      const previewUrl = registerUrl(URL.createObjectURL(file));
      const { width, height } = await inspectImageDimensions(file, previewUrl);

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        originalSizeFormatted: formatBytes(file.size),
        originalWidth: width,
        originalHeight: height,
        previewUrl,
        status: 'pending',
      });
    }

    if (newItems.length > 0) {
      if (isReplace) {
        // Clean up old items
        items.forEach((it) => {
          revokeRegisteredUrl(it.previewUrl);
          if (it.result?.resizedPreviewUrl) {
            revokeRegisteredUrl(it.result.resizedPreviewUrl);
          }
        });

        const firstW = newItems[0].originalWidth;
        const firstH = newItems[0].originalHeight;
        setTargetWidth(firstW);
        setTargetHeight(firstH);

        setItems(newItems);
        setSelectedItemId(newItems[0].id);
        setWorkflowStage('edit');
        setPreviewTab('resized');
      } else {
        // Appending / Initial upload
        setItems((prev) => {
          const combined = [...prev, ...newItems];
          if (prev.length === 0) {
            const firstW = newItems[0].originalWidth;
            const firstH = newItems[0].originalHeight;
            setTargetWidth(firstW);
            setTargetHeight(firstH);
            setSelectedItemId(newItems[0].id);
          }
          return combined;
        });

        if (workflowStage === 'upload' || workflowStage === 'review') {
          setWorkflowStage('edit');
          setPreviewTab('resized');
        }
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addMoreInputRef.current) addMoreInputRef.current.value = '';
    if (replaceInputRef.current) replaceInputRef.current.value = '';
  };

  // Adjust width with aspect ratio lock
  const handleWidthChange = (val: number) => {
    const newW = Math.max(1, val);
    setTargetWidth(newW);
    if (lockAspectRatio && activeAspect > 0) {
      setTargetHeight(Math.max(1, Math.round(newW / activeAspect)));
    }
  };

  // Adjust height with aspect ratio lock
  const handleHeightChange = (val: number) => {
    const newH = Math.max(1, val);
    setTargetHeight(newH);
    if (lockAspectRatio && activeAspect > 0) {
      setTargetWidth(Math.max(1, Math.round(newH * activeAspect)));
    }
  };

  // Preset selection handler
  const handleSelectPreset = (preset: ResizePreset) => {
    setSelectedPresetId(preset.id);
    setTargetWidth(preset.width);
    setTargetHeight(preset.height);
  };

  // Reset dimensions back to active image natural dimensions
  const handleResetSettings = () => {
    if (!activeItem) return;
    setMode('dimensions');
    setTargetWidth(activeItem.originalWidth);
    setTargetHeight(activeItem.originalHeight);
    setPercentage(100);
    setLockAspectRatio(true);
    setFitMode('scale');
    setOutputFormat('original');
    setQuality(0.92);
    showToast('Reset resize settings to original dimensions');
  };

  // Remove single image
  const removeItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const itemToRemove = items.find((i) => i.id === id);
    if (itemToRemove) {
      revokeRegisteredUrl(itemToRemove.previewUrl);
      if (itemToRemove.result?.resizedPreviewUrl) {
        revokeRegisteredUrl(itemToRemove.result.resizedPreviewUrl);
      }
    }

    const remaining = items.filter((i) => i.id !== id);
    setItems(remaining);

    if (remaining.length === 0) {
      setWorkflowStage('upload');
      setSelectedItemId(null);
    } else if (selectedItemId === id) {
      setSelectedItemId(remaining[0].id);
      if (lockAspectRatio) {
        const nextAspect = remaining[0].originalWidth / remaining[0].originalHeight;
        setTargetHeight(Math.max(1, Math.round(targetWidth / nextAspect)));
      }
    }
  };

  // Clear all images
  const clearAll = () => {
    items.forEach((it) => {
      revokeRegisteredUrl(it.previewUrl);
      if (it.result?.resizedPreviewUrl) {
        revokeRegisteredUrl(it.result.resizedPreviewUrl);
      }
    });
    setItems([]);
    setSelectedItemId(null);
    setWorkflowStage('upload');
    setErrorMessage(null);
  };

  // Execute Resizing
  const handleResize = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setProcessingStatus(`Resizing 1 of ${items.length} image${items.length > 1 ? 's' : ''}...`);
    trackToolEvent('image-resizer', 'tool_started');

    const updated: ImageItemState[] = [];

    for (let i = 0; i < items.length; i++) {
      const current = items[i];
      setProcessedCount(i + 1);
      setProcessingStatus(`Processing "${current.file.name}" (${i + 1} of ${items.length})...`);

      // Determine dimensions for this specific file
      let w = targetWidth;
      let h = targetHeight;

      if (mode === 'percentage') {
        const scale = percentage / 100;
        w = Math.max(1, Math.round(current.originalWidth * scale));
        h = Math.max(1, Math.round(current.originalHeight * scale));
      } else if (lockAspectRatio) {
        const itemAspect = current.originalWidth / current.originalHeight;
        h = Math.max(1, Math.round(w / itemAspect));
      }

      const opts: ResizeOptions = {
        mode: mode === 'percentage' ? 'percentage' : 'dimensions',
        targetWidth: w,
        targetHeight: h,
        percentage,
        lockAspectRatio,
        fitMode,
        outputFormat: outputFormat as any,
        quality,
      };

      try {
        const res = await resizeSingleImage(current.file, opts);
        registerUrl(res.resizedPreviewUrl);
        updated.push({
          ...current,
          status: 'done',
          result: res,
          errorMessage: undefined,
        });
      } catch (err: any) {
        updated.push({
          ...current,
          status: 'error',
          errorMessage: err?.message || 'Failed to resize image',
        });
      }
    }

    setItems(updated);
    setIsProcessing(false);
    setWorkflowStage('review');
    setPreviewTab('resized');
    trackToolEvent('image-resizer', 'tool_completed');
    showToast(`Successfully resized ${updated.filter((u) => u.status === 'done').length} image(s)!`);
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
    a.download = `${baseName}_resized_${item.result.resizedWidth}x${item.result.resizedHeight}${ext}`;
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
        const filename = `${baseName}_resized_${item.result.resizedWidth}x${item.result.resizedHeight}_${idx + 1}${ext}`;
        zip.file(filename, item.result.resizedBlob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `toolino_resized_images_${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded all resized images in ZIP archive!');
    } catch (err: any) {
      setErrorMessage(`Failed creating ZIP: ${err?.message || 'Error bundling files'}`);
    } finally {
      setIsZipping(false);
    }
  };

  // Total original bytes of all items
  const totalOriginalBytes = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.file.size, 0);
  }, [items]);

  // Total resized bytes of all processed items
  const totalResizedBytes = useMemo(() => {
    return items.reduce((acc, curr) => acc + (curr.result?.resizedSize || 0), 0);
  }, [items]);

  return (
    <div className="w-full bg-slate-50 font-sans flex flex-col min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden select-none">
      {/* Hidden File Inputs */}
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
      <input
        ref={addMoreInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files, true);
          }
        }}
      />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-3.5 flex flex-col flex-1 h-full min-h-0">
        {/* ========================================================================= */}
        {/* HEADER SECTION (Breadcrumb, Title, SaaS Badges)                          */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pb-2.5 border-b border-slate-200/80 shrink-0">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 mb-0.5"
            >
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

            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Image Resizer
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full">
                v1.0.0
              </span>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Files stay on your device</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 hidden md:block mt-0.5">
              Resize your image to the exact dimensions you need while keeping the correct proportions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {workflowStage !== 'upload' && (
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Remove all uploaded images"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Start Over</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mt-2.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-center justify-between gap-3 shadow-2xs shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span className="truncate">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 font-bold text-xs shrink-0 px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: INITIAL COMPACT UPLOAD STATE                                      */}
        {/* ========================================================================= */}
        {workflowStage === 'upload' && (
          <div className="flex-1 flex items-center justify-center py-6 min-h-0">
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
              className={`w-full max-w-xl border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50/70 scale-[1.01] shadow-lg shadow-blue-500/10'
                  : 'border-slate-300 hover:border-blue-400 bg-white shadow-xs hover:shadow-md'
              }`}
            >
              <div className="space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-xs">
                  <Maximize2 className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Upload your image
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Drag &amp; drop an image here or click below to choose
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-2"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Choose Image</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-600">
                    JPG • PNG • WEBP • AVIF • up to 20 files • up to 50 MB each
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>100% Client-Side • Your images stay on your device</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: MAIN RESIZE WORKSPACE (EDIT STAGE)                                 */}
        {/* ========================================================================= */}
        {workflowStage === 'edit' && activeItem && (
          <div className="flex-1 flex flex-col min-h-0 pt-2 pb-1 gap-2.5">
            {/* Top Compact Management Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[220px] sm:max-w-md">
                      {activeItem.file.name}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {activeItem.originalWidth} × {activeItem.originalHeight} px •{' '}
                      {activeItem.originalSizeFormatted}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {items.length === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => replaceInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Replace current image with another"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                      <span>Replace Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addMoreInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Add one or more images"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add More</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold text-slate-600 hidden sm:inline-block">
                      {items.length} images • {formatBytes(totalOriginalBytes)}
                    </span>
                    <button
                      type="button"
                      onClick={() => addMoreInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Add more images without error"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add More Images</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Two-Column Responsive Workspace */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
              {/* ----------------------------------------------------------------- */}
              {/* LEFT COLUMN: LIVE PREVIEW & COMPARISON (7 COLS)                   */}
              {/* ----------------------------------------------------------------- */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col shadow-xs min-h-0">
                {/* Preview Toolbar */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">Preview:</span>
                    <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200/70 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('resized')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                          previewTab === 'resized'
                            ? 'bg-white text-blue-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Target Size ({effectiveDimensions.width} × {effectiveDimensions.height})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('original')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                          previewTab === 'original'
                            ? 'bg-white text-blue-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Original ({activeItem.originalWidth} × {activeItem.originalHeight})
                      </button>
                    </div>
                  </div>

                  {isUpscaled && (
                    <div className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Upscaled</span>
                    </div>
                  )}
                </div>

                {/* Main Viewport Box */}
                <div className="flex-1 relative rounded-xl bg-slate-900/5 border border-slate-200/60 overflow-hidden flex items-center justify-center p-3 my-2 min-h-[220px]">
                  {/* Checkerboard Pattern for Alpha Channel */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        'radial-gradient(#475569 0.75px, transparent 0.75px), radial-gradient(#475569 0.75px, #f8fafc 0.75px)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 8px 8px',
                    }}
                  />

                  {/* Resized Aspect-Ratio Container */}
                  <div
                    className="relative max-w-full max-h-full flex items-center justify-center transition-all duration-300"
                    style={{
                      aspectRatio:
                        previewTab === 'original'
                          ? `${activeItem.originalWidth} / ${activeItem.originalHeight}`
                          : `${effectiveDimensions.width} / ${effectiveDimensions.height}`,
                    }}
                  >
                    <img
                      src={activeItem.previewUrl}
                      alt={activeItem.file.name}
                      className={`max-w-full max-h-[300px] lg:max-h-[360px] object-contain rounded-lg shadow-md transition-all ${
                        previewTab === 'resized' && fitMode === 'cover'
                          ? 'object-cover'
                          : 'object-contain'
                      }`}
                    />
                  </div>

                  {/* Live Dimensions Overlay Pill */}
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-2">
                    <span className="text-slate-300">
                      {previewTab === 'original' ? 'Original:' : 'Target:'}
                    </span>
                    <span className="font-bold text-white">
                      {previewTab === 'original'
                        ? `${activeItem.originalWidth} × ${activeItem.originalHeight} px`
                        : `${effectiveDimensions.width} × ${effectiveDimensions.height} px`}
                    </span>
                  </div>
                </div>

                {/* Multiple Images Thumbnail Strip */}
                {items.length > 1 && (
                  <div className="pt-2 border-t border-slate-100 shrink-0">
                    <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                      <span>Click to select &amp; preview image:</span>
                      <span className="text-slate-400 font-normal">
                        {items.length} files selected
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-thin">
                      {items.map((it) => {
                        const isSelected = it.id === activeItem.id;
                        return (
                          <div
                            key={it.id}
                            onClick={() => setSelectedItemId(it.id)}
                            className={`group relative shrink-0 w-16 h-16 rounded-xl border-2 cursor-pointer transition-all overflow-hidden flex items-center justify-center bg-slate-100 ${
                              isSelected
                                ? 'border-blue-600 ring-2 ring-blue-100 scale-105 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={it.previewUrl}
                              alt={it.file.name}
                              className="w-full h-full object-cover"
                            />

                            <button
                              type="button"
                              onClick={(e) => removeItem(it.id, e)}
                              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-slate-900/70 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete this image"
                            >
                              ✕
                            </button>

                            <div className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[8px] font-bold text-center py-0.5 truncate px-1">
                              {it.originalWidth}×{it.originalHeight}
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => addMoreInputRef.current?.click()}
                        className="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 text-slate-500 hover:text-blue-600 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all"
                        title="Add another image"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* RIGHT COLUMN: RESIZE SETTINGS & PRIMARY ACTION (5 COLS)           */}
              {/* ----------------------------------------------------------------- */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col justify-between shadow-xs min-h-0 overflow-y-auto">
                <div className="space-y-3.5">
                  {/* Title & Reset Button */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        Resize Settings
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetSettings}
                      className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                      title="Reset dimensions to original"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setMode('dimensions')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        mode === 'dimensions'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Exact Size
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('percentage')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        mode === 'percentage'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('preset')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        mode === 'preset'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Preset Size
                    </button>
                  </div>

                  {/* MODE A: EXACT DIMENSIONS */}
                  {mode === 'dimensions' && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Width */}
                        <div className="col-span-5">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Width (px)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="12000"
                            value={targetWidth}
                            onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 1)}
                            className="w-full border border-slate-300 focus:border-blue-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white outline-none shadow-2xs"
                          />
                        </div>

                        {/* Aspect Ratio Lock Toggle */}
                        <div className="col-span-2 flex flex-col items-center justify-end pt-5">
                          <button
                            type="button"
                            onClick={() => {
                              const nextLock = !lockAspectRatio;
                              setLockAspectRatio(nextLock);
                              if (nextLock && activeAspect > 0) {
                                setTargetHeight(Math.max(1, Math.round(targetWidth / activeAspect)));
                              }
                            }}
                            className={`p-1.5 rounded-xl border transition-all ${
                              lockAspectRatio
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-400 border-slate-300 hover:text-slate-700'
                            }`}
                            title={
                              lockAspectRatio
                                ? 'Aspect ratio locked: prevents distortion'
                                : 'Aspect ratio unlocked: image may be stretched'
                            }
                          >
                            {lockAspectRatio ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Height */}
                        <div className="col-span-5">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Height (px)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="12000"
                            value={targetHeight}
                            onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 1)}
                            className="w-full border border-slate-300 focus:border-blue-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white outline-none shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Aspect Ratio Status Hint */}
                      <div className="text-[11px] text-slate-500 flex items-center justify-between px-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          {lockAspectRatio ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" /> Keep aspect ratio active
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Unlocked (may distort)
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetWidth(activeItem.originalWidth);
                            setTargetHeight(activeItem.originalHeight);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
                        >
                          Use Original ({activeItem.originalWidth}×{activeItem.originalHeight})
                        </button>
                      </div>

                      {/* Quick Dimension Presets */}
                      <div className="pt-1 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Popular Dimensions:
                        </span>
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {[
                            { label: '1920×1080 (FHD)', w: 1920, h: 1080 },
                            { label: '1280×720 (HD)', w: 1280, h: 720 },
                            { label: '1080×1080 (Square)', w: 1080, h: 1080 },
                            { label: '800×600', w: 800, h: 600 },
                          ].map((dim) => (
                            <button
                              key={dim.label}
                              type="button"
                              onClick={() => {
                                setTargetWidth(dim.w);
                                if (lockAspectRatio && activeAspect > 0) {
                                  setTargetHeight(Math.max(1, Math.round(dim.w / activeAspect)));
                                } else {
                                  setTargetHeight(dim.h);
                                }
                              }}
                              className="px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition-colors"
                            >
                              {dim.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fit Mode */}
                      {!lockAspectRatio && (
                        <div className="pt-1">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Fitting Strategy
                          </label>
                          <select
                            value={fitMode}
                            onChange={(e) => setFitMode(e.target.value as any)}
                            className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white outline-none focus:border-blue-500"
                          >
                            <option value="scale">Exact Scale / Stretch</option>
                            <option value="cover">Crop Center to Fill</option>
                            <option value="contain">Contain with Letterbox</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MODE B: PERCENTAGE */}
                  {mode === 'percentage' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Scaling Factor</span>
                        <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
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

                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {[25, 50, 75, 100, 150, 200].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setPercentage(pct)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                              percentage === pct
                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between">
                        <span className="text-slate-500">Calculated size:</span>
                        <span className="font-bold text-slate-900">
                          {effectiveDimensions.width} × {effectiveDimensions.height} px
                        </span>
                      </div>
                    </div>
                  )}

                  {/* MODE C: PRESET SIZES */}
                  {mode === 'preset' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Choose Pre-Configured Size:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                        {RESIZE_PRESETS.map((p) => {
                          const isSelected =
                            targetWidth === p.width && targetHeight === p.height;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPreset(p)}
                              className={`p-2 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500 font-bold'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <div className="text-[11px] truncate">{p.name}</div>
                              <div className="text-[10px] text-slate-500 font-semibold">
                                {p.width} × {p.height} px
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Output Format & Quality Rows */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Format
                      </label>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white outline-none focus:border-blue-500"
                      >
                        <option value="original">Keep Original</option>
                        <option value="image/jpeg">JPG</option>
                        <option value="image/png">PNG (Lossless)</option>
                        <option value="image/webp">WebP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Quality
                      </label>
                      <select
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white outline-none focus:border-blue-500"
                      >
                        <option value="0.95">High Fidelity (95%)</option>
                        <option value="0.92">Standard (92%)</option>
                        <option value="0.80">Compact (80%)</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary Metric Card */}
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Current Size
                      </div>
                      <div className="font-bold text-slate-800">
                        {activeItem.originalWidth} × {activeItem.originalHeight} px
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        New Size
                      </div>
                      <div className="font-bold text-blue-700">
                        {effectiveDimensions.width} × {effectiveDimensions.height} px
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Resize Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleResize}
                    disabled={isProcessing || items.length === 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>
                      {items.length > 1
                        ? `Resize ${items.length} Images →`
                        : 'Resize Image →'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: RESULT STATE / REVIEW BEFORE DOWNLOAD                             */}
        {/* ========================================================================= */}
        {workflowStage === 'review' && activeItem && (
          <div className="flex-1 flex flex-col min-h-0 pt-2 pb-1 gap-3">
            {/* Success Summary Banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {items.length === 1
                      ? 'Image resized successfully!'
                      : `${items.filter((i) => i.status === 'done').length} images resized successfully!`}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Review your new image below and download when ready.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWorkflowStage('edit')}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Adjust Size</span>
                </button>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={downloadAllZip}
                    disabled={isZipping}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                    <span>Download All as ZIP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Review Cards Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
              {/* Visual Preview Box (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col shadow-xs min-h-0">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Resized Preview</span>
                    <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[200px]">
                      {activeItem.file.name}
                    </span>
                  </div>

                  {activeItem.result && (
                    <div className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold">
                      {activeItem.result.resizedWidth} × {activeItem.result.resizedHeight} px
                    </div>
                  )}
                </div>

                {/* Resized Image Output Box */}
                <div className="flex-1 relative rounded-xl bg-slate-900/5 border border-slate-200/60 overflow-hidden flex items-center justify-center p-3 my-2 min-h-[220px]">
                  {/* Checkerboard Pattern */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        'radial-gradient(#475569 0.75px, transparent 0.75px), radial-gradient(#475569 0.75px, #f8fafc 0.75px)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 8px 8px',
                    }}
                  />

                  <img
                    src={activeItem.result?.resizedPreviewUrl || activeItem.previewUrl}
                    alt={activeItem.file.name}
                    className="max-w-full max-h-[300px] lg:max-h-[360px] object-contain rounded-lg shadow-md relative z-10"
                  />
                </div>

                {/* Multiple Images Selector Strip in Review */}
                {items.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100 shrink-0 scrollbar-thin">
                    {items.map((it) => {
                      const isSelected = it.id === activeItem.id;
                      return (
                        <div
                          key={it.id}
                          onClick={() => setSelectedItemId(it.id)}
                          className={`shrink-0 w-14 h-14 rounded-xl border-2 cursor-pointer transition-all overflow-hidden flex items-center justify-center bg-slate-100 ${
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-100 scale-105 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 opacity-80'
                          }`}
                        >
                          <img
                            src={it.result?.resizedPreviewUrl || it.previewUrl}
                            alt={it.file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Result Details & Actions (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between shadow-xs min-h-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Result Details
                    </h3>
                  </div>

                  {/* Comparison Stats */}
                  <div className="space-y-2.5">
                    {/* Dimension Comparison */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Dimension Transformation
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500">Original:</span>{' '}
                          <span className="font-bold text-slate-800">
                            {activeItem.originalWidth} × {activeItem.originalHeight} px
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <span className="text-slate-500">New:</span>{' '}
                          <span className="font-bold text-blue-700">
                            {activeItem.result?.resizedWidth || targetWidth} ×{' '}
                            {activeItem.result?.resizedHeight || targetHeight} px
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* File Size Comparison */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        File Size
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500">Original:</span>{' '}
                          <span className="font-bold text-slate-800">
                            {activeItem.originalSizeFormatted}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <span className="text-slate-500">New:</span>{' '}
                          <span className="font-bold text-emerald-700">
                            {activeItem.result
                              ? formatBytes(activeItem.result.resizedSize)
                              : 'Calculated'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Format and Status */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Output Format
                        </span>
                        <span className="font-bold text-slate-800 uppercase">
                          {activeItem.result?.outputFormat.replace('image/', '') || 'JPG'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Scaling
                        </span>
                        <span className="font-bold text-slate-800">
                          {activeItem.result?.isUpscaled ? 'Upscaled' : 'Proportional'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => downloadSingle(activeItem)}
                    disabled={!activeItem.result}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Image</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWorkflowStage('edit')}
                      className="py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      <span>Adjust Size</span>
                    </button>

                    <button
                      type="button"
                      onClick={clearAll}
                      className="py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Resize Another</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PROCESSING OVERLAY                                                        */}
      {/* ========================================================================= */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-xs">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Resizing your image{items.length > 1 ? 's' : ''}...
              </h3>
              <p className="text-xs text-slate-500 mt-1">{processingStatus}</p>
            </div>

            {items.length > 1 && (
              <div className="space-y-1">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${(processedCount / items.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] font-semibold text-slate-400">
                  {processedCount} of {items.length} completed
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOAST NOTIFICATION                                                        */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
