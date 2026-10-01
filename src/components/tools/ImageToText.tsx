'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  FileCode,
  FileSpreadsheet,
  Globe,
  Sliders,
  Maximize2,
  Loader2,
  ImageIcon,
  Eye,
  Settings2,
} from 'lucide-react';
import {
  SUPPORTED_OCR_LANGUAGES,
  OcrLanguage,
  OcrResult,
  OcrProgress,
  PreprocessOptions,
  recognizeTextFromImage,
  exportToDocx,
  exportToPdf,
  exportToTxt,
} from '@/core/engine/ocrEngine';

interface SampleDoc {
  name: string;
  type: string;
  url: string;
  lang: string;
}

const SAMPLE_DOCS: SampleDoc[] = [
  {
    name: 'Business Invoice & Receipt',
    type: 'Document',
    lang: 'eng',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750"><rect width="600" height="750" fill="%23ffffff"/><text x="40" y="60" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="%231e293b">TOOLINO CLOUD SERVICES</text><text x="40" y="90" font-family="Arial,sans-serif" font-size="14" fill="%2364748b">Invoice Number: INV-2026-89412</text><text x="40" y="115" font-family="Arial,sans-serif" font-size="14" fill="%2364748b">Date: September 29, 2026</text><line x1="40" y1="140" x2="560" y2="140" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="180" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="%230f172a">Description</text><text x="440" y="180" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="%230f172a">Amount</text><text x="40" y="220" font-family="Arial,sans-serif" font-size="15" fill="%23334155">1. Enterprise Cloud Subscription</text><text x="440" y="220" font-family="Arial,sans-serif" font-size="15" fill="%23334155">$240.00</text><text x="40" y="260" font-family="Arial,sans-serif" font-size="15" fill="%23334155">2. Secure Document API Gateway</text><text x="440" y="260" font-family="Arial,sans-serif" font-size="15" fill="%23334155">$120.00</text><text x="40" y="300" font-family="Arial,sans-serif" font-size="15" fill="%23334155">3. Dedicated Privacy Sandbox</text><text x="440" y="300" font-family="Arial,sans-serif" font-size="15" fill="%23334155">$85.00</text><line x1="40" y1="340" x2="560" y2="340" stroke="%23cbd5e1" stroke-width="1"/><text x="320" y="380" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="%230f172a">Total Due: $445.00 USD</text><text x="40" y="440" font-family="Arial,sans-serif" font-size="13" fill="%2394a3b8">Thank you for your business! Payment is due within 30 days.</text></svg>',
  },
  {
    name: 'Book Page Paragraph',
    type: 'Literature',
    lang: 'eng',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="500" viewBox="0 0 600 500"><rect width="600" height="500" fill="%23fefdf9"/><text x="50" y="80" font-family="Georgia,serif" font-size="20" font-weight="bold" fill="%231e293b">Chapter IV: The Future of Web Computing</text><text x="50" y="130" font-family="Georgia,serif" font-size="15" fill="%23334155">Modern web architectures have evolved from basic server-rendered</text><text x="50" y="165" font-family="Georgia,serif" font-size="15" fill="%23334155">pages into robust local processing environments. With WebAssembly</text><text x="50" y="200" font-family="Georgia,serif" font-size="15" fill="%23334155">and HTML5 Canvas APIs, intensive computational tasks like optical</text><text x="50" y="235" font-family="Georgia,serif" font-size="15" fill="%23334155">character recognition execute directly on user devices without</text><text x="50" y="270" font-family="Georgia,serif" font-size="15" fill="%23334155">compromising confidentiality or transmitting private records.</text></svg>',
  },
];

export function ImageToText() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>('eng');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<OcrProgress>({ status: '', progress: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Results
  const [extractedText, setExtractedText] = useState<string>('');
  const [resultMetrics, setResultMetrics] = useState<OcrResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Preprocessing Options
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [preprocess, setPreprocess] = useState<PreprocessOptions>({
    grayscale: true,
    enhanceContrast: true,
    binarize: false,
    threshold: 130,
    invert: false,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle file select
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP, BMP).');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setExtractedText('');
    setResultMetrics(null);
  };

  const handleSampleSelect = (sample: SampleDoc) => {
    setErrorMessage(null);
    setSelectedFile(null);
    setSelectedImage(sample.url);
    setLanguage(sample.lang);
    setExtractedText('');
    setResultMetrics(null);
  };

  // Run OCR
  const handleRunOcr = useCallback(async () => {
    if (!selectedImage) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const res = await recognizeTextFromImage(
        selectedImage,
        language,
        showFilters ? preprocess : undefined,
        (p) => setProgress(p)
      );

      setExtractedText(res.text);
      setResultMetrics(res);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'OCR extraction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage, language, showFilters, preprocess]);

  // Trigger OCR when an image is loaded
  useEffect(() => {
    if (selectedImage && !extractedText && !isProcessing) {
      handleRunOcr();
    }
  }, [selectedImage]);

  // Copy to clipboard
  const handleCopy = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErrorMessage('Failed to copy to clipboard.');
    }
  };

  // Download handlers
  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const blob = exportToTxt(extractedText);
    downloadBlob(blob, 'extracted_text.txt');
  };

  const handleDownloadDocx = async () => {
    if (!extractedText) return;
    const blob = await exportToDocx(extractedText, 'Toolino Extracted Text');
    downloadBlob(blob, 'extracted_text.docx');
  };

  const handleDownloadPdf = async () => {
    if (!extractedText) return;
    const blob = await exportToPdf(extractedText, 'Toolino Extracted Text');
    downloadBlob(blob, 'extracted_text.pdf');
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Live word and character counter for editable textarea
  const wordsCount = extractedText ? extractedText.trim().split(/\s+/).filter(Boolean).length : 0;
  const charsCount = extractedText.length;
  const linesCount = extractedText ? extractedText.split('\n').length : 0;

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
              Image to Text (OCR)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% In-Browser OCR • Zero Cloud Uploads
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Client-Side Optical Character Recognition
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Free Online Image to Text (OCR)
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Extract text from photos, scans, receipts, and book pages with high accuracy. Edit, copy, or export to TXT, Microsoft Word (DOCX), and PDF.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 max-w-4xl mx-auto">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-800">OCR Notice</p>
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

        {/* State 1: Upload Dropzone when no image */}
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
                  handleFileSelect(e.dataTransfer.files[0]);
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
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                <UploadCloud className="w-10 h-10" />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Drop your image or scan here, or browse
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Supports JPG, PNG, WEBP, BMP documents, invoices, receipts, and book screenshots. 100% private.
              </p>

              <button
                type="button"
                className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                Upload Image
              </button>
            </div>

            {/* Instant Sample Documents */}
            <div className="mt-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Or try instantly with a sample document:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {SAMPLE_DOCS.map((sample) => (
                  <button
                    key={sample.name}
                    onClick={() => handleSampleSelect(sample)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition-all shadow-xs"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
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
          /* State 2: Active Side-by-Side OCR Studio */
          <div className="space-y-6">
            {/* Top Toolbar: Language, Filters Toggle, Re-run */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Language Dropdown */}
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-700">Language:</span>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setExtractedText('');
                    }}
                    className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-blue-500 cursor-pointer"
                  >
                    {SUPPORTED_OCR_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name} ({l.nativeName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filters / Image Prep Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    showFilters
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Scan Enhancement Filters</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunOcr}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recognizing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-extract Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setExtractedText('');
                    setResultMetrics(null);
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Change Image
                </button>
              </div>
            </div>

            {/* Scan Enhancement Filters Drawer */}
            {showFilters && (
              <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={preprocess.enhanceContrast}
                    onChange={(e) => setPreprocess({ ...preprocess, enhanceContrast: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Enhance Text Contrast</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={preprocess.binarize}
                    onChange={(e) => setPreprocess({ ...preprocess, binarize: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Binarize (Sharp Black & White)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={preprocess.invert}
                    onChange={(e) => setPreprocess({ ...preprocess, invert: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Invert (Dark Mode Photos)</span>
                </label>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Threshold:</span>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={preprocess.threshold}
                    onChange={(e) => setPreprocess({ ...preprocess, threshold: parseInt(e.target.value, 10) })}
                    className="w-24 accent-blue-600 cursor-pointer"
                  />
                  <span className="font-mono">{preprocess.threshold}</span>
                </div>
              </div>
            )}

            {/* Main Side-by-Side Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left 5 Cols: Original Image Viewer */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50/50">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    Source Image
                  </span>
                  {selectedFile && (
                    <span className="text-[11px] font-normal text-slate-400 truncate max-w-[180px]">
                      {selectedFile.name}
                    </span>
                  )}
                </div>

                <div className="flex-1 p-4 bg-slate-100/60 min-h-[420px] max-h-[620px] flex items-center justify-center overflow-auto">
                  <img
                    src={selectedImage}
                    alt="Source for OCR"
                    className="max-h-[560px] w-auto object-contain rounded-xl shadow-xs"
                  />
                </div>
              </div>

              {/* Right 7 Cols: Extracted Text Editor */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
                {/* Editor Header with Metrics */}
                <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Extracted Text
                    </span>
                    {resultMetrics && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {resultMetrics.confidence}% Confidence
                      </span>
                    )}
                  </div>

                  {/* Counters */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>
                      <strong className="text-slate-800">{wordsCount}</strong> words
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-800">{charsCount}</strong> chars
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-800">{linesCount}</strong> lines
                    </span>
                  </div>
                </div>

                {/* Textarea or Loader */}
                <div className="flex-1 p-4 flex flex-col relative min-h-[380px]">
                  {isProcessing ? (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10">
                      <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-800">{progress.status}</p>
                        <div className="w-48 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden mx-auto">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    placeholder="Extracted text will appear here. You can freely edit, format, or clean up any characters before downloading..."
                    className="w-full flex-1 p-4 text-sm font-mono text-slate-800 bg-slate-50/50 border border-slate-200 rounded-2xl resize-none focus:outline-blue-500 leading-relaxed"
                  />
                </div>

                {/* Action Bar: Copy & Export Formats */}
                <div className="p-4 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={handleCopy}
                    disabled={!extractedText || isProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadTxt}
                      disabled={!extractedText || isProcessing}
                      title="Download as Plain Text (.txt)"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.TXT</span>
                    </button>

                    <button
                      onClick={handleDownloadDocx}
                      disabled={!extractedText || isProcessing}
                      title="Download as Microsoft Word (.docx)"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-200/60 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>.DOCX (Word)</span>
                    </button>

                    <button
                      onClick={handleDownloadPdf}
                      disabled={!extractedText || isProcessing}
                      title="Download as Searchable PDF (.pdf)"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
