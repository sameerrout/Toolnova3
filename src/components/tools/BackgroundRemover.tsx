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
  Copy,
  Eye,
  Pipette,
  Eraser,
  Undo2,
  Maximize2,
  Layers,
  Palette,
  Split,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  MousePointer,
  Brush,
} from 'lucide-react';
import {
  removeBackground,
  BackgroundRemovalOptions,
  RemoveBackgroundResult,
  COLOR_PRESETS,
  GRADIENT_PRESETS,
} from '@/core/engine/backgroundRemoverEngine';
import { trackToolEvent } from '@/lib/analytics/tracker';

interface SampleImage {
  name: string;
  type: string;
  url: string;
}

const SAMPLE_IMAGES: SampleImage[] = [
  {
    name: 'Sneaker Product',
    type: 'Product',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23f1f5f9"/><path d="M120 380 C180 370 240 370 320 340 C380 320 440 270 480 250 C490 270 490 310 470 340 C440 380 370 420 280 430 C200 440 140 420 120 380 Z" fill="%232563eb"/><ellipse cx="280" cy="380" rx="90" ry="30" fill="%231d4ed8"/><path d="M180 375 C240 330 330 310 420 290" stroke="%23ffffff" stroke-width="12" stroke-linecap="round"/><circle cx="210" cy="340" r="14" fill="%23fbbf24"/></svg>',
  },
  {
    name: 'Studio Portrait',
    type: 'Portrait',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23e2e8f0"/><ellipse cx="300" cy="240" rx="90" ry="120" fill="%23fbb595"/><circle cx="265" cy="220" r="12" fill="%231e293b"/><circle cx="335" cy="220" r="12" fill="%231e293b"/><path d="M280 270 Q300 290 320 270" stroke="%23dc2626" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M160 520 C180 400 220 360 300 360 C380 360 420 400 440 520 Z" fill="%234338ca"/><path d="M210 210 C210 140 260 110 300 110 C340 110 390 140 390 210 C390 170 340 140 300 140 C260 140 210 170 210 210 Z" fill="%23451a03"/></svg>',
  },
  {
    name: 'Geometric Brand Logo',
    type: 'Graphic',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23ffffff"/><polygon points="300,120 460,440 140,440" fill="%230ea5e9"/><polygon points="300,200 400,400 200,400" fill="%236366f1"/><circle cx="300" cy="330" r="45" fill="%23f43f5e"/></svg>',
  },
];

export function BackgroundRemover() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalMeta, setOriginalMeta] = useState<{ width: number; height: number; size: number; name: string } | null>(null);

  // Status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStage, setProgressStage] = useState<string>('Preparing...');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Result
  const [result, setResult] = useState<RemoveBackgroundResult | null>(null);
  const maskHistoryRef = useRef<HTMLCanvasElement[]>([]);

  // Adjustment Options
  const [tolerance, setTolerance] = useState<number>(24); // 24% default
  const [feather, setFeather] = useState<number>(2); // 2px edge blur
  const [edgeShift, setEdgeShift] = useState<number>(-1); // -1px shrink halo
  const [despill, setDespill] = useState<boolean>(true);
  const [bgType, setBgType] = useState<'transparent' | 'solid' | 'gradient'>('transparent');
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [gradientType, setGradientType] = useState<'warm' | 'cool' | 'sunset' | 'dark' | 'neon' | 'mesh'>('warm');
  const [keyColor, setKeyColor] = useState<{ r: number; g: number; b: number } | null>(null);

  // Viewer / Tools
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'result-only'>('split');
  const [sliderPos, setSliderPos] = useState<number>(50); // 50%
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'pointer' | 'eyedropper' | 'erase' | 'restore'>('pointer');
  const [brushSize, setBrushSize] = useState<number>(24);

  // Drag over state
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPaintingRef = useRef<boolean>(false);

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

  // Format bytes helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Handle image upload
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP, AVIF).');
      return;
    }

    if (file.size > 40 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 40MB limit for browser processing.');
      return;
    }

    setErrorMessage(null);
    setOriginalFile(file);
    setKeyColor(null);
    maskHistoryRef.current = [];

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setOriginalMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        name: file.name,
      });
      setSelectedImage((prev) => {
        if (prev && prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev);
        }
        return url;
      });
      trackToolEvent('background-remover', 'tool_opened');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setErrorMessage('Unable to load or parse image. Please try another file.');
    };
    img.src = url;
  }, []);

  const handleSampleLoad = useCallback(async (sample: SampleImage) => {
    setErrorMessage(null);
    setSelectedImage((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return sample.url;
    });
    setOriginalFile(null);
    setKeyColor(null);
    maskHistoryRef.current = [];

    const img = new Image();
    img.onload = () => {
      setOriginalMeta({
        width: img.naturalWidth || 600,
        height: img.naturalHeight || 600,
        size: 45000,
        name: `${sample.name.toLowerCase().replace(/\s+/g, '_')}.png`,
      });
      trackToolEvent('background-remover', 'tool_opened');
    };
    img.src = sample.url;
  }, []);

  // Process Background Removal
  const runRemoval = useCallback(
    async (customMask?: HTMLCanvasElement | null) => {
      if (!selectedImage) return;

      try {
        setIsProcessing(true);
        setErrorMessage(null);

        const options: BackgroundRemovalOptions = {
          mode: keyColor ? 'color-key' : 'auto',
          keyColor,
          tolerance,
          feather,
          edgeShift,
          despill,
          bgType,
          bgColor: bgType === 'solid' ? bgColor : 'transparent',
          gradientType: bgType === 'gradient' ? gradientType : undefined,
        };

        const res = await removeBackground(
          selectedImage,
          options,
          customMask || (maskHistoryRef.current.length > 0 ? maskHistoryRef.current[maskHistoryRef.current.length - 1] : null),
          (p) => {
            setProgressStage(p.stage);
            setProgressPercent(p.percent);
          }
        );

        setResult(res);
      } catch (err: unknown) {
        console.error('Background removal error:', err);
        setErrorMessage('Unable to remove the background. Please try another image or adjust fine-tuning.');
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedImage, keyColor, tolerance, feather, edgeShift, despill, bgType, bgColor, gradientType]
  );

  // Trigger removal when image or key settings change
  useEffect(() => {
    if (selectedImage) {
      const timer = setTimeout(() => {
        runRemoval();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedImage, tolerance, feather, edgeShift, despill, bgType, bgColor, gradientType, keyColor]);

  // Color picker (Eyedropper) click on image
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'eyedropper' || !containerRef.current || !selectedImage) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const px = Math.floor(x * img.naturalWidth);
        const py = Math.floor(y * img.naturalHeight);
        const pixel = ctx.getImageData(px, py, 1, 1).data;
        setKeyColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
        setActiveTool('pointer');
      }
    };
    img.src = selectedImage;
  };

  // Touch-up Brush painting logic on maskCanvas
  const handleTouchDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((activeTool !== 'erase' && activeTool !== 'restore') || !result || !containerRef.current) return;
    isPaintingRef.current = true;
    applyBrushStroke(e);
  };

  const handleTouchMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPaintingRef.current || (activeTool !== 'erase' && activeTool !== 'restore')) return;
    applyBrushStroke(e);
  };

  const handleTouchUp = () => {
    if (isPaintingRef.current && result) {
      isPaintingRef.current = false;
      const clone = document.createElement('canvas');
      clone.width = result.maskCanvas.width;
      clone.height = result.maskCanvas.height;
      const cctx = clone.getContext('2d');
      if (cctx) cctx.drawImage(result.maskCanvas, 0, 0);
      maskHistoryRef.current.push(clone);

      runRemoval(result.maskCanvas);
    }
    isPaintingRef.current = false;
  };

  const applyBrushStroke = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!result || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    const maskCanvas = result.maskCanvas;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const cx = nx * maskCanvas.width;
    const cy = ny * maskCanvas.height;
    const scale = maskCanvas.width / rect.width;
    const r = (brushSize / 2) * scale;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (activeTool === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    }
    ctx.fill();
    ctx.restore();
  };

  const handleUndo = () => {
    if (maskHistoryRef.current.length === 0) return;
    maskHistoryRef.current.pop();
    const prevMask = maskHistoryRef.current.length > 0 ? maskHistoryRef.current[maskHistoryRef.current.length - 1] : null;
    runRemoval(prevMask);
  };

  // Reset to default sliders
  const handleResetFineTuning = () => {
    setTolerance(24);
    setFeather(2);
    setEdgeShift(-1);
    setDespill(true);
    setKeyColor(null);
  };

  // Reset all
  const handleStartOver = () => {
    setSelectedImage((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setOriginalFile(null);
    setOriginalMeta(null);
    setResult(null);
    setKeyColor(null);
    setBgType('transparent');
    setBgColor('transparent');
    maskHistoryRef.current = [];
    setErrorMessage(null);
  };

  // Download Output File
  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.dataUrl;
    const baseName = originalMeta?.name ? originalMeta.name.replace(/\.[^/.]+$/, '') : 'image';
    const ext = bgType === 'transparent' ? 'png' : 'jpg';
    a.download = `${baseName}_no_bg.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    trackToolEvent('background-remover', 'tool_completed');
  };

  // Copy transparent PNG to clipboard
  const handleCopy = async () => {
    if (!result) return;
    try {
      const item = new ClipboardItem({ 'image/png': result.blob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage('Direct clipboard copy is not supported in this browser. Please download the image.');
    }
  };

  // Drag split slider interactions
  const handleSliderMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, pos)));
  }, []);

  const handleSliderEnd = useCallback(() => {
    setIsDraggingSlider(false);
  }, []);

  useEffect(() => {
    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleSliderMove);
      window.addEventListener('mouseup', handleSliderEnd);
      window.addEventListener('touchmove', handleSliderMove);
      window.addEventListener('touchend', handleSliderEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleSliderMove);
      window.removeEventListener('mouseup', handleSliderEnd);
      window.removeEventListener('touchmove', handleSliderMove);
      window.removeEventListener('touchend', handleSliderEnd);
    };
  }, [isDraggingSlider, handleSliderMove, handleSliderEnd]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (selectedImage && selectedImage.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  return (
    <div className="bg-[#f8fafc] w-full min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden flex flex-col font-sans">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
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
            <Link href="/image-tools" className="hover:text-blue-600 transition-colors">
              Image Tools
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">Background Remover</span>
          </nav>

          {/* 2. Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <Eraser className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Background Remover
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Remove the background from your image automatically and download a clean transparent result.
                </p>
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">Your image stays on your device</span>
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
          {!selectedImage ? (
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
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFile(e.dataTransfer.files[0]);
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
                  Remove Image Background
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-xs">
                  Drag &amp; drop your image here, or click to choose from your device.
                </p>
                <button
                  type="button"
                  id="choose-image-button"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ImageIcon className="w-4 h-4" />
                  Choose Image
                </button>
                <div className="flex items-center gap-3 mt-6 text-[11px] text-slate-400 font-medium">
                  <span>JPG • PNG • WebP</span>
                  <span>•</span>
                  <span>Single image</span>
                  <span>•</span>
                  <span>Up to 40 MB</span>
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
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span>{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. MAIN WORKSPACE (TWO-COLUMN BALANCED LAYOUT)                             */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Document/Image Information Bar */}
              <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {originalMeta?.name || 'Uploaded Image'}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{originalMeta ? formatFileSize(originalMeta.size) : ''}</span>
                      <span>•</span>
                      <span>
                        {originalMeta ? `${originalMeta.width} × ${originalMeta.height}` : ''}
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
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition shadow-2xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Image
                  </button>
                </div>
              </div>

              {/* Main Workspace: Left (Preview) + Right (Settings) */}
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
                {/* ------------------------------------------------------------- */}
                {/* LEFT: INTERACTIVE BEFORE / AFTER PREVIEW CANVAS               */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-50/60 p-3 sm:p-4">
                  {/* View Toolbar: View Modes & Interactive Tools */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/60 shrink-0 text-xs">
                    {/* View Modes Tabs */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setViewMode('split')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          viewMode === 'split'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Split Slider
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('side-by-side')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          viewMode === 'side-by-side'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Side by Side
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('result-only')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          viewMode === 'result-only'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Result Only
                      </button>
                    </div>

                    {/* Interactive Touch-up Brush Tools */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setActiveTool('pointer')}
                        title="Pointer / Inspect"
                        className={`p-1.5 rounded-lg text-xs font-medium transition ${
                          activeTool === 'pointer'
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <MousePointer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTool('erase')}
                        title="Erase Brush (Remove leftovers)"
                        className={`p-1.5 rounded-lg text-xs font-medium transition ${
                          activeTool === 'erase'
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Eraser className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTool('restore')}
                        title="Restore Brush (Bring back parts)"
                        className={`p-1.5 rounded-lg text-xs font-medium transition ${
                          activeTool === 'restore'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Brush className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTool('eyedropper')}
                        title="Eyedropper (Sample background color to key out)"
                        className={`p-1.5 rounded-lg text-xs font-medium transition ${
                          activeTool === 'eyedropper'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Pipette className="w-3.5 h-3.5" />
                      </button>

                      {/* Undo Button */}
                      <button
                        type="button"
                        onClick={handleUndo}
                        disabled={maskHistoryRef.current.length === 0}
                        title="Undo brush stroke"
                        className="p-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Active Tool Helper Note */}
                  {activeTool !== 'pointer' && (
                    <div className="mb-2 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-lg flex items-center justify-between text-[11px] text-blue-900 shrink-0">
                      <span>
                        {activeTool === 'erase'
                          ? 'Erase Brush Active: Click & drag to remove leftover background.'
                          : activeTool === 'restore'
                          ? 'Restore Brush Active: Click & drag to restore accidentally removed subject parts.'
                          : 'Eyedropper Active: Click on the image to sample the background color.'}
                      </span>
                      {(activeTool === 'erase' || activeTool === 'restore') && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-[10px] text-slate-500">Size:</span>
                          <input
                            type="range"
                            min="10"
                            max="60"
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                            className="w-16 accent-blue-600 cursor-pointer h-1"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Canvas Viewport with Subtle Checkerboard */}
                  <div className="flex-1 min-h-0 flex items-center justify-center p-2 relative">
                    {/* View Mode 1: Split Slider */}
                    {viewMode === 'split' && (
                      <div
                        ref={containerRef}
                        onClick={handleCanvasClick}
                        onMouseDown={handleTouchDown}
                        onMouseMove={handleTouchMove}
                        onMouseUp={handleTouchUp}
                        className={`relative max-h-full max-w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/90 shadow-md select-none ${
                          activeTool === 'eyedropper'
                            ? 'cursor-crosshair'
                            : activeTool === 'erase' || activeTool === 'restore'
                            ? 'cursor-pointer'
                            : 'cursor-default'
                        }`}
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        {/* Background-Removed Result Layer */}
                        {result && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={result.dataUrl}
                            alt="Background removed"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        )}

                        {/* Original Image Layer (Clipped to slider percentage) */}
                        <div
                          className="absolute inset-0 overflow-hidden pointer-events-none"
                          style={{ width: `${sliderPos}%` }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedImage}
                            alt="Original"
                            className="absolute top-0 left-0 max-w-none h-full"
                            style={{
                              width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                              objectFit: 'contain',
                            }}
                          />
                          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/70 text-white text-[10px] font-bold backdrop-blur-xs">
                            Before
                          </span>
                        </div>

                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-blue-600/80 text-white text-[10px] font-bold backdrop-blur-xs pointer-events-none">
                          After
                        </span>

                        {/* Interactive Draggable Divider Handle */}
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsDraggingSlider(true);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            setIsDraggingSlider(true);
                          }}
                          className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-md flex items-center justify-center pointer-events-auto"
                          style={{ left: `${sliderPos}%` }}
                        >
                          <div className="w-7 h-7 -ml-3.5 rounded-full bg-white border border-slate-300 shadow-md flex items-center justify-center text-slate-600 hover:text-blue-600">
                            <Split className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Loading Spinner during automatic processing */}
                        {isProcessing && (
                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex flex-col items-center justify-center text-white gap-2">
                            <Loader2 className="w-7 h-7 animate-spin text-white" />
                            <span className="text-xs font-bold">{progressStage}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* View Mode 2: Side by Side */}
                    {viewMode === 'side-by-side' && (
                      <div className="w-full h-full grid grid-cols-2 gap-3 min-h-0">
                        {/* Before */}
                        <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                          <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                            Original
                          </div>
                          <div className="flex-1 flex items-center justify-center p-2 bg-slate-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedImage}
                              alt="Original"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        </div>

                        {/* After */}
                        <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                          <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-100 text-[11px] font-bold text-blue-700">
                            Background Removed
                          </div>
                          <div
                            className="flex-1 flex items-center justify-center p-2"
                            style={{
                              backgroundImage:
                                'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                              backgroundSize: '16px 16px',
                              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                              backgroundColor: '#ffffff',
                            }}
                          >
                            {result ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={result.dataUrl}
                                alt="Removed"
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View Mode 3: Result Only */}
                    {viewMode === 'result-only' && (
                      <div
                        className="relative max-h-full max-w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/90 shadow-md flex items-center justify-center"
                        style={{
                          backgroundImage:
                            bgType === 'transparent'
                              ? 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)'
                              : 'none',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                          backgroundColor: bgType === 'solid' ? bgColor : '#ffffff',
                        }}
                      >
                        {result ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={result.dataUrl}
                            alt="Result only"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            <span className="text-xs text-slate-500 font-medium">Processing...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Document Metrics Comparison Pills */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 shrink-0 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Original
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {originalMeta ? formatFileSize(originalMeta.size) : '—'} • {originalMeta?.width}×{originalMeta?.height}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Result
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {result ? formatFileSize(result.blob.size) : 'Processing...'} • {bgType === 'transparent' ? 'Transparent' : 'Color Fill'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT: BACKGROUND REMOVAL CONTROLS & SETTINGS                 */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 flex flex-col min-h-0 bg-white p-3 sm:p-4 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60 shrink-0">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-blue-600" />
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                        Background Tools
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetFineTuning}
                      className="text-[11px] font-medium text-slate-500 hover:text-blue-600 transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Fine-Tuning
                    </button>
                  </div>

                  <div className="space-y-4 flex-1 text-xs">
                    {/* 1. BACKGROUND REPLACEMENT */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1.5">
                        Background
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            setBgType('transparent');
                            setBgColor('transparent');
                          }}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                            bgType === 'transparent'
                              ? 'bg-white text-blue-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Transparent
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBgType('solid');
                            if (bgColor === 'transparent') setBgColor('#ffffff');
                          }}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                            bgType === 'solid'
                              ? 'bg-white text-blue-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Solid Color
                        </button>
                        <button
                          type="button"
                          onClick={() => setBgType('gradient')}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                            bgType === 'gradient'
                              ? 'bg-white text-blue-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Gradient
                        </button>
                      </div>

                      {/* Transparent info notice */}
                      {bgType === 'transparent' && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200/80 leading-relaxed">
                          Transparent background works well for logos, products, and profile images. Saved as high-res PNG.
                        </p>
                      )}

                      {/* Solid color palette */}
                      {bgType === 'solid' && (
                        <div className="space-y-2.5 animate-in fade-in-50">
                          <div className="grid grid-cols-5 gap-1.5">
                            {COLOR_PRESETS.slice(1).map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setBgColor(preset.value)}
                                title={preset.label}
                                className={`w-full aspect-square rounded-xl transition-all ${preset.preview} ${
                                  bgColor === preset.value
                                    ? 'ring-2 ring-blue-600 ring-offset-2 scale-105'
                                    : 'hover:scale-105'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Custom Hex Color */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="color"
                              value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                              onChange={(e) => setBgColor(e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                            />
                            <div className="flex-1 flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1 bg-white">
                              <span className="text-[10px] font-semibold text-slate-400">HEX:</span>
                              <input
                                type="text"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="w-full text-xs font-mono font-bold text-slate-800 outline-hidden"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gradient presets */}
                      {bgType === 'gradient' && (
                        <div className="grid grid-cols-2 gap-1.5 animate-in fade-in-50">
                          {Object.entries(GRADIENT_PRESETS).map(([key, grad]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setGradientType(key as any)}
                              className={`p-2 rounded-xl border text-left transition ${
                                gradientType === key
                                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div
                                className="w-full h-6 rounded-lg mb-1 shadow-2xs"
                                style={{
                                  background: `linear-gradient(135deg, ${grad.stops[0]}, ${grad.stops[1]})`,
                                }}
                              />
                              <span className="text-[10px] font-semibold text-slate-700 block truncate">
                                {grad.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. FINE-TUNING & EDGE CLEANUP */}
                    <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        Edge &amp; Color Fine-Tuning
                      </span>

                      {/* Color Tolerance */}
                      <div>
                        <div className="flex justify-between items-center text-[11px] font-medium mb-1">
                          <span className="text-slate-700 font-semibold">Color Tolerance</span>
                          <span className="font-mono text-slate-500 font-bold">{tolerance}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="65"
                          value={tolerance}
                          onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                          className="w-full accent-blue-600 cursor-pointer h-1.5"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Higher tolerance removes more background color.
                        </p>
                      </div>

                      {/* Edge Feathering */}
                      <div>
                        <div className="flex justify-between items-center text-[11px] font-medium mb-1">
                          <span className="text-slate-700 font-semibold">Edge Softness (Feathering)</span>
                          <span className="font-mono text-slate-500 font-bold">{feather} px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={feather}
                          onChange={(e) => setFeather(parseInt(e.target.value, 10))}
                          className="w-full accent-blue-600 cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Halo Removal */}
                      <div>
                        <div className="flex justify-between items-center text-[11px] font-medium mb-1">
                          <span className="text-slate-700 font-semibold">Halo Removal (Edge Shift)</span>
                          <span className="font-mono text-slate-500 font-bold">{edgeShift} px</span>
                        </div>
                        <input
                          type="range"
                          min="-4"
                          max="4"
                          value={edgeShift}
                          onChange={(e) => setEdgeShift(parseInt(e.target.value, 10))}
                          className="w-full accent-blue-600 cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Color Despill */}
                      <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-slate-200/80">
                        <div>
                          <span className="text-xs font-semibold text-slate-800 block">Color Despill</span>
                          <span className="text-[10px] text-slate-400">Neutralizes edge color reflections</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={despill}
                          onChange={(e) => setDespill(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* 3. DOWNLOAD & ACTIONS */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        id="download-image-button"
                        onClick={handleDownload}
                        disabled={!result || isProcessing}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Image ({bgType === 'transparent' ? 'PNG' : 'JPG'})</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopy}
                        disabled={!result || isProcessing}
                        className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy to Clipboard</span>
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

        {/* BOTTOM SECTION: Guarantee Badge */}
        {selectedImage && (
          <div className="shrink-0 pt-2 flex items-center justify-between gap-3 border-t border-slate-200/80">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Images are processed in memory and never uploaded to any server.</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>{originalMeta?.width} × {originalMeta?.height} px</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
