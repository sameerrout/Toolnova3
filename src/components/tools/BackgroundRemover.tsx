'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import {
  removeBackground,
  BackgroundRemovalOptions,
  RemoveBackgroundResult,
  COLOR_PRESETS,
  GRADIENT_PRESETS,
} from '@/core/engine/backgroundRemoverEngine';

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
  const [originalMeta, setOriginalMeta] = useState<{ width: number; height: number; size: number } | null>(null);

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

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPaintingRef = useRef<boolean>(false);

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

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setOriginalMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
      });
      setSelectedImage(url);
      setKeyColor(null);
      maskHistoryRef.current = [];
    };
    img.onerror = () => {
      setErrorMessage('Failed to decode image.');
    };
    img.src = url;
  }, []);

  const handleSampleLoad = useCallback(async (sample: SampleImage) => {
    setErrorMessage(null);
    setSelectedImage(sample.url);
    setOriginalFile(null);
    setKeyColor(null);
    maskHistoryRef.current = [];

    const img = new Image();
    img.onload = () => {
      setOriginalMeta({
        width: img.naturalWidth || 600,
        height: img.naturalHeight || 600,
        size: 45000,
      });
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
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err?.message || 'Failed to remove background.');
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
    const x = ((e.clientX - rect.left) / rect.width);
    const y = ((e.clientY - rect.top) / rect.height);

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
      // Save mask state to history for undo
      const clone = document.createElement('canvas');
      clone.width = result.maskCanvas.width;
      clone.height = result.maskCanvas.height;
      const cctx = clone.getContext('2d');
      if (cctx) cctx.drawImage(result.maskCanvas, 0, 0);
      maskHistoryRef.current.push(clone);

      // Re-render composite using updated mask
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
    if (maskHistoryRef.current.length > 0) {
      maskHistoryRef.current.pop();
      const prev = maskHistoryRef.current[maskHistoryRef.current.length - 1] || null;
      runRemoval(prev);
    }
  };

  // Download handling
  const handleDownload = () => {
    if (!result) return;
    const ext = bgType === 'transparent' ? 'png' : 'jpg';
    const baseName = originalFile?.name ? originalFile.name.replace(/\.[^.]+$/, '') : 'removed_bg';
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = `${baseName}_toolino.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!result) return;
    try {
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({
            'image/png': result.blob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        throw new Error('ClipboardItem API not supported');
      }
    } catch {
      handleDownload();
    }
  };

  // Split slider drag handling
  const handleSliderMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDraggingSlider || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(pct);
    },
    [isDraggingSlider]
  );

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

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Breadcrumb & Header */}
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
              Background Remover
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
        {/* Title & Introduction */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Instant AI Silhouette Matting
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Free Online Background Remover
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Remove image backgrounds in 1 second. Clean edges, transparent PNGs, custom studio colors, and zero quality loss.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 max-w-4xl mx-auto animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-800">Processing Error</p>
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

        {/* State 1: Upload Dropzone if no image selected */}
        {!selectedImage ? (
          <div className="max-w-3xl mx-auto">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="relative group border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 bg-white/60 hover:bg-blue-50/30 shadow-xs hover:shadow-md"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-inner">
                <UploadCloud className="w-10 h-10" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Drop your image here, or browse
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Supports JPG, PNG, WebP, AVIF, HEIC up to 40MB. Works offline directly in your browser.
              </p>

              <button
                type="button"
                className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                Upload Photo
              </button>
            </div>

            {/* Quick Sample Image Demos */}
            <div className="mt-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Or try instantly with a sample image:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {SAMPLE_IMAGES.map((sample) => (
                  <button
                    key={sample.name}
                    onClick={() => handleSampleLoad(sample)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition-all shadow-xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>{sample.name}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {sample.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* State 2: Active Image Editor & Controls */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Interactive Preview Canvas */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Canvas Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                {/* View Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                  {/* View Mode Tabs */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs">
                    <button
                      onClick={() => setViewMode('split')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        viewMode === 'split'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Split className="w-3.5 h-3.5" />
                      Split Slider
                    </button>
                    <button
                      onClick={() => setViewMode('side-by-side')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        viewMode === 'side-by-side'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Side by Side
                    </button>
                    <button
                      onClick={() => setViewMode('result-only')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        viewMode === 'result-only'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Result
                    </button>
                  </div>

                  {/* Interactive Tools */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs">
                    <button
                      onClick={() => setActiveTool('pointer')}
                      title="Inspect / Default Cursor"
                      className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTool === 'pointer' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTool('eyedropper')}
                      title="Click background color on image to remove"
                      className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTool === 'eyedropper' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Pipette className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTool('erase')}
                      title="Erase Brush (Remove leftover background)"
                      className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTool === 'erase' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Eraser className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleUndo}
                      title="Undo touch-up brush stroke"
                      className="p-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Re-upload button */}
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setResult(null);
                      setOriginalFile(null);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Change Image
                  </button>
                </div>

                {/* Brush Size Helper Bar when tool active */}
                {(activeTool === 'erase' || activeTool === 'restore') && (
                  <div className="px-4 py-2 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Eraser className="w-3.5 h-3.5 text-blue-600" />
                      Touch-up Brush Active: Paint on preview to erase unwanted spots
                    </span>
                    <div className="flex items-center gap-2">
                      <span>Size: {brushSize}px</span>
                      <input
                        type="range"
                        min="8"
                        max="80"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                        className="w-24 accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Eyedropper Tip */}
                {activeTool === 'eyedropper' && (
                  <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Pipette className="w-3.5 h-3.5 text-amber-600" />
                      Eyedropper Tool Active: Click anywhere on the background to sample and remove that exact color.
                    </span>
                    <button
                      onClick={() => setActiveTool('pointer')}
                      className="text-amber-700 hover:text-amber-900 font-bold underline"
                    >
                      Done
                    </button>
                  </div>
                )}

                {/* Canvas Display Area */}
                <div
                  ref={containerRef}
                  onClick={handleCanvasClick}
                  onMouseDown={handleTouchDown}
                  onMouseMove={handleTouchMove}
                  onMouseUp={handleTouchUp}
                  className={`relative select-none w-full min-h-[420px] max-h-[650px] flex items-center justify-center p-4 overflow-hidden ${
                    activeTool === 'eyedropper'
                      ? 'cursor-crosshair'
                      : activeTool === 'erase' || activeTool === 'restore'
                      ? 'cursor-cell'
                      : 'cursor-default'
                  } bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100/60`}
                >
                  {/* Processing Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-800">{progressStage}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{progressPercent}% complete</p>
                      </div>
                    </div>
                  )}

                  {/* View Mode 1: Split Comparison Slider */}
                  {viewMode === 'split' && result && (
                    <div className="relative max-w-full max-h-[580px] rounded-2xl overflow-hidden shadow-md flex items-center justify-center">
                      {/* Underneath: Processed Image */}
                      <img
                        src={result.dataUrl}
                        alt="Background removed"
                        className="max-h-[580px] w-auto object-contain block"
                      />

                      {/* Overlay: Original Image clipped to slider pos */}
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none"
                        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                      >
                        <img
                          src={selectedImage}
                          alt="Original"
                          className="max-h-[580px] w-full h-full object-contain block"
                        />
                      </div>

                      {/* Interactive Divider Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                        style={{ left: `${sliderPos}%` }}
                        onMouseDown={() => setIsDraggingSlider(true)}
                        onTouchStart={() => setIsDraggingSlider(true)}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-slate-300 flex items-center justify-center text-slate-700">
                          <Split className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Labels */}
                      <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] font-semibold px-2 py-1 rounded-md backdrop-blur-xs pointer-events-none">
                        Original
                      </span>
                      <span className="absolute bottom-3 right-3 bg-blue-600/80 text-white text-[11px] font-semibold px-2 py-1 rounded-md backdrop-blur-xs pointer-events-none">
                        Removed
                      </span>
                    </div>
                  )}

                  {/* View Mode 2: Side-by-Side */}
                  {viewMode === 'side-by-side' && result && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-h-[580px]">
                      <div className="flex flex-col items-center justify-center bg-white/80 p-3 rounded-2xl border border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 mb-2">Original Photo</span>
                        <img
                          src={selectedImage}
                          alt="Original"
                          className="max-h-[460px] w-auto object-contain rounded-xl"
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center bg-white/80 p-3 rounded-2xl border border-slate-200">
                        <span className="text-xs font-semibold text-blue-600 mb-2">Background Removed</span>
                        <img
                          src={result.dataUrl}
                          alt="Removed"
                          className="max-h-[460px] w-auto object-contain rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {/* View Mode 3: Result Only */}
                  {viewMode === 'result-only' && result && (
                    <div className="flex items-center justify-center max-h-[580px]">
                      <img
                        src={result.dataUrl}
                        alt="Background removed result"
                        className="max-h-[580px] w-auto object-contain rounded-2xl shadow-md"
                      />
                    </div>
                  )}
                </div>

                {/* Footer specs */}
                {originalMeta && (
                  <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 px-6">
                    <div className="flex items-center gap-4">
                      <span>
                        Dimensions: <strong className="text-slate-700">{originalMeta.width} × {originalMeta.height} px</strong>
                      </span>
                      <span>
                        Original Size: <strong className="text-slate-700">{(originalMeta.size / 1024).toFixed(1)} KB</strong>
                      </span>
                    </div>
                    {keyColor && (
                      <div className="flex items-center gap-1.5">
                        <span>Sampled Key:</span>
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300"
                          style={{ backgroundColor: `rgb(${keyColor.r}, ${keyColor.g}, ${keyColor.b})` }}
                        />
                        <button
                          onClick={() => setKeyColor(null)}
                          className="text-blue-600 hover:underline font-semibold ml-1"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right 4 Cols: Adjustment Controls & Background Options */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Card 1: Background Replacement */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Background Replacement</h3>
                </div>

                {/* Background Type Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold text-slate-600">
                  <button
                    onClick={() => {
                      setBgType('transparent');
                      setBgColor('transparent');
                    }}
                    className={`py-1.5 rounded-lg transition-colors ${
                      bgType === 'transparent' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Transparent
                  </button>
                  <button
                    onClick={() => {
                      setBgType('solid');
                      if (bgColor === 'transparent') setBgColor('#ffffff');
                    }}
                    className={`py-1.5 rounded-lg transition-colors ${
                      bgType === 'solid' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Solid Color
                  </button>
                  <button
                    onClick={() => setBgType('gradient')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      bgType === 'gradient' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Gradient
                  </button>
                </div>

                {/* Solid Color Palette & Picker */}
                {bgType === 'solid' && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-slate-500">Popular Presets:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {COLOR_PRESETS.slice(1).map((color) => (
                        <button
                          key={color.label}
                          onClick={() => setBgColor(color.value)}
                          title={color.label}
                          className={`w-full aspect-square rounded-xl transition-all ${color.preview} ${
                            bgColor === color.value ? 'ring-2 ring-blue-600 ring-offset-2 scale-105' : 'hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Custom Hex Color Input */}
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="color"
                        value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-1"
                      />
                      <div className="flex-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Custom Hex
                        </label>
                        <input
                          type="text"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-full text-xs font-mono font-medium px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Studio Gradient Presets */}
                {bgType === 'gradient' && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(GRADIENT_PRESETS).map(([key, grad]) => (
                      <button
                        key={key}
                        onClick={() => setGradientType(key as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          gradientType === key
                            ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className="w-full h-8 rounded-lg mb-1.5 shadow-xs"
                          style={{
                            background: `linear-gradient(135deg, ${grad.stops[0]}, ${grad.stops[1]})`,
                          }}
                        />
                        <span className="text-[11px] font-semibold text-slate-700 block truncate">
                          {grad.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 2: Fine-Tuning Sliders */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">Fine-Tuning</h3>
                  </div>
                  <button
                    onClick={() => {
                      setTolerance(24);
                      setFeather(2);
                      setEdgeShift(-1);
                      setDespill(true);
                      setKeyColor(null);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Reset
                  </button>
                </div>

                {/* Tolerance */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                    <span className="text-slate-700 font-semibold">Color Tolerance</span>
                    <span className="text-slate-500 font-mono">{tolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="65"
                    value={tolerance}
                    onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Increase if background remains; decrease if subject disappears.
                  </p>
                </div>

                {/* Edge Feathering */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                    <span className="text-slate-700 font-semibold">Edge Feathering (Softness)</span>
                    <span className="text-slate-500 font-mono">{feather} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={feather}
                    onChange={(e) => setFeather(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Blurs edge boundaries for a natural blend without jagged pixels.
                  </p>
                </div>

                {/* Halo Removal (Erosion) */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                    <span className="text-slate-700 font-semibold">Halo Removal (Edge Shift)</span>
                    <span className="text-slate-500 font-mono">{edgeShift} px</span>
                  </div>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    value={edgeShift}
                    onChange={(e) => setEdgeShift(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Trims border halo (negative values remove edge fringes).
                  </p>
                </div>

                {/* Despill Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Color Despill</span>
                    <span className="text-[11px] text-slate-400">Neutralizes old background color reflections</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={despill}
                    onChange={(e) => setDespill(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Card 3: Export & Download */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={!result || isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download High-Res Image</span>
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!result || isProcessing}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Transparent PNG</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
