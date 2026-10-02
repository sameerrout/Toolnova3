'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  Settings,
  Layers,
  ArrowRight,
  Info,
  Lock,
  Zap,
  ShieldCheck,
  Infinity as InfinityIcon,
  FileText,
  Plus,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface MergePdfFileItem {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount: number;
}

export interface MergedResult {
  blob: Blob;
  fileName: string;
  sizeFormatted: string;
  totalPages: number;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB per file
const MAX_FILES_COUNT = 50;

export function MergePdfConverter() {
  const [files, setFiles] = useState<MergePdfFileItem[]>([]);
  const [outputFileName, setOutputFileName] = useState('Merged_Document.pdf');
  const [pageOrder, setPageOrder] = useState<'current' | 'reverse' | 'alpha-asc' | 'alpha-desc'>('current');
  const [keepQuality, setKeepQuality] = useState(true);

  // Drag and drop states for upload area
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drag and drop states for file list reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Processing & Success states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ progress: 0, statusText: 'Preparing...' });
  const [mergedResult, setMergedResult] = useState<MergedResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock desktop body and html scrolling on desktop viewports (fits completely in one screen)
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

  // Clean up object URLs on unmount or new merge
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  // Format bytes to human readable string
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Inspect PDF and extract page count
  const inspectPdfPageCount = async (file: File): Promise<number> => {
    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      return doc.getPageCount();
    } catch {
      return 1;
    }
  };

  // Total pages and size
  const totalPages = useMemo(() => {
    return files.reduce((acc, curr) => acc + curr.pageCount, 0);
  }, [files]);

  const totalSizeBytes = useMemo(() => {
    return files.reduce((acc, curr) => acc + curr.sizeBytes, 0);
  }, [files]);

  const totalSizeFormatted = useMemo(() => {
    return formatFileSize(totalSizeBytes);
  }, [totalSizeBytes]);

  // Handle incoming file selection (both initial upload and "Add More Files")
  // Allows 1 or more files to be added at any time!
  const addFiles = async (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const filesArray = Array.from(incomingFiles);

    if (filesArray.length === 0) return;

    if (files.length + filesArray.length > MAX_FILES_COUNT) {
      setErrorMessage(`Maximum of ${MAX_FILES_COUNT} files allowed. Please select fewer files.`);
      return;
    }

    const newItems: MergePdfFileItem[] = [];

    for (const file of filesArray) {
      const lowerName = file.name.toLowerCase();
      const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf';

      if (!isPdf) {
        setErrorMessage(`"${file.name}" is not a PDF file. Only PDF files are supported.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`"${file.name}" exceeds the 100 MB file size limit.`);
        continue;
      }

      const pageCount = await inspectPdfPageCount(file);

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        file,
        name: file.name,
        sizeBytes: file.size,
        sizeFormatted: formatFileSize(file.size),
        pageCount,
      });
    }

    if (newItems.length > 0) {
      setFiles((prev) => [...prev, ...newItems]);
      if (mergedResult) {
        // Reset merge-result so user can merge the updated collection
        setMergedResult(null);
        if (downloadUrl) {
          URL.revokeObjectURL(downloadUrl);
          setDownloadUrl(null);
        }
      }
    }
  };

  // Upload card drag and drop handlers
  const handleUploadDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(true);
  };

  const handleUploadDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(false);
  };

  const handleUploadDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await addFiles(e.dataTransfer.files);
    }
  };

  // File row reordering: Move Up
  const moveFileUp = (index: number) => {
    if (index <= 0) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
    setPageOrder('current');
  };

  // File row reordering: Move Down
  const moveFileDown = (index: number) => {
    if (index >= files.length - 1) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
    setPageOrder('current');
  };

  // File row reordering: Drag and Drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (e.dataTransfer.setDragImage && e.currentTarget) {
      e.dataTransfer.setDragImage(e.currentTarget as Element, 20, 20);
    }
  };

  const handleDragOverRow = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDropRow = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setFiles((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(dropIndex, 0, movedItem);
      return updated;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
    setPageOrder('current');
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Remove single file
  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (mergedResult) {
      setMergedResult(null);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }
    }
  };

  // Clear all files
  const handleClearAll = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setFiles([]);
    setMergedResult(null);
    setErrorMessage(null);
    setIsProcessing(false);
  };

  // Page order mode dropdown change
  const handlePageOrderChange = (newOrder: 'current' | 'reverse' | 'alpha-asc' | 'alpha-desc') => {
    setPageOrder(newOrder);
    if (newOrder === 'reverse') {
      setFiles((prev) => [...prev].reverse());
    } else if (newOrder === 'alpha-asc') {
      setFiles((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    } else if (newOrder === 'alpha-desc') {
      setFiles((prev) => [...prev].sort((a, b) => b.name.localeCompare(a.name)));
    }
  };

  // Reset only the merge-result state when user clicks "Merge More Files" (keeps files intact!)
  const handleMergeMoreFiles = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setMergedResult(null);
    setIsProcessing(false);
    setProgress({ progress: 0, statusText: 'Preparing...' });
  };

  // Client-side merge execution
  const handleMergePdf = async () => {
    if (files.length < 2) {
      setErrorMessage('Please select at least 2 PDF files to merge.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProgress({ progress: 5, statusText: 'Initializing client-side merge engine...' });

    try {
      trackToolEvent('merge-pdf', 'tool_started');
      const mergedDoc = await PDFDocument.create();
      const total = files.length;

      for (let i = 0; i < total; i++) {
        const item = files[i];
        const progressPercent = Math.round(10 + (i / total) * 80);

        setProgress({
          progress: progressPercent,
          statusText: `Merging document ${i + 1} of ${total}: ${item.name}`,
        });

        const buffer = await item.file.arrayBuffer();
        let srcDoc: PDFDocument;

        try {
          srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('encrypt') || msg.includes('password')) {
            throw new Error(`"${item.name}" is password-protected. Please unlock it before merging.`);
          }
          throw new Error(`Failed to read "${item.name}". The file may be damaged or corrupted.`);
        }

        const pageIndices = srcDoc.getPageIndices();
        const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);

        for (const page of copiedPages) {
          mergedDoc.addPage(page);
        }
      }

      setProgress({ progress: 95, statusText: 'Generating final PDF document...' });
      const mergedBytes = await mergedDoc.save();

      let finalName = outputFileName.trim();
      if (!finalName) {
        finalName = 'Merged_Document.pdf';
      }
      if (!finalName.toLowerCase().endsWith('.pdf')) {
        finalName += '.pdf';
      }

      const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setMergedResult({
        blob,
        fileName: finalName,
        sizeFormatted: formatFileSize(blob.size),
        totalPages: mergedDoc.getPageCount(),
      });

      trackToolEvent('merge-pdf', 'tool_completed');
      setProgress({ progress: 100, statusText: 'Merge complete!' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while merging your PDF files.';
      setErrorMessage(message);
      trackToolEvent('merge-pdf', 'tool_failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download merged PDF
  const handleDownload = () => {
    if (!downloadUrl || !mergedResult) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = mergedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-[#f8fafc] w-full min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden flex flex-col font-sans">
      {/* Hidden File Input (Used by choose files, dropzone, and Add More Files) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-3 flex-1 flex flex-col justify-between min-h-0">
        {/* TOP SECTION: Breadcrumb + Header */}
        <div className="shrink-0 space-y-1.5">
          {/* 1. Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/pdf-tools" className="hover:text-blue-600 transition-colors">
              PDF Tools
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">Merge PDF</span>
          </nav>

          {/* 2. Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-red-500 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-bl-sm"></div>
                <span className="font-black text-[9px] sm:text-[10px] tracking-wider">PDF</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Merge PDF</h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Combine multiple PDF files into one organized file.
                </p>
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">Files stay on your device</span>
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
                className="text-[11px] font-semibold text-red-600 hover:text-red-800 px-1.5 py-0.5 rounded hover:bg-red-100 transition cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* CASE A: ZERO FILES — Centered Upload Card + Feature Highlights            */}
        {/* ========================================================================= */}
        {files.length === 0 && (
          <div className="flex-1 flex flex-col justify-center my-auto min-h-0 space-y-3">
            {/* Full-Width Initial Upload Card */}
            <div
              onDragOver={handleUploadDragOver}
              onDragLeave={handleUploadDragLeave}
              onDrop={handleUploadDrop}
              className={`border-2 border-dashed rounded-2xl py-7 px-4 text-center transition-all shadow-xs ${
                isDragOverUpload
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : 'border-blue-200 hover:border-blue-300 bg-white'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-2 shadow-2xs">
                <UploadCloud className="w-5 h-5" />
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-0.5">Upload your PDFs</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-3">
                Drag &amp; drop PDF files here or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  click to browse
                </button>
              </p>

              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-xs sm:text-sm px-6 py-2 rounded-xl shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Choose Files
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mt-2.5 font-normal">
                Select at least 2 PDF files to merge • PDF only • Max 100 MB per file • Up to {MAX_FILES_COUNT} files
              </p>
            </div>

            {/* Feature Highlights Section */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 fill-purple-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Fast Processing</h3>
                  <p className="text-[10px] text-slate-500">Instant in-browser merge</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">100% Private</h3>
                  <p className="text-[10px] text-slate-500">Zero server file uploads</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <InfinityIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Up to 50 Files</h3>
                  <p className="text-[10px] text-slate-500">Combine large document sets</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Lossless Quality</h3>
                  <p className="text-[10px] text-slate-500">Preserves original vectors</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE B: FILES EXIST — Full Width Stacked Interface (NO SIDEBAR)           */}
        {/* ========================================================================= */}
        {files.length > 0 && (
          <div className="flex-1 flex flex-col justify-between my-1 min-h-0 space-y-2 sm:space-y-2.5">
            {/* 3. Compact Full-Width "Add More Files" Drop Strip */}
            <div
              onDragOver={handleUploadDragOver}
              onDragLeave={handleUploadDragLeave}
              onDrop={handleUploadDrop}
              className={`shrink-0 border border-dashed rounded-xl px-4 py-2 flex items-center justify-between gap-3 transition-all ${
                isDragOverUpload
                  ? 'border-blue-500 bg-blue-50/70 scale-[0.995]'
                  : 'border-blue-200/90 hover:border-blue-300 bg-blue-50/20'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-100/70 flex items-center justify-center text-blue-600 shrink-0">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <span className="text-xs font-bold text-slate-800 block sm:inline">Add more PDF files</span>
                  <span className="text-xs text-slate-500 sm:ml-2 hidden sm:inline">
                    Drag &amp; drop additional PDFs here or click to browse
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-[11px] text-slate-400 hidden md:inline">
                  You can add one or more PDF files • Max 100 MB
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add More Files
                </button>
              </div>
            </div>

            {/* 4. Full-Width "Your Files" Section (NO INTERNAL SCROLLING) */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3 flex flex-col min-h-0">
              {/* File Section Header */}
              <div className="shrink-0 flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Your Files
                  </h2>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full px-2.5 py-0.5">
                    {files.length} {files.length === 1 ? 'file' : 'files'} • {totalPages} pages • {totalSizeFormatted}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200/70 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add More Files
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    title="Remove all files"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* File Rows: All files fully visible on screen without internal scroll container */}
              {/* Adapts into 2 columns on desktop when > 4 files so it fits within viewport */}
              <div
                className={`space-y-1.5 ${
                  files.length > 4 ? 'grid grid-cols-1 md:grid-cols-2 gap-1.5 space-y-0' : ''
                }`}
              >
                {files.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOverRow(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDropRow(e, index)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg border transition-all ${
                      dragOverIndex === index
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {/* Left: Drag Handle, Red PDF badge, Name & Page/Size info */}
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <button
                        type="button"
                        aria-label={`Drag to reorder ${item.name}`}
                        className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing p-0.5 shrink-0"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </button>

                      <div
                        className="w-6 h-7 bg-red-500 rounded-xs flex flex-col items-center justify-center text-white shrink-0 shadow-2xs relative overflow-hidden"
                        aria-hidden="true"
                      >
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-600 rounded-bl-xs"></div>
                        <span className="font-extrabold text-[7px] tracking-wider">PDF</span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {item.sizeFormatted} • {item.pageCount} page{item.pageCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    {/* Right: Up, Down, Delete buttons */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveFileUp(index)}
                        disabled={index === 0}
                        aria-label={`Move ${item.name} up`}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveFileDown(index)}
                        disabled={index === files.length - 1}
                        aria-label={`Move ${item.name} down`}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(item.id)}
                        aria-label={`Delete ${item.name}`}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Merge Settings: Single Horizontal Row on Desktop */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs px-4 py-2.5 shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-5">
                {/* Setting A: Output File Name */}
                <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
                  <label htmlFor="outputFileName" className="text-xs font-semibold text-slate-700 shrink-0">
                    Output File Name
                  </label>
                  <input
                    id="outputFileName"
                    type="text"
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                    placeholder="Merged_Document.pdf"
                    className="w-full px-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                {/* Setting B: Page Order */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <label htmlFor="pageOrderSelect" className="text-xs font-semibold text-slate-700 shrink-0">
                    Page Order
                  </label>
                  <select
                    id="pageOrderSelect"
                    value={pageOrder}
                    onChange={(e) => handlePageOrderChange(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition cursor-pointer"
                  >
                    <option value="current">Use current order</option>
                    <option value="reverse">Reverse order</option>
                    <option value="alpha-asc">Alphabetical (A-Z)</option>
                    <option value="alpha-desc">Alphabetical (Z-A)</option>
                  </select>
                </div>

                {/* Setting C: Quality Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 md:ml-auto">
                  <input
                    type="checkbox"
                    checked={keepQuality}
                    onChange={(e) => setKeepQuality(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Keep original PDF quality
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BOTTOM ACTION AREA: Merge Button / In-Progress Bar / Success Section       */}
        {/* ========================================================================= */}
        <div className="shrink-0 pt-1 pb-1">
          {/* STATE 1: MERGING IN PROGRESS */}
          {isProcessing && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-2xs p-3 text-center max-w-xl mx-auto w-full animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {progress.statusText}
                </span>
                <span className="text-blue-600 font-bold">{progress.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* STATE 2: SUCCESS — Compact In-Place Transform (Download & Merge More) */}
          {mergedResult && !isProcessing && (
            <div className="w-full bg-emerald-50/90 border border-emerald-200/90 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    PDF merged successfully
                  </h3>
                  <p className="text-xs text-slate-600 truncate font-medium">
                    <span className="font-semibold text-slate-800">{mergedResult.fileName}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span>{mergedResult.sizeFormatted}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span>{mergedResult.totalPages} pages</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm py-2 px-4 rounded-xl shadow-xs transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={handleMergeMoreFiles}
                  className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm py-2 px-3.5 rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Merge More Files
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: MERGE ACTION BUTTON (When not processing and not in success state) */}
          {!isProcessing && !mergedResult && (
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleMergePdf}
                disabled={files.length < 2 || isProcessing}
                className={`w-full max-w-md py-2.5 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                  files.length < 2 || isProcessing
                    ? 'bg-slate-200 text-slate-400 border border-slate-300/50 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white hover:shadow-md cursor-pointer'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Merge PDF</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Dynamic Validation & Status Text */}
              <div className="flex items-center justify-center gap-1 text-[11px] mt-1.5 font-medium">
                {files.length === 0 ? (
                  <>
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-amber-600">Select at least 2 PDF files to merge</span>
                  </>
                ) : files.length === 1 ? (
                  <>
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-amber-600">Add at least one more PDF to merge</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-emerald-600 truncate">
                      Ready to merge {files.length} files ({totalPages} pages • {totalSizeFormatted})
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
