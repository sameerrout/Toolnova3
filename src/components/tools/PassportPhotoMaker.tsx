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
  RotateCw,
  Printer,
  Maximize2,
  Layers,
  ZoomIn,
  Move,
  UserCheck,
  HelpCircle,
  FileText,
  ImageIcon,
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

const SAMPLE_PORTRAIT_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700"><rect width="600" height="700" fill="%23f8fafc"/><ellipse cx="300" cy="280" rx="100" ry="130" fill="%23fbb595"/><circle cx="260" cy="260" r="14" fill="%231e293b"/><circle cx="340" cy="260" r="14" fill="%231e293b"/><circle cx="264" cy="256" r="4" fill="%23ffffff"/><circle cx="344" cy="256" r="4" fill="%23ffffff"/><ellipse cx="300" cy="305" rx="12" ry="8" fill="%23f09070"/><path d="M270 340 Q300 365 330 340" stroke="%23b91c1c" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M190 230 C190 140 250 110 300 110 C350 110 410 140 410 230 C410 170 350 140 300 140 C250 140 190 170 190 230 Z" fill="%23374151"/><path d="M130 650 C150 480 200 420 300 420 C400 420 450 480 470 650 Z" fill="%231e3a8a"/><polygon points="300,420 280,480 320,480" fill="%23ffffff"/></svg>';

export function PassportPhotoMaker() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings
  const [selectedPreset, setSelectedPreset] = useState<CountryPreset>(COUNTRY_PRESETS[0]);
  const [selectedPaper, setSelectedPaper] = useState<PrintPaperOption>(PRINT_PAPERS[0]);
  const [activeTab, setActiveTab] = useState<'single' | 'sheet'>('single');

  // Interactive Adjustments
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [showBiometricGuide, setShowBiometricGuide] = useState<boolean>(true);
  const [addCutLines, setAddCutLines] = useState<boolean>(true);

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

  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Dragging interaction state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle uploaded file
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    setErrorMessage(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setSelectedImage(url);
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setRotation(0);
    };
    img.onerror = () => {
      setErrorMessage('Failed to decode portrait image.');
    };
    img.src = url;
  };

  const handleLoadSample = () => {
    setErrorMessage(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setSelectedImage(SAMPLE_PORTRAIT_URL);
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setRotation(0);
    };
    img.src = SAMPLE_PORTRAIT_URL;
  };

  // Re-render single photo and print sheet whenever parameters change
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
      setSingleResult(single);

      // 2. Setup offscreen canvas for tiling
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
        setSheetResult(sheet);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Error generating passport photos');
    } finally {
      setIsRendering(false);
    }
  }, [imageElement, selectedPreset, selectedPaper, zoom, panX, panY, rotation, bgColor, addCutLines]);

  useEffect(() => {
    if (imageElement) {
      const timer = setTimeout(() => {
        generatePhotos();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [imageElement, selectedPreset, selectedPaper, zoom, panX, panY, rotation, bgColor, addCutLines, generatePhotos]);

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { x: panX, y: panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanX(panStartRef.current.x + dx * 1.5);
    setPanY(panStartRef.current.y + dy * 1.5);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Download actions
  const handleDownloadSingle = () => {
    if (!singleResult) return;
    const a = document.createElement('a');
    a.href = singleResult.dataUrl;
    a.download = `Passport_Photo_${selectedPreset.id}_300DPI.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSheet = () => {
    if (!sheetResult) return;
    const a = document.createElement('a');
    a.href = sheetResult.dataUrl;
    a.download = `Passport_Print_Sheet_${selectedPaper.id}_${selectedPreset.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Header */}
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
              Passport Photo Maker
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Client-Side • Biometric Standard Verified
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Title & Introduction */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            Official Biometric Standards
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Free Passport Photo Maker Online
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Create compliant US, UK, Schengen, India, Canada, and Australia passport and visa photos. Biometric guides, automatic face scaling, and printable 4×6" photo sheets.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 max-w-4xl mx-auto">
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

        {/* State 1: Upload Dropzone if no image */}
        {!selectedImage ? (
          <div className="max-w-3xl mx-auto">
            <div
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
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 bg-white/70 hover:bg-blue-50/30 shadow-xs hover:shadow-md"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                <UploadCloud className="w-10 h-10" />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Upload your portrait photo
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Take a straight-on photo with shoulders visible and even lighting. We will automatically frame it to exact country standards.
              </p>

              <button
                type="button"
                className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                Select Portrait Photo
              </button>
            </div>

            {/* Quick Demo with Sample */}
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadSample}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition-all shadow-xs"
              >
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <span>Try with Sample Biometric Portrait</span>
              </button>
            </div>

            {/* Supported Standards Grid */}
            <div className="mt-12">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-4">
                Supported Country Passport & Visa Sizes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COUNTRY_PRESETS.slice(0, 8).map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-center"
                  >
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {preset.country}
                    </span>
                    <span className="text-[11px] font-mono text-blue-600 font-semibold mt-0.5 block">
                      {preset.widthMm} × {preset.heightMm} mm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* State 2: Interactive Cropping Studio & Layout Generator */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Interactive Canvas Viewport */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                {/* Viewport Top Controls */}
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                  {/* Mode tabs */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs">
                    <button
                      onClick={() => setActiveTab('single')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        activeTab === 'single'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Single Photo ({selectedPreset.widthMm}×{selectedPreset.heightMm}mm)
                    </button>
                    <button
                      onClick={() => setActiveTab('sheet')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        activeTab === 'sheet'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Sheet ({sheetResult?.photoCount || 6} Photos)
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBiometricGuide(!showBiometricGuide)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                        showBiometricGuide
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      Biometric Guides
                    </button>

                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImageElement(null);
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>

                {/* Viewport Display Canvas */}
                <div
                  className="relative select-none w-full min-h-[440px] max-h-[580px] flex items-center justify-center p-6 overflow-hidden bg-slate-100 cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {activeTab === 'single' ? (
                    /* Single Photo Preview with Biometric Guidelines */
                    <div
                      className="relative rounded-lg shadow-2xl overflow-hidden border-2 border-slate-300"
                      style={{
                        width: '320px',
                        height: `${Math.round(320 * (selectedPreset.heightMm / selectedPreset.widthMm))}px`,
                      }}
                    >
                      {singleResult && (
                        <img
                          src={singleResult.dataUrl}
                          alt="Cropped Passport"
                          className="w-full h-full object-cover block pointer-events-none"
                        />
                      )}

                      {/* Biometric Overlay Grid (Crown, Eye line, Chin line) */}
                      {showBiometricGuide && (
                        <div className="absolute inset-0 pointer-events-none border border-blue-500/40">
                          {/* Vertical Center Symmetry Line */}
                          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-blue-500/50 border-r border-dashed border-blue-400" />

                          {/* Top of Head / Crown Line (10-12% from top) */}
                          <div className="absolute left-0 right-0 top-[12%] border-t border-dashed border-amber-500/80">
                            <span className="absolute left-1 -top-4 text-[9px] font-bold text-amber-600 bg-white/80 px-1 rounded">
                              Top of Head
                            </span>
                          </div>

                          {/* Eye Level Line (40-44% from top) */}
                          <div className="absolute left-0 right-0 top-[42%] border-t border-dashed border-blue-500/80">
                            <span className="absolute left-1 -top-4 text-[9px] font-bold text-blue-600 bg-white/80 px-1 rounded">
                              Eye Level
                            </span>
                          </div>

                          {/* Chin Level Line (70-75% from top) */}
                          <div className="absolute left-0 right-0 top-[74%] border-t border-dashed border-emerald-500/80">
                            <span className="absolute left-1 -top-4 text-[9px] font-bold text-emerald-600 bg-white/80 px-1 rounded">
                              Chin Base
                            </span>
                          </div>

                          {/* Head Silhouette Oval */}
                          <div className="absolute top-[12%] bottom-[26%] left-[22%] right-[22%] rounded-[50%] border-2 border-blue-500/40" />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Print Sheet Preview */
                    <div className="max-w-full max-h-[500px] flex items-center justify-center p-2 bg-white rounded-xl shadow-lg border border-slate-300">
                      {sheetResult && (
                        <img
                          src={sheetResult.dataUrl}
                          alt="Print Sheet"
                          className="max-h-[460px] w-auto object-contain block shadow-xs"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Drag hint footer */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-6">
                  <span className="flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-blue-600" />
                    Click & drag photo on canvas to center your face inside the guides
                  </span>
                  <span>
                    Resolution: <strong className="text-slate-800">300 DPI (High-Res Print)</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Controls & Presets */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Card 1: Country & Standard Preset */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Country Standard</h3>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Select Document Type:
                  </label>
                  <select
                    value={selectedPreset.id}
                    onChange={(e) => {
                      const found = COUNTRY_PRESETS.find((p) => p.id === e.target.value);
                      if (found) setSelectedPreset(found);
                    }}
                    className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-blue-500 cursor-pointer"
                  >
                    {COUNTRY_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.country} — {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    {selectedPreset.description}
                  </p>
                </div>

                {/* Print Paper Format */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Print Sheet Paper Size:
                  </label>
                  <select
                    value={selectedPaper.id}
                    onChange={(e) => {
                      const found = PRINT_PAPERS.find((p) => p.id === e.target.value);
                      if (found) setSelectedPaper(found);
                    }}
                    className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-blue-500 cursor-pointer"
                  >
                    {PRINT_PAPERS.map((paper) => (
                      <option key={paper.id} value={paper.id}>
                        {paper.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Card 2: Interactive Zoom, Rotation & Background */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">Adjustments</h3>
                  </div>
                  <button
                    onClick={() => {
                      setZoom(1.0);
                      setPanX(0);
                      setPanY(0);
                      setRotation(0);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Reset Framing
                  </button>
                </div>

                {/* Zoom */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                    <span className="text-slate-700 font-semibold flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5" />
                      Face Scale (Zoom)
                    </span>
                    <span className="text-slate-500 font-mono">{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="2.2"
                    step="0.02"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Fine Rotation */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                    <span className="text-slate-700 font-semibold flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5" />
                      Straighten & Rotate
                    </span>
                    <span className="text-slate-500 font-mono">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="0.5"
                    value={rotation}
                    onChange={(e) => setRotation(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Background color choice */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    Background Color:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'White', color: '#ffffff' },
                      { label: 'Off-White', color: '#f8fafc' },
                      { label: 'Light Blue', color: '#e0f2fe' },
                      { label: 'Light Gray', color: '#f1f5f9' },
                    ].map((bg) => (
                      <button
                        key={bg.label}
                        onClick={() => setBgColor(bg.color)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                          bgColor === bg.color
                            ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/30 text-blue-700'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block border border-slate-300 align-middle mr-1"
                          style={{ backgroundColor: bg.color }}
                        />
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cut Lines Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-800">
                    Cutting Guide Borders (on print sheet)
                  </span>
                  <input
                    type="checkbox"
                    checked={addCutLines}
                    onChange={(e) => setAddCutLines(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Card 3: Download Buttons */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
                <button
                  onClick={handleDownloadSingle}
                  disabled={!singleResult || isRendering}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Single Photo ({selectedPreset.widthMm}×{selectedPreset.heightMm}mm)</span>
                </button>

                <button
                  onClick={handleDownloadSheet}
                  disabled={!sheetResult || isRendering}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download 4×6" Print Sheet ({sheetResult?.photoCount || 6} Photos)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
