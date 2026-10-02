'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Trash2,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Layers,
  ArrowRight,
  Info,
  Lock,
  Zap,
  ShieldCheck,
  Infinity as InfinityIcon,
  FileText,
  Plus,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  FolderArchive,
  FileCheck,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface SplitPdfFileItem {
  file: File;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount: number;
}

export interface SplitOutputFile {
  name: string;
  blob: Blob;
  url: string;
  sizeFormatted: string;
  pageCount: number;
  pagesDescription: string;
}

export interface SplitResult {
  files: SplitOutputFile[];
  zipBlob: Blob | null;
  zipUrl: string | null;
  zipName: string;
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
}

interface RangeGroup {
  description: string;
  indices: number[]; // 0-indexed for pdf-lib
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export function SplitPdfConverter() {
  const [fileItem, setFileItem] = useState<SplitPdfFileItem | null>(null);

  // Split methods: 'ranges' (default), 'all' (split every page), 'select' (visual page chips)
  const [splitMode, setSplitMode] = useState<'ranges' | 'all' | 'select'>('ranges');

  // Page range input string
  const [pageRangesInput, setPageRangesInput] = useState<string>('1');

  // Visual selection set of page numbers (1-indexed)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set([1]));

  // Option: combine extracted ranges into 1 PDF or separate files
  const [combineIntoSingleFile, setCombineIntoSingleFile] = useState<boolean>(false);

  // Output filename prefix
  const [outputPrefix, setOutputPrefix] = useState<string>('Document_split');

  // Upload dropzone state
  const [isDragOverUpload, setIsDragOverUpload] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Processing & result states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ progress: number; statusText: string }>({
    progress: 0,
    statusText: 'Preparing...',
  });
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);

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

  // Cleanup object URLs on unmount or new run
  useEffect(() => {
    return () => {
      if (splitResult) {
        splitResult.files.forEach((f) => URL.revokeObjectURL(f.url));
        if (splitResult.zipUrl) URL.revokeObjectURL(splitResult.zipUrl);
      }
    };
  }, [splitResult]);

  // Format bytes helper
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

  // Parse page range string into distinct RangeGroup items
  const parsedRangeGroups = useMemo<RangeGroup[]>(() => {
    if (!fileItem || splitMode !== 'ranges') return [];
    const totalPages = fileItem.pageCount;
    const trimmedInput = pageRangesInput.trim();
    if (!trimmedInput) return [];

    const parts = trimmedInput.split(',');
    const groups: RangeGroup[] = [];

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr.trim(), 10);
        const end = parseInt(endStr.trim(), 10);

        if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
          continue;
        }

        const indices: number[] = [];
        for (let p = start; p <= end; p++) {
          indices.push(p - 1);
        }

        groups.push({
          description: start === end ? `Page ${start}` : `Pages ${start}–${end}`,
          indices,
        });
      } else {
        const page = parseInt(trimmed, 10);
        if (isNaN(page) || page < 1 || page > totalPages) {
          continue;
        }
        groups.push({
          description: `Page ${page}`,
          indices: [page - 1],
        });
      }
    }

    return groups;
  }, [fileItem, pageRangesInput, splitMode]);

  // Validation state for range input
  const rangeValidationError = useMemo<string | null>(() => {
    if (!fileItem || splitMode !== 'ranges') return null;
    const totalPages = fileItem.pageCount;
    const trimmedInput = pageRangesInput.trim();
    if (!trimmedInput) {
      return 'Please enter a page range (e.g. 1-3, 5).';
    }

    const parts = trimmedInput.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.includes('-')) {
        const subParts = trimmed.split('-');
        if (subParts.length !== 2) {
          return `Invalid range format: "${trimmed}".`;
        }
        const start = parseInt(subParts[0].trim(), 10);
        const end = parseInt(subParts[1].trim(), 10);

        if (isNaN(start) || isNaN(end)) {
          return `Invalid numbers in range: "${trimmed}".`;
        }
        if (start < 1) {
          return `Start page cannot be less than 1.`;
        }
        if (end > totalPages) {
          return `Page ${end} exceeds total pages (${totalPages}).`;
        }
        if (start > end) {
          return `Start page (${start}) cannot be greater than end page (${end}).`;
        }
      } else {
        const page = parseInt(trimmed, 10);
        if (isNaN(page)) {
          return `Invalid page number: "${trimmed}".`;
        }
        if (page < 1 || page > totalPages) {
          return `Page ${page} is out of bounds (document has ${totalPages} ${totalPages === 1 ? 'page' : 'pages'}).`;
        }
      }
    }

    if (parsedRangeGroups.length === 0) {
      return 'No valid pages found in range.';
    }

    return null;
  }, [fileItem, pageRangesInput, splitMode, parsedRangeGroups]);

  // Validation state for visual selection
  const visualSelectionError = useMemo<string | null>(() => {
    if (!fileItem || splitMode !== 'select') return null;
    if (selectedPages.size === 0) {
      return 'Please select at least one page to extract.';
    }
    return null;
  }, [fileItem, splitMode, selectedPages]);

  // Overall configuration validity
  const isConfigValid = useMemo<boolean>(() => {
    if (!fileItem) return false;
    if (splitMode === 'ranges') return rangeValidationError === null && parsedRangeGroups.length > 0;
    if (splitMode === 'all') return fileItem.pageCount >= 1;
    if (splitMode === 'select') return selectedPages.size > 0;
    return false;
  }, [fileItem, splitMode, rangeValidationError, parsedRangeGroups, selectedPages]);

  // Computed number of output files based on mode
  const computedOutputFileCount = useMemo<number>(() => {
    if (!fileItem || !isConfigValid) return 0;
    if (splitMode === 'all') return fileItem.pageCount;
    if (splitMode === 'ranges') {
      return combineIntoSingleFile ? 1 : parsedRangeGroups.length;
    }
    if (splitMode === 'select') {
      return combineIntoSingleFile ? 1 : selectedPages.size;
    }
    return 0;
  }, [fileItem, isConfigValid, splitMode, combineIntoSingleFile, parsedRangeGroups, selectedPages]);

  // Handle single file upload
  const handleSelectFile = async (incoming: FileList | File[]) => {
    setErrorMessage(null);
    const filesArray = Array.from(incoming);
    if (filesArray.length === 0) return;

    const file = filesArray[0];
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (!isPdf) {
      setErrorMessage(`"${file.name}" is not a PDF file. Please select a valid PDF.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`"${file.name}" exceeds the 100 MB file size limit.`);
      return;
    }

    const pageCount = await inspectPdfPageCount(file);
    const baseName = file.name.replace(/\.[^/.]+$/, '').trim();

    setFileItem({
      file,
      name: file.name,
      sizeBytes: file.size,
      sizeFormatted: formatFileSize(file.size),
      pageCount,
    });

    setOutputPrefix(`${baseName}_split`);
    setPageRangesInput(pageCount > 1 ? `1-${Math.min(pageCount, 2)}` : '1');
    setSelectedPages(new Set([1]));
    setSplitResult(null);
  };

  // Drag and drop handlers for upload zone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUpload(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUpload(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUpload(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files);
    }
  };

  // Clear current file
  const handleClearFile = () => {
    setFileItem(null);
    setSplitResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Visual selection helpers
  const togglePageSelection = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  };

  const selectAllPages = () => {
    if (!fileItem) return;
    const all = new Set<number>();
    for (let i = 1; i <= fileItem.pageCount; i++) all.add(i);
    setSelectedPages(all);
  };

  const clearAllSelectedPages = () => {
    setSelectedPages(new Set());
  };

  const selectOddPages = () => {
    if (!fileItem) return;
    const odds = new Set<number>();
    for (let i = 1; i <= fileItem.pageCount; i += 2) odds.add(i);
    setSelectedPages(odds);
  };

  const selectEvenPages = () => {
    if (!fileItem) return;
    const evens = new Set<number>();
    for (let i = 2; i <= fileItem.pageCount; i += 2) evens.add(i);
    setSelectedPages(evens);
  };

  // Execute PDF Split
  const handleSplitPdf = async () => {
    if (!fileItem || !isConfigValid || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProgress({ progress: 10, statusText: 'Reading PDF document...' });

    try {
      const buffer = await fileItem.file.arrayBuffer();
      let srcDoc: PDFDocument;

      try {
        srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('encrypt') || msg.includes('password')) {
          throw new Error(`"${fileItem.name}" is password-protected. Please unlock it before splitting.`);
        }
        throw new Error(`Failed to read "${fileItem.name}". The file may be damaged or corrupted.`);
      }

      const totalDocPages = srcDoc.getPageCount();
      const cleanPrefix = outputPrefix.trim() || 'Document_split';

      // 1. Determine execution groups: Array<{ name: string; indices: number[]; desc: string }>
      interface OutputPlanItem {
        fileName: string;
        indices: number[];
        description: string;
      }

      const plan: OutputPlanItem[] = [];

      if (splitMode === 'all') {
        // Split every page
        for (let p = 1; p <= totalDocPages; p++) {
          plan.push({
            fileName: `${cleanPrefix}_page_${p}.pdf`,
            indices: [p - 1],
            description: `Page ${p}`,
          });
        }
      } else if (splitMode === 'ranges') {
        if (combineIntoSingleFile) {
          // Combine all ranges into 1 PDF
          const allIndices = Array.from(new Set(parsedRangeGroups.flatMap((g) => g.indices))).sort(
            (a, b) => a - b
          );
          plan.push({
            fileName: `${cleanPrefix}_extracted.pdf`,
            indices: allIndices,
            description: `${allIndices.length} extracted pages`,
          });
        } else {
          // Separate PDF per range
          parsedRangeGroups.forEach((group, idx) => {
            const rangeIndex = idx + 1;
            plan.push({
              fileName: `${cleanPrefix}_part_${rangeIndex}.pdf`,
              indices: group.indices,
              description: group.description,
            });
          });
        }
      } else if (splitMode === 'select') {
        const sortedSelected = Array.from(selectedPages).sort((a, b) => a - b);
        if (combineIntoSingleFile) {
          plan.push({
            fileName: `${cleanPrefix}_selected.pdf`,
            indices: sortedSelected.map((p) => p - 1),
            description: `${sortedSelected.length} selected pages`,
          });
        } else {
          sortedSelected.forEach((p) => {
            plan.push({
              fileName: `${cleanPrefix}_page_${p}.pdf`,
              indices: [p - 1],
              description: `Page ${p}`,
            });
          });
        }
      }

      if (plan.length === 0) {
        throw new Error('No split outputs could be generated from the current options.');
      }

      const outputFiles: SplitOutputFile[] = [];
      const totalOutputs = plan.length;

      // Extract each file in the plan
      for (let i = 0; i < totalOutputs; i++) {
        const item = plan[i];
        const stepProgress = Math.round(15 + ((i + 1) / totalOutputs) * 70);
        setProgress({
          progress: stepProgress,
          statusText: `Generating file ${i + 1} of ${totalOutputs}...`,
        });

        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, item.indices);
        copied.forEach((p) => newDoc.addPage(p));

        const bytes = await newDoc.save();
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        outputFiles.push({
          name: item.fileName,
          blob,
          url,
          sizeFormatted: formatFileSize(blob.size),
          pageCount: item.indices.length,
          pagesDescription: item.description,
        });
      }

      // Generate ZIP archive if multiple files produced
      let zipBlob: Blob | null = null;
      let zipUrl: string | null = null;
      const zipName = `${cleanPrefix}_archive.zip`;

      if (outputFiles.length > 1) {
        setProgress({ progress: 92, statusText: 'Creating ZIP download archive...' });
        const zip = new JSZip();
        outputFiles.forEach((f) => {
          zip.file(f.name, f.blob);
        });
        zipBlob = await zip.generateAsync({ type: 'blob' });
        zipUrl = URL.createObjectURL(zipBlob);
      }

      const totalSizeBytes = outputFiles.reduce((acc, curr) => acc + curr.blob.size, 0);

      setSplitResult({
        files: outputFiles,
        zipBlob,
        zipUrl,
        zipName,
        totalFiles: outputFiles.length,
        totalSizeBytes,
        totalSizeFormatted: formatFileSize(totalSizeBytes),
      });

      trackToolEvent('split-pdf', 'tool_completed');
      setProgress({ progress: 100, statusText: 'Split complete!' });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while splitting your PDF.';
      setErrorMessage(message);
      trackToolEvent('split-pdf', 'tool_failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download all / primary download
  const handleDownloadMain = () => {
    if (!splitResult) return;
    const a = document.createElement('a');

    if (splitResult.zipUrl) {
      a.href = splitResult.zipUrl;
      a.download = splitResult.zipName;
    } else if (splitResult.files.length === 1) {
      a.href = splitResult.files[0].url;
      a.download = splitResult.files[0].name;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download individual file
  const handleDownloadSingle = (file: SplitOutputFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Reset to split another PDF
  const handleSplitAnother = () => {
    if (splitResult) {
      splitResult.files.forEach((f) => URL.revokeObjectURL(f.url));
      if (splitResult.zipUrl) URL.revokeObjectURL(splitResult.zipUrl);
    }
    setSplitResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="bg-[#f8fafc] w-full min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden flex flex-col font-sans">
      {/* Hidden File Input for Single PDF Selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleSelectFile(e.target.files);
          }
          e.target.value = '';
        }}
      />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-3 flex-1 flex flex-col justify-between min-h-0">
        {/* TOP SECTION: Breadcrumb + Header + Alert */}
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
            <span className="font-bold text-slate-900">Split PDF</span>
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
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Split PDF</h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Split your PDF into separate files using page ranges or individual pages.
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
        {!fileItem && (
          <div className="flex-1 flex flex-col justify-center my-auto min-h-0 space-y-3">
            {/* Full-Width Initial Upload Card */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl py-7 px-4 text-center transition-all shadow-xs ${
                isDragOverUpload
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : 'border-blue-200 hover:border-blue-300 bg-white'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-2 shadow-2xs">
                <UploadCloud className="w-5 h-5" />
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-0.5">Upload your PDF</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-3">
                Drag &amp; drop a PDF here or{' '}
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
                  <Plus className="w-4 h-4" /> Choose PDF
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mt-2.5 font-normal">
                PDF files only • Max 100 MB
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
                  <p className="text-[10px] text-slate-500">Instant in-browser split</p>
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
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Flexible Splitting</h3>
                  <p className="text-[10px] text-slate-500">Ranges, pages, or chips</p>
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
        {/* CASE B: FILE UPLOADED — Full Width Stacked Interface (NO SIDEBAR)         */}
        {/* ========================================================================= */}
        {fileItem && (
          <div className="flex-1 flex flex-col justify-between my-1 min-h-0 space-y-2 sm:space-y-2.5">
            {/* 3. Selected File Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs px-4 py-2 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-7 h-8 bg-red-500 rounded-sm flex flex-col items-center justify-center text-white shrink-0 shadow-2xs relative overflow-hidden"
                  aria-hidden="true"
                >
                  <div className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-bl-xs"></div>
                  <span className="font-extrabold text-[8px] tracking-wider">PDF</span>
                </div>

                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={fileItem.name}>
                    {fileItem.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {fileItem.sizeFormatted} • {fileItem.pageCount} {fileItem.pageCount === 1 ? 'page' : 'pages'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200/70 transition cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Replace
                </button>
                <button
                  type="button"
                  onClick={handleClearFile}
                  title="Remove file"
                  aria-label="Remove file"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4. Split Options Card (NO INTERNAL SCROLLING) */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3 sm:p-3.5 flex flex-col justify-between space-y-2 min-h-0">
              {/* Header + Method Switcher Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Split Options</h2>
                </div>

                {/* Tabs */}
                <div className="inline-flex p-0.5 bg-slate-100 rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setSplitMode('ranges')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      splitMode === 'ranges'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Page Ranges
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('all')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      splitMode === 'all'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Split Every Page
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('select')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      splitMode === 'select'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Select Pages Visually
                  </button>
                </div>
              </div>

              {/* METHOD 1: PAGE RANGES */}
              {splitMode === 'ranges' && (
                <div className="space-y-2 py-0.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                    {/* Range Input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="pageRangeInput" className="text-xs font-bold text-slate-800">
                          Page ranges
                        </label>
                        <span className="text-[11px] text-slate-400">Total: {fileItem.pageCount} pages</span>
                      </div>
                      <input
                        id="pageRangeInput"
                        type="text"
                        value={pageRangesInput}
                        onChange={(e) => setPageRangesInput(e.target.value)}
                        placeholder="e.g. 1-3, 5, 8-10"
                        className="w-full px-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                      <p className="text-[11px] text-slate-500">
                        Specify individual pages or comma-separated ranges (e.g. <span className="font-mono text-slate-700">1-3, 5, 8-10</span>).
                      </p>
                    </div>

                    {/* Output Prefix */}
                    <div className="space-y-1">
                      <label htmlFor="outputPrefixInput" className="text-xs font-bold text-slate-800 block">
                        Output file name prefix
                      </label>
                      <input
                        id="outputPrefixInput"
                        type="text"
                        value={outputPrefix}
                        onChange={(e) => setOutputPrefix(e.target.value)}
                        placeholder="Document_split"
                        className="w-full px-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                      <div className="flex items-center justify-between pt-0.5">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-700 font-medium">
                          <input
                            type="checkbox"
                            checked={combineIntoSingleFile}
                            onChange={(e) => setCombineIntoSingleFile(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
                          />
                          <span>Merge into 1 extracted file</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Range preview breakdown explanation */}
                  {parsedRangeGroups.length > 0 && (
                    <div className="bg-blue-50/60 border border-blue-100/90 rounded-lg px-3 py-1.5 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-blue-900 shrink-0">Split preview:</span>
                      {combineIntoSingleFile ? (
                        <span className="text-[11px] text-blue-700 font-medium">
                          All specified ranges → 1 combined PDF ({parsedRangeGroups.reduce((acc, g) => acc + g.indices.length, 0)} pages)
                        </span>
                      ) : (
                        parsedRangeGroups.map((g, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-white border border-blue-200 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs"
                          >
                            <span>{g.description}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-blue-400" />
                            <span className="text-slate-900">File {idx + 1}</span>
                          </span>
                        ))
                      )}
                    </div>
                  )}

                  {rangeValidationError && (
                    <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {rangeValidationError}
                    </p>
                  )}
                </div>
              )}

              {/* METHOD 2: SPLIT EVERY PAGE */}
              {splitMode === 'all' && (
                <div className="space-y-2 py-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <h3 className="text-xs font-bold text-slate-800">Split into individual pages</h3>
                      </div>
                      <p className="text-xs text-slate-600">
                        {fileItem.pageCount} {fileItem.pageCount === 1 ? 'page' : 'pages'} →{' '}
                        <span className="font-bold text-blue-600">
                          {fileItem.pageCount} separate PDF {fileItem.pageCount === 1 ? 'file' : 'files'}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {outputPrefix}_page_1.pdf ... {outputPrefix}_page_{fileItem.pageCount}.pdf
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="outputPrefixAll" className="text-xs font-bold text-slate-800 block">
                        Output file name prefix
                      </label>
                      <input
                        id="outputPrefixAll"
                        type="text"
                        value={outputPrefix}
                        onChange={(e) => setOutputPrefix(e.target.value)}
                        placeholder="Document_split"
                        className="w-full px-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                      <p className="text-[11px] text-slate-500">
                        Files will be packaged into a single ZIP archive for fast one-click download.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD 3: SELECT PAGES VISUALLY */}
              {splitMode === 'select' && (
                <div className="space-y-2 py-0.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">Click pages to select:</span>
                      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full px-2 py-0.2">
                        {selectedPages.size} of {fileItem.pageCount} selected
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={selectAllPages}
                        className="text-blue-600 hover:text-blue-700 font-semibold px-2 py-0.5 rounded hover:bg-blue-50 transition cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={clearAllSelectedPages}
                        className="text-slate-500 hover:text-slate-800 font-semibold px-2 py-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
                      >
                        Clear
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={selectOddPages}
                        className="text-slate-600 hover:text-blue-600 font-semibold px-2 py-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
                      >
                        Odd
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={selectEvenPages}
                        className="text-slate-600 hover:text-blue-600 font-semibold px-2 py-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
                      >
                        Even
                      </button>
                    </div>
                  </div>

                  {/* Compact visual page chips (fits without scrolling) */}
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50/60 border border-slate-200/70 rounded-lg">
                    {Array.from({ length: fileItem.pageCount }, (_, i) => i + 1).map((pageNum) => {
                      const isSelected = selectedPages.has(pageNum);
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => togglePageSelection(pageNum)}
                          className={`w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs scale-105'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600'
                          }`}
                          title={`Page ${pageNum}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={combineIntoSingleFile}
                        onChange={(e) => setCombineIntoSingleFile(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
                      />
                      <span>Combine selected pages into 1 single PDF file</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <label htmlFor="outputPrefixSelect" className="text-xs font-semibold text-slate-700">
                        Prefix:
                      </label>
                      <input
                        id="outputPrefixSelect"
                        type="text"
                        value={outputPrefix}
                        onChange={(e) => setOutputPrefix(e.target.value)}
                        placeholder="Document_split"
                        className="w-36 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  {visualSelectionError && (
                    <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {visualSelectionError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 5. Result Preview Card (When Split Complete) */}
            {splitResult && (
              <div className="bg-white rounded-xl border border-emerald-200/90 shadow-2xs p-3 shrink-0 animate-in fade-in space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {splitResult.totalFiles} {splitResult.totalFiles === 1 ? 'file' : 'files'} created ({splitResult.totalSizeFormatted})
                    </span>
                  </div>

                  <span className="text-[11px] text-emerald-700 font-medium">Ready for download</span>
                </div>

                {/* Compact Output Files Grid / Rows */}
                <div
                  className={`gap-1.5 ${
                    splitResult.files.length > 3 ? 'grid grid-cols-1 sm:grid-cols-2' : 'space-y-1'
                  }`}
                >
                  {splitResult.files.slice(0, 6).map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1 rounded-lg border border-slate-200/70 bg-slate-50/50 hover:bg-white transition"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {file.pageCount}p • {file.sizeFormatted}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(file)}
                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition cursor-pointer shrink-0"
                        title={`Download ${file.name}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {splitResult.files.length > 6 && (
                  <p className="text-[10px] text-slate-500 text-center font-medium">
                    + {splitResult.files.length - 6} more files included in ZIP download
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* BOTTOM ACTION AREA: Split Button / Progress Bar / Success Banner          */}
        {/* ========================================================================= */}
        <div className="shrink-0 pt-1 pb-1">
          {/* STATE 1: PROCESSING */}
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

          {/* STATE 2: SUCCESS BAR (Download ZIP/PDF & Split Another) */}
          {splitResult && !isProcessing && (
            <div className="w-full bg-emerald-50/90 border border-emerald-200/90 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">PDF split successfully</h3>
                  <p className="text-xs text-slate-600 truncate font-medium">
                    <span className="font-semibold text-slate-800">
                      {splitResult.zipUrl ? splitResult.zipName : splitResult.files[0]?.name}
                    </span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span>{splitResult.totalFiles} files created</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span>{splitResult.totalSizeFormatted}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadMain}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm py-2 px-4 rounded-xl shadow-xs transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  {splitResult.zipUrl ? 'Download ZIP' : 'Download PDF'}
                </button>
                <button
                  type="button"
                  onClick={handleSplitAnother}
                  className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm py-2 px-3.5 rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Split Another PDF
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: PRIMARY SPLIT ACTION BUTTON */}
          {!isProcessing && !splitResult && (
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleSplitPdf}
                disabled={!fileItem || !isConfigValid || isProcessing}
                className={`w-full max-w-md py-2.5 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                  !fileItem || !isConfigValid || isProcessing
                    ? 'bg-slate-200 text-slate-400 border border-slate-300/50 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white hover:shadow-md cursor-pointer'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>Split PDF</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Dynamic Validation & Status Text */}
              <div className="flex items-center justify-center gap-1 text-[11px] mt-1.5 font-medium">
                {!fileItem ? (
                  <>
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-amber-600">Upload a PDF to continue</span>
                  </>
                ) : !isConfigValid ? (
                  <>
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-amber-600">
                      {rangeValidationError || visualSelectionError || 'Choose how you want to split the PDF'}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-emerald-600 truncate">
                      Ready to split into {computedOutputFileCount} {computedOutputFileCount === 1 ? 'file' : 'files'}
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
