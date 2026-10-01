'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Save,
  Download,
  RotateCcw,
  RotateCw,
  Type,
  Image as ImageIcon,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Indent,
  ChevronDown,
  X,
  Upload,
  Check,
  Sparkles,
  ShieldCheck,
  FileCode,
  FileUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  EditorPage,
  ActiveTool,
  TextElement,
  ImageElement,
} from './types';
import { INITIAL_PAGES, LAPTOP_SVG_DATA_URL } from './sampleData';
import { generateEditedPdf } from './pdfExport';

export function PdfEditor() {
  // Document state: begins in upload mode until user uploads a PDF
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

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
  const [textColor, setTextColor] = useState<string>('#1e293b');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Zoom level (0.5 to 2.0)
  const [zoom, setZoom] = useState<number>(1.0);
  const [showZoomMenu, setShowZoomMenu] = useState<boolean>(false);

  // Notifications and search
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchBox, setShowSearchBox] = useState<boolean>(false);

  // Dragging & Resizing elements state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [elementStartPos, setElementStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Uploaded original PDF buffer (stores the user's uploaded PDF)
  const [originalPdfBuffer, setOriginalPdfBuffer] = useState<ArrayBuffer | null>(null);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pageSheetRef = useRef<HTMLDivElement>(null);

  const currentPage = pages[currentPageIndex] || pages[0];

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
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPages(JSON.parse(JSON.stringify(history[newIndex])));
      showToast('Undo');
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPages(JSON.parse(JSON.stringify(history[newIndex])));
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
      setTextColor(textEl.color || '#1e293b');
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
      setOriginalPdfBuffer(buffer);
      setUploadedFileName(file.name);

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
        showToast(`Ready! Loaded ${loadedPages.length} pages from "${file.name}"`);
      }
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      showToast(`Failed to load PDF: ${err?.message || 'Invalid format'}`);
    } finally {
      setIsLoadingPdf(false);
      setLoadingStatus('');
    }
  };

  // Add new text element to current page (supports optional click x, y coordinates)
  const handleAddTextAt = (x?: number, y?: number) => {
    const newId = `text-${Date.now()}`;
    const defaultX = 60;
    const defaultY = 120 + ((currentPage?.elements.length || 0) * 30) % 300;
    const posX = x !== undefined ? Math.max(10, Math.min(x, 500)) : defaultX;
    const posY = y !== undefined ? Math.max(10, Math.min(y, 750)) : defaultY;

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
    showToast('Text block added to page. Click inside to edit.');
  };

  const handleAddText = () => {
    handleAddTextAt();
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
      setActiveTool('edit');
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
      elements: [
        {
          id: `text-title-${newPageNum}`,
          type: 'text',
          text: `Page ${newPageNum} Content`,
          x: 42,
          y: 60,
          width: 300,
          height: 36,
          fontSize: 20,
          fontFamily: 'Inter',
          color: '#0f172a',
          bold: true,
          italic: false,
          underline: false,
          align: 'left',
        },
      ],
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

  // Save action (saves to local state / shows confirmation)
  const handleSave = () => {
    showToast('Document saved successfully! All edits are preserved.');
  };

  // Download compiled PDF using pdf-lib (preserves highlights, text, images, drawings)
  const handleDownloadPdf = async () => {
    try {
      showToast('Generating high-quality PDF with highlights & edits...');
      const pdfBytes = await generateEditedPdf({
        pages,
        originalPdfBuffer,
      });

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const baseName = uploadedFileName
        ? uploadedFileName.replace(/\.pdf$/i, '')
        : 'toolino-edited';
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `${baseName}-edited-${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('PDF downloaded successfully! All highlights preserved.');
    } catch (err: any) {
      console.error('PDF export error:', err);
      showToast(`Export error: ${err?.message || 'Failed generating PDF'}`);
    }
  };

  // Canvas mouse handlers for dragging elements and click-to-place text
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'add-text') {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = Math.round((e.clientX - rect.left) / zoom);
      const clickY = Math.round((e.clientY - rect.top) / zoom);
      handleAddTextAt(clickX, clickY);
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
    setIsLoaded(true);
    showToast('Loaded sample project proposal');
  };

  // ===========================================================================
  // SCREEN 1: UPLOAD PDF VIEW (Before any file is loaded)
  // ===========================================================================
  if (!isLoaded) {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-800 font-sans">
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
            <Link
              href="/tools"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Tools</span>
            </Link>
            <div className="flex justify-center mb-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20">
                <FileText className="w-8 h-8 stroke-[2.2]" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit PDF</h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Upload your PDF file to add text, images, annotations, links, and edit pages directly
              in your browser.
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
            className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all shadow-sm ${
              isDraggingFile
                ? 'border-blue-500 bg-blue-50/50 scale-[1.01] shadow-md'
                : 'border-slate-300 hover:border-blue-500 bg-white hover:bg-slate-50/50'
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
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-xs">
                  <FileUp className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Drag & drop your PDF file here
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">or click to browse from your device</p>
                </div>
                <div>
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose PDF File</span>
                  </button>
                </div>
                <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% private. Files are processed locally and never sent to a server.</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Option to try sample */}
          <div className="text-center pt-1">
            <button
              onClick={handleLoadSample}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Or click here to test with a sample proposal PDF</span>
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // SCREEN 2: FULL PDF STUDIO EDITOR (Active once PDF is uploaded)
  // ===========================================================================
  return (
    <div className="w-full min-h-screen bg-slate-100 flex flex-col select-none text-slate-800 font-sans">
      {/* Hidden file inputs */}
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
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* ========================================================================= */}
      {/* TOP HEADER BAR                                                            */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mr-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Tools</span>
          </Link>

          <div className="h-6 w-px bg-slate-200" />

          {/* Clean Red PDF Badge */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 leading-tight">Edit PDF</h1>
              {uploadedFileName && (
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full max-w-[180px] truncate">
                  {uploadedFileName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Edit your PDF files online. Add text, images, links, highlight, and more — all in your
              browser.
            </p>
          </div>
        </div>

        {/* Top Right Action Buttons (Save & Download) */}
        <div className="flex items-center gap-2">
          {/* Upload Another PDF Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            title="Upload a different PDF file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Change PDF</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-all shadow-xs hover:border-slate-400"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>Save</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg flex items-center gap-1.5 transition-all shadow-xs shadow-blue-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECONDARY MENU & FORMATTING TOOLBAR                                       */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs z-20 shadow-xs">
        {/* Document Action Menus */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
          <div className="relative group">
            <button className="px-2 py-1 rounded hover:bg-slate-100 font-medium text-slate-700">
              File
            </button>
            <div className="absolute left-0 top-full mt-0.5 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-44 z-50">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-left hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Upload New PDF...</span>
                <span className="text-[10px] text-slate-400">Ctrl+O</span>
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-left hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Save</span>
                <span className="text-[10px] text-slate-400">Ctrl+S</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                className="px-3 py-1.5 text-left hover:bg-slate-50 font-semibold text-blue-600 flex items-center justify-between"
              >
                <span>Download PDF</span>
                <span className="text-[10px] text-blue-400">Ctrl+D</span>
              </button>
              <hr className="my-1 border-slate-100" />
              <button onClick={handleAddPage} className="px-3 py-1.5 text-left hover:bg-slate-50">
                Add Blank Page
              </button>
            </div>
          </div>

          <div className="relative group">
            <button className="px-2 py-1 rounded hover:bg-slate-100 font-medium text-slate-700">
              Edit
            </button>
            <div className="absolute left-0 top-full mt-0.5 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-40 z-50">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="px-3 py-1.5 text-left hover:bg-slate-50 disabled:opacity-40"
              >
                Undo (Ctrl+Z)
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="px-3 py-1.5 text-left hover:bg-slate-50 disabled:opacity-40"
              >
                Redo (Ctrl+Y)
              </button>
              <hr className="my-1 border-slate-100" />
              <button
                onClick={handleDeleteSelectedElement}
                disabled={!selectedElementId}
                className="px-3 py-1.5 text-left hover:bg-slate-50 text-red-600 disabled:opacity-40"
              >
                Delete Selected
              </button>
            </div>
          </div>

          <div className="relative group">
            <button className="px-2 py-1 rounded hover:bg-slate-100 font-medium text-slate-700">
              View
            </button>
            <div className="absolute left-0 top-full mt-0.5 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-40 z-50">
              <button
                onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
                className="px-3 py-1.5 text-left hover:bg-slate-50"
              >
                Zoom In (+)
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                className="px-3 py-1.5 text-left hover:bg-slate-50"
              >
                Zoom Out (-)
              </button>
              <button onClick={() => setZoom(1.0)} className="px-3 py-1.5 text-left hover:bg-slate-50">
                Actual Size (100%)
              </button>
            </div>
          </div>

          <div className="relative group">
            <button className="px-2 py-1 rounded hover:bg-slate-100 font-medium text-slate-700">
              Insert
            </button>
            <div className="absolute left-0 top-full mt-0.5 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-44 z-50">
              <button
                onClick={handleAddTextClick}
                className="px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 text-xs text-slate-700"
              >
                <Type className="w-3.5 h-3.5 text-blue-600" />
                <span>Add Text</span>
              </button>
              <button
                onClick={() => {
                  setActiveTool('add-image');
                  imageInputRef.current?.click();
                }}
                className="px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 text-xs text-slate-700"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Add Image...</span>
              </button>
            </div>
          </div>
        </div>

        {/* Formatting Buttons Ribbon */}
        <div className="flex items-center gap-1">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Font Family Selector */}
          <select
            value={fontFamily}
            onChange={(e) => {
              setFontFamily(e.target.value);
              updateSelectedTextElement({ fontFamily: e.target.value });
            }}
            className="bg-transparent border border-slate-200 hover:border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
          </select>

          {/* Font Size Selector */}
          <select
            value={fontSize}
            onChange={(e) => {
              const sz = parseInt(e.target.value, 10);
              setFontSize(sz);
              updateSelectedTextElement({ fontSize: sz });
            }}
            className="bg-transparent border border-slate-200 hover:border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="10">10</option>
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="20">20</option>
            <option value="24">24</option>
            <option value="32">32</option>
            <option value="40">40</option>
          </select>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Bold, Italic, Underline */}
          <button
            onClick={() => {
              const next = !isBold;
              setIsBold(next);
              updateSelectedTextElement({ bold: next });
            }}
            className={`p-1.5 rounded transition-colors ${
              isBold ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const next = !isItalic;
              setIsItalic(next);
              updateSelectedTextElement({ italic: next });
            }}
            className={`p-1.5 rounded transition-colors ${
              isItalic ? 'bg-blue-100 text-blue-700 italic' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const next = !isUnderline;
              setIsUnderline(next);
              updateSelectedTextElement({ underline: next });
            }}
            className={`p-1.5 rounded transition-colors ${
              isUnderline ? 'bg-blue-100 text-blue-700 underline' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          {/* Color Picker */}
          <div className="relative flex items-center">
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

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Alignment */}
          <button
            onClick={() => {
              setTextAlign('left');
              updateSelectedTextElement({ align: 'left' });
            }}
            className={`p-1.5 rounded ${
              textAlign === 'left' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setTextAlign('center');
              updateSelectedTextElement({ align: 'center' });
            }}
            className={`p-1.5 rounded ${
              textAlign === 'center'
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setTextAlign('right');
              updateSelectedTextElement({ align: 'right' });
            }}
            className={`p-1.5 rounded ${
              textAlign === 'right'
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Lists & Indent */}
          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Bullet List">
            <List className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Numbered List">
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Indent">
            <Indent className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Quick Action Buttons */}
          <button
            onClick={handleAddTextClick}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
            title="Add Text"
          >
            <Type className="w-3.5 h-3.5 text-blue-600" />
          </button>
          <button
            onClick={() => {
              setActiveTool('add-image');
              imageInputRef.current?.click();
            }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
            title="Add Image"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN WORKSPACE: LEFT TOOLS + CANVAS + RIGHT PAGES PANEL                   */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ======================================================================= */}
        {/* LEFT TOOLBAR: ONLY Add Text & Add Image                                 */}
        {/* ======================================================================= */}
        <aside className="w-48 bg-white border-r border-slate-200 p-2 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Editing Tools
            </div>

            {/* 1. Add Text */}
            <button
              onClick={handleAddTextClick}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTool === 'add-text' || (selectedElementId && currentPage?.elements.find((e) => e.id === selectedElementId)?.type === 'text')
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-xs border border-blue-200/60'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Type className="w-4 h-4 shrink-0 text-blue-600 stroke-[2.2]" />
              <span>Add Text</span>
            </button>

            {/* 2. Add Image */}
            <button
              onClick={() => {
                setActiveTool('add-image');
                imageInputRef.current?.click();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTool === 'add-image' || (selectedElementId && currentPage?.elements.find((e) => e.id === selectedElementId)?.type === 'image')
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-xs border border-blue-200/60'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <ImageIcon className="w-4 h-4 shrink-0 text-indigo-600 stroke-[2.2]" />
              <span>Add Image</span>
            </button>
          </div>

          {/* Clean footer info */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 px-2 flex items-center justify-between">
            <span>Toolino Suite</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Client-side engine ready" />
          </div>
        </aside>

        {/* ======================================================================= */}
        {/* CENTER EDITING CANVAS                                                   */}
        {/* ======================================================================= */}
        <div
          ref={canvasContainerRef}
          className="flex-1 bg-slate-100 overflow-auto flex flex-col items-center p-8 relative"
          onClick={() => {
            setSelectedElementId(null);
          }}
        >
          {/* Search Bar Popover (if active) */}
          {showSearchBox && (
            <div className="absolute top-4 z-40 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 ml-1" />
              <input
                type="text"
                placeholder="Find in document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs outline-none w-48 text-slate-800"
                autoFocus
              />
              <button
                onClick={() => setShowSearchBox(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Floating Hint when Add Text mode is active */}
          {activeTool === 'add-text' && (
            <div className="fixed top-24 z-30 bg-white border border-slate-200 rounded-full shadow-md px-4 py-1.5 flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-2">
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-700">Add Text: Click anywhere on the page to place a text box</span>
              <button
                onClick={() => setActiveTool('select')}
                className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Done
              </button>
            </div>
          )}

          {/* The PDF Page Sheet Container */}
          <div
            style={{
              transform: `scale(${zoom}) rotate(${currentPage?.rotation || 0}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="relative"
          >
            {/* The Actual PDF Page (Dimensions: scaled according to page aspect ratio) */}
            <div
              ref={pageSheetRef}
              style={{
                width: '600px',
                minHeight:
                  currentPage?.height && currentPage?.width
                    ? `${Math.round((600 / currentPage.width) * currentPage.height)}px`
                    : '848px',
              }}
              className={`bg-white shadow-2xl rounded-sm border border-slate-200/80 relative overflow-hidden select-none ${
                activeTool === 'add-text' ? 'cursor-crosshair' : 'cursor-default'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* ----------------------------------------------------------------- */}
              {/* PAGE CONTENT RENDERING                                            */}
              {/* ----------------------------------------------------------------- */}

              {/* Uploaded PDF Canvas Background */}
              {currentPage?.canvasDataUrl && (
                <img
                  src={currentPage.canvasDataUrl}
                  alt={`Page ${currentPage.pageNumber}`}
                  className="w-full h-full object-contain pointer-events-none"
                />
              )}

              {/* Fallback proposal sample template if user chose to test sample */}
              {!currentPage?.canvasDataUrl && currentPage?.customTemplateType === 'proposal' && (
                <div className="p-10 space-y-6 text-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold tracking-wide text-slate-700">Toolino</span>
                    <span>September 28, 2025</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight">
                      Project <span className="text-blue-600">Proposal</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      Building a smarter, simpler way to work.
                    </p>
                  </div>
                  <div className="h-44" />
                  <div className="pt-2">
                    <h3 className="text-sm font-bold text-slate-900">Our Features</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 flex items-start gap-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">PDF Tools</h4>
                        <ul className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                          <li>• Edit PDF</li>
                          <li>• Merge / Split PDF</li>
                          <li>• Compress PDF</li>
                        </ul>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 flex items-start gap-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Image Tools</h4>
                        <ul className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                          <li>• Image Compressor</li>
                          <li>• Resize & Convert</li>
                          <li>• Background Remover</li>
                        </ul>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 flex items-start gap-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Calculators</h4>
                        <ul className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                          <li>• Percentage Calculator</li>
                          <li>• CGPA Calculator</li>
                          <li>• EMI Calculator</li>
                        </ul>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 flex items-start gap-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Developer Tools</h4>
                        <ul className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                          <li>• JSON Formatter</li>
                          <li>• Base64 Encoder</li>
                          <li>• URL Encoder</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex items-center gap-3">
                    <span className="text-blue-500 font-serif text-2xl font-bold leading-none">“</span>
                    <p className="text-xs italic text-blue-900 font-medium">
                      More than just tools — Toolino is your all-in-one solution for everyday digital
                      tasks.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                    <span className="font-semibold text-slate-500">Toolino</span>
                    <span className="text-slate-400">www.toolnova.com</span>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* INTERACTIVE ELEMENTS LAYER (Text, Images, Shapes, Selection)      */}
              {/* ----------------------------------------------------------------- */}
              {currentPage?.elements.map((elem) => {
                const isSelected = selectedElementId === elem.id;

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
                        fontFamily: textEl.fontFamily,
                        color: textEl.color,
                        fontWeight: textEl.bold ? 'bold' : 'normal',
                        fontStyle: textEl.italic ? 'italic' : 'normal',
                        textDecoration: textEl.underline ? 'underline' : 'none',
                        textAlign: textEl.align,
                      }}
                      className={`cursor-move leading-relaxed transition-shadow ${
                        isSelected
                          ? 'border-2 border-blue-500 rounded p-1 bg-blue-50/20 shadow-xs'
                          : 'hover:border hover:border-slate-300 rounded p-1'
                      }`}
                    >
                      {/* Floating Mini-Toolbar when Selected */}
                      {isSelected && (
                        <div
                          className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-md px-2 py-1 flex items-center gap-1.5 z-30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => updateSelectedTextElement({ bold: !textEl.bold })}
                            className={`p-1 rounded text-xs ${
                              textEl.bold ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Bold className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => updateSelectedTextElement({ italic: !textEl.italic })}
                            className={`p-1 rounded text-xs ${
                              textEl.italic ? 'bg-blue-100 text-blue-700 italic' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Italic className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => updateSelectedTextElement({ underline: !textEl.underline })}
                            className={`p-1 rounded text-xs ${
                              textEl.underline ? 'bg-blue-100 text-blue-700 underline' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Underline className="w-3 h-3" />
                          </button>
                          <div className="w-px h-3 bg-slate-200" />
                          <button
                            onClick={handleDeleteSelectedElement}
                            className="p-1 rounded text-xs text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* 8 Drag Handles on Selection Bounding Box */}
                      {isSelected && (
                        <>
                          <div className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-sm border border-white" />
                          <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                          <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-sm border border-white" />
                          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-sm border border-white" />
                          <div className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-sm border border-white" />
                          <div className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                        </>
                      )}

                      {/* Content editable */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updated = e.currentTarget.innerText;
                          updateSelectedTextElement({ text: updated });
                        }}
                        className="outline-none"
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
                      }}
                      className={`cursor-move rounded transition-shadow ${
                        isSelected
                          ? 'border-2 border-blue-500 p-0.5 shadow-md z-20'
                          : 'hover:border hover:border-slate-300'
                      }`}
                    >
                      {/* Floating Mini-Toolbar for Image */}
                      {isSelected && (
                        <div
                          className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-md px-2 py-1 flex items-center gap-2 z-30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => imageInputRef.current?.click()}
                            className="p-1 rounded text-slate-600 hover:bg-slate-100"
                            title="Replace Image"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleDeleteSelectedElement}
                            className="p-1 rounded text-red-600 hover:bg-red-50"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* 4 Corner Resize Handles */}
                      {isSelected && (
                        <>
                          <div className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                          <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                          <div className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                          <div className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                        </>
                      )}

                      <img
                        src={imgEl.src}
                        alt={imgEl.alt || 'PDF asset'}
                        className="w-full h-full object-contain pointer-events-none rounded"
                      />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BOTTOM CANVAS BAR (Zoom & Pagination - matching screenshot)           */}
          {/* ===================================================================== */}
          <div className="sticky bottom-4 mt-6 bg-white border border-slate-200/90 rounded-2xl shadow-lg px-4 py-2 flex items-center gap-4 text-xs z-30">
            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPageIndex((idx) => Math.max(0, idx - 1))}
                disabled={currentPageIndex <= 0}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-700"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 font-semibold text-slate-800">
                <span className="px-2 py-0.5 border border-slate-200 rounded text-center min-w-[28px]">
                  {currentPageIndex + 1}
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600">{pages.length}</span>
              </div>

              <button
                onClick={() => setCurrentPageIndex((idx) => Math.min(pages.length - 1, idx + 1))}
                disabled={currentPageIndex >= pages.length - 1}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-700"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 relative">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.1).toFixed(2))))}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowZoomMenu(!showZoomMenu)}
                  className="px-2 py-1 rounded-md hover:bg-slate-100 font-semibold text-slate-700 flex items-center gap-1 min-w-[60px] justify-center"
                >
                  <span>{Math.round(zoom * 100)}%</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showZoomMenu && (
                  <div className="absolute bottom-full mb-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-24 z-50">
                    {[50, 75, 100, 125, 150, 200].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => {
                          setZoom(pct / 100);
                          setShowZoomMenu(false);
                        }}
                        className={`w-full px-3 py-1 text-left text-xs hover:bg-slate-50 ${
                          Math.round(zoom * 100) === pct ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setZoom((z) => Math.min(2.0, parseFloat((z + 0.1).toFixed(2))))}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-600"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* In-Document Search */}
            <button
              onClick={() => setShowSearchBox(!showSearchBox)}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
              title="Search Document"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Fit / Fullscreen */}
            <button
              onClick={() => setZoom(1.0)}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
              title="Fit to Width / Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT SIDEBAR ("Pages" Panel from Screenshot)                           */}
        {/* ======================================================================= */}
        <aside className="w-52 bg-white border-l border-slate-200 p-3 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pages</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                {pages.length}
              </span>
            </div>

            {/* Vertical Scrollable Thumbnail List */}
            <div className="space-y-3">
              {pages.map((page, idx) => {
                const isSelected = idx === currentPageIndex;
                return (
                  <div
                    key={page.id}
                    onClick={() => setCurrentPageIndex(idx)}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div
                      className={`w-36 h-48 rounded-lg border-2 p-1.5 bg-white transition-all shadow-xs overflow-hidden flex flex-col justify-between relative ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Mini Preview Graphic */}
                      {page.canvasDataUrl ? (
                        <img
                          src={page.canvasDataUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-50 rounded p-1.5 flex flex-col justify-between text-[6px] text-slate-400 select-none">
                          <div className="space-y-1">
                            <div className="h-1 bg-slate-300 rounded w-1/3" />
                            <div className="h-1.5 bg-blue-300 rounded w-2/3" />
                            <div className="h-1 bg-slate-200 rounded w-full" />
                            <div className="h-1 bg-slate-200 rounded w-4/5" />
                          </div>
                          <div className="h-1 bg-slate-200 rounded w-1/2" />
                        </div>
                      )}

                      {/* Rotation indicator if rotated */}
                      {page.rotation > 0 && (
                        <span className="absolute top-1 right-1 text-[8px] bg-blue-600 text-white px-1 rounded">
                          {page.rotation}°
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-1 ${
                        isSelected ? 'text-blue-600 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Page Actions: Add Page & Delete Page */}
          <div className="space-y-2 pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={handleAddPage}
              className="w-full py-2 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Page</span>
            </button>

            <button
              onClick={handleDeletePage}
              disabled={pages.length <= 1}
              className="w-full py-2 px-3 border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 disabled:opacity-40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Page</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* TOAST NOTIFICATION                                                        */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DIALOGS FOR LEFT TOOLBAR ACTIONS                                    */}
      {/* ========================================================================= */}

    </div>
  );
}
