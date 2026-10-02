'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Loader2,
  Trash2,
  Plus,
  Archive,
  Image as ImageIcon,
  Palette,
  Maximize2,
  Layers,
  RotateCcw,
  CheckCheck,
  Split,
  Eye,
  Lock,
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
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface ImageItemState {
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
  resizeMode: 'original' | '75' | '50' | '25' | 'custom';
  customWidth?: number;
  customHeight?: number;
  outputFileName?: string;
}

interface SampleImage {
  name: string;
  type: string;
  url: string;
  format: string;
}

const SAMPLE_IMAGES: SampleImage[] = [
  {
    name: 'Camera Product',
    type: 'Product',
    format: 'PNG',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23f8fafc"/><rect x="150" y="140" width="300" height="200" rx="30" fill="%231e293b"/><circle cx="300" cy="240" r="70" fill="%23334155"/><circle cx="300" cy="240" r="50" fill="%230284c7"/><circle cx="280" cy="220" r="14" fill="%23ffffff" opacity="0.6"/><rect x="200" y="100" width="80" height="40" rx="8" fill="%23475569"/><circle cx="400" cy="180" r="12" fill="%23ef4444"/></svg>',
  },
  {
    name: 'Studio Portrait',
    type: 'Photo',
    format: 'JPG',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23e2e8f0"/><ellipse cx="300" cy="240" rx="90" ry="120" fill="%23fbb595"/><circle cx="265" cy="220" r="12" fill="%231e293b"/><circle cx="335" cy="220" r="12" fill="%231e293b"/><path d="M280 270 Q300 290 320 270" stroke="%23dc2626" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M160 520 C180 400 220 360 300 360 C380 360 420 400 440 520 Z" fill="%234338ca"/><path d="M210 210 C210 140 260 110 300 110 C340 110 390 140 390 210 C390 170 340 140 300 140 C260 140 210 170 210 210 Z" fill="%23451a03"/></svg>',
  },
  {
    name: 'Brand Logo Icon',
    type: 'Icon',
    format: 'WEBP',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="128" fill="%232563eb"/><polygon points="256,100 390,370 122,370" fill="%23ffffff"/><polygon points="256,170 340,340 172,340" fill="%232563eb"/><circle cx="256" cy="280" r="40" fill="%23f59e0b"/></svg>',
  },
];

const MATTE_COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
  { label: 'Light Gray', value: '#f1f5f9' },
  { label: 'Navy', value: '#0f172a' },
];

export function ImageConverter() {
  const [items, setItems] = useState<ImageItemState[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingIndex, setProcessingIndex] = useState<number>(0);
  const [processingTotal, setProcessingTotal] = useState<number>(0);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [showResultsScreen, setShowResultsScreen] = useState<boolean>(false);

  // Global Settings - Smart Defaults: JPG, 85% Quality, Original Size
  const [globalFormat, setGlobalFormat] = useState<SupportedOutputFormat>('jpeg');
  const [quality, setQuality] = useState<number>(0.85); // 85%
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [icoSize, setIcoSize] = useState<16 | 32 | 48 | 64 | 128 | 256>(64);
  const [globalResizeMode, setGlobalResizeMode] = useState<'original' | '75' | '50' | '25' | 'custom'>('original');
  const [customWidth, setCustomWidth] = useState<number | ''>('');
  const [customHeight, setCustomHeight] = useState<number | ''>('');
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [removeMetadata, setRemoveMetadata] = useState<boolean>(true);

  // Preview Mode: 'converted' | 'original' | 'split'
  const [previewTab, setPreviewTab] = useState<'converted' | 'original' | 'split'>('converted');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  // Live lightweight converted preview for currently selected item
  const [livePreviewResult, setLivePreviewResult] = useState<ConvertedResult | null>(null);
  const [isGeneratingLivePreview, setIsGeneratingLivePreview] = useState<boolean>(false);

  // File Inputs & Container Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addMoreInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Desktop single-screen overflow lock
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

  // Parse original format from file extension or mime
  const getFormatFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'IMG';
    return ext === 'JPEG' ? 'JPG' : ext;
  };

  // Safe file adding (supports single or multiple, 1 file is always valid)
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setErrorMessage(null);
      const newItems: ImageItemState[] = [];

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|avif|bmp|ico|gif|svg|tiff)$/i)) {
          return;
        }

        if (file.size > 100 * 1024 * 1024) {
          setErrorMessage(`"${file.name}" is too large. Maximum file size is 100 MB.`);
          return;
        }

        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const previewUrl = URL.createObjectURL(file);
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const fmtMeta = SUPPORTED_OUTPUT_FORMATS.find((f) => f.id === globalFormat) || SUPPORTED_OUTPUT_FORMATS[0];

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
                    customWidth: it.customWidth || img.naturalWidth,
                    customHeight: it.customHeight || img.naturalHeight,
                  }
                : it
            )
          );
        };
        img.onerror = () => {
          setErrorMessage(`We couldn't read "${file.name}". Please try another image.`);
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
          resizeMode: globalResizeMode,
          outputFileName: `${baseName}_converted.${fmtMeta.ext}`,
        });
      });

      if (newItems.length === 0 && files.length > 0) {
        setErrorMessage('Please select a supported image (JPG, PNG, WebP, AVIF, BMP, ICO, SVG, TIFF).');
        return;
      }

      setItems((prev) => [...prev, ...newItems]);
      setShowResultsScreen(false);
      trackToolEvent('image-converter', 'tool_opened');
    },
    [globalFormat, globalResizeMode]
  );

  // Load interactive demo sample
  const handleSampleLoad = useCallback(async (sample: SampleImage) => {
    setErrorMessage(null);
    try {
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], `${sample.name.toLowerCase().replace(/\s+/g, '_')}.${sample.format.toLowerCase()}`, {
        type: blob.type || 'image/png',
      });
      addFiles([file]);
    } catch {
      setErrorMessage('Could not load sample demo image.');
    }
  }, [addFiles]);

  // Clean up object URLs when unmounting or discarding items
  useEffect(() => {
    return () => {
      items.forEach((it) => {
        if (it.previewUrl && it.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(it.previewUrl);
        }
        if (it.result?.dataUrl && it.result.dataUrl.startsWith('blob:')) {
          URL.revokeObjectURL(it.result.dataUrl);
        }
      });
      if (livePreviewResult?.dataUrl && livePreviewResult.dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(livePreviewResult.dataUrl);
      }
    };
  }, [items, livePreviewResult]);

  // Active selected item
  const selectedItem = items[selectedIndex] || items[0] || null;

  // Sync custom width/height when selected item changes
  useEffect(() => {
    if (selectedItem && selectedItem.originalWidth > 0) {
      if (globalResizeMode === '75') {
        setCustomWidth(Math.round(selectedItem.originalWidth * 0.75));
        setCustomHeight(Math.round(selectedItem.originalHeight * 0.75));
      } else if (globalResizeMode === '50') {
        setCustomWidth(Math.round(selectedItem.originalWidth * 0.5));
        setCustomHeight(Math.round(selectedItem.originalHeight * 0.5));
      } else if (globalResizeMode === '25') {
        setCustomWidth(Math.round(selectedItem.originalWidth * 0.25));
        setCustomHeight(Math.round(selectedItem.originalHeight * 0.25));
      } else if (globalResizeMode === 'original') {
        setCustomWidth(selectedItem.originalWidth);
        setCustomHeight(selectedItem.originalHeight);
      }
    }
  }, [selectedItem, globalResizeMode]);

  // Handle Width change with aspect ratio locking
  const handleWidthChange = (val: number | '') => {
    setCustomWidth(val);
    if (lockAspectRatio && typeof val === 'number' && selectedItem && selectedItem.originalWidth > 0) {
      const ratio = selectedItem.originalHeight / selectedItem.originalWidth;
      setCustomHeight(Math.round(val * ratio));
    }
  };

  // Handle Height change with aspect ratio locking
  const handleHeightChange = (val: number | '') => {
    setCustomHeight(val);
    if (lockAspectRatio && typeof val === 'number' && selectedItem && selectedItem.originalHeight > 0) {
      const ratio = selectedItem.originalWidth / selectedItem.originalHeight;
      setCustomWidth(Math.round(val * ratio));
    }
  };

  // Target format definition metadata
  const currentFormatMeta = useMemo(() => {
    const target = selectedItem ? selectedItem.targetFormat : globalFormat;
    return SUPPORTED_OUTPUT_FORMATS.find((f) => f.id === target) || SUPPORTED_OUTPUT_FORMATS[0];
  }, [selectedItem, globalFormat]);

  // Check if original item has transparency that will be lost in target format
  const isLosingTransparency = useMemo(() => {
    if (!selectedItem) return false;
    const hasAlphaInput = ['PNG', 'WEBP', 'AVIF', 'ICO', 'SVG'].includes(selectedItem.originalFormat);
    return hasAlphaInput && !currentFormatMeta.supportsAlpha;
  }, [selectedItem, currentFormatMeta]);

  // Update target format globally
  const handleGlobalFormatChange = (fmt: SupportedOutputFormat) => {
    setGlobalFormat(fmt);
    const fmtMeta = SUPPORTED_OUTPUT_FORMATS.find((f) => f.id === fmt) || SUPPORTED_OUTPUT_FORMATS[0];

    setItems((prev) =>
      prev.map((item) => {
        const baseName = item.file.name.replace(/\.[^.]+$/, '');
        return {
          ...item,
          targetFormat: fmt,
          status: item.status === 'done' ? 'pending' : item.status,
          result: undefined,
          outputFileName: `${baseName}_converted.${fmtMeta.ext}`,
        };
      })
    );
  };

  // Handle Output File Name change for selected item
  const handleOutputFileNameChange = (newName: string) => {
    if (!selectedItem) return;
    setItems((prev) =>
      prev.map((it, idx) =>
        idx === selectedIndex
          ? {
              ...it,
              outputFileName: newName,
            }
          : it
      )
    );
  };

  // Remove single item
  const handleRemoveItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        if (target.previewUrl.startsWith('blob:')) URL.revokeObjectURL(target.previewUrl);
        if (target.result?.dataUrl.startsWith('blob:')) URL.revokeObjectURL(target.result.dataUrl);
      }
      return prev.filter((it) => it.id !== id);
    });

    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // Replace single item
  const handleReplaceItem = (file: File) => {
    if (!selectedItem) return;
    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|avif|bmp|ico|gif|svg|tiff)$/i)) {
      setErrorMessage('Please select a supported image file.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('This image is too large. Maximum file size is 100 MB.');
      return;
    }

    if (selectedItem.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(selectedItem.previewUrl);
    }
    if (selectedItem.result?.dataUrl.startsWith('blob:')) {
      URL.revokeObjectURL(selectedItem.result.dataUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const fmtMeta = SUPPORTED_OUTPUT_FORMATS.find((f) => f.id === selectedItem.targetFormat) || SUPPORTED_OUTPUT_FORMATS[0];

    const img = new Image();
    img.onload = () => {
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === selectedIndex
            ? {
                ...it,
                file,
                previewUrl,
                originalSize: file.size,
                originalWidth: img.naturalWidth,
                originalHeight: img.naturalHeight,
                originalFormat: getFormatFromExtension(file.name),
                status: 'pending',
                result: undefined,
                errorMessage: undefined,
                outputFileName: `${baseName}_converted.${fmtMeta.ext}`,
                customWidth: img.naturalWidth,
                customHeight: img.naturalHeight,
              }
            : it
        )
      );
    };
    img.onerror = () => {
      setErrorMessage("We couldn't read this image. Please try another one.");
    };
    img.src = previewUrl;
  };

  // Clear all / Start over
  const handleClearAll = () => {
    items.forEach((it) => {
      if (it.previewUrl.startsWith('blob:')) URL.revokeObjectURL(it.previewUrl);
      if (it.result?.dataUrl.startsWith('blob:')) URL.revokeObjectURL(it.result.dataUrl);
    });
    if (livePreviewResult?.dataUrl && livePreviewResult.dataUrl.startsWith('blob:')) {
      URL.revokeObjectURL(livePreviewResult.dataUrl);
      setLivePreviewResult(null);
    }
    setItems([]);
    setSelectedIndex(0);
    setShowResultsScreen(false);
    setErrorMessage(null);
  };

  // Generate lightweight live preview for selected item
  useEffect(() => {
    if (!selectedItem || selectedItem.status === 'done') return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsGeneratingLivePreview(true);
        const targetW =
          globalResizeMode !== 'original' && typeof customWidth === 'number' && customWidth > 0
            ? customWidth
            : undefined;
        const targetH =
          globalResizeMode !== 'original' && typeof customHeight === 'number' && customHeight > 0
            ? customHeight
            : undefined;

        const res = await convertSingleImage(selectedItem.file, {
          targetFormat: selectedItem.targetFormat,
          quality,
          backgroundColor,
          icoSize,
          resizeWidth: targetW,
          resizeHeight: targetH,
        });

        if (isMounted) {
          setLivePreviewResult((prev) => {
            if (prev?.dataUrl && prev.dataUrl.startsWith('blob:')) {
              URL.revokeObjectURL(prev.dataUrl);
            }
            return res;
          });
        } else {
          if (res.dataUrl && res.dataUrl.startsWith('blob:')) {
            URL.revokeObjectURL(res.dataUrl);
          }
        }
      } catch (err) {
        console.warn('Live preview generation error:', err);
      } finally {
        if (isMounted) setIsGeneratingLivePreview(false);
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    selectedItem?.id,
    selectedItem?.file,
    selectedItem?.targetFormat,
    selectedItem?.status,
    quality,
    backgroundColor,
    icoSize,
    globalResizeMode,
    customWidth,
    customHeight,
  ]);

  // Convert all images
  const handleConvertAll = async () => {
    if (items.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingTotal(items.length);

    const updatedItems = [...items];

    for (let i = 0; i < items.length; i++) {
      setProcessingIndex(i + 1);
      const current = updatedItems[i];

      try {
        const targetW =
          current.resizeMode !== 'original' && typeof customWidth === 'number' && customWidth > 0
            ? customWidth
            : undefined;
        const targetH =
          current.resizeMode !== 'original' && typeof customHeight === 'number' && customHeight > 0
            ? customHeight
            : undefined;

        const result = await convertSingleImage(current.file, {
          targetFormat: current.targetFormat,
          quality,
          backgroundColor,
          icoSize,
          resizeWidth: targetW,
          resizeHeight: targetH,
        });

        updatedItems[i] = {
          ...current,
          status: 'done',
          result,
          errorMessage: undefined,
        };
        setItems([...updatedItems]);
      } catch (err: any) {
        console.error('Conversion failed for item:', current.file.name, err);
        updatedItems[i] = {
          ...current,
          status: 'error',
          errorMessage: err?.message || 'Unable to convert this image',
        };
        setItems([...updatedItems]);
      }
    }

    setIsProcessing(false);
    setShowResultsScreen(true);
    trackToolEvent('image-converter', 'tool_completed');
  };

  // Download single converted image
  const handleDownloadItem = (item: ImageItemState) => {
    if (!item.result) return;
    const baseName = item.file.name.replace(/\.[^.]+$/, '');
    const filename = item.outputFileName || `${baseName}_converted.${item.result.outputExtension}`;

    const a = document.createElement('a');
    a.href = item.result.dataUrl;
    a.download = filename;
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
          const filename = item.outputFileName || `${baseName}_converted.${item.result.outputExtension}`;
          zip.file(filename, item.result.blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `Toollino_Converted_Images_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      setErrorMessage('Unable to generate ZIP archive. Please download images individually.');
    } finally {
      setIsZipping(false);
    }
  };

  // Calculate totals and savings
  const totalOriginalBytes = useMemo(() => items.reduce((acc, it) => acc + it.originalSize, 0), [items]);
  const totalConvertedBytes = useMemo(
    () => items.reduce((acc, it) => acc + (it.result?.outputSize || it.originalSize), 0),
    [items]
  );
  const doneCount = items.filter((it) => it.status === 'done' && it.result).length;

  // Split comparison dragging
  const handleSplitMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSplitPos(Math.min(100, Math.max(0, pos)));
  }, []);

  const handleSplitEnd = useCallback(() => {
    setIsDraggingSplit(false);
  }, []);

  useEffect(() => {
    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleSplitMove);
      window.addEventListener('mouseup', handleSplitEnd);
      window.addEventListener('touchmove', handleSplitMove);
      window.addEventListener('touchend', handleSplitEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleSplitMove);
      window.removeEventListener('mouseup', handleSplitEnd);
      window.removeEventListener('touchmove', handleSplitMove);
      window.removeEventListener('touchend', handleSplitEnd);
    };
  }, [isDraggingSplit, handleSplitMove, handleSplitEnd]);

  // Displayed Preview URL
  const displayedConvertedUrl = selectedItem?.result?.dataUrl || livePreviewResult?.dataUrl || selectedItem?.previewUrl;

  return (
    <div className="bg-[#f8fafc] w-full min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden flex flex-col font-sans">
      {/* Hidden File Inputs */}
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
      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        accept="image/*,.ico,.bmp,.tiff"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,.ico,.bmp,.tiff"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleReplaceItem(e.target.files[0]);
          }
          e.target.value = '';
        }}
      />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-3 flex-1 flex flex-col justify-between min-h-0">
        {/* TOP SECTION: Breadcrumb + Header + Privacy Badge + Alert */}
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
            <span className="font-bold text-slate-900">Image Converter</span>
          </nav>

          {/* Compact Page Header */}
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
                    Image Converter
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Convert your images to the format you need with a simple preview before downloading.
                </p>
              </div>
            </div>

            {/* Truthful Client-Side Processing Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                Your images stay on your device
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
                className="text-red-600 hover:text-red-900 font-bold text-xs shrink-0 ml-2 cursor-pointer"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* MIDDLE SECTION: Upload Card OR Main Workspace OR Result Review Screen */}
        <div className="flex-1 flex flex-col min-h-0 my-2">
          {items.length === 0 ? (
            /* ========================================================================= */
            /* 1. INITIAL UPLOAD STATE                                                   */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOver(false);
                  if (e.dataTransfer.files) {
                    addFiles(e.dataTransfer.files);
                  }
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
                  Convert Your Images
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-xs">
                  Drag &amp; drop images here
                  <br />
                  <span className="text-slate-400 text-xs">or</span>
                </p>
                <button
                  type="button"
                  id="choose-images-button"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  Choose Images
                </button>
                <div className="flex items-center gap-2 mt-6 text-[11px] text-slate-400 font-medium flex-wrap justify-center">
                  <span>JPG • PNG • WEBP • AVIF • BMP • ICO</span>
                  <span>•</span>
                  <span>Single or multiple images</span>
                  <span>•</span>
                  <span>Up to 100 MB</span>
                </div>
              </div>

              {/* Instant Sample Demos */}
              <div className="mt-5 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Or test instantly with a sample:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {SAMPLE_IMAGES.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => handleSampleLoad(sample)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition shadow-2xs cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span>{sample.name} ({sample.format})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : showResultsScreen ? (
            /* ========================================================================= */
            /* 2. RESULTS REVIEW STATE (REVIEW BEFORE DOWNLOAD)                           */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Results Top Header */}
              <div className="px-4 py-2.5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2">
                      <span>✓ Images converted successfully</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        {doneCount} of {items.length} Ready
                      </span>
                    </h2>
                    <p className="text-[11px] text-emerald-700">
                      Review your converted files below before downloading.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResultsScreen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Adjust Settings
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Convert Another
                  </button>
                </div>
              </div>

              {/* Conversion Metrics Summary Bar */}
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs shrink-0">
                <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Original Total
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {formatBytes(totalOriginalBytes)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Converted Total
                  </span>
                  <span className="text-xs font-bold text-blue-700">
                    {formatBytes(totalConvertedBytes)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    File Size Impact
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      totalConvertedBytes <= totalOriginalBytes ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {totalConvertedBytes <= totalOriginalBytes
                      ? `${Math.round((1 - totalConvertedBytes / (totalOriginalBytes || 1)) * 100)}% smaller`
                      : `Output is larger by ${Math.round((totalConvertedBytes / (totalOriginalBytes || 1) - 1) * 100)}%`}
                  </span>
                </div>
              </div>

              {/* Converted Files Grid */}
              <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                    >
                      {/* Image Preview with Neutral Checkerboard */}
                      <div
                        className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200 relative flex items-center justify-center mb-2.5"
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        {item.result ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.result.dataUrl}
                            alt={item.file.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center p-2">
                            <AlertCircle className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                            <span className="text-[10px] text-rose-600 font-semibold">
                              {item.errorMessage || 'Conversion Error'}
                            </span>
                          </div>
                        )}
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-[9px] uppercase shadow-2xs">
                          {item.result?.outputExtension || item.targetFormat}
                        </span>
                      </div>

                      {/* File Details */}
                      <div className="mb-3">
                        <p className="text-xs font-bold text-slate-800 truncate" title={item.file.name}>
                          {item.outputFileName || item.file.name}
                        </p>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-slate-400">
                            {item.originalFormat} ({formatBytes(item.originalSize)})
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold text-emerald-700">
                            {item.result ? formatBytes(item.result.outputSize) : 'Failed'}
                          </span>
                        </div>
                      </div>

                      {/* Download Button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadItem(item)}
                        disabled={!item.result}
                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download {item.result?.outputExtension.toUpperCase() || 'Image'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Batch Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <span className="text-xs text-slate-600 font-medium">
                  {doneCount} file{doneCount !== 1 ? 's' : ''} ready for download
                </span>

                <div className="flex items-center gap-2">
                  {doneCount > 1 && (
                    <button
                      type="button"
                      id="download-all-zip-button"
                      onClick={handleDownloadAllZip}
                      disabled={isZipping}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                    >
                      {isZipping ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating ZIP Archive...</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          <span>Download All as ZIP ({doneCount})</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowResultsScreen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    Adjust Settings
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 3. MAIN WORKSPACE (TWO-COLUMN BALANCED LAYOUT)                             */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Document Summary Bar */}
              <div className="px-4 py-2 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
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

                {/* Queue Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    id="add-more-images-button"
                    onClick={() => addMoreInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add More Images
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Start Over
                  </button>
                </div>
              </div>

              {/* Uploaded Images List Strip (Prompt Section 9 & 11) */}
              <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-200/70 shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
                  {items.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedIndex(idx)}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-left shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white/80 border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        {/* Thumbnail with checkerboard */}
                        <div
                          className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center"
                          style={{
                            backgroundImage:
                              'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                            backgroundSize: '8px 8px',
                            backgroundColor: '#ffffff',
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.previewUrl} alt="thumb" className="w-full h-full object-contain" />
                        </div>

                        {/* File Details: Name, Format, File Size, Dimensions */}
                        <div className="min-w-0 max-w-[170px]">
                          <p className="text-[11px] font-bold text-slate-800 truncate" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {item.originalFormat} • {formatBytes(item.originalSize)} •{' '}
                            {item.originalWidth > 0 ? `${item.originalWidth} × ${item.originalHeight}` : 'Loading...'}
                          </p>
                        </div>

                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveItem(item.id, e)}
                          title="Delete image"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition ml-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Workspace Split: Left (Preview) / Right (Conversion Settings) */}
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
                {/* ------------------------------------------------------------- */}
                {/* LEFT: IMAGE PREVIEW & COMPARISON                              */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-50/60 p-3 sm:p-4">
                  {/* Selected Image Information Header & Preview Tabs */}
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/60 shrink-0 text-xs flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-400">Selected:</span>
                        <span className="font-bold text-slate-800 truncate block max-w-[200px]" title={selectedItem?.file.name}>
                          {selectedItem?.file.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {selectedItem?.originalFormat} • {selectedItem ? formatBytes(selectedItem.originalSize) : '—'} •{' '}
                        {selectedItem?.originalWidth} × {selectedItem?.originalHeight} px
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Preview Tab Buttons */}
                      <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('converted')}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                            previewTab === 'converted'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Converted
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('original')}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                            previewTab === 'original'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Original
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('split')}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                            previewTab === 'split'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Split
                        </button>
                      </div>

                      {/* Replace Image Action */}
                      <button
                        type="button"
                        onClick={() => replaceInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Replace Image
                      </button>
                    </div>
                  </div>

                  {/* Transparency Notice if applicable */}
                  {isLosingTransparency && (
                    <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] flex items-center gap-2 shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        This format does not support transparent backgrounds. Transparent areas will be filled with the matte color selected on the right.
                      </span>
                    </div>
                  )}

                  {/* Main Preview Viewport */}
                  <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                    {previewTab === 'split' ? (
                      /* Split Comparison View */
                      <div
                        ref={previewContainerRef}
                        className="relative w-full max-h-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/90 shadow-md select-none"
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        {/* Converted Output Layer */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={displayedConvertedUrl}
                          alt="Converted"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                          {selectedItem?.targetFormat.toUpperCase()}
                        </span>

                        {/* Original Image Layer (Clipped) */}
                        <div
                          className="absolute inset-0 overflow-hidden pointer-events-none"
                          style={{ width: `${splitPos}%` }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedItem?.previewUrl}
                            alt="Original"
                            className="absolute top-0 left-0 max-w-none h-full"
                            style={{
                              width: previewContainerRef.current
                                ? `${previewContainerRef.current.clientWidth}px`
                                : '100%',
                              objectFit: 'contain',
                            }}
                          />
                          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold shadow-xs">
                            Original ({selectedItem?.originalFormat})
                          </span>
                        </div>

                        {/* Split Divider Handle */}
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsDraggingSplit(true);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            setIsDraggingSplit(true);
                          }}
                          className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-md flex items-center justify-center pointer-events-auto"
                          style={{ left: `${splitPos}%` }}
                        >
                          <div className="w-7 h-7 -ml-3.5 rounded-full bg-white border border-slate-300 shadow-md flex items-center justify-center text-slate-600 hover:text-blue-600">
                            <Split className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Single View (Original or Converted) */
                      <div
                        className="relative w-full max-h-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/90 shadow-md flex items-center justify-center"
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewTab === 'original' ? selectedItem?.previewUrl : displayedConvertedUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />

                        {isGeneratingLivePreview && previewTab === 'converted' && (
                          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] flex items-center gap-1.5 shadow-xs">
                            <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                            <span>Updating preview...</span>
                          </div>
                        )}

                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold shadow-xs">
                          {previewTab === 'original'
                            ? `Original (${selectedItem?.originalFormat})`
                            : `Target (${selectedItem?.targetFormat.toUpperCase()})`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Real Comparison Metrics Bar (Prompt Section 16 & 36) */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 shrink-0 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70 text-left">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Original Image
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {selectedItem?.originalFormat} • {selectedItem ? formatBytes(selectedItem.originalSize) : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {selectedItem?.originalWidth} × {selectedItem?.originalHeight} px
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/70 text-left">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Converted Preview
                      </span>
                      <span className="text-xs font-bold text-blue-700">
                        {selectedItem?.targetFormat.toUpperCase()} •{' '}
                        {livePreviewResult ? formatBytes(livePreviewResult.outputSize) : 'Estimating...'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {livePreviewResult && selectedItem && livePreviewResult.outputSize <= selectedItem.originalSize
                          ? `${Math.round((1 - livePreviewResult.outputSize / (selectedItem.originalSize || 1)) * 100)}% smaller`
                          : livePreviewResult && selectedItem
                          ? `Output is larger by ${Math.round((livePreviewResult.outputSize / (selectedItem.originalSize || 1) - 1) * 100)}%`
                          : typeof customWidth === 'number' && customWidth > 0
                          ? `${customWidth} × ${customHeight} px`
                          : 'Original Dimensions'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT: CONVERSION SETTINGS & ACTIONS                          */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 flex flex-col min-h-0 bg-white p-3 sm:p-4 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60 shrink-0">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900">Conversion Settings</h2>
                    </div>
                    <span className="text-[11px] text-slate-400">Apply to all images</span>
                  </div>

                  <div className="space-y-3.5 flex-1 text-xs">
                    {/* 1. Target Format Selection (Prompt Section 13) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          Convert To
                        </label>
                        <span className="text-[10px] text-slate-400">Choose output format</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {SUPPORTED_OUTPUT_FORMATS.map((fmt) => (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => handleGlobalFormatChange(fmt.id)}
                            className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                              (selectedItem ? selectedItem.targetFormat : globalFormat) === fmt.id
                                ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 shadow-2xs'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <span className="text-xs font-extrabold text-slate-900 block">{fmt.label}</span>
                            <span className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                              {fmt.supportsAlpha ? 'Transparency' : 'Solid'}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Format Description & Flow Indicator (Prompt Section 14) */}
                      <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-600">
                        <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                          <span>Current format: {selectedItem?.originalFormat}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-blue-700">Converting to: {currentFormatMeta.label}</span>
                        </div>
                        <p className="text-slate-500 text-[10px] leading-relaxed">
                          {currentFormatMeta.description}
                        </p>
                      </div>
                    </div>

                    {/* 2. Format-Specific Quality Slider (Prompt Section 15) */}
                    {currentFormatMeta.lossy && (
                      <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-medium">
                          <span className="text-slate-700 font-semibold">Quality</span>
                          <span className="font-mono text-blue-700 font-bold">{Math.round(quality * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="1.0"
                          step="0.05"
                          value={quality}
                          onChange={(e) => setQuality(parseFloat(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer h-1.5"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Lower Size</span>
                          <span>───────●──────</span>
                          <span>Better Quality</span>
                        </div>
                      </div>
                    )}

                    {/* 3. Matte Background Color (For non-alpha targets like JPG/BMP) */}
                    {!currentFormatMeta.supportsAlpha && (
                      <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
                        <div className="flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-xs font-semibold text-slate-800">
                            Matte Background Color
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          JPG and BMP do not support transparency. Transparent areas will be filled with this color.
                        </p>
                        <div className="flex items-center gap-2">
                          {MATTE_COLORS.map((col) => (
                            <button
                              key={col.value}
                              type="button"
                              onClick={() => setBackgroundColor(col.value)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                backgroundColor === col.value
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {col.label}
                            </button>
                          ))}
                          <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-7 h-7 rounded cursor-pointer border border-slate-200 p-0.5 ml-auto"
                            title="Custom Color"
                          />
                        </div>
                      </div>
                    )}

                    {/* 4. ICO Favicon Size Selector (If ICO selected) */}
                    {globalFormat === 'ico' && (
                      <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-800 block">
                          Favicon Icon Dimensions:
                        </label>
                        <select
                          value={icoSize}
                          onChange={(e) => setIcoSize(parseInt(e.target.value, 10) as any)}
                          className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl p-2 focus:outline-blue-500 cursor-pointer"
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

                    {/* 5. Resize Image Options (Prompt Section 18 & 19) */}
                    <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                          Resize Image
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {selectedItem?.originalWidth} × {selectedItem?.originalHeight} px
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1 text-[11px]">
                        {(['original', '75', '50', 'custom'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setGlobalResizeMode(mode)}
                            className={`py-1.5 rounded-lg font-semibold transition cursor-pointer text-center ${
                              globalResizeMode === mode
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {mode === 'original' ? 'Original Size' : mode === 'custom' ? 'Custom' : `${mode}%`}
                          </button>
                        ))}
                      </div>

                      {globalResizeMode === 'custom' && (
                        <div className="space-y-2 pt-1 border-t border-slate-200/60 animate-in fade-in-50">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Width (px)</label>
                              <input
                                type="number"
                                min="16"
                                max="10000"
                                value={customWidth}
                                onChange={(e) => handleWidthChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg p-1.5 outline-blue-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Height (px)</label>
                              <input
                                type="number"
                                min="16"
                                max="10000"
                                value={customHeight}
                                onChange={(e) => handleHeightChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg p-1.5 outline-blue-500"
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={lockAspectRatio}
                              onChange={(e) => setLockAspectRatio(e.target.checked)}
                              className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                            />
                            <span>Keep aspect ratio</span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* 6. Metadata Removal (Prompt Section 20) */}
                    <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={removeMetadata}
                          onChange={(e) => setRemoveMetadata(e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                        />
                        <span>Remove metadata</span>
                      </label>
                      <p className="text-[10px] text-slate-500 pl-5.5 mt-0.5">
                        Removes extra information stored inside the image.
                      </p>
                    </div>

                    {/* 7. Output File Name (Prompt Section 21) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Output File Name
                      </label>
                      <input
                        type="text"
                        value={selectedItem?.outputFileName || ''}
                        onChange={(e) => handleOutputFileNameChange(e.target.value)}
                        placeholder="file_converted.ext"
                        className="w-full text-xs font-mono font-medium text-slate-800 bg-white border border-slate-200 rounded-xl p-2 outline-blue-500"
                      />
                    </div>

                    {/* 8. Convert Button (Prompt Section 22 & 23) */}
                    <div className="pt-2">
                      <button
                        type="button"
                        id="convert-images-button"
                        onClick={handleConvertAll}
                        disabled={isProcessing || items.length === 0}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>
                              Converting your images... Processing {processingIndex} of {processingTotal}
                            </span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            <span>
                              {items.length === 1 ? 'Convert Image →' : `Convert ${items.length} Images →`}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Footer note */}
        {items.length > 0 && (
          <div className="shrink-0 pt-2 flex items-center justify-between gap-3 border-t border-slate-200/80 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Images stay on your device and are processed locally via browser Web APIs.</span>
            </div>

            <div className="flex items-center gap-2 font-semibold">
              <span>{items.length} image{items.length !== 1 ? 's' : ''} loaded</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
