'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  FileText,
  Globe,
  Sliders,
  Loader2,
  Image as ImageIcon,
  Settings2,
  Trash2,
  Plus,
  Layers,
  RotateCcw,
  CheckCircle2,
  Archive,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  SUPPORTED_OCR_LANGUAGES,
  OcrResult,
  OcrProgress,
  PreprocessOptions,
  recognizeTextFromImage,
  exportToDocx,
  exportToPdf,
  exportToTxt,
} from '@/core/engine/ocrEngine';
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface OcrItemState {
  id: string;
  file?: File;
  name: string;
  previewUrl: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalFormat: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: OcrProgress;
  extractedText: string;
  resultMetrics: OcrResult | null;
  errorMessage?: string;
}

interface SampleDoc {
  name: string;
  type: string;
  url: string;
  lang: string;
}

const SAMPLE_DOCS: SampleDoc[] = [
  {
    name: 'Business Invoice & Receipt',
    type: 'Invoice',
    lang: 'eng',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750"><rect width="600" height="750" fill="%23ffffff"/><text x="40" y="60" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="%231e293b">TOOLINO CLOUD SERVICES</text><text x="40" y="90" font-family="Arial,sans-serif" font-size="14" fill="%2364748b">Invoice Number: INV-2026-89412</text><text x="40" y="115" font-family="Arial,sans-serif" font-size="14" fill="%2364748b">Date: September 29, 2026</text><line x1="40" y1="140" x2="560" y2="140" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="180" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="%230f172a">Description</text><text x="440" y="180" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="%230f172a">Amount</text><text x="40" y="220" font-family="Arial,sans-serif" font-size="15" fill="%23334155">1. Enterprise Cloud Subscription</text><text x="440" y="220" font-family="Arial,sans-serif" font-size="15" fill="%23334155">$240.00</text><text x="40" y="260" font-family="Arial,sans-serif" font-size="15" fill="%23334155">2. Secure Document API Gateway</text><text x="440" y="260" font-family="Arial,sans-serif" font-size="15" fill="%23334155">$120.00</text><text x="40" y="300" font-family="Arial,sans-serif" font-size="15" fill="%23334155">3. Dedicated Privacy Sandbox</text><text x="440" y="300" font-family="Arial,sans-serif" font-size="15" fill="%23334155">$85.00</text><line x1="40" y1="340" x2="560" y2="340" stroke="%23cbd5e1" stroke-width="1"/><text x="320" y="380" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="%230f172a">Total Due: $445.00 USD</text><text x="40" y="440" font-family="Arial,sans-serif" font-size="13" fill="%2394a3b8">Thank you for your business! Payment is due within 30 days.</text></svg>',
  },
  {
    name: 'Book Page Paragraph',
    type: 'Book',
    lang: 'eng',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="500" viewBox="0 0 600 500"><rect width="600" height="500" fill="%23fefdf9"/><text x="50" y="80" font-family="Georgia,serif" font-size="20" font-weight="bold" fill="%231e293b">Chapter IV: The Future of Web Computing</text><text x="50" y="130" font-family="Georgia,serif" font-size="15" fill="%23334155">Modern web architectures have evolved from basic server-rendered</text><text x="50" y="165" font-family="Georgia,serif" font-size="15" fill="%23334155">pages into robust local processing environments. With WebAssembly</text><text x="50" y="200" font-family="Georgia,serif" font-size="15" fill="%23334155">and HTML5 Canvas APIs, intensive computational tasks like optical</text><text x="50" y="235" font-family="Georgia,serif" font-size="15" fill="%23334155">character recognition execute directly on user devices without</text><text x="50" y="270" font-family="Georgia,serif" font-size="15" fill="%23334155">compromising confidentiality or transmitting private records.</text></svg>',
  },
  {
    name: 'Printed Article Clip',
    type: 'Article',
    lang: 'eng',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420"><rect width="600" height="420" fill="%23f8fafc"/><text x="40" y="60" font-family="Helvetica,sans-serif" font-size="22" font-weight="bold" fill="%230f172a">ARTIFICIAL INTELLIGENCE REPORT</text><text x="40" y="95" font-family="Helvetica,sans-serif" font-size="13" font-weight="bold" fill="%232563eb">RESEARCH DIGEST • OCTOBER 2026</text><line x1="40" y1="115" x2="560" y2="115" stroke="%23e2e8f0" stroke-width="1.5"/><text x="40" y="150" font-family="Helvetica,sans-serif" font-size="15" fill="%23334155">High precision optical character recognition empowers users to</text><text x="40" y="185" font-family="Helvetica,sans-serif" font-size="15" fill="%23334155">digitize archived documents, contracts, and research papers in seconds.</text><text x="40" y="220" font-family="Helvetica,sans-serif" font-size="15" fill="%23334155">Combined with in-browser privacy standards, sensitive records are</text><text x="40" y="255" font-family="Helvetica,sans-serif" font-size="15" fill="%23334155">converted safely without cloud storage risks.</text><text x="40" y="320" font-family="Helvetica,sans-serif" font-size="13" fill="%2364748b">Verified by Toolino Research Team</text></svg>',
  },
];

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function ImageToText() {
  const [items, setItems] = useState<OcrItemState[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OCR Settings
  const [language, setLanguage] = useState<string>('eng');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  // Preprocessing Options
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [preprocess, setPreprocess] = useState<PreprocessOptions>({
    grayscale: true,
    enhanceContrast: true,
    binarize: false,
    threshold: 130,
    invert: false,
  });

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addMoreInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

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

  // Clean up object URLs on unmount or item removal
  useEffect(() => {
    return () => {
      items.forEach((it) => {
        if (it.previewUrl && it.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(it.previewUrl);
        }
      });
    };
  }, [items]);

  // Current selected item
  const selectedItem = items[selectedIndex] || items[0] || null;

  // Run OCR on a specific item
  const executeOcrOnItem = useCallback(
    async (item: OcrItemState, lang: string, options?: PreprocessOptions) => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: 'processing',
                progress: { status: 'Initializing OCR...', progress: 10 },
                errorMessage: undefined,
              }
            : it
        )
      );

      try {
        const res = await recognizeTextFromImage(
          item.file || item.previewUrl,
          lang,
          options,
          (p) => {
            setItems((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? {
                      ...it,
                      progress: p,
                    }
                  : it
              )
            );
          }
        );

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'done',
                  progress: { status: 'Done', progress: 100 },
                  extractedText: res.text,
                  resultMetrics: res,
                  errorMessage: undefined,
                }
              : it
          )
        );
        trackToolEvent('image-to-text', 'tool_completed');
      } catch (err: any) {
        console.error('OCR Error on item:', item.name, err);
        const errMsg = err?.message || "We couldn't read text from this image. Please try another one.";
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'error',
                  errorMessage: errMsg,
                }
              : it
          )
        );
        setErrorMessage(errMsg);
      }
    },
    []
  );

  // Safe file adding (supports single image or multiple; 1 image is ALWAYS valid)
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setErrorMessage(null);
      const newItems: OcrItemState[] = [];

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
        const ext = file.name.split('.').pop()?.toUpperCase() || 'IMG';

        const item: OcrItemState = {
          id,
          file,
          name: file.name,
          previewUrl,
          originalSize: file.size,
          originalWidth: 0,
          originalHeight: 0,
          originalFormat: ext === 'JPEG' ? 'JPG' : ext,
          status: 'idle',
          progress: { status: 'Queued', progress: 0 },
          extractedText: '',
          resultMetrics: null,
        };

        // Preload dimensions
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

        newItems.push(item);
      });

      if (newItems.length === 0 && files.length > 0) {
        setErrorMessage('Please select a supported image file (JPG, PNG, WebP, AVIF, BMP).');
        return;
      }

      setItems((prev) => {
        const updated = [...prev, ...newItems];
        return updated;
      });

      trackToolEvent('image-to-text', 'tool_opened');

      // Auto-run OCR on newly added items
      newItems.forEach((it) => {
        executeOcrOnItem(it, language, showFilters ? preprocess : undefined);
      });
    },
    [language, showFilters, preprocess, executeOcrOnItem]
  );

  // Load interactive demo sample
  const handleSampleSelect = useCallback(
    async (sample: SampleDoc) => {
      setErrorMessage(null);
      try {
        const res = await fetch(sample.url);
        const blob = await res.blob();
        const file = new File([blob], `${sample.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`, {
          type: 'image/png',
        });
        addFiles([file]);
      } catch {
        setErrorMessage('Could not load sample demo document.');
      }
    },
    [addFiles]
  );

  // Replace single image
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

    // Cleanup old URL
    if (selectedItem.previewUrl && selectedItem.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(selectedItem.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'IMG';

    const updatedItem: OcrItemState = {
      ...selectedItem,
      file,
      name: file.name,
      previewUrl,
      originalSize: file.size,
      originalWidth: 0,
      originalHeight: 0,
      originalFormat: ext === 'JPEG' ? 'JPG' : ext,
      status: 'idle',
      progress: { status: 'Preparing...', progress: 0 },
      extractedText: '',
      resultMetrics: null,
      errorMessage: undefined,
    };

    const img = new Image();
    img.onload = () => {
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === selectedIndex
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

    setItems((prev) => prev.map((it, idx) => (idx === selectedIndex ? updatedItem : it)));
    executeOcrOnItem(updatedItem, language, showFilters ? preprocess : undefined);
  };

  // Remove single item
  const handleRemoveItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // Clear all items / Start over
  const handleStartOver = () => {
    items.forEach((it) => {
      if (it.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(it.previewUrl);
      }
    });
    setItems([]);
    setSelectedIndex(0);
    setErrorMessage(null);
  };

  // Re-run OCR on current item
  const handleRunOcrAgain = () => {
    if (!selectedItem) return;
    executeOcrOnItem(selectedItem, language, showFilters ? preprocess : undefined);
  };

  // Update text in editor for current item
  const handleTextChange = (text: string) => {
    if (!selectedItem) return;
    setItems((prev) =>
      prev.map((it, idx) =>
        idx === selectedIndex
          ? {
              ...it,
              extractedText: text,
            }
          : it
      )
    );
  };

  // Clear text only for current item
  const handleClearText = () => {
    handleTextChange('');
  };

  // Copy to clipboard
  const handleCopyText = async () => {
    if (!selectedItem?.extractedText) return;
    try {
      await navigator.clipboard.writeText(selectedItem.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage('Failed to copy text to clipboard.');
    }
  };

  // Download single TXT
  const handleDownloadTxt = () => {
    if (!selectedItem?.extractedText) return;
    const blob = exportToTxt(selectedItem.extractedText);
    const base = selectedItem.name.replace(/\.[^.]+$/, '');
    downloadBlob(blob, `${base}_ocr.txt`);
  };

  // Download single DOCX (Word)
  const handleDownloadDocx = async () => {
    if (!selectedItem?.extractedText) return;
    try {
      const blob = await exportToDocx(selectedItem.extractedText, selectedItem.name);
      const base = selectedItem.name.replace(/\.[^.]+$/, '');
      downloadBlob(blob, `${base}_ocr.docx`);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to export as Word document.');
    }
  };

  // Download single PDF
  const handleDownloadPdf = async () => {
    if (!selectedItem?.extractedText) return;
    try {
      const blob = await exportToPdf(selectedItem.extractedText, selectedItem.name);
      const base = selectedItem.name.replace(/\.[^.]+$/, '');
      downloadBlob(blob, `${base}_ocr.pdf`);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to export as PDF document.');
    }
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    const doneItems = items.filter((it) => it.extractedText.trim().length > 0);
    if (doneItems.length === 0 || isExportingZip) return;

    try {
      setIsExportingZip(true);
      const zip = new JSZip();

      doneItems.forEach((it) => {
        const base = it.name.replace(/\.[^.]+$/, '');
        zip.file(`${base}_ocr.txt`, it.extractedText);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `Toollino_OCR_Extracted_Text_${new Date().toISOString().slice(0, 10)}.zip`);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to generate ZIP archive.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Live counters for current active item's text
  const currentText = selectedItem?.extractedText || '';
  const wordsCount = useMemo(() => (currentText.trim() ? currentText.trim().split(/\s+/).filter(Boolean).length : 0), [currentText]);
  const charsCount = currentText.length;
  const linesCount = useMemo(() => (currentText ? currentText.split('\n').length : 0), [currentText]);

  // Overall counts
  const totalOriginalBytes = useMemo(() => items.reduce((acc, it) => acc + it.originalSize, 0), [items]);
  const doneCount = items.filter((it) => it.status === 'done').length;

  return (
    <div className="bg-[#f8fafc] w-full min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden flex flex-col font-sans">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
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
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
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
            <span className="font-bold text-slate-900">Image to Text</span>
          </nav>

          {/* Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Image to Text (OCR)
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Extract text from images quickly and turn it into editable, copyable text.
                </p>
              </div>
            </div>

            {/* Truthful In-Browser Privacy Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                Your image stays on your device
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

        {/* MIDDLE SECTION: Upload Card OR Main Two-Column OCR Workspace */}
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
                  Image to Text
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-xs">
                  Drag &amp; drop your image here
                  <br />
                  <span className="text-slate-400 text-xs">or</span>
                </p>
                <button
                  type="button"
                  id="choose-image-button"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  Choose Image
                </button>
                <div className="flex items-center gap-2 mt-6 text-[11px] text-slate-400 font-medium flex-wrap justify-center">
                  <span>JPG • PNG • WEBP • BMP • Scans</span>
                  <span>•</span>
                  <span>Single or multiple images</span>
                  <span>•</span>
                  <span>Up to 100 MB</span>
                </div>
              </div>

              {/* Instant Sample Demos */}
              <div className="mt-5 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Or test instantly with a sample document:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {SAMPLE_DOCS.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => handleSampleSelect(sample)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition shadow-2xs cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span>{sample.name}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-mono">
                        {sample.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. MAIN OCR WORKSPACE (TWO-COLUMN BALANCED LAYOUT)                         */
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
                      {selectedItem?.name || 'Uploaded Document'}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{items.length} {items.length === 1 ? 'image' : 'images'}</span>
                      <span>•</span>
                      <span>{formatBytes(totalOriginalBytes)}</span>
                      {selectedItem?.originalWidth ? (
                        <>
                          <span>•</span>
                          <span>{selectedItem.originalWidth} × {selectedItem.originalHeight} px</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>

                {/* Queue & Action Buttons */}
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
                    id="replace-image-button"
                    onClick={() => replaceInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replace Image
                  </button>
                  <button
                    type="button"
                    id="remove-image-button"
                    onClick={handleStartOver}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Image
                  </button>
                </div>
              </div>

              {/* Multiple Images Selector Strip (when > 1 image exists) */}
              {items.length > 1 && (
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
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.previewUrl} alt="thumb" className="w-full h-full object-contain" />
                          </div>
                          <div className="min-w-0 max-w-[150px]">
                            <p className="text-[11px] font-bold text-slate-800 truncate" title={item.name}>
                              {item.name}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {item.status === 'done' ? (
                                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Text extracted
                                </span>
                              ) : item.status === 'processing' ? (
                                <span className="text-blue-600 font-semibold flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Reading...
                                </span>
                              ) : (
                                `${item.originalFormat} • ${formatBytes(item.originalSize)}`
                              )}
                            </span>
                          </div>
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
              )}

              {/* Main Workspace Split: Left (Image Preview) / Right (Extracted Text) */}
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
                {/* ------------------------------------------------------------- */}
                {/* LEFT: ORIGINAL IMAGE PREVIEW & OCR SETTINGS                   */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-6 flex flex-col min-h-0 bg-slate-50/60 p-3 sm:p-4">
                  {/* Image Preview Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 shrink-0 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      Original Image Preview
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {selectedItem?.originalFormat} • {selectedItem ? formatBytes(selectedItem.originalSize) : '—'} •{' '}
                      {selectedItem?.originalWidth > 0
                        ? `${selectedItem.originalWidth} × ${selectedItem.originalHeight} px`
                        : 'Image loaded'}
                    </span>
                  </div>

                  {/* Main Image Viewport with Checkerboard Frame */}
                  <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                    <div
                      className="relative w-full max-h-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/90 shadow-md flex items-center justify-center bg-white"
                      style={{
                        backgroundImage:
                          'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                      }}
                    >
                      {selectedItem ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={selectedItem.previewUrl}
                          alt="Source Document for OCR"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-slate-400 text-xs">No image selected</div>
                      )}
                    </div>
                  </div>

                  {/* OCR Settings Bar (Language, Filters, Re-run) */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 shrink-0 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {/* Language Selection Dropdown */}
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                        <Globe className="w-3.5 h-3.5 text-blue-600 ml-1.5 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-700 hidden sm:inline">Language:</span>
                        <select
                          id="ocr-language-select"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="text-xs font-semibold text-slate-800 bg-transparent border-0 py-1 pl-1 pr-6 focus:ring-0 cursor-pointer"
                        >
                          {SUPPORTED_OCR_LANGUAGES.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.flag} {l.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Scan Filters Drawer Toggle */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowFilters(!showFilters)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                            showFilters
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>Filters</span>
                        </button>

                        {/* Run OCR Again */}
                        <button
                          type="button"
                          id="run-ocr-again-button"
                          onClick={handleRunOcrAgain}
                          disabled={selectedItem?.status === 'processing'}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                        >
                          {selectedItem?.status === 'processing' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Reading...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Run OCR Again</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Preprocessing Filters Drawer */}
                    {showFilters && (
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] animate-in fade-in">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            checked={preprocess.enhanceContrast}
                            onChange={(e) => setPreprocess({ ...preprocess, enhanceContrast: e.target.checked })}
                            className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                          />
                          <span>Enhance Contrast</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            checked={preprocess.binarize}
                            onChange={(e) => setPreprocess({ ...preprocess, binarize: e.target.checked })}
                            className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                          />
                          <span>Binarize</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            checked={preprocess.invert}
                            onChange={(e) => setPreprocess({ ...preprocess, invert: e.target.checked })}
                            className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                          />
                          <span>Invert (Dark)</span>
                        </label>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span>Threshold:</span>
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={preprocess.threshold}
                            onChange={(e) => setPreprocess({ ...preprocess, threshold: parseInt(e.target.value, 10) })}
                            className="w-16 accent-blue-600 cursor-pointer h-1.5"
                          />
                          <span className="font-mono text-[10px]">{preprocess.threshold}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT: EXTRACTED TEXT EDITOR & ACTIONS                        */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-6 flex flex-col min-h-0 bg-white p-3 sm:p-4">
                  {/* Editor Header: Title, Confidence, Metrics, Clear */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 shrink-0 flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Extracted Text
                      </span>
                      {selectedItem?.resultMetrics && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            selectedItem.resultMetrics.confidence >= 80
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : selectedItem.resultMetrics.confidence >= 50
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {selectedItem.resultMetrics.confidence}% Confidence
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <span>
                        <strong className="text-slate-800 font-semibold">{wordsCount}</strong> words
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-slate-800 font-semibold">{charsCount}</strong> chars
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-slate-800 font-semibold">{linesCount}</strong> lines
                      </span>
                      {selectedItem?.extractedText && (
                        <button
                          type="button"
                          id="clear-text-button"
                          onClick={handleClearText}
                          className="text-slate-400 hover:text-rose-600 ml-1 font-medium transition cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Textarea with Processing Progress Overlay */}
                  <div className="flex-1 min-h-0 flex flex-col relative">
                    {selectedItem?.status === 'processing' && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10 p-6 rounded-2xl">
                        <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
                        <div className="text-center w-full max-w-xs">
                          <p className="text-xs font-bold text-slate-800">
                            Reading text from your image...
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {selectedItem.progress.status || 'Detecting text'}
                          </p>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-300"
                              style={{ width: `${selectedItem.progress.progress || 10}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <textarea
                      id="extracted-text-area"
                      value={selectedItem?.extractedText || ''}
                      onChange={(e) => handleTextChange(e.target.value)}
                      placeholder="Extracted text will appear here once processed. You can freely edit, format, or correct mistakes before downloading..."
                      className="w-full flex-1 p-3.5 text-xs font-mono text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl resize-none focus:outline-blue-500 leading-relaxed overflow-y-auto"
                    />
                  </div>

                  {/* Bottom Accuracy UX Notice */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 shrink-0 flex items-center justify-between gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span className="text-slate-400 italic">
                      Review the extracted text for accuracy before using it.
                    </span>

                    {/* Actions: Copy & Downloads */}
                    <div className="flex items-center gap-1.5">
                      {/* Copy Text Button */}
                      <button
                        type="button"
                        id="copy-text-button"
                        onClick={handleCopyText}
                        disabled={!selectedItem?.extractedText || selectedItem?.status === 'processing'}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 active:scale-[0.98] disabled:opacity-50 text-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">✓ Text copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-600" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>

                      {/* Download TXT */}
                      <button
                        type="button"
                        id="download-txt-button"
                        onClick={handleDownloadTxt}
                        disabled={!selectedItem?.extractedText || selectedItem?.status === 'processing'}
                        title="Download Plain Text (.txt)"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.TXT</span>
                      </button>

                      {/* Export Word (.docx) */}
                      <button
                        type="button"
                        id="download-docx-button"
                        onClick={handleDownloadDocx}
                        disabled={!selectedItem?.extractedText || selectedItem?.status === 'processing'}
                        title="Download Microsoft Word (.docx)"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-200/60 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Word</span>
                      </button>

                      {/* Export PDF (.pdf) */}
                      <button
                        type="button"
                        id="download-pdf-button"
                        onClick={handleDownloadPdf}
                        disabled={!selectedItem?.extractedText || selectedItem?.status === 'processing'}
                        title="Download Searchable PDF (.pdf)"
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      {/* Batch Export as ZIP (when > 1 images) */}
                      {items.length > 1 && (
                        <button
                          type="button"
                          id="download-all-zip-button"
                          onClick={handleDownloadAllZip}
                          disabled={doneCount === 0 || isExportingZip}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
                          title="Download all OCR text files as ZIP"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>ZIP ({doneCount})</span>
                        </button>
                      )}
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
              <span>Images are processed in memory and never uploaded to any server.</span>
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
