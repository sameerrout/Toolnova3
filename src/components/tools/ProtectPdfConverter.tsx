'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Unlock,
  FileText,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Eye,
  EyeOff,
  Sliders,
  ChevronDown,
  ChevronUp,
  Printer,
  Copy,
  Edit3,
  MessageSquare,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { trackToolEvent } from '@/lib/analytics/tracker';

export interface ProtectPdfFileItem {
  file: File;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount: number;
  originalPdfBuffer: ArrayBuffer;
}

export interface ProtectPdfSettings {
  algorithm: 'AES-256' | 'RC4';
  allowPrinting: boolean;
  allowHighQualityPrint: boolean;
  allowCopying: boolean;
  allowModifying: boolean;
  allowAnnotating: boolean;
  ownerPassword?: string;
}

export interface ProtectedResult {
  blob: Blob;
  url: string;
  fileName: string;
  sizeFormatted: string;
  pageCount: number;
  settingsApplied: {
    algorithm: 'AES-256' | 'RC4';
    allowPrinting: boolean;
    allowCopying: boolean;
    allowModifying: boolean;
    allowAnnotating: boolean;
    hasOwnerPassword: boolean;
  };
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const DEFAULT_SETTINGS: ProtectPdfSettings = {
  algorithm: 'AES-256',
  allowPrinting: true,
  allowHighQualityPrint: true,
  allowCopying: true,
  allowModifying: false,
  allowAnnotating: true,
  ownerPassword: '',
};

export function ProtectPdfConverter() {
  const [fileItem, setFileItem] = useState<ProtectPdfFileItem | null>(null);
  const [settings, setSettings] = useState<ProtectPdfSettings>(DEFAULT_SETTINGS);

  // Sensitive password state - stored ONLY in React component memory
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Preview page navigation
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [renderedPageImages, setRenderedPageImages] = useState<string[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

  // Upload dropzone state
  const [isDragOverUpload, setIsDragOverUpload] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workflow states: 'edit' vs 'review'
  const [workflowStage, setWorkflowStage] = useState<'edit' | 'review'>('edit');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('Preparing...');
  const [protectedResult, setProtectedResult] = useState<ProtectedResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Lock desktop body and html scrolling on desktop viewports to ensure single-screen fit
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
      if (protectedResult?.url) {
        URL.revokeObjectURL(protectedResult.url);
      }
    };
  }, [protectedResult]);

  // Clean sensitive state when component unmounts
  useEffect(() => {
    return () => {
      setPassword('');
      setConfirmPassword('');
    };
  }, []);

  // Format bytes helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) {
      return { score: 'empty', label: 'None', width: '0%', color: 'bg-slate-200', textClass: 'text-slate-400', hint: 'Enter a password to protect your PDF.' };
    }
    if (password.length < 4) {
      return { score: 'short', label: 'Too short', width: '20%', color: 'bg-red-500', textClass: 'text-red-600', hint: 'Use at least 4 characters.' };
    }

    let scorePoints = 0;
    if (password.length >= 6) scorePoints++;
    if (password.length >= 10) scorePoints++;
    if (/[A-Z]/.test(password)) scorePoints++;
    if (/[0-9]/.test(password)) scorePoints++;
    if (/[^A-Za-z0-9]/.test(password)) scorePoints++;

    if (scorePoints <= 1) {
      return { score: 'weak', label: 'Weak', width: '35%', color: 'bg-amber-500', textClass: 'text-amber-600', hint: 'Try a longer password with letters, numbers, and symbols.' };
    }
    if (scorePoints <= 3) {
      return { score: 'medium', label: 'Medium', width: '70%', color: 'bg-blue-600', textClass: 'text-blue-600', hint: 'Good password. Add special symbols for maximum strength.' };
    }
    return { score: 'strong', label: 'Strong ✓', width: '100%', color: 'bg-emerald-600', textClass: 'text-emerald-600', hint: 'Excellent password strength.' };
  }, [password]);

  // Password matching validation
  const passwordsMatch = password.length >= 4 && password === confirmPassword;
  const isConfirmDirty = confirmPassword.length > 0;
  const hasMismatchError = isConfirmDirty && password !== confirmPassword;
  const canProtect = Boolean(fileItem && password.length >= 4 && passwordsMatch && !isProcessing);

  // Render thumbnail previews for PDF pages via pdfjs-dist
  const renderPdfThumbnails = useCallback(async (buffer: ArrayBuffer, pageCount: number) => {
    setIsLoadingThumbnails(true);
    const images: string[] = new Array(pageCount).fill('');

    try {
      const pdfjs = await import('pdfjs-dist');
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      }

      // Safe clone to prevent ArrayBuffer detachment
      const safeBufferCopy = buffer.slice(0);
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(safeBufferCopy),
        disableAutoFetch: true,
        disableStream: true,
      });

      const pdf = await loadingTask.promise;
      const pagesToRender = Math.min(pageCount, 10); // Render first 10 pages for preview

      for (let i = 1; i <= pagesToRender; i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (context) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (page.render({ canvasContext: context, viewport } as any).promise);
            images[i - 1] = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch {
          // Fallback handled gracefully
        }
      }

      setRenderedPageImages(images);
    } catch {
      // PDF.js render failed or worker unavailable; fallback SVG handles preview
    } finally {
      setIsLoadingThumbnails(false);
    }
  }, []);

  // Process and load an uploaded PDF file
  const handleSelectFile = async (files: FileList | File[]) => {
    setErrorMessage(null);

    if (files.length === 0) return;
    if (files.length > 1) {
      setErrorMessage('Please upload a single PDF document to protect.');
      return;
    }

    const file = files[0];

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Invalid file format. Please upload a PDF document (.pdf).');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File size exceeds the 100 MB limit. Please select a smaller PDF.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();

      // Check if file is already encrypted using pdf-lib
      try {
        const testDoc = await PDFDocument.load(buffer.slice(0));
        const pageCount = testDoc.getPageCount();

        if (pageCount === 0) {
          setErrorMessage('The uploaded PDF does not contain any pages.');
          return;
        }

        const newItem: ProtectPdfFileItem = {
          file,
          name: file.name,
          sizeBytes: file.size,
          sizeFormatted: formatFileSize(file.size),
          pageCount,
          originalPdfBuffer: buffer,
        };

        setFileItem(newItem);
        setCurrentPageIndex(0);
        setWorkflowStage('edit');
        if (protectedResult) setProtectedResult(null);

        // Render page previews safely
        renderPdfThumbnails(buffer, pageCount);
      } catch (loadErr: unknown) {
        const errStr = String(loadErr);
        if (errStr.includes('encrypted') || errStr.includes('EncryptedPDFError')) {
          setErrorMessage(
            'This PDF is already password-protected. Please unlock or decrypt it first before applying new protection.'
          );
          return;
        }
        throw loadErr;
      }
    } catch (err: unknown) {
      console.error('Error loading PDF:', err);
      setErrorMessage('Unable to load or parse the PDF document. Please verify the file is not corrupted.');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files);
    }
  };

  // Reset to initial upload state
  const handleStartOver = () => {
    if (protectedResult?.url) {
      URL.revokeObjectURL(protectedResult.url);
    }
    setFileItem(null);
    setSettings(DEFAULT_SETTINGS);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowOwnerPassword(false);
    setShowAdvanced(false);
    setWorkflowStage('edit');
    setProtectedResult(null);
    setRenderedPageImages([]);
    setErrorMessage(null);
    setCurrentPageIndex(0);
  };

  // Reset settings to defaults while keeping file
  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowOwnerPassword(false);
  };

  // Primary Action: Protect PDF
  const handleProtectPdf = async () => {
    if (!fileItem) return;

    if (!password || password.length < 4) {
      setErrorMessage('Please enter a password with at least 4 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingStatus('Reading document...');
      trackToolEvent('protect-pdf', 'tool_started');

      // 1. Normalize PDF structure using pdf-lib with safe cloned buffer
      setProcessingStatus('Normalizing document structure...');
      const safeBuffer = fileItem.originalPdfBuffer.slice(0);
      const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
      pdfDoc.setProducer('Toolino Security Engine');
      pdfDoc.setCreator('Toolino');
      const normalizedBytes = await pdfDoc.save();

      // 2. Encrypt PDF with selected options via Web Crypto API
      setProcessingStatus(`Applying ${settings.algorithm} encryption sandbox...`);
      const ownerPass = settings.ownerPassword && settings.ownerPassword.trim().length > 0
        ? settings.ownerPassword.trim()
        : password;

      const encryptedBytes = await encryptPDF(normalizedBytes, password, {
        ownerPassword: ownerPass,
        algorithm: settings.algorithm,
        allowPrinting: settings.allowPrinting,
        allowCopying: settings.allowCopying,
        allowModifying: settings.allowModifying,
        allowAnnotating: settings.allowAnnotating,
        allowFillingForms: settings.allowAnnotating,
        allowHighQualityPrint: settings.allowPrinting && settings.allowHighQualityPrint,
      });

      setProcessingStatus('Finalizing secure document...');

      // 3. Create output blob and URL
      const finalBlob = new Blob([new Uint8Array(encryptedBytes)], {
        type: 'application/pdf',
      });
      const url = URL.createObjectURL(finalBlob);

      const baseName = fileItem.name.replace(/\.[^/.]+$/, '').trim();
      const outputFileName = `${baseName}_protected.pdf`;

      const result: ProtectedResult = {
        blob: finalBlob,
        url,
        fileName: outputFileName,
        sizeFormatted: formatFileSize(finalBlob.size),
        pageCount: fileItem.pageCount,
        settingsApplied: {
          algorithm: settings.algorithm,
          allowPrinting: settings.allowPrinting,
          allowCopying: settings.allowCopying,
          allowModifying: settings.allowModifying,
          allowAnnotating: settings.allowAnnotating,
          hasOwnerPassword: Boolean(settings.ownerPassword && settings.ownerPassword.trim().length > 0),
        },
      };

      setProtectedResult(result);
      setWorkflowStage('review');
      trackToolEvent('protect-pdf', 'tool_completed');
    } catch (err: unknown) {
      console.error('PDF Protection error:', err);
      trackToolEvent('protect-pdf', 'tool_failed');
      setErrorMessage('Unable to protect your PDF. Please check your password and security settings, then try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download the protected PDF
  const handleDownloadProtectedPdf = () => {
    if (!protectedResult) return;
    const a = document.createElement('a');
    a.href = protectedResult.url;
    a.download = protectedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Return to editing mode without re-uploading
  const handleChangeSettings = () => {
    setWorkflowStage('edit');
  };

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
        {/* TOP SECTION: Breadcrumb + Header + Privacy Badge + Alert */}
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
            <span className="font-bold text-slate-900">Protect PDF</span>
          </nav>

          {/* 2. Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Protect PDF
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Protect your PDF with a password and control what users can do with the file.
                </p>
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">Your PDF stays on your device</span>
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

        {/* MIDDLE SECTION: Upload Area OR Main Two-Column Workspace */}
        <div className="flex-1 flex flex-col min-h-0 my-2">
          {!fileItem ? (
            /* ========================================================================= */
            /* 1. INITIAL UPLOAD STATE                                                   */
            /* ========================================================================= */
            <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
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
                  Protect your PDF
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-xs">
                  Drag &amp; drop your PDF here, or click to choose from your device.
                </p>
                <button
                  type="button"
                  id="choose-pdf-button"
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
          ) : workflowStage === 'edit' ? (
            /* ========================================================================= */
            /* 2. MAIN WORKSPACE (TWO-COLUMN BALANCED LAYOUT)                             */
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
                        {fileItem.pageCount} {fileItem.pageCount === 1 ? 'page' : 'pages'}
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

              {/* Main Workspace: Left (Preview) + Right (Settings) */}
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
                {/* ------------------------------------------------------------- */}
                {/* LEFT: LIVE PDF PREVIEW & METADATA CARD                        */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 flex flex-col min-h-0 bg-slate-50/60 p-3 sm:p-4">
                  {/* Page Preview Header & Pagination */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 shrink-0 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">Document Preview</span>
                      <span className="text-[11px] text-slate-400">
                        Page {currentPageIndex + 1} of {fileItem.pageCount}
                      </span>
                    </div>

                    {fileItem.pageCount > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                          disabled={currentPageIndex === 0}
                          className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <span className="px-2 font-semibold text-[11px] text-slate-700">
                          {currentPageIndex + 1} / {fileItem.pageCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPageIndex((prev) => Math.min(fileItem.pageCount - 1, prev + 1))}
                          disabled={currentPageIndex >= fileItem.pageCount - 1}
                          className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          title="Next page"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* PDF Canvas Viewport */}
                  <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                    <div className="relative max-h-full max-w-full aspect-[1/1.38] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex items-center justify-center">
                      {renderedPageImages[currentPageIndex] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={renderedPageImages[currentPageIndex]}
                          alt={`Page ${currentPageIndex + 1}`}
                          className="w-full h-full object-contain select-none pointer-events-none"
                        />
                      ) : isLoadingThumbnails ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-8">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          <span className="text-xs font-medium">Rendering PDF page...</span>
                        </div>
                      ) : (
                        /* Clean SVG Mockup Page Fallback */
                        <div className="w-full h-full p-6 flex flex-col justify-between select-none">
                          <div className="space-y-3">
                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                            <div className="h-2 w-full bg-slate-100 rounded"></div>
                            <div className="h-2 w-5/6 bg-slate-100 rounded"></div>
                            <div className="h-2 w-4/6 bg-slate-100 rounded"></div>
                            <div className="h-2 w-full bg-slate-100 rounded"></div>
                            <div className="h-2 w-3/4 bg-slate-100 rounded"></div>
                          </div>
                          <div className="text-center font-bold text-slate-300 text-xs">
                            Page {currentPageIndex + 1}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Baseline Details */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 shrink-0 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        File Size
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {fileItem.sizeFormatted}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Page Count
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {fileItem.pageCount} {fileItem.pageCount === 1 ? 'Page' : 'Pages'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT: PROTECTION SETTINGS & LIVE SECURITY SUMMARY            */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-7 flex flex-col min-h-0 bg-white p-3 sm:p-4 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60 shrink-0">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                        Protection Settings
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetSettings}
                      className="text-[11px] font-medium text-slate-500 hover:text-blue-600 transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Settings
                    </button>
                  </div>

                  <div className="space-y-4 flex-1 text-xs">
                    {/* 1. PASSWORD IS THE MAIN CONTROL */}
                    <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                          Set Document Password *
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">Required to open PDF</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Password input */}
                        <div className="space-y-1">
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              id="pdf-password-input"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter password (min 4 chars)"
                              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 pr-10 text-xs text-slate-800 outline-hidden transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password input */}
                        <div className="space-y-1">
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              id="pdf-confirm-password-input"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm password"
                              className={`w-full rounded-xl border p-2.5 pr-10 text-xs outline-hidden transition-all focus:ring-1 ${
                                hasMismatchError
                                  ? 'border-red-400 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-red-500'
                                  : passwordsMatch
                                  ? 'border-emerald-400 bg-emerald-50/20 text-emerald-900 focus:border-emerald-500 focus:ring-emerald-500'
                                  : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:ring-blue-500'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Password Validation & Strength Row */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">
                            Password Strength:{' '}
                            <span className={`font-bold ${passwordStrength.textClass}`}>
                              {passwordStrength.label}
                            </span>
                          </span>
                          {hasMismatchError ? (
                            <span className="text-red-600 font-semibold flex items-center gap-1">
                              ✕ Passwords do not match
                            </span>
                          ) : passwordsMatch ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              ✓ Passwords match
                            </span>
                          ) : password.length > 0 && password.length < 4 ? (
                            <span className="text-amber-600 font-semibold">
                              Min 4 characters required
                            </span>
                          ) : null}
                        </div>

                        {/* Strength Bar */}
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: passwordStrength.width }}
                          ></div>
                        </div>

                        <p className="text-[10px] text-slate-400">
                          {passwordStrength.hint}
                        </p>
                      </div>
                    </div>

                    {/* 2. PERMISSIONS ("What can people do with this PDF?") */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">
                          What can people do with this PDF?
                        </label>
                        <span className="text-[10px] text-slate-400">Uncheck to restrict</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* 1. Printing */}
                        <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={settings.allowPrinting}
                            onChange={(e) =>
                              setSettings((s) => ({ ...s, allowPrinting: e.target.checked }))
                            }
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                              Allow printing
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                              {settings.allowPrinting
                                ? 'Recipients can print this document.'
                                : 'Printing is blocked for recipients.'}
                            </span>
                          </div>
                        </label>

                        {/* 2. Copying */}
                        <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={settings.allowCopying}
                            onChange={(e) =>
                              setSettings((s) => ({ ...s, allowCopying: e.target.checked }))
                            }
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              Allow copying text &amp; images
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                              {settings.allowCopying
                                ? 'Content copying is permitted.'
                                : 'Content copying is restricted.'}
                            </span>
                          </div>
                        </label>

                        {/* 3. Editing */}
                        <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={settings.allowModifying}
                            onChange={(e) =>
                              setSettings((s) => ({ ...s, allowModifying: e.target.checked }))
                            }
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              Allow editing
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                              {settings.allowModifying
                                ? 'Document modification is allowed.'
                                : 'Restricts changes to the PDF.'}
                            </span>
                          </div>
                        </label>

                        {/* 4. Comments & Annotations */}
                        <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={settings.allowAnnotating}
                            onChange={(e) =>
                              setSettings((s) => ({ ...s, allowAnnotating: e.target.checked }))
                            }
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                              Allow comments &amp; form filling
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                              {settings.allowAnnotating
                                ? 'Allows notes and form filling.'
                                : 'Blocks annotations and form edits.'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* 3. ADVANCED SECURITY SETTINGS (COLLAPSED BY DEFAULT) */}
                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/40">
                      <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100/70 transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          Advanced Security Settings
                        </span>
                        {showAdvanced ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      {showAdvanced && (
                        <div className="p-3.5 pt-1 space-y-3 bg-white border-t border-slate-200/80 animate-in fade-in-50">
                          {/* Encryption Algorithm */}
                          <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1.5">
                              Encryption Standard
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setSettings((s) => ({ ...s, algorithm: 'AES-256' }))}
                                className={`p-2.5 rounded-xl border text-left transition ${
                                  settings.algorithm === 'AES-256'
                                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-600'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="text-xs">AES-256 (Recommended)</div>
                                <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                                  Modern PDF 2.0 standard
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSettings((s) => ({ ...s, algorithm: 'RC4' }))}
                                className={`p-2.5 rounded-xl border text-left transition ${
                                  settings.algorithm === 'RC4'
                                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-1 ring-blue-600'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="text-xs">RC4 (128-bit)</div>
                                <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                                  Legacy compatibility mode
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Owner Password (Optional) */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-800 block">
                              Permissions Password (Optional)
                            </label>
                            <p className="text-[10px] text-slate-500">
                              Document password opens the PDF. A separate permissions password allows managing security in PDF readers. If empty, the document password is used.
                            </p>
                            <div className="relative max-w-sm mt-1">
                              <input
                                type={showOwnerPassword ? 'text' : 'password'}
                                value={settings.ownerPassword || ''}
                                onChange={(e) =>
                                  setSettings((s) => ({ ...s, ownerPassword: e.target.value }))
                                }
                                placeholder="Leave blank to use main password"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 pr-10 text-xs text-slate-800 outline-hidden transition focus:border-blue-500 focus:bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                aria-label="Toggle permissions password visibility"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                              >
                                {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* High Quality Printing Toggle */}
                          {settings.allowPrinting && (
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 pt-1">
                              <input
                                type="checkbox"
                                checked={settings.allowHighQualityPrint}
                                onChange={(e) =>
                                  setSettings((s) => ({ ...s, allowHighQualityPrint: e.target.checked }))
                                }
                                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>Allow high-quality print output</span>
                            </label>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 4. LIVE SECURITY SUMMARY CARD */}
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          Security Summary
                        </span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-600">
                          <div>
                            <span className="text-slate-400">Open Password:</span>{' '}
                            <span className={passwordsMatch ? 'font-bold text-emerald-700' : 'font-medium text-amber-700'}>
                              {passwordsMatch ? 'Enabled ✓' : 'Required'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Encryption:</span>{' '}
                            <span className="font-semibold text-slate-700">{settings.algorithm}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Printing:</span>{' '}
                            <span className={settings.allowPrinting ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-500'}>
                              {settings.allowPrinting ? 'Allowed' : 'Blocked'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Copying:</span>{' '}
                            <span className={settings.allowCopying ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-500'}>
                              {settings.allowCopying ? 'Allowed' : 'Blocked'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Editing:</span>{' '}
                            <span className={settings.allowModifying ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-500'}>
                              {settings.allowModifying ? 'Allowed' : 'Blocked'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Comments:</span>{' '}
                            <span className={settings.allowAnnotating ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-500'}>
                              {settings.allowAnnotating ? 'Allowed' : 'Blocked'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 3. SUCCESS & SECURITY REVIEW STATE (STAGE === 'review')                   */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col justify-center items-center p-2 sm:p-4 min-h-0 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-lg border border-slate-200/90 text-center space-y-5 animate-in zoom-in-95">
                {/* Success Icon */}
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    PDF protected successfully
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your document is encrypted and protected with your custom security rules.
                  </p>
                </div>

                {/* File Details Card */}
                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 text-left flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {protectedResult?.fileName}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {protectedResult?.pageCount} {protectedResult?.pageCount === 1 ? 'page' : 'pages'} • {protectedResult?.sizeFormatted}
                    </p>
                  </div>
                </div>

                {/* Explicit Security Review Summary */}
                <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-100/80 text-left space-y-2">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    Protection Summary
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Opening Password</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        ✓ Required
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Encryption Standard</span>
                      <span className="font-bold text-slate-800">
                        {protectedResult?.settingsApplied.algorithm}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Printing</span>
                      <span className={protectedResult?.settingsApplied.allowPrinting ? 'font-bold text-emerald-700' : 'font-bold text-slate-600'}>
                        {protectedResult?.settingsApplied.allowPrinting ? 'Allowed' : 'Blocked'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Copying Text &amp; Images</span>
                      <span className={protectedResult?.settingsApplied.allowCopying ? 'font-bold text-emerald-700' : 'font-bold text-slate-600'}>
                        {protectedResult?.settingsApplied.allowCopying ? 'Allowed' : 'Blocked'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Document Editing</span>
                      <span className={protectedResult?.settingsApplied.allowModifying ? 'font-bold text-emerald-700' : 'font-bold text-slate-600'}>
                        {protectedResult?.settingsApplied.allowModifying ? 'Allowed' : 'Blocked'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Comments &amp; Forms</span>
                      <span className={protectedResult?.settingsApplied.allowAnnotating ? 'font-bold text-emerald-700' : 'font-bold text-slate-600'}>
                        {protectedResult?.settingsApplied.allowAnnotating ? 'Allowed' : 'Blocked'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 pt-1">
                    Your password will be required every time this protected PDF is opened in any PDF viewer.
                  </p>
                </div>

                {/* Primary Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    id="download-protected-pdf-button"
                    onClick={handleDownloadProtectedPdf}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Protected PDF</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleChangeSettings}
                      className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Change Security Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartOver}
                      className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Protect Another PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Primary Action Button (in Edit Stage) */}
        {fileItem && workflowStage === 'edit' && (
          <div className="shrink-0 pt-2 flex items-center justify-between gap-3 border-t border-slate-200/80">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Files are encrypted locally and never uploaded to any server.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="protect-pdf-button"
                onClick={handleProtectPdf}
                disabled={!canProtect}
                className={`px-5 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                  !canProtect
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Protecting...</span>
                  </>
                ) : (
                  <>
                    <span>Protect PDF</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PROCESSING STATE MODAL / OVERLAY                                          */}
      {/* ========================================================================= */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Protecting your PDF...
              </h3>
              <p className="text-xs text-slate-500 mt-1">{processingStatus}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-full w-2/3 animate-pulse rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
