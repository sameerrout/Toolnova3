'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Trash2,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  FileText,
  Sparkles,
  Undo2,
  Redo2,
  RotateCcw,
  RotateCw,
  Copy,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  CheckSquare,
  Square,
  Layers,
  ArrowDownUp,
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface OrganizePdfPageItem {
  id: string;
  originalIndex: number; // 0-based index in source PDF
  originalPageNumber: number; // 1-based original page number
  rotation: number; // 0, 90, 180, 270 delta
  thumbnailDataUrl?: string;
  aspectRatio: number;
}

export interface OrganizePdfFileItem {
  file: File;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount: number;
  originalPdfBuffer: ArrayBuffer;
}

export interface OrganizedResult {
  blob: Blob;
  url: string;
  fileName: string;
  sizeFormatted: string;
  pageCount: number;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export function OrganizePdfConverter() {
  const [fileItem, setFileItem] = useState<OrganizePdfFileItem | null>(null);
  const [pages, setPages] = useState<OrganizePdfPageItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // History stack for Undo / Redo
  const [history, setHistory] = useState<OrganizePdfPageItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Upload dropzone state
  const [isDragOverUpload, setIsDragOverUpload] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rendering & processing state
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('Preparing...');
  const [workflowStage, setWorkflowStage] = useState<'edit' | 'review'>('edit');
  const [organizedResult, setOrganizedResult] = useState<OrganizedResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

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
      if (organizedResult?.url) {
        URL.revokeObjectURL(organizedResult.url);
      }
    };
  }, [organizedResult]);

  // Format bytes helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Push new state to history stack
  const pushState = useCallback((newPages: OrganizePdfPageItem[]) => {
    setPages(newPages);
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newPages];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevPages = history[historyIndex - 1];
      setPages(prevPages);
      setHistoryIndex((prev) => prev - 1);
      setSelectedIds(new Set());
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextPages = history[historyIndex + 1];
      setPages(nextPages);
      setHistoryIndex((prev) => prev + 1);
      setSelectedIds(new Set());
    }
  };

  // Render thumbnails using pdfjs-dist
  const renderThumbnails = async (buffer: ArrayBuffer, initialPages: OrganizePdfPageItem[]) => {
    setIsLoadingThumbnails(true);
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
      if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
          pdfjs.version || '3.11.174'
        }/pdf.worker.min.js`;
      }

      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });

      const loadedPdf = await loadingTask.promise;
      const numPages = loadedPdf.numPages;

      for (let p = 1; p <= numPages; p++) {
        try {
          const page = await loadedPdf.getPage(p);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const targetWidth = 280;
          const scale = Math.min(1.5, targetWidth / unscaledViewport.width);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            setPages((prev) =>
              prev.map((item) =>
                item.originalIndex === p - 1
                  ? {
                      ...item,
                      thumbnailDataUrl: dataUrl,
                      aspectRatio: viewport.width / viewport.height,
                    }
                  : item
              )
            );
          }
        } catch {
          // If a thumbnail render fails, fallback stays available
        }
      }
    } catch {
      // Fallback: visual placeholder cards are used
    } finally {
      setIsLoadingThumbnails(false);
    }
  };

  // Handle PDF file selection
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

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const docPages = pdfDoc.getPages();
      const count = docPages.length;

      if (count === 0) {
        setErrorMessage('The selected PDF contains no pages.');
        return;
      }

      const initialPages: OrganizePdfPageItem[] = docPages.map((p, idx) => ({
        id: `page-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        originalIndex: idx,
        originalPageNumber: idx + 1,
        rotation: 0,
        aspectRatio: p.getWidth() / p.getHeight() || 0.707,
      }));

      setFileItem({
        file,
        name: file.name,
        sizeBytes: file.size,
        sizeFormatted: formatFileSize(file.size),
        pageCount: count,
        originalPdfBuffer: buffer,
      });

      setPages(initialPages);
      setHistory([initialPages]);
      setHistoryIndex(0);
      setSelectedIds(new Set());
      setWorkflowStage('edit');
      setOrganizedResult(null);

      // Render actual visual page previews
      renderThumbnails(buffer, initialPages);
    } catch {
      setErrorMessage('Unable to load or parse the PDF document. It may be password-protected or corrupted.');
    }
  };

  // Drag and drop handlers for upload area
  const handleDragOverUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUpload(true);
  };

  const handleDragLeaveUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUpload(false);
  };

  const handleDropUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUpload(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files);
    }
  };

  // --- PAGE SELECTION HELPERS ---
  const toggleSelectPage = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllPages = () => {
    setSelectedIds(new Set(pages.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // --- REORDERING: DRAG AND DROP ---
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDropItem = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...pages];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    setDragOverIndex(null);
    pushState(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Step reorder left / right
  const movePageLeft = (index: number) => {
    if (index <= 0) return;
    const updated = [...pages];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    pushState(updated);
  };

  const movePageRight = (index: number) => {
    if (index >= pages.length - 1) return;
    const updated = [...pages];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    pushState(updated);
  };

  // --- ROTATION OPERATIONS ---
  const rotatePageLeft = (id: string) => {
    const updated = pages.map((p) =>
      p.id === id ? { ...p, rotation: (p.rotation - 90 + 360) % 360 } : p
    );
    pushState(updated);
  };

  const rotatePageRight = (id: string) => {
    const updated = pages.map((p) =>
      p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    );
    pushState(updated);
  };

  const rotateSelectedLeft = () => {
    if (selectedIds.size === 0) return;
    const updated = pages.map((p) =>
      selectedIds.has(p.id) ? { ...p, rotation: (p.rotation - 90 + 360) % 360 } : p
    );
    pushState(updated);
  };

  const rotateSelectedRight = () => {
    if (selectedIds.size === 0) return;
    const updated = pages.map((p) =>
      selectedIds.has(p.id) ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    );
    pushState(updated);
  };

  // --- DELETION OPERATIONS ---
  const deletePage = (id: string) => {
    if (pages.length <= 1) {
      setErrorMessage('Your PDF must contain at least one page.');
      return;
    }
    const updated = pages.filter((p) => p.id !== id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setErrorMessage(null);
    pushState(updated);
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (selectedIds.size >= pages.length) {
      setErrorMessage('Your PDF must contain at least one page. Cannot delete all pages.');
      return;
    }
    const updated = pages.filter((p) => !selectedIds.has(p.id));
    setSelectedIds(new Set());
    setErrorMessage(null);
    pushState(updated);
  };

  // --- DUPLICATE PAGE ---
  const duplicatePage = (index: number) => {
    const target = pages[index];
    const copy: OrganizePdfPageItem = {
      ...target,
      id: `page-copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    const updated = [...pages];
    updated.splice(index + 1, 0, copy);
    pushState(updated);
  };

  const duplicateSelected = () => {
    if (selectedIds.size === 0) return;
    const updated: OrganizePdfPageItem[] = [];
    for (const p of pages) {
      updated.push(p);
      if (selectedIds.has(p.id)) {
        updated.push({
          ...p,
          id: `page-copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        });
      }
    }
    pushState(updated);
  };

  // --- REVERSE ORDER ---
  const handleReverseOrder = () => {
    const updated = [...pages].reverse();
    pushState(updated);
  };

  // --- RESET ALL ---
  const handleResetOrder = () => {
    if (history.length > 0) {
      const original = history[0];
      pushState(original);
      setSelectedIds(new Set());
      setErrorMessage(null);
    }
  };

  // --- START OVER ---
  const handleStartOver = () => {
    if (organizedResult?.url) {
      URL.revokeObjectURL(organizedResult.url);
    }
    setFileItem(null);
    setPages([]);
    setSelectedIds(new Set());
    setHistory([]);
    setHistoryIndex(-1);
    setWorkflowStage('edit');
    setOrganizedResult(null);
    setErrorMessage(null);
  };

  // --- SAVE & GENERATE ORGANIZED PDF ---
  const handleSaveOrganizedPdf = async () => {
    if (!fileItem || pages.length === 0) return;

    try {
      setIsProcessing(true);
      setProcessingStatus('Reading PDF document...');
      trackToolEvent('organize-pdf', 'tool_started');

      const srcDoc = await PDFDocument.load(fileItem.originalPdfBuffer, {
        ignoreEncryption: true,
      });
      const newDoc = await PDFDocument.create();

      setProcessingStatus(`Copying ${pages.length} pages in organized order...`);

      const indices = pages.map((p) => p.originalIndex);
      const copiedPages = await newDoc.copyPages(srcDoc, indices);

      for (let i = 0; i < copiedPages.length; i++) {
        const page = copiedPages[i];
        const item = pages[i];
        const origRot = page.getRotation().angle || 0;
        const finalRot = (origRot + item.rotation) % 360;
        page.setRotation(degrees(finalRot));
        newDoc.addPage(page);
      }

      setProcessingStatus('Saving organized PDF...');
      const pdfBytes = await newDoc.save();

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = fileItem.name.replace(/\.[^/.]+$/, '').trim();
      const outputName = `${baseName}_organized.pdf`;

      const result: OrganizedResult = {
        blob,
        url,
        fileName: outputName,
        sizeFormatted: formatFileSize(blob.size),
        pageCount: pages.length,
      };

      setOrganizedResult(result);
      setWorkflowStage('review');
      trackToolEvent('organize-pdf', 'tool_completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to organize PDF.';
      setErrorMessage(msg);
      trackToolEvent('organize-pdf', 'tool_failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger download of generated PDF
  const handleDownloadPdf = () => {
    if (!organizedResult) return;
    const a = document.createElement('a');
    a.href = organizedResult.url;
    a.download = organizedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const selectedCount = selectedIds.size;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="bg-[#f8fafc] w-full min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden flex flex-col font-sans">
      {/* Hidden File Inputs */}
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
      <input
        ref={replaceFileInputRef}
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
            <span className="font-bold text-slate-900">Organize PDF</span>
          </nav>

          {/* 2. Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Organize PDF
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Reorder, manage and organize your PDF pages easily, then save the final PDF.
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
                className="text-red-600 hover:text-red-900 font-bold text-xs shrink-0 ml-2"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* MIDDLE SECTION: Upload Area OR Main Workspace */}
        <div className="flex-1 flex flex-col min-h-0 my-2">
          {!fileItem ? (
            /* ========================================================================= */
            /* 1. INITIAL UPLOAD STATE                                                   */
            /* ========================================================================= */
            <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
              <div
                onDragOver={handleDragOverUpload}
                onDragLeave={handleDragLeaveUpload}
                onDrop={handleDropUpload}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-xl mx-auto rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center bg-white shadow-xs ${
                  isDragOverUpload
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-2xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1.5">
                  Upload your PDF
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-xs">
                  Drag &amp; drop a PDF here, or click to choose from your device.
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FileText className="w-4 h-4" />
                  Choose PDF
                </button>
                <div className="flex items-center gap-3 mt-6 text-[11px] text-slate-400 font-medium">
                  <span>PDF files only</span>
                  <span>•</span>
                  <span>Single file</span>
                  <span>•</span>
                  <span>Up to 100 MB</span>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. ORGANIZE PDF WORKSPACE                                                 */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Document Summary Bar */}
              <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {fileItem.name}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{fileItem.sizeFormatted}</span>
                      <span>•</span>
                      <span>
                        {pages.length} {pages.length === 1 ? 'page' : 'pages'} (original {fileItem.pageCount})
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
                    Replace PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition shadow-2xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove PDF
                  </button>
                </div>
              </div>

              {/* Smart Page Management Toolbar */}
              <div className="px-4 py-2 bg-white border-b border-slate-200/80 flex items-center justify-between gap-2.5 shrink-0 flex-wrap text-xs">
                {/* Left: Selection info & batch selectors */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={selectAllPages}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                    >
                      Select All
                    </button>
                    {selectedCount > 0 && (
                      <button
                        type="button"
                        onClick={clearSelection}
                        title="Clear Selection"
                        className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  {selectedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[11px]">
                      {selectedCount} selected
                    </span>
                  )}
                </div>

                {/* Right: Actions (Undo, Redo, Rotate, Delete, Reverse) */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Undo / Redo */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                      title="Undo last change"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-slate-200"></div>
                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                      title="Redo change"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actions for Selected Pages */}
                  <button
                    type="button"
                    onClick={rotateSelectedLeft}
                    disabled={selectedCount === 0}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    title="Rotate selected pages left"
                  >
                    <RotateCcw className="w-3 h-3 text-blue-600" />
                    Rotate Left
                  </button>

                  <button
                    type="button"
                    onClick={rotateSelectedRight}
                    disabled={selectedCount === 0}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    title="Rotate selected pages right"
                  >
                    <RotateCw className="w-3 h-3 text-blue-600" />
                    Rotate Right
                  </button>

                  <button
                    type="button"
                    onClick={duplicateSelected}
                    disabled={selectedCount === 0}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    title="Duplicate selected pages"
                  >
                    <Copy className="w-3 h-3 text-slate-600" />
                    Duplicate
                  </button>

                  <button
                    type="button"
                    onClick={deleteSelected}
                    disabled={selectedCount === 0 || selectedCount >= pages.length}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none bg-white border-rose-200 text-rose-600 hover:bg-rose-50"
                    title="Delete selected pages"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>

                  {/* Extra Utility: Reverse order */}
                  <button
                    type="button"
                    onClick={handleReverseOrder}
                    className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition flex items-center gap-1"
                    title="Reverse all pages"
                  >
                    <ArrowDownUp className="w-3 h-3" />
                    <span className="hidden sm:inline">Reverse</span>
                  </button>
                </div>
              </div>

              {/* Scrollable PDF Page Thumbnail Grid with Drag & Drop Reordering */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-slate-50/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {pages.map((p, index) => {
                    const isSelected = selectedIds.has(p.id);
                    const isDragging = draggedIndex === index;
                    const isDragOver = dragOverIndex === index;

                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOverItem(e, index)}
                        onDrop={() => handleDropItem(index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => toggleSelectPage(p.id)}
                        className={`bg-white rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-xs relative select-none cursor-pointer group ${
                          isDragging
                            ? 'opacity-40 scale-95 border-dashed border-blue-400'
                            : isDragOver
                            ? 'border-blue-500 ring-2 ring-blue-500/40 scale-[1.02]'
                            : isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                            : 'border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        {/* Page Card Header */}
                        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
                          {/* Selection Checkbox */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center transition ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-slate-300 bg-white group-hover:border-slate-400'
                              }`}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-transparent" />
                              )}
                            </span>
                            <span className="font-extrabold text-xs text-slate-800">
                              #{index + 1}
                            </span>
                          </div>

                          {/* Original Reference if moved/duplicated */}
                          <div className="flex items-center gap-1">
                            {p.originalPageNumber !== index + 1 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                (orig {p.originalPageNumber})
                              </span>
                            )}
                            {p.rotation !== 0 && (
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">
                                {p.rotation}°
                              </span>
                            )}
                            <div className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing p-0.5">
                              <GripVertical className="w-3 h-3" />
                            </div>
                          </div>
                        </div>

                        {/* Page Preview Thumbnail Container */}
                        <div className="h-32 sm:h-36 w-full my-2 bg-slate-100/70 rounded-lg overflow-hidden flex items-center justify-center relative p-1.5 border border-slate-200/50">
                          {p.thumbnailDataUrl ? (
                            /* Rendered Thumbnail with Smooth Visual CSS Rotation */
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{
                                transform: `rotate(${p.rotation}deg) scale(${
                                  p.rotation % 180 !== 0 ? 0.72 : 1
                                })`,
                                transition: 'transform 0.2s ease',
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.thumbnailDataUrl}
                                alt={`Page ${index + 1}`}
                                className="max-h-full max-w-full object-contain shadow-xs rounded border border-slate-200/70 bg-white"
                              />
                            </div>
                          ) : (
                            /* Fallback Skeleton/Vector Page Representation */
                            <div
                              className="w-16 h-24 bg-white rounded shadow-xs border border-slate-300 p-1.5 flex flex-col justify-between"
                              style={{
                                transform: `rotate(${p.rotation}deg) scale(${
                                  p.rotation % 180 !== 0 ? 0.72 : 1
                                })`,
                                transition: 'transform 0.2s ease',
                              }}
                            >
                              <div className="space-y-1">
                                <div className="h-1 w-8 bg-slate-200 rounded"></div>
                                <div className="h-1 w-10 bg-slate-100 rounded"></div>
                                <div className="h-1 w-9 bg-slate-100 rounded"></div>
                              </div>
                              <span className="text-center font-bold text-slate-400 text-[10px]">
                                {index + 1}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Page Bottom Quick Actions */}
                        <div
                          className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => movePageLeft(index)}
                              disabled={index === 0}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 transition"
                              title="Move left"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => movePageRight(index)}
                              disabled={index === pages.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 transition"
                              title="Move right"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => rotatePageLeft(p.id)}
                              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Rotate left"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => rotatePageRight(p.id)}
                              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Rotate right"
                            >
                              <RotateCw className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicatePage(index)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Duplicate page"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePage(p.id)}
                              disabled={pages.length <= 1}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-20 transition"
                              title="Delete page"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Review State & Action Bar */}
        {fileItem && (
          <div className="shrink-0 bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {workflowStage === 'edit' ? (
              /* Editing Stage Bottom Bar */
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {pages.length} pages organized
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Drag to reorder, rotate, or delete pages, then save your final PDF.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleStartOver}
                    disabled={isProcessing}
                    className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition shadow-2xs"
                  >
                    Start Over
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveOrganizedPdf}
                    disabled={isProcessing || pages.length === 0}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{processingStatus}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Save Organized PDF</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Review / Ready State Bottom Bar (BEFORE DOWNLOAD) */
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      ✓ PDF organized successfully
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {organizedResult?.fileName} • {organizedResult?.pageCount} pages • {organizedResult?.sizeFormatted}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setWorkflowStage('edit')}
                    className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                  >
                    Continue Editing
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
