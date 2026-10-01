'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Trash2,
  ChevronUp,
  ChevronDown,
  Download,
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileImage,
  GripVertical,
  Check,
} from 'lucide-react';
import {
  generatePdfFromImages,
  ImageToPdfOptions,
} from '@/core/engine/pdfEngine';
import { ProcessedOutput, ProcessingProgress } from '@/core/types/tool';

export interface UploadedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeFormatted: string;
}

const DEFAULT_OPTIONS: ImageToPdfOptions = {
  pageSize: 'a4',
  orientation: 'auto',
  margin: 'small',
  imageFit: 'fit',
  quality: 0.85,
};

export function ImageToPdfConverter() {
  const [images, setImages] = useState<UploadedImageItem[]>([]);
  const [options] = useState<ImageToPdfOptions>(DEFAULT_OPTIONS);

  // Drag-and-drop file upload state
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Card reorder drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Processing & Download states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    progress: 0,
    statusText: 'Preparing...',
  });
  const [output, setOutput] = useState<ProcessedOutput | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [images, downloadUrl]);

  // Add files to state (appends rather than overwriting)
  const addFiles = (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const filesArray = Array.from(incomingFiles);
    const validItems: UploadedImageItem[] = [];

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    for (const file of filesArray) {
      const lowerName = file.name.toLowerCase();
      const hasValidExt = allowedExtensions.some((ext) => lowerName.endsWith(ext));
      const hasValidMime =
        file.type.startsWith('image/jpeg') ||
        file.type.startsWith('image/png') ||
        file.type.startsWith('image/webp');

      if (!hasValidExt && !hasValidMime) {
        setErrorMessage(
          `"${file.name}" has an unsupported format. Supported formats: JPG, JPEG, PNG, WEBP.`
        );
        continue;
      }

      if (file.size === 0) {
        setErrorMessage(`"${file.name}" is empty (0 bytes).`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      validItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl,
        name: file.name,
        sizeFormatted: formatFileSize(file.size),
      });
    }

    if (validItems.length > 0) {
      setImages((prev) => [...prev, ...validItems]);
    }

    // Reset input so user can re-select if deleted
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Delete individual image card
  const handleDeleteImage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Clear all images
  const handleClearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setErrorMessage(null);
  };

  // Move image earlier in PDF sequence (Move Up)
  const handleMoveUp = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index <= 0) return;
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
  };

  // Move image later in PDF sequence (Move Down)
  const handleMoveDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index >= images.length - 1) return;
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
  };

  // Drag and drop reordering handlers
  const handleCardDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleCardDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setImages((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCardDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Convert to PDF execution
  const handleConvert = async () => {
    if (images.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProgress({ progress: 5, statusText: 'Initializing PDF document...' });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Order strictly preserved from current state array
      const orderedRawFiles = images.map((img) => img.file);

      const pdfBlob = await generatePdfFromImages(
        orderedRawFiles,
        options,
        (p) => setProgress(p),
        controller.signal
      );

      const dateStamp = new Date().toISOString().slice(0, 10);
      const fileName = `toolino-converted-${dateStamp}.pdf`;
      const processed: ProcessedOutput = {
        blob: pdfBlob,
        fileName,
        mimeType: 'application/pdf',
        sizeBytes: pdfBlob.size,
      };

      const url = URL.createObjectURL(pdfBlob);
      setDownloadUrl(url);
      setOutput(processed);
    } catch (err: any) {
      if (controller.signal.aborted) {
        setIsProcessing(false);
        return;
      }
      setErrorMessage(err.message || 'Failed to convert images to PDF. Please try again.');
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  // Download PDF
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!output) return;

    try {
      const clickUrl = URL.createObjectURL(output.blob);
      const link = document.createElement('a');
      link.href = clickUrl;
      link.setAttribute('download', output.fileName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(clickUrl);
      }, 10000);
    } catch (err) {
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    }
  };

  // Reset tool
  const handleReset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setImages([]);
    setOutput(null);
    setIsProcessing(false);
    setErrorMessage(null);
    setProgress({ progress: 0, statusText: 'Preparing...' });
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Image to PDF
          </h1>
          <p className="text-sm sm:text-base text-slate-500">
            Convert your JPG, JPEG, PNG, and WEBP images into a PDF document.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW A: SUCCESS STATE (CONVERSION COMPLETED)                             */}
        {/* ========================================================================= */}
        {output && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/70">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                PDF created successfully
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                All {images.length} {images.length === 1 ? 'image has' : 'images have'} been merged into your PDF.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-left flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <p className="font-bold text-slate-800 truncate" title={output.fileName}>
                  {output.fileName}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {formatFileSize(output.sizeBytes)} &bull; {images.length} {images.length === 1 ? 'page' : 'pages'}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Ready
              </span>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all text-base cursor-pointer active:scale-[0.99]"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </button>

            <div className="flex items-center justify-center gap-4 text-xs pt-1">
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview in Tab</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Convert More Images</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW B: PROCESSING / CONVERTING STATE                                    */}
        {/* ========================================================================= */}
        {isProcessing && !output && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 animate-in fade-in duration-150">
            <div className="flex justify-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <span className="absolute font-bold text-sm text-blue-600">
                  {Math.round(progress.progress)}%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                Converting images to PDF...
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {progress.statusText || 'Creating your PDF...'}
              </p>
              {progress.currentStep && (
                <p className="text-xs font-semibold text-blue-600">
                  Image {progress.currentStep}
                </p>
              )}
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(5, Math.min(100, progress.progress))}%` }}
              />
            </div>

            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600/85 text-white font-semibold py-3 px-6 rounded-xl cursor-not-allowed text-sm"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating your PDF...</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW C: MAIN WORKSPACE (LEFT: UPLOAD, RIGHT: UPLOADED FILE CARDS)         */}
        {/* ========================================================================= */}
        {!output && !isProcessing && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
            {/* Hidden File Input (Used by Dropzone & Browse) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files) {
                  addFiles(e.target.files);
                }
              }}
              className="sr-only"
            />

            {/* 2-COLUMN WORKSPACE: LEFT = UPLOAD, RIGHT = FILE CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ============================================================== */}
              {/* 1. LEFT SIDE: LARGE UPLOAD / DROP ZONE                         */}
              {/* ============================================================== */}
              <div className="lg:col-span-5 flex flex-col">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverUpload(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragOverUpload(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverUpload(false);
                    if (e.dataTransfer.files) {
                      addFiles(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none text-center min-h-[300px] ${
                    isDragOverUpload
                      ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                      : 'border-slate-300 bg-slate-50/40 hover:border-blue-400 hover:bg-blue-50/30'
                  }`}
                >
                  {/* Upload Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-2xs group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-7 h-7 stroke-[2]" />
                  </div>

                  {/* Title & Instructions */}
                  <h3 className="text-lg font-bold text-slate-800">
                    Upload your images
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
                    Drag and drop your images here or{' '}
                    <span className="text-blue-600 font-semibold underline decoration-blue-300">
                      click to browse
                    </span>
                  </p>

                  {/* Supported Formats */}
                  <div className="mt-5 pt-3 border-t border-slate-200/60 w-full max-w-xs text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Supported formats
                    </span>
                    <span className="text-xs text-slate-600 font-medium mt-0.5 block">
                      JPG, JPEG, PNG, WEBP
                    </span>
                  </div>

                  {/* Informational note when files already selected */}
                  {images.length > 0 && (
                    <div className="mt-3 text-[11px] text-blue-600 font-medium bg-blue-50/80 px-2.5 py-1 rounded-full">
                      + Click to add more images
                    </div>
                  )}
                </div>
              </div>

              {/* ============================================================== */}
              {/* 2. RIGHT SIDE: DYNAMIC UPLOADED FILE CARDS                      */}
              {/* ============================================================== */}
              <div className="lg:col-span-7 flex flex-col min-h-[300px]">
                {images.length === 0 ? (
                  /* Placeholder when no images have been uploaded yet */
                  <div className="h-full border border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/40 min-h-[300px]">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <FileImage className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-1">
                      No images selected yet
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Drop or browse images on the left. Each image will appear here as a separate file card with preview, progress indicator, reordering, and delete options.
                    </p>
                  </div>
                ) : (
                  /* Dynamic List of Uploaded File Cards */
                  <div className="space-y-3">
                    {/* Header above cards */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          Uploaded Files ({images.length})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          (Page order in PDF)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear All</span>
                      </button>
                    </div>

                    {/* Scrollable Container for Any Number of Files */}
                    <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1.5 focus:outline-hidden">
                      {images.map((img, index) => {
                        const isDragging = draggedIndex === index;
                        const isDragOver = dragOverIndex === index;

                        return (
                          <div
                            key={img.id}
                            draggable
                            onDragStart={(e) => handleCardDragStart(e, index)}
                            onDragOver={(e) => handleCardDragOver(e, index)}
                            onDrop={(e) => handleCardDrop(e, index)}
                            onDragEnd={handleCardDragEnd}
                            className={`group relative rounded-xl border bg-white p-3 shadow-2xs transition-all ${
                              isDragging
                                ? 'opacity-40 border-dashed border-blue-400 scale-[0.99]'
                                : isDragOver
                                ? 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/20'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              {/* Left: Drag grip & Thumbnail preview */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <GripVertical className="w-3.5 h-3.5 text-slate-300 cursor-grab shrink-0 group-hover:text-slate-500" />

                                {/* Small Thumbnail Preview */}
                                <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={img.previewUrl}
                                    alt={img.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                {/* File Name & Details */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded shrink-0">
                                      #{index + 1}
                                    </span>
                                    <p
                                      className="font-semibold text-xs text-slate-800 truncate"
                                      title={img.name}
                                    >
                                      {img.name}
                                    </p>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Ready for conversion &bull; {img.sizeFormatted}
                                  </p>
                                </div>
                              </div>

                              {/* Right: Reorder controls, 100% Ready status, and Delete button */}
                              <div className="flex items-center gap-2 shrink-0">
                                {/* Accessible Move Up / Down Arrows */}
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={(e) => handleMoveUp(index, e)}
                                    title="Move earlier in PDF"
                                    className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-20 transition"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === images.length - 1}
                                    onClick={(e) => handleMoveDown(index, e)}
                                    title="Move later in PDF"
                                    className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-20 transition"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* 100% Ready Status Indicator */}
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>100%</span>
                                </span>

                                {/* 4. Delete / Trash Button */}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteImage(img.id, e)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                  title="Remove image"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Ready / Progress Bar Indicator matching reference */}
                            <div className="w-full bg-slate-100 rounded-full h-1 mt-2.5 overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full w-full" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================== */}
            {/* 9. BOTTOM: CONVERT TO PDF BUTTON                               */}
            {/* ============================================================== */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                {images.length === 0 ? (
                  <span>Upload images on the left to begin conversion.</span>
                ) : (
                  <span>
                    Total: <strong className="text-slate-800">{images.length}</strong> {images.length === 1 ? 'file' : 'files'} ready for PDF conversion.
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleConvert}
                disabled={images.length === 0 || isProcessing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-3 px-8 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {images.length > 0
                    ? `Convert to PDF (${images.length} ${images.length === 1 ? 'Page' : 'Pages'})`
                    : 'Convert to PDF'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
