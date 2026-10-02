'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Save,
  Download,
  RotateCcw,
  RotateCw,
  Type,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Upload,
  Check,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  FileUp,
  Loader2,
  RefreshCw,
  Sliders,
  MousePointer,
  AlertTriangle,
  X,
  Layers,
} from 'lucide-react';
import {
  EditorPage,
  ActiveTool,
  TextElement,
  ImageElement,
} from './types';
import { INITIAL_PAGES } from './sampleData';
import { generateEditedPdf } from './pdfExport';
import { trackToolEvent } from '@/lib/analytics/tracker';

export function PdfEditor() {
  // Document state: begins in upload mode until user uploads a PDF
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(0);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // Workflow Stage: 'editor' | 'review'
  const [workflowStage, setWorkflowStage] = useState<'editor' | 'review'>('editor');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [compiledPdfBlob, setCompiledPdfBlob] = useState<Blob | null>(null);
  const [compiledPdfUrl, setCompiledPdfUrl] = useState<string | null>(null);

  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Pages state
  const [pages, setPages] = useState<EditorPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');

  // Selection state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // History state for Undo / Redo
  const [history, setHistory] = useState<EditorPage[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Formatting state for selected text
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [fontSize, setFontSize] = useState<number>(14);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [textColor, setTextColor] = useState<string>('#0f172a');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Zoom level (0.5 to 2.0)
  const [zoom, setZoom] = useState<number>(1.0);
  const [showZoomMenu, setShowZoomMenu] = useState<boolean>(false);

  // Bottom thumbnail filmstrip toggle
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dragging & Resizing elements state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [elementStartPos, setElementStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Uploaded original PDF buffer
  const [originalPdfBuffer, setOriginalPdfBuffer] = useState<ArrayBuffer | null>(null);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pageSheetRef = useRef<HTMLDivElement>(null);

  const currentPage = pages[currentPageIndex] || pages[0];

  // Lock desktop body and html scrolling on desktop viewports
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
      window.removeEventListener('resize', applyOverflow);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // Cleanup compiled PDF object URL
  useEffect(() => {
    return () => {
      if (compiledPdfUrl) {
        URL.revokeObjectURL(compiledPdfUrl);
      }
    };
  }, [compiledPdfUrl]);

  // Helper to show transient toast message
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Push new state to history
  const pushHistory = (newPages: EditorPage[]) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(JSON.parse(JSON.stringify(newPages)));
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    setPages(newPages);
    setHasUnsavedChanges(true);
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPages(JSON.parse(JSON.stringify(history[newIndex])));
      setHasUnsavedChanges(true);
      showToast('Undo');
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPages(JSON.parse(JSON.stringify(history[newIndex])));
      setHasUnsavedChanges(true);
      showToast('Redo');
    }
  };

  // Get currently selected element
  const selectedElement = currentPage?.elements.find((el) => el.id === selectedElementId);

  // Sync format bar with selected element
  useEffect(() => {
    if (selectedElement && selectedElement.type === 'text') {
      const textEl = selectedElement as TextElement;
      setFontFamily(textEl.fontFamily || 'Inter');
      setFontSize(textEl.fontSize || 14);
      setIsBold(!!textEl.bold);
      setIsItalic(!!textEl.italic);
      setIsUnderline(!!textEl.underline);
      setTextColor(textEl.color || '#0f172a');
      setTextAlign(textEl.align || 'left');
    }
  }, [selectedElementId, currentPageIndex]);

  // Update selected text element format
  const updateSelectedTextElement = (updates: Partial<TextElement>) => {
    if (!selectedElementId) return;
    const newPages = pages.map((page, idx) => {
      if (idx !== currentPageIndex) return page;
      return {
        ...page,
        elements: page.elements.map((el) => {
          if (el.id === selectedElementId && el.type === 'text') {
            return { ...el, ...updates };
          }
          return el;
        }),
      };
    });
    pushHistory(newPages);
  };

  // Load PDF file (renders pages via pdfjs-dist)
  const loadPdfFromFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Please select a valid PDF document.');
      return;
    }

    try {
      setIsLoadingPdf(true);
      setLoadingStatus(`Reading "${file.name}"...`);
      const buffer = await file.arrayBuffer();
      // Keep independent copy to prevent detached ArrayBuffer issues
      setOriginalPdfBuffer(buffer.slice(0));
      setUploadedFileName(file.name);
      setUploadedFileSize(file.size);

      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
      if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
          pdfjs.version || '3.11.174'
        }/pdf.worker.min.js`;
      }

      setLoadingStatus('Rendering PDF pages...');
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });

      const loadedPdf = await loadingTask.promise;
      const numPages = loadedPdf.numPages;
      const loadedPages: EditorPage[] = [];

      for (let p = 1; p <= numPages; p++) {
        setLoadingStatus(`Rendering page ${p} of ${numPages}...`);
        const page = await loadedPdf.getPage(p);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/png');

          loadedPages.push({
            id: `loaded-page-${p}-${Date.now()}`,
            pageNumber: p,
            rotation: 0,
            canvasDataUrl: dataUrl,
            sourcePageIndex: p - 1,
            width: viewport.width,
            height: viewport.height,
            canvasWidth: 600,
            canvasHeight: Math.round((600 / viewport.width) * viewport.height),
            title: `Page ${p}`,
            elements: [],
            drawings: [],
          });
        }
      }

      if (loadedPages.length > 0) {
        setPages(loadedPages);
        setHistory([loadedPages]);
        setHistoryIndex(0);
        setCurrentPageIndex(0);
        setSelectedElementId(null);
        setIsLoaded(true);
        setWorkflowStage('editor');
        setHasUnsavedChanges(false);
        showToast(`Ready! Loaded ${loadedPages.length} pages from "${file.name}"`);
        trackToolEvent('edit-pdf', 'tool_started');
      }
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      showToast(`Failed to load PDF: ${err?.message || 'Invalid format'}`);
    } finally {
      setIsLoadingPdf(false);
      setLoadingStatus('');
    }
  };

  // Add new text element to current page
  const handleAddTextAt = (x?: number, y?: number) => {
    const newId = `text-${Date.now()}`;
    const defaultX = 60;
    const defaultY = 120 + ((currentPage?.elements.length || 0) * 30) % 300;
    const posX = x !== undefined ? Math.max(10, Math.min(x, 480)) : defaultX;
    const posY = y !== undefined ? Math.max(10, Math.min(y, 700)) : defaultY;

    const newElement: TextElement = {
      id: newId,
      type: 'text',
      text: 'Type your text here...',
      x: posX,
      y: posY,
      width: 240,
      height: 48,
      fontSize: fontSize || 14,
      fontFamily: fontFamily || 'Inter',
      color: textColor || '#0f172a',
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      align: textAlign,
    };

    const newPages = pages.map((page, idx) => {
      if (idx !== currentPageIndex) return page;
      return {
        ...page,
        elements: [...page.elements, newElement],
      };
    });

    pushHistory(newPages);
    setSelectedElementId(newId);
    setActiveTool('select');
    showToast('Text element added. Click inside to edit.');
  };

  const handleAddTextClick = () => {
    setActiveTool('add-text');
    handleAddTextAt();
  };

  // Global Keyboard Shortcuts (Delete, Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditingInput =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable);

      if (!isEditingInput) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedElementId) {
            e.preventDefault();
            handleDeleteSelectedElement();
          }
        }
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          handleUndo();
        }
        if (
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
        ) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, historyIndex, history]);

  // Add Image to current page
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      const newId = `img-${Date.now()}`;
      const newElement: ImageElement = {
        id: newId,
        type: 'image',
        src,
        x: 80,
        y: 180,
        width: 200,
        height: 140,
        alt: file.name,
      };

      const newPages = pages.map((page, idx) => {
        if (idx !== currentPageIndex) return page;
        return {
          ...page,
          elements: [...page.elements, newElement],
        };
      });

      pushHistory(newPages);
      setSelectedElementId(newId);
      setActiveTool('select');
      showToast('Image inserted on page');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Rotate active page 90 degrees clockwise
  const handleRotatePage = () => {
    const newPages = pages.map((page, idx) => {
      if (idx !== currentPageIndex) return page;
      const nextRotation = ((page.rotation || 0) + 90) % 360;
      return {
        ...page,
        rotation: nextRotation,
      };
    });
    pushHistory(newPages);
    showToast(`Page ${currentPageIndex + 1} rotated 90°`);
  };

  // Add a blank page
  const handleAddPage = () => {
    const newPageNum = pages.length + 1;
    const newPage: EditorPage = {
      id: `page-${newPageNum}-${Date.now()}`,
      pageNumber: newPageNum,
      rotation: 0,
      title: `Page ${newPageNum}`,
      customTemplateType: 'blank',
      elements: [],
      drawings: [],
    };
    const newPages = [...pages, newPage];
    pushHistory(newPages);
    setCurrentPageIndex(newPages.length - 1);
    showToast(`Page ${newPageNum} added`);
  };

  // Delete current page
  const handleDeletePage = () => {
    if (pages.length <= 1) {
      showToast('Cannot delete the only page');
      return;
    }
    const newPages = pages.filter((_, idx) => idx !== currentPageIndex);
    const updatedPages = newPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    pushHistory(updatedPages);
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
    showToast('Page deleted');
  };

  // Delete selected element
  const handleDeleteSelectedElement = () => {
    if (!selectedElementId) return;
    const newPages = pages.map((page, idx) => {
      if (idx !== currentPageIndex) return page;
      return {
        ...page,
        elements: page.elements.filter((el) => el.id !== selectedElementId),
      };
    });
    pushHistory(newPages);
    setSelectedElementId(null);
    showToast('Element removed');
  };

  // Save action: compiles PDF and enters review state
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const pdfBytes = await generateEditedPdf({
        pages,
        originalPdfBuffer: originalPdfBuffer ? originalPdfBuffer.slice(0) : null,
      });

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (compiledPdfUrl) {
        URL.revokeObjectURL(compiledPdfUrl);
      }

      setCompiledPdfBlob(blob);
      setCompiledPdfUrl(url);
      setHasUnsavedChanges(false);
      setWorkflowStage('review');
      trackToolEvent('edit-pdf', 'tool_completed');
      showToast('Changes saved successfully! Review your document below.');
    } catch (err: any) {
      console.error('PDF compile error:', err);
      showToast(`Save error: ${err?.message || 'Failed generating PDF'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Final Download of compiled PDF
  const handleDownloadPdf = () => {
    if (!compiledPdfBlob) return;
    const url = URL.createObjectURL(compiledPdfBlob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = uploadedFileName
      ? uploadedFileName.replace(/\.pdf$/i, '')
      : 'toolino-edited';
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `${baseName}_edited_${dateStr}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded "${link.download}"`);
  };

  // Canvas mouse handlers for dragging elements and click-to-place text
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'add-text') {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = Math.round((e.clientX - rect.left) / zoom);
      const clickY = Math.round((e.clientY - rect.top) / zoom);
      handleAddTextAt(clickX, clickY);
    } else if (activeTool === 'select' && e.target === e.currentTarget) {
      setSelectedElementId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && selectedElementId) {
      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;

      setPages((prev) =>
        prev.map((page, idx) => {
          if (idx !== currentPageIndex) return page;
          return {
            ...page,
            elements: page.elements.map((el) => {
              if (el.id === selectedElementId) {
                return {
                  ...el,
                  x: Math.max(0, Math.round(elementStartPos.x + deltaX)),
                  y: Math.max(0, Math.round(elementStartPos.y + deltaY)),
                };
              }
              return el;
            }),
          };
        })
      );
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      pushHistory(pages);
    }
  };

  // Start dragging an element
  const handleElementDragStart = (e: React.MouseEvent, elem: any) => {
    e.stopPropagation();
    setSelectedElementId(elem.id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStartPos({ x: elem.x, y: elem.y });
  };

  // Load sample proposal template if user clicks "Try sample"
  const handleLoadSample = () => {
    setPages(INITIAL_PAGES);
    setHistory([INITIAL_PAGES]);
    setHistoryIndex(0);
    setCurrentPageIndex(0);
    setSelectedElementId('p1-text-intro');
    setUploadedFileName('Project-Proposal.pdf');
    setUploadedFileSize(125 * 1024);
    setIsLoaded(true);
    setWorkflowStage('editor');
    setHasUnsavedChanges(false);
    showToast('Loaded sample project proposal');
    trackToolEvent('edit-pdf', 'tool_started');
  };

  // Confirm replacement or start over when unsaved changes exist
  const requestSafeAction = (action: () => void) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => action);
      setShowConfirmModal(true);
    } else {
      action();
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirmModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleStartOver = () => {
    requestSafeAction(() => {
      setPages([]);
      setHistory([]);
      setHistoryIndex(0);
      setCurrentPageIndex(0);
      setSelectedElementId(null);
      setOriginalPdfBuffer(null);
      setUploadedFileName('');
      setUploadedFileSize(0);
      setIsLoaded(false);
      setWorkflowStage('editor');
      setCompiledPdfBlob(null);
      setHasUnsavedChanges(false);
    });
  };

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ===========================================================================
  // SCREEN 1: UPLOAD PDF VIEW (Before any file is loaded)
  // ===========================================================================
  if (!isLoaded) {
    return (
      <div className="w-full min-h-[calc(100vh-72px)] bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800 font-sans select-none">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadPdfFromFile(file);
            e.target.value = '';
          }}
        />

        <div className="max-w-xl w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <nav aria-label="Breadcrumb" className="inline-flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/pdf-tools" className="hover:text-blue-600 transition-colors">
                PDF Tools
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-800">Edit PDF</span>
            </nav>

            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Edit PDF
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full">
                v1.0.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Upload a PDF to start editing text, adding images, and applying annotations directly in your browser.
            </p>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingFile(false);
              const file = e.dataTransfer.files?.[0];
              if (file) loadPdfFromFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
              isDraggingFile
                ? 'border-blue-500 bg-blue-50/70 scale-[1.01] shadow-lg shadow-blue-500/10'
                : 'border-slate-300 hover:border-blue-400 bg-white shadow-xs hover:shadow-md'
            }`}
          >
            {isLoadingPdf ? (
              <div className="py-8 space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{loadingStatus}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Rendering pages client-side for immediate editing...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-xs">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Edit your PDF
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Drag &amp; drop your PDF here or click below to choose
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-2"
                  >
                    <FileUp className="w-4 h-4" />
                    <span>Choose PDF File</span>
                  </button>
                </div>
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-600">
                    PDF files only • up to 100 MB
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>100% private. Files stay on your device and are never sent to a server.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Option to try sample */}
          <div className="text-center pt-1">
            <button
              onClick={handleLoadSample}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Or click here to test with a sample proposal PDF</span>
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // SCREEN 2: MAIN EDITOR WORKSPACE OR REVIEW SCREEN
  // ===========================================================================
  return (
    <div className="w-full bg-slate-100 font-sans flex flex-col min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden select-none">
      {/* Hidden file inputs */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            requestSafeAction(() => loadPdfFromFile(file));
          }
          e.target.value = '';
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* ========================================================================= */}
      {/* 1. TOP DOCUMENT BAR                                                       */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200/90 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {uploadedFileName || 'Document.pdf'}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {formatBytes(uploadedFileSize)} • {pages.length} page{pages.length !== 1 ? 's' : ''}
              </span>
              {hasUnsavedChanges ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Unsaved changes</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold hidden sm:inline-flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>All changes saved</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => replaceFileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Replace current PDF with another file"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Replace PDF</span>
          </button>

          <button
            type="button"
            onClick={handleStartOver}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Close document and start over"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPACT TOP EDITOR TOOLBAR (ABSOLUTELY NO SIDEBARS)                    */}
      {/* ========================================================================= */}
      {workflowStage === 'editor' && (
        <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-xs z-20">
          {/* Left Tool Group */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none py-0.5">
            {/* Undo / Redo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-all"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-all"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

            {/* Select Tool */}
            <button
              type="button"
              onClick={() => setActiveTool('select')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTool === 'select'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 border border-slate-200/80 bg-white'
              }`}
              title="Select tool: click objects to move or edit"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Select</span>
            </button>

            {/* Add Text Tool */}
            <button
              type="button"
              onClick={handleAddTextClick}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTool === 'add-text' || (selectedElement && selectedElement.type === 'text')
                  ? 'bg-blue-50 text-blue-700 border border-blue-300 font-bold'
                  : 'text-slate-700 hover:bg-slate-100 border border-slate-200/80 bg-white'
              }`}
              title="Add text to document"
            >
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Text</span>
            </button>

            {/* Add Image Tool */}
            <button
              type="button"
              onClick={() => {
                setActiveTool('add-image');
                imageInputRef.current?.click();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200/80 bg-white flex items-center gap-1.5 transition-all"
              title="Add image to document"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Add Image</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

            {/* Text Formatting Controls (Active when text element selected) */}
            {selectedElement && selectedElement.type === 'text' && (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-0.5">
                {/* Font Family */}
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    setFontFamily(e.target.value);
                    updateSelectedTextElement({ fontFamily: e.target.value });
                  }}
                  className="bg-transparent border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier</option>
                  <option value="Georgia">Georgia</option>
                </select>

                {/* Font Size */}
                <select
                  value={fontSize}
                  onChange={(e) => {
                    const sz = parseInt(e.target.value, 10);
                    setFontSize(sz);
                    updateSelectedTextElement({ fontSize: sz });
                  }}
                  className="bg-transparent border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                >
                  {[10, 12, 14, 16, 18, 20, 24, 32, 40].map((s) => (
                    <option key={s} value={s}>
                      {s}px
                    </option>
                  ))}
                </select>

                {/* Bold, Italic, Underline */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isBold;
                    setIsBold(next);
                    updateSelectedTextElement({ bold: next });
                  }}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    isBold ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200/70 text-slate-700'
                  }`}
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isItalic;
                    setIsItalic(next);
                    updateSelectedTextElement({ italic: next });
                  }}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    isItalic ? 'bg-blue-100 text-blue-700 italic' : 'hover:bg-slate-200/70 text-slate-700'
                  }`}
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isUnderline;
                    setIsUnderline(next);
                    updateSelectedTextElement({ underline: next });
                  }}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    isUnderline ? 'bg-blue-100 text-blue-700 underline' : 'hover:bg-slate-200/70 text-slate-700'
                  }`}
                  title="Underline"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                {/* Text Color Picker */}
                <div className="flex items-center px-1">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => {
                      setTextColor(e.target.value);
                      updateSelectedTextElement({ color: e.target.value });
                    }}
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                    title="Text Color"
                  />
                </div>

                {/* Text Alignment */}
                <button
                  type="button"
                  onClick={() => {
                    setTextAlign('left');
                    updateSelectedTextElement({ align: 'left' });
                  }}
                  className={`p-1.5 rounded-lg text-xs ${
                    textAlign === 'left' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200/70 text-slate-700'
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTextAlign('center');
                    updateSelectedTextElement({ align: 'center' });
                  }}
                  className={`p-1.5 rounded-lg text-xs ${
                    textAlign === 'center' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200/70 text-slate-700'
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTextAlign('right');
                    updateSelectedTextElement({ align: 'right' });
                  }}
                  className={`p-1.5 rounded-lg text-xs ${
                    textAlign === 'right' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200/70 text-slate-700'
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelectedElement}
                  className="p-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors ml-1"
                  title="Delete element"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Action Group: Page Manipulation */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRotatePage}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              title="Rotate current page 90° clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Rotate</span>
            </button>

            <button
              type="button"
              onClick={handleAddPage}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              title="Insert a blank page"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Add Page</span>
            </button>

            <button
              type="button"
              onClick={handleDeletePage}
              disabled={pages.length <= 1}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              title="Delete current page"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Delete Page</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CENTER PDF CANVAS / WORKSPACE                                          */}
      {/* ========================================================================= */}
      {workflowStage === 'editor' && (
        <div
          className="flex-1 relative overflow-auto p-4 sm:p-6 flex flex-col items-center justify-start min-h-0 bg-slate-200/60"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Centered PDF Page Container */}
          <div
            ref={pageSheetRef}
            onClick={handleMouseDown}
            style={{
              width: `${(currentPage?.canvasWidth || 600) * zoom}px`,
              minHeight: `${(currentPage?.canvasHeight || 848) * zoom}px`,
              transformOrigin: 'top center',
            }}
            className="relative bg-white rounded-lg shadow-xl border border-slate-300 transition-all duration-150 cursor-crosshair overflow-hidden shrink-0 my-2"
          >
            {/* Background Page Render (from PDF or sample template) */}
            {currentPage?.canvasDataUrl ? (
              <img
                src={currentPage.canvasDataUrl}
                alt={`Page ${currentPage.pageNumber}`}
                className="w-full h-full object-contain pointer-events-none select-none"
                style={{
                  transform: currentPage.rotation ? `rotate(${currentPage.rotation}deg)` : undefined,
                }}
              />
            ) : (
              <div className="w-full h-full p-8 flex flex-col justify-between pointer-events-none select-none text-slate-800">
                <div className="space-y-4">
                  <div className="text-xl font-extrabold text-blue-900 border-b border-slate-100 pb-2">
                    {currentPage?.title || `Page ${currentPageIndex + 1}`}
                  </div>
                  <div className="text-xs text-slate-500">
                    Click anywhere on this blank page or click &quot;Add Text&quot; to begin editing.
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  Page {currentPageIndex + 1} of {pages.length}
                </div>
              </div>
            )}

            {/* Elements Layer (Text, Images) */}
            <div
              className="absolute inset-0"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: `${currentPage?.canvasWidth || 600}px`,
                height: `${currentPage?.canvasHeight || 848}px`,
              }}
            >
              {currentPage?.elements.map((elem) => {
                const isSelected = elem.id === selectedElementId;

                if (elem.type === 'text') {
                  const textEl = elem as TextElement;
                  return (
                    <div
                      key={elem.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(elem.id);
                      }}
                      onMouseDown={(e) => handleElementDragStart(e, elem)}
                      style={{
                        position: 'absolute',
                        left: `${textEl.x}px`,
                        top: `${textEl.y}px`,
                        width: `${textEl.width}px`,
                        fontSize: `${textEl.fontSize}px`,
                        fontFamily: textEl.fontFamily || 'Inter',
                        color: textEl.color || '#0f172a',
                        fontWeight: textEl.bold ? 'bold' : 'normal',
                        fontStyle: textEl.italic ? 'italic' : 'normal',
                        textDecoration: textEl.underline ? 'underline' : 'none',
                        textAlign: textEl.align || 'left',
                        cursor: 'move',
                      }}
                      className={`group p-1.5 rounded transition-all select-text ${
                        isSelected
                          ? 'border-2 border-blue-500 bg-blue-50/20 shadow-md ring-1 ring-blue-300 z-20'
                          : 'hover:border hover:border-slate-300'
                      }`}
                    >
                      {/* Floating Mini Action Bar */}
                      {isSelected && (
                        <div
                          className="absolute -top-8 left-0 bg-white border border-slate-200 rounded-lg shadow-md px-2 py-0.5 flex items-center gap-1.5 z-30 pointer-events-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => updateSelectedTextElement({ bold: !textEl.bold })}
                            className={`p-1 rounded text-xs ${
                              textEl.bold ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Bold className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSelectedTextElement({ italic: !textEl.italic })}
                            className={`p-1 rounded text-xs ${
                              textEl.italic ? 'bg-blue-100 text-blue-700 italic' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Italic className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteSelectedElement}
                            className="p-1 rounded text-xs text-red-600 hover:bg-red-50"
                            title="Delete text element"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Content Editable Area */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updated = e.currentTarget.innerText;
                          updateSelectedTextElement({ text: updated });
                        }}
                        className="outline-none min-h-[20px]"
                      >
                        {textEl.text}
                      </div>
                    </div>
                  );
                }

                if (elem.type === 'image') {
                  const imgEl = elem as ImageElement;
                  return (
                    <div
                      key={elem.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(elem.id);
                      }}
                      onMouseDown={(e) => handleElementDragStart(e, elem)}
                      style={{
                        position: 'absolute',
                        left: `${imgEl.x}px`,
                        top: `${imgEl.y}px`,
                        width: `${imgEl.width}px`,
                        height: `${imgEl.height}px`,
                        cursor: 'move',
                      }}
                      className={`group rounded transition-all ${
                        isSelected
                          ? 'border-2 border-blue-500 shadow-md ring-1 ring-blue-300 z-20'
                          : 'hover:border hover:border-slate-300'
                      }`}
                    >
                      {/* Floating Mini Action Bar */}
                      {isSelected && (
                        <div
                          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-md px-2 py-0.5 flex items-center gap-2 z-30 pointer-events-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="p-1 rounded text-slate-600 hover:bg-slate-100"
                            title="Replace Image"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteSelectedElement}
                            className="p-1 rounded text-red-600 hover:bg-red-50"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <img
                        src={imgEl.src}
                        alt={imgEl.alt || 'PDF asset'}
                        className="w-full h-full object-contain pointer-events-none rounded select-none"
                      />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BOTTOM CONTROLS BAR (Page Navigation, Zoom, Save Changes)            */}
          {/* ===================================================================== */}
          <div className="sticky bottom-3 mt-4 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl shadow-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-30 max-w-xl w-full">
            {/* Page Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPageIndex((idx) => Math.max(0, idx - 1))}
                disabled={currentPageIndex <= 0}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-700 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 font-bold text-slate-800 px-1">
                <span>Page {currentPageIndex + 1} of {pages.length}</span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentPageIndex((idx) => Math.min(pages.length - 1, idx + 1))}
                disabled={currentPageIndex >= pages.length - 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-700 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 relative">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowZoomMenu(!showZoomMenu)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 flex items-center gap-1 min-w-[56px] justify-center"
                >
                  <span>{Math.round(zoom * 100)}%</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showZoomMenu && (
                  <div className="absolute bottom-full mb-1.5 left-0 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-28 z-50 animate-in fade-in">
                    {[50, 75, 100, 125, 150, 200].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setZoom(pct / 100);
                          setShowZoomMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 ${
                          Math.round(zoom * 100) === pct
                            ? 'font-bold text-blue-600 bg-blue-50/50'
                            : 'text-slate-700'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.0, parseFloat((z + 0.1).toFixed(2))))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Save / Apply Changes Action Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. REVIEW SCREEN (REVIEW BEFORE DOWNLOAD)                                 */}
      {/* ========================================================================= */}
      {workflowStage === 'review' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-0 bg-slate-50">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in">
            {/* Success Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Changes saved successfully!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Your edited PDF has been generated with all custom text and image modifications.
              </p>
            </div>

            {/* Document Metadata Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Document Name:</span>
                <span className="font-bold text-slate-900 truncate max-w-[220px]">
                  {uploadedFileName || 'Document.pdf'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Total Pages:</span>
                <span className="font-bold text-slate-900">{pages.length} pages</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Compiled Size:</span>
                <span className="font-bold text-emerald-700">
                  {compiledPdfBlob ? formatBytes(compiledPdfBlob.size) : 'Ready'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Edited PDF</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWorkflowStage('editor')}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Continue Editing</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartOver}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Start Over</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNSAVED CHANGES CONFIRMATION MODAL                                        */}
      {/* ========================================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                You have unsaved changes
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to leave? Unsaved additions or modifications will be lost.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOAST NOTIFICATION                                                        */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
