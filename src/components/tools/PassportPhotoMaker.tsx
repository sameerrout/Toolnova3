'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Download,
  RotateCw,
  Printer,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Move,
  UserCheck,
  ImageIcon,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronRight,
  ArrowRight,
  Check,
  Palette,
  Eye,
  EyeOff,
  FileText,
  X,
  Plus,
  Compass,
} from 'lucide-react';
import {
  CountryPreset,
  COUNTRY_PRESETS,
  PRINT_PAPERS,
  PrintPaperOption,
  renderSinglePassportPhoto,
  renderPassportPrintSheet,
  mmToPixels,
} from '@/core/engine/passportPhotoEngine';
import { trackToolEvent } from '@/lib/analytics/tracker';

const SAMPLE_PORTRAIT_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700"><rect width="600" height="700" fill="%23f8fafc"/><ellipse cx="300" cy="280" rx="100" ry="130" fill="%23fbb595"/><circle cx="260" cy="260" r="14" fill="%231e293b"/><circle cx="340" cy="260" r="14" fill="%231e293b"/><circle cx="264" cy="256" r="4" fill="%23ffffff"/><circle cx="344" cy="256" r="4" fill="%23ffffff"/><ellipse cx="300" cy="305" rx="12" ry="8" fill="%23f09070"/><path d="M270 340 Q300 365 330 340" stroke="%23b91c1c" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M190 230 C190 140 250 110 300 110 C350 110 410 140 410 230 C410 170 350 140 300 140 C250 140 190 170 190 230 Z" fill="%23374151"/><path d="M130 650 C150 480 200 420 300 420 C400 420 450 480 470 650 Z" fill="%231e3a8a"/><polygon points="300,420 280,480 320,480" fill="%23ffffff"/></svg>';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const BG_PRESETS = [
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'off-white', label: 'Off-White', color: '#f8fafc' },
  { id: 'light-blue', label: 'Light Blue', color: '#e0f2fe' },
  { id: 'light-gray', label: 'Light Gray', color: '#f1f5f9' },
];

export function PassportPhotoMaker() {
  // Image Source State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    name: string;
    size: number;
    width: number;
    height: number;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings
  const [selectedPreset, setSelectedPreset] = useState<CountryPreset>(COUNTRY_PRESETS[0]);
  const [selectedPaper, setSelectedPaper] = useState<PrintPaperOption>(PRINT_PAPERS[0]);
  const [activePreviewTab, setActivePreviewTab] = useState<'single' | 'sheet'>('single');

  // Interactive Adjustments
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [showBiometricGuide, setShowBiometricGuide] = useState<boolean>(true);
  const [addCutLines, setAddCutLines] = useState<boolean>(true);

  // Workflow Screens
  const [showResultsScreen, setShowResultsScreen] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isGeneratingFinal, setIsGeneratingFinal] = useState<boolean>(false);

  // Generated Outputs
  const [singleResult, setSingleResult] = useState<{
    blob: Blob;
    dataUrl: string;
    width: number;
    height: number;
  } | null>(null);

  const [sheetResult, setSheetResult] = useState<{
    blob: Blob;
    dataUrl: string;
    width: number;
    height: number;
    photoCount: number;
  } | null>(null);

  // Dragging interaction state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up object URLs on change / unmount
  const cleanUpUrls = useCallback(() => {
    if (selectedImage && selectedImage.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImage);
    }
    if (singleResult?.dataUrl && singleResult.dataUrl.startsWith('blob:')) {
      URL.revokeObjectURL(singleResult.dataUrl);
    }
    if (sheetResult?.dataUrl && sheetResult.dataUrl.startsWith('blob:')) {
      URL.revokeObjectURL(sheetResult.dataUrl);
    }
  }, [selectedImage, singleResult, sheetResult]);

  useEffect(() => {
    return () => {
      cleanUpUrls();
    };
  }, [cleanUpUrls]);

  // Load uploaded image file
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose a supported image (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('This photo is too large. Please select a photo under 25MB.');
      return;
    }

    setErrorMessage(null);
    cleanUpUrls();

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setSelectedImage(url);
      setUploadedFile(file);
      setImageMeta({
        name: file.name,
        size: file.size,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setRotation(0);
      setShowResultsScreen(false);
      trackToolEvent('passport-photo-maker', 'tool_opened');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setErrorMessage("We couldn't read this image. Please choose another one.");
    };
    img.src = url;
  };

  // Load sample demo portrait
  const handleLoadSample = () => {
    setErrorMessage(null);
    cleanUpUrls();

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setSelectedImage(SAMPLE_PORTRAIT_URL);
      setUploadedFile(null);
      setImageMeta({
        name: 'sample_portrait.png',
        size: 1450000,
        width: 600,
        height: 700,
      });
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setRotation(0);
      setShowResultsScreen(false);
      trackToolEvent('passport-photo-maker', 'tool_opened');
    };
    img.onerror = () => {
      setErrorMessage('Failed to load sample portrait.');
    };
    img.src = SAMPLE_PORTRAIT_URL;
  };

  // Reset entire session
  const handleStartOver = () => {
    cleanUpUrls();
    setSelectedImage(null);
    setImageElement(null);
    setUploadedFile(null);
    setImageMeta(null);
    setSingleResult(null);
    setSheetResult(null);
    setShowResultsScreen(false);
    setErrorMessage(null);
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    setRotation(0);
  };

  // Re-render single photo and print sheet preview
  const generatePhotos = useCallback(async () => {
    if (!imageElement) return;

    try {
      setIsRendering(true);

      // 1. Render single photo at 300 DPI
      const single = await renderSinglePassportPhoto(imageElement, {
        preset: selectedPreset,
        dpi: 300,
        cropZoom: zoom,
        panX,
        panY,
        rotation,
        backgroundColor: bgColor,
      });

      setSingleResult((prev) => {
        if (prev?.dataUrl && prev.dataUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prev.dataUrl);
        }
        return single;
      });

      // 2. Setup canvas for tiling onto sheet
      const singleCanvas = document.createElement('canvas');
      singleCanvas.width = single.width;
      singleCanvas.height = single.height;
      const sctx = singleCanvas.getContext('2d');
      if (sctx) {
        const sImg = new Image();
        await new Promise((res) => {
          sImg.onload = res;
          sImg.src = single.dataUrl;
        });
        sctx.drawImage(sImg, 0, 0);

        // 3. Render print sheet
        const sheet = await renderPassportPrintSheet(
          singleCanvas,
          selectedPreset,
          selectedPaper,
          300,
          addCutLines
        );

        setSheetResult((prev) => {
          if (prev?.dataUrl && prev.dataUrl.startsWith('blob:')) {
            URL.revokeObjectURL(prev.dataUrl);
          }
          return sheet;
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Error generating passport photos.');
    } finally {
      setIsRendering(false);
    }
  }, [imageElement, selectedPreset, selectedPaper, zoom, panX, panY, rotation, bgColor, addCutLines]);

  // Debounced preview update on adjustments
  useEffect(() => {
    if (imageElement) {
      const timer = setTimeout(() => {
        generatePhotos();
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [imageElement, selectedPreset, selectedPaper, zoom, panX, panY, rotation, bgColor, addCutLines, generatePhotos]);

  // Mouse / Touch Drag Interaction for Panning
  const handleDragStart = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: clientX, y: clientY };
    panStartRef.current = { x: panX, y: panY };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    setPanX(Math.round(panStartRef.current.x + dx * 1.4));
    setPanY(Math.round(panStartRef.current.y + dy * 1.4));
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
  };

  // Trigger Final Creation
  const handleCreatePassportPhoto = async () => {
    if (!imageElement) return;
    setIsGeneratingFinal(true);
    trackToolEvent('passport-photo-maker', 'tool_started');

    try {
      await generatePhotos();
      setShowResultsScreen(true);
      trackToolEvent('passport-photo-maker', 'tool_completed');
    } catch {
      setErrorMessage('Could not generate passport photo. Please check your image.');
    } finally {
      setIsGeneratingFinal(false);
    }
  };

  // Download actions
  const handleDownloadSingle = () => {
    if (!singleResult) return;
    const a = document.createElement('a');
    a.href = singleResult.dataUrl;
    const baseName = imageMeta?.name.replace(/\.[^.]+$/, '') || 'passport';
    a.download = `${baseName}_${selectedPreset.id}_300DPI.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSheet = () => {
    if (!sheetResult) return;
    const a = document.createElement('a');
    a.href = sheetResult.dataUrl;
    const baseName = imageMeta?.name.replace(/\.[^.]+$/, '') || 'passport';
    a.download = `${baseName}_sheet_${selectedPaper.id}_${selectedPreset.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Calculated Dimensions
  const approxPxWidth = mmToPixels(selectedPreset.widthMm, 300);
  const approxPxHeight = mmToPixels(selectedPreset.heightMm, 300);

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
            handleFileUpload(e.target.files[0]);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
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
            <span className="font-bold text-slate-900">Passport Photo Maker</span>
          </nav>

          {/* Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Passport Photo Maker
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Create passport and identity photos with the required size, background, and layout for your selected photo standard.
                </p>
              </div>
            </div>

            {/* Truthful Client-Side Processing Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                Your photo stays on your device
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
                className="text-red-600 hover:text-red-800 font-bold p-0.5"
                aria-label="Dismiss error message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* WORKFLOW VIEW: Initial Upload / Interactive Editor / Results Review */}
        {!selectedImage ? (
          /* ============================================================== */
          /* STAGE 1: INITIAL COMPACT UPLOAD CARD                           */
          /* ============================================================== */
          <div className="my-auto py-2 sm:py-6 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
            <div
              role="region"
              aria-label="Photo Upload Area"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className="w-full bg-white border-2 border-dashed border-slate-200/90 hover:border-blue-500 rounded-3xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-200 hover:bg-blue-50/20 shadow-xs hover:shadow-md group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3.5 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-200">
                <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Create Your Passport Photo
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Drag &amp; drop your photo here or click to browse
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-4 px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-sm transition-all inline-flex items-center gap-1.5"
              >
                <span>Choose Photo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="mt-3 text-[11px] font-medium text-slate-400">
                JPG • PNG • WebP • supported image formats (Single photo valid)
              </div>
            </div>

            {/* Quick Demo Sample Button */}
            <div className="mt-4 flex items-center justify-center">
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 transition-all shadow-2xs hover:shadow-xs"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Try with Sample Biometric Portrait</span>
              </button>
            </div>

            {/* Supported Standards Quick Showcase */}
            <div className="mt-5 w-full">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
                Supported Photo Standards
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COUNTRY_PRESETS.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-center"
                  >
                    <span className="text-[11px] font-bold text-slate-800 block truncate">
                      {p.country}
                    </span>
                    <span className="text-[10px] font-mono text-blue-600 font-semibold block">
                      {p.widthMm} × {p.heightMm} mm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : showResultsScreen ? (
          /* ============================================================== */
          /* STAGE 3: RESULTS SCREEN (REVIEW BEFORE DOWNLOAD)               */
          /* ============================================================== */
          <div className="flex-1 flex flex-col justify-between min-h-0 py-1 sm:py-2">
            {/* Top Bar for Results */}
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Photo Ready for Download
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full">
                      300 DPI High-Res
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {selectedPreset.name} • {selectedPreset.widthMm} × {selectedPreset.heightMm} mm ({approxPxWidth} × {approxPxHeight} px)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowResultsScreen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 shadow-2xs transition-all inline-flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Adjust Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-2xs transition-all inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Create Another</span>
                </button>
              </div>
            </div>

            {/* Results Preview & Downloads Box */}
            <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row items-center justify-center gap-6 overflow-hidden min-h-0">
              {/* Preview Window */}
              <div className="flex-1 w-full h-full flex flex-col items-center justify-center min-h-0">
                {/* Switch between Single Photo and Print Sheet preview */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs mb-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('single')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activePreviewTab === 'single'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Single Photo ({selectedPreset.widthMm}×{selectedPreset.heightMm}mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('sheet')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activePreviewTab === 'sheet'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Print Sheet ({sheetResult?.photoCount || 6} Copies)
                  </button>
                </div>

                <div className="flex-1 w-full flex items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200/80 min-h-0 overflow-hidden relative">
                  {activePreviewTab === 'single' ? (
                    singleResult ? (
                      <div className="relative shadow-md rounded-lg overflow-hidden border border-slate-300 max-h-[340px]">
                        <img
                          src={singleResult.dataUrl}
                          alt="Final Passport Photo Preview"
                          className="max-h-[320px] max-w-full object-contain block"
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">Rendering preview...</div>
                    )
                  ) : sheetResult ? (
                    <div className="relative shadow-md rounded-lg overflow-hidden border border-slate-300 max-h-[340px]">
                      <img
                        src={sheetResult.dataUrl}
                        alt="Final Print Sheet Preview"
                        className="max-h-[320px] max-w-full object-contain block bg-white"
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">Rendering print sheet...</div>
                  )}
                </div>
              </div>

              {/* Download Actions Sidebar Card */}
              <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Export Specifications
                  </span>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Standard</span>
                    <span className="font-semibold text-slate-900">{selectedPreset.country}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Dimensions</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPreset.widthMm} × {selectedPreset.heightMm} mm
                    </span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Pixel Resolution</span>
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {approxPxWidth} × {approxPxHeight} px (300 DPI)
                    </span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-600">Paper Sheet</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPaper.name.split('(')[0]} ({sheetResult?.photoCount || 6} photos)
                    </span>
                  </div>
                </div>

                {/* Primary Download Single Button */}
                <button
                  type="button"
                  onClick={handleDownloadSingle}
                  disabled={!singleResult}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Single Photo</span>
                </button>

                {/* Secondary Download Sheet Button */}
                <button
                  type="button"
                  onClick={handleDownloadSheet}
                  disabled={!sheetResult}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download Print Sheet ({sheetResult?.photoCount || 6} Copies)</span>
                </button>

                {/* Adjust Photo Return Button */}
                <button
                  type="button"
                  onClick={() => setShowResultsScreen(false)}
                  className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Adjust Framing or Settings</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* STAGE 2: INTERACTIVE WORKSPACE (TWO-COLUMN SaaS LAYOUT)        */
          /* ============================================================== */
          <div className="flex-1 flex flex-col justify-between min-h-0 py-1 sm:py-2">
            {/* Image Information Bar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base" role="img" aria-label="Photo">
                  📷
                </span>
                <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {imageMeta?.name || 'photo.jpg'}
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {formatBytes(imageMeta?.size || 0)} • {imageMeta?.width || 0} × {imageMeta?.height || 0}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => replaceInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 shadow-2xs transition-all"
                >
                  Replace Photo
                </button>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 shadow-2xs transition-all"
                >
                  Remove Photo
                </button>
              </div>
            </div>

            {/* Main 2-Column Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
              {/* LEFT 7 COLS: Live Interactive Canvas Preview */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden min-h-0">
                {/* Preview Toolbar */}
                <div className="px-3.5 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60 shrink-0">
                  {/* Single vs Sheet Preview Mode */}
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('single')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        activePreviewTab === 'single'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Single ({selectedPreset.widthMm}×{selectedPreset.heightMm}mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('sheet')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        activePreviewTab === 'sheet'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Print Sheet ({sheetResult?.photoCount || 6})
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Biometric Guide Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowBiometricGuide(!showBiometricGuide)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-all ${
                        showBiometricGuide
                          ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Guides</span>
                    </button>

                    {/* Reset Framing Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1.0);
                        setPanX(0);
                        setPanY(0);
                        setRotation(0);
                      }}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="Reset Pan, Zoom, and Rotation"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Live Canvas Viewport */}
                <div
                  className="flex-1 w-full relative select-none flex items-center justify-center p-3 bg-slate-100 overflow-hidden cursor-move min-h-0"
                  onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                  onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={(e) => {
                    if (e.touches && e.touches[0]) {
                      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches && e.touches[0]) {
                      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchEnd={handleDragEnd}
                >
                  {activePreviewTab === 'single' ? (
                    /* Single Photo Frame */
                    <div
                      className="relative rounded-lg shadow-lg overflow-hidden border border-slate-300 max-h-full transition-all"
                      style={{
                        width: '260px',
                        height: `${Math.round(260 * (selectedPreset.heightMm / selectedPreset.widthMm))}px`,
                        maxHeight: '100%',
                      }}
                    >
                      {singleResult ? (
                        <img
                          src={singleResult.dataUrl}
                          alt="Live Passport Preview"
                          className="w-full h-full object-cover block pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-400">
                          Rendering...
                        </div>
                      )}

                      {/* Biometric Overlay Guides */}
                      {showBiometricGuide && (
                        <div className="absolute inset-0 pointer-events-none border border-blue-500/40">
                          {/* Symmetry Center Line */}
                          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-blue-500/60 border-r border-dashed border-blue-400/80" />

                          {/* Top of Head / Crown Line */}
                          <div className="absolute left-0 right-0 top-[12%] border-t border-dashed border-amber-500/90">
                            <span className="absolute left-1 -top-3.5 text-[8px] font-bold text-amber-700 bg-white/90 px-1 rounded shadow-2xs">
                              Crown
                            </span>
                          </div>

                          {/* Eye Level Line */}
                          <div className="absolute left-0 right-0 top-[42%] border-t border-dashed border-blue-500/90">
                            <span className="absolute left-1 -top-3.5 text-[8px] font-bold text-blue-700 bg-white/90 px-1 rounded shadow-2xs">
                              Eyes
                            </span>
                          </div>

                          {/* Chin Base Line */}
                          <div className="absolute left-0 right-0 top-[74%] border-t border-dashed border-emerald-500/90">
                            <span className="absolute left-1 -top-3.5 text-[8px] font-bold text-emerald-700 bg-white/90 px-1 rounded shadow-2xs">
                              Chin
                            </span>
                          </div>

                          {/* Head Oval Framing Guide */}
                          <div className="absolute top-[12%] bottom-[26%] left-[22%] right-[22%] rounded-[50%] border-2 border-blue-500/40" />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Print Sheet Frame */
                    <div className="max-w-full max-h-full flex items-center justify-center p-2 bg-white rounded-xl shadow-md border border-slate-300">
                      {sheetResult ? (
                        <img
                          src={sheetResult.dataUrl}
                          alt="Live Sheet Preview"
                          className="max-h-[260px] w-auto object-contain block shadow-2xs"
                        />
                      ) : (
                        <div className="text-xs text-slate-400">Rendering sheet...</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Framing Adjustments Bar (Zoom + Straighten + Pan Arrows) */}
                <div className="p-2.5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1.5 min-w-[140px]">
                    <span className="text-[11px] font-bold text-slate-600">Zoom:</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.05).toFixed(2)))}
                      className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                      title="Zoom Out"
                    >
                      −
                    </button>
                    <span className="text-[11px] font-mono font-semibold text-slate-700 w-9 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.05).toFixed(2)))}
                      className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                      title="Zoom In"
                    >
                      +
                    </button>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.02"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-16 accent-blue-600 cursor-pointer hidden sm:block"
                    />
                  </div>

                  {/* Straighten Rotation */}
                  <div className="flex items-center gap-1.5 min-w-[130px]">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <RotateCw className="w-3 h-3 text-slate-500" />
                      Rotate:
                    </span>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      step="0.5"
                      value={rotation}
                      onChange={(e) => setRotation(parseFloat(e.target.value))}
                      className="w-16 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono font-semibold text-slate-700 w-7 text-right">
                      {rotation}°
                    </span>
                  </div>

                  {/* Pan Alignment Arrows */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold mr-0.5">Pan:</span>
                    <button
                      type="button"
                      onClick={() => setPanX((p) => p - 10)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]"
                      title="Move Left"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanY((p) => p - 10)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]"
                      title="Move Up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanY((p) => p + 10)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]"
                      title="Move Down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanX((p) => p + 10)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]"
                      title="Move Right"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPanX(0);
                        setPanY(0);
                      }}
                      className="px-1.5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-semibold"
                      title="Center Image"
                    >
                      Center
                    </button>
                  </div>
                </div>

                {/* Footer Status Bar */}
                <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                  <span className="flex items-center gap-1">
                    <Move className="w-3 h-3 text-blue-600" />
                    Drag photo on canvas to align face with guidelines
                  </span>
                  <span>
                    Output: <strong className="text-slate-800">{approxPxWidth} × {approxPxHeight} px</strong> at 300 DPI
                  </span>
                </div>
              </div>

              {/* RIGHT 5 COLS: Passport Settings & Actions */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-2.5 min-h-0">
                {/* Scrollable Settings Panel */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 space-y-3 flex-1 overflow-y-auto min-h-0">
                  {/* Photo Standard Section */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                      <span>Country / Photo Standard:</span>
                      <span className="text-[10px] font-mono text-blue-600 font-semibold">
                        {selectedPreset.widthMm} × {selectedPreset.heightMm} mm
                      </span>
                    </label>
                    <select
                      value={selectedPreset.id}
                      onChange={(e) => {
                        const found = COUNTRY_PRESETS.find((p) => p.id === e.target.value);
                        if (found) setSelectedPreset(found);
                      }}
                      className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-blue-500 cursor-pointer"
                    >
                      {COUNTRY_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.country} — {p.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Requirements can vary depending on the issuing authority. Check official requirements before submission.
                    </p>
                  </div>

                  {/* Background Color Section */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      Background Color:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {BG_PRESETS.map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => setBgColor(bg.color)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                            bgColor.toLowerCase() === bg.color.toLowerCase()
                              ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/40 text-blue-700'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-slate-300 inline-block shrink-0"
                            style={{ backgroundColor: bg.color }}
                          />
                          <span className="truncate">{bg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Print Sheet Options */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                      <span>Print Sheet Paper Size:</span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {sheetResult?.photoCount || 6} photos per sheet
                      </span>
                    </label>
                    <select
                      value={selectedPaper.id}
                      onChange={(e) => {
                        const found = PRINT_PAPERS.find((p) => p.id === e.target.value);
                        if (found) setSelectedPaper(found);
                      }}
                      className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-blue-500 cursor-pointer"
                    >
                      {PRINT_PAPERS.map((paper) => (
                        <option key={paper.id} value={paper.id}>
                          {paper.name}
                        </option>
                      ))}
                    </select>

                    {/* Cut Lines Checkbox */}
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none text-[11px] text-slate-700">
                      <input
                        type="checkbox"
                        checked={addCutLines}
                        onChange={(e) => setAddCutLines(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                      />
                      <span>Include dashed cutting guides on print sheet</span>
                    </label>
                  </div>

                  {/* Photo Tips Box */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Photo Tips
                    </span>
                    <ul className="text-[10px] text-slate-600 space-y-1">
                      <li className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Face camera directly with neutral expression</span>
                      </li>
                      <li className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Keep both eyes open and mouth closed</span>
                      </li>
                      <li className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Even lighting without strong facial shadows</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={handleCreatePassportPhoto}
                    disabled={!imageElement || isRendering || isGeneratingFinal}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all"
                  >
                    {isGeneratingFinal ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Preparing your passport photo...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Passport Photo</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
