'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Plus, AlertCircle, File } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FileDropZoneProps {
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSizeMb?: number;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}

export function FileDropZone({
  accept,
  multiple = true,
  maxFiles = 50,
  maxFileSizeMb = 50,
  onFilesSelected,
  disabled = false,
  className,
  helperText = 'Select or drag & drop files here',
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (rawFiles: FileList | null) => {
    if (!rawFiles || rawFiles.length === 0) return;
    setErrorMessage(null);

    const filesArray = Array.from(rawFiles);

    // Validation 1: Max files count
    if (filesArray.length > maxFiles) {
      setErrorMessage(`Maximum ${maxFiles} files can be processed at once.`);
      return;
    }

    // Validation 2: Individual file validation (0-byte check, size limit)
    const validFiles: File[] = [];
    const maxBytes = maxFileSizeMb * 1024 * 1024;

    for (const file of filesArray) {
      if (file.size === 0) {
        setErrorMessage(`File "${file.name}" is empty (0 bytes).`);
        return;
      }
      if (file.size > maxBytes) {
        setErrorMessage(
          `File "${file.name}" exceeds the ${maxFileSizeMb}MB size limit.`
        );
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset the input value so the same file can be re-selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerPicker = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn('w-full space-y-2', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerPicker();
          }
        }}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Upload files"
        aria-disabled={disabled}
        className={cn(
          'group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all cursor-pointer select-none outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 scale-[1.005]'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/70',
          disabled && 'cursor-not-allowed opacity-50 hover:border-slate-300 hover:bg-white'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 group-hover:scale-105 group-hover:bg-blue-100 transition-all shadow-xs">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h4 className="text-base font-bold text-slate-900">
          {helperText}
        </h4>

        <p className="mt-1.5 text-xs text-slate-500">
          or click to browse from your device
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs group-hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Choose Files</span>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-400">
          <span>Max {maxFileSizeMb}MB per file</span>
          <span>&bull;</span>
          <span>Up to {maxFiles} files</span>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

