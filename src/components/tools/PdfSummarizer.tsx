'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Copy,
  Check,
  Download,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Clock,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCode,
  BookOpen,
  ListOrdered,
  FileCheck,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  extractPdfDocument,
  summarizePdfDocument,
  exportSummaryAsTxt,
  exportSummaryAsMarkdown,
  exportSummaryAsPdf,
  ExtractedPdfDocument,
  GeneratedSummary,
  SummaryLength,
} from '@/core/engine/pdfSummarizerEngine';

export function PdfSummarizer() {
  const [extractedDoc, setExtractedDoc] = useState<ExtractedPdfDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Summary configuration
  const [lengthMode, setLengthMode] = useState<SummaryLength>('detailed');
  const [summary, setSummary] = useState<GeneratedSummary | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle PDF upload
  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('Please select a valid PDF document.');
      return;
    }

    try {
      setErrorMsg(null);
      setIsLoading(true);
      setProgressPercent(10);
      setProgressStatus(`Analyzing "${file.name}"...`);

      const doc = await extractPdfDocument(file, (pct, status) => {
        setProgressPercent(pct);
        setProgressStatus(status);
      });

      setExtractedDoc(doc);

      // Generate default summary
      const generated = summarizePdfDocument(doc, lengthMode);
      setSummary(generated);
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      setErrorMsg(err?.message || 'Failed to parse PDF document.');
    } finally {
      setIsLoading(false);
      setProgressStatus('');
    }
  };

  // Switch summary length mode
  const handleLengthChange = (mode: SummaryLength) => {
    setLengthMode(mode);
    if (extractedDoc) {
      const updated = summarizePdfDocument(extractedDoc, mode);
      setSummary(updated);
    }
  };

  // Copy summary to clipboard
  const handleCopy = () => {
    if (!summary) return;
    const textToCopy = `SUMMARY: ${summary.title}
${summary.summaryText}

KEY POINTS:
${summary.keyPoints.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Export TXT
  const handleDownloadTxt = () => {
    if (!summary) return;
    const blob = exportSummaryAsTxt(summary);
    downloadBlob(blob, `${summary.title}-summary.txt`);
  };

  // Export Markdown
  const handleDownloadMd = () => {
    if (!summary) return;
    const blob = exportSummaryAsMarkdown(summary);
    downloadBlob(blob, `${summary.title}-summary.md`);
  };

  // Export PDF
  const handleDownloadPdf = async () => {
    if (!summary) return;
    try {
      setIsExportingPdf(true);
      const pdfBytes = await exportSummaryAsPdf(summary);
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      downloadBlob(blob, `${summary.title}-summary.pdf`);
    } catch (e) {
      console.error('PDF summary generation failed:', e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset / Clear document
  const handleClear = () => {
    setExtractedDoc(null);
    setSummary(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Load sample text PDF for immediate testing
  const handleLoadSample = async () => {
    const sampleDoc: ExtractedPdfDocument = {
      fileName: 'Modern-Software-Engineering-Principles.pdf',
      fileSizeBytes: 245000,
      totalPages: 4,
      totalWords: 1250,
      totalCharacters: 8200,
      hasScannedPages: false,
      scannedPageCount: 0,
      pages: [
        {
          pageNumber: 1,
          wordCount: 320,
          isScanned: false,
          headings: ['Chapter 1: Foundational Principles of Scalable Software Architecture'],
          text: 'Modern software engineering demands decoupled modular systems capable of independent deployment and elastic horizontal scaling. Microservices and domain-driven design establish clear bounded contexts that allow engineering squads to iterate rapidly without inter-service coordination overhead. Maintaining strict API contracts, robust telemetry, and comprehensive end-to-end integration tests ensures regression-free continuous delivery.',
        },
        {
          pageNumber: 2,
          wordCount: 340,
          isScanned: false,
          headings: ['Chapter 2: Client-Side Browser Computing & Zero-Trust Privacy'],
          text: 'Recent advances in WebAssembly, Web Workers, and local hardware acceleration enable compute-heavy utilities to execute directly in the browser sandbox. This architecture eliminates sensitive document transmission across public networks, satisfying strict GDPR, HIPAA, and SOC-2 privacy requirements. Zero server uploads guarantee total data sovereignty and reduce infrastructure operational overhead by up to 90%.',
        },
        {
          pageNumber: 3,
          wordCount: 310,
          isScanned: false,
          headings: ['Chapter 3: Resilient Data Persistence & Offline Availability'],
          text: 'Progressive web applications utilize IndexedDB and intelligent service workers to provide reliable offline capabilities during network outages. Local conflict-resolution algorithms reconcile background edits when connectivity resumes. Observability benchmarks demonstrate a 10x reduction in perceived latency compared to round-trip server architectures.',
        },
        {
          pageNumber: 4,
          wordCount: 280,
          isScanned: false,
          headings: ['Conclusion & Implementation Strategy'],
          text: 'Organizations adopting privacy-first browser computing and decoupled microservices achieve significantly higher customer satisfaction, reduced security attack surfaces, and rapid software delivery cycles. Embracing modular architecture ensures sustainable technological longevity.',
        },
      ],
    };

    setExtractedDoc(sampleDoc);
    const s = summarizePdfDocument(sampleDoc, lengthMode);
    setSummary(s);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = '';
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* UPLOAD / DROPZONE (When no document is loaded)                */}
      {/* ------------------------------------------------------------- */}
      {!extractedDoc && (
        <div className="space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all bg-white shadow-xs group"
          >
            {isLoading ? (
              <div className="space-y-4 max-w-xs mx-auto">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-800">{progressStatus}</p>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  />
                </div>
                <p className="text-xs text-slate-400">Processing locally in browser memory...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-xs">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Upload your PDF document to summarize
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Drag and drop your file here, or click to browse
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
                  >
                    Choose PDF File
                  </button>
                </div>
                <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% private. PDF is processed locally and never uploaded to any server.</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Option to try sample */}
          <div className="text-center">
            <button
              onClick={handleLoadSample}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Or click here to test with a sample 4-page software engineering PDF</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUMMARY WORKSPACE (When PDF is loaded)                        */}
      {/* ------------------------------------------------------------- */}
      {extractedDoc && summary && (
        <div className="space-y-8">
          {/* Top Document Header Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {extractedDoc.fileName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{extractedDoc.totalPages} Pages</span>
                  <span>•</span>
                  <span>{extractedDoc.totalWords.toLocaleString()} Words</span>
                  <span>•</span>
                  <span>{(extractedDoc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Change PDF
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition flex items-center gap-1"
                title="Clear and reset"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>

          {/* Scanned PDF Warning If Applicable */}
          {extractedDoc.hasScannedPages && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Scanned / Image-Based Pages Detected</p>
                <p className="text-[11px] leading-relaxed">
                  This document contains {extractedDoc.scannedPageCount} page(s) with minimal or no embedded text streams. To extract and summarize text from scanned images, OCR processing is required. Text-based pages have been extracted normally.
                </p>
              </div>
            </div>
          )}

          {/* Key Metrics Reduction Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Reading Reduction
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {summary.reductionPercentage}% Condensed
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Word Ratio
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {summary.summaryWordCount} / {summary.originalWordCount}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Est. Read Time
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  ~{summary.readingTimeMinutes} Minute{summary.readingTimeMinutes > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Mode Controls & Actions Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              {/* Length Mode Selector */}
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Summary Length &amp; Format
                </p>
                <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex flex-wrap gap-1 text-xs font-bold">
                  {[
                    { id: 'short', label: 'Short' },
                    { id: 'detailed', label: 'Detailed' },
                    { id: 'bullet', label: 'Key Points' },
                    { id: 'sections', label: 'Section-by-Section' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleLengthChange(m.id as SummaryLength)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        lengthMode === m.id
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Copy, TXT, MD, PDF */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownloadTxt}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                  title="Download as text file"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>TXT</span>
                </button>

                <button
                  onClick={handleDownloadMd}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                  title="Download as Markdown"
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>MD</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  title="Download as PDF document"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Generated Content Display */}
            <div className="space-y-6">
              {/* Executive Summary Paragraphs */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Executive Summary
                </h4>
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 text-sm text-slate-800 leading-relaxed font-sans select-text">
                  {summary.summaryText || 'No text extracted.'}
                </div>
              </div>

              {/* Key Takeaways Bullet List */}
              {summary.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-blue-600" />
                    <span>Key Takeaways &amp; Important Findings</span>
                  </h4>
                  <div className="space-y-2">
                    {summary.keyPoints.map((pt, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3"
                      >
                        <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium select-text">
                          {pt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Breakdown (When in Sections Mode) */}
              {lengthMode === 'sections' && summary.sections.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Section-by-Section Breakdown</span>
                  </h4>
                  <div className="space-y-3">
                    {summary.sections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                      >
                        <p className="text-xs font-bold text-slate-900">{sec.title}</p>
                        <p className="text-xs text-slate-700 leading-relaxed select-text font-medium">
                          {sec.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
