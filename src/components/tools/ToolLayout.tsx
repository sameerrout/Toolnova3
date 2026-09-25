'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { IToolDefinition } from '@/core/contracts/toolDefinition';
import { ProcessingState, ProcessedOutput, ProcessingProgress } from '@/core/types/tool';
import { Container } from '@/components/common/Container';
import { PrivacyNotice } from '@/components/common/PrivacyNotice';
import { FileDropZone } from '@/components/common/FileDropZone';
import { FileList } from '@/components/common/FileList';
import { SelectedFileItem } from '@/components/common/FileItem';
import { ProgressBar } from '@/components/common/ProgressBar';
import { ResultPanel } from '@/components/common/ResultPanel';
import { Badge } from '@/components/common/Badge';
import { normalizeError, AppError } from '@/lib/errors/AppError';

import { executeTool } from '@/core/execution/executeTool';

interface ToolLayoutProps {
  tool: IToolDefinition;
}

export function ToolLayout({ tool }: ToolLayoutProps) {
  const { manifest } = tool;

  // Lifecycle state (§33)
  const [files, setFiles] = useState<SelectedFileItem[]>([]);
  const [options, setOptions] = useState<any>(tool.defaultOptions);
  const [state, setState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState<ProcessingProgress>({
    progress: 0,
    statusText: 'Preparing...',
  });
  const [output, setOutput] = useState<ProcessedOutput | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  // Cancellation token and active server jobId tracker (§20)
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeJobIdRef = useRef<string | null>(null);

  // File selection & validation
  const handleFilesSelected = (newFiles: File[]) => {
    setError(null);

    // Optional tool-specific validator
    if (tool.validateFiles) {
      const validation = tool.validateFiles(newFiles);
      if (!validation.valid) {
        setError(
          new AppError({
            code: 'VALIDATION_ERROR',
            userMessage: validation.error || 'Invalid files provided.',
          })
        );
        return;
      }
    }

    const items: SelectedFileItem[] = newFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
    }));

    setFiles((prev) => [...prev, ...items]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
    setError(null);
  };

  // Execution via Unified Execution Router (§18)
  const handleProcess = async () => {
    if (files.length === 0 && manifest.id !== 'qr-code-generator') return;

    setError(null);
    setState('processing');
    setProgress({ progress: 5, statusText: 'Initializing...' });

    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeJobIdRef.current = null;

    try {
      const result = await executeTool({
        tool,
        files,
        options,
        onProgress: (p) => setProgress(p),
        signal: controller.signal,
        onJobAssigned: (jobId) => {
          activeJobIdRef.current = jobId;
        },
      });

      setOutput(result);
      setState('completed');
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        setState('cancelled');
        setError(
          new AppError({
            code: 'PROCESSING_CANCELLED',
            userMessage: 'Processing was cancelled.',
            retryable: true,
          })
        );
      } else {
        const normalized = normalizeError(err, 'Failed to process files.');
        setError(normalized);
        setState('error');
      }
    } finally {
      abortControllerRef.current = null;
      activeJobIdRef.current = null;
    }
  };

  const handleCancel = () => {
    if (activeJobIdRef.current) {
      fetch(`/api/jobs/${activeJobIdRef.current}/cancel`, { method: 'POST' }).catch(() => {});
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleReset = () => {
    setFiles([]);
    setOutput(null);
    setError(null);
    setState('idle');
    setProgress({ progress: 0, statusText: 'Idle' });
  };

  // Accepted MIME / format string
  const acceptFormats = manifest.inputFormats
    .map((fmt) => `.${fmt.toLowerCase()}`)
    .join(',');

  const OptionsComponent = tool.OptionsComponent;

  return (
    <div className="py-8 md:py-14">
      <Container size="lg">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/"
            className="hover:text-blue-600 transition-colors"
          >
            Home
          </Link>
          <span>/</span>
          <Link
            href={manifest.category === 'pdf' ? '/pdf-tools' : '/'}
            className="hover:text-blue-600 transition-colors capitalize"
          >
            {manifest.category === 'pdf' ? 'PDF Tools' : `${manifest.category} Tools`}
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900">{manifest.name}</span>
        </nav>

        {/* Tool Header */}
        <div className="space-y-4 border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {manifest.name}
              </h1>
              <Badge variant="info" size="md">
                v{manifest.version}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {manifest.executionMode === 'LOCAL' && (
                <Badge variant="success" size="md">
                  <Lock className="h-3.5 w-3.5" />
                  Client-Side Engine
                </Badge>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            {manifest.description}
          </p>

          <PrivacyNotice executionMode={manifest.executionMode} detailed />
        </div>

        {/* Main Interactive Stage */}
        <div className="mt-8 space-y-8">
          {/* State: Completed Result */}
          {state === 'completed' && output && (
            <ResultPanel output={output} onReset={handleReset} />
          )}

          {/* State: Error Banner */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error.userMessage}</span>
              </div>
              {error.retryable && (
                <button
                  type="button"
                  onClick={handleProcess}
                  className="inline-flex items-center gap-1 font-semibold text-red-800 hover:underline shrink-0"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          {/* State: Processing Progress */}
          {state === 'processing' && (
            <ProgressBar
              progress={progress.progress}
              statusText={progress.statusText}
              currentStep={progress.currentStep}
              onCancel={handleCancel}
            />
          )}

          {/* State: File Selection & Options Configuration */}
          {state !== 'completed' && (
            <>
              {manifest.id === 'qr-code-generator' ? (
                <div className="space-y-6">
                  {OptionsComponent && (
                    <OptionsComponent
                      options={options}
                      onChange={setOptions}
                      disabled={state === 'processing'}
                    />
                  )}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleProcess}
                      disabled={state === 'processing'}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      <span>Export Final QR Code Document</span>
                    </button>
                  </div>
                </div>
              ) : files.length === 0 ? (
                <FileDropZone
                  accept={acceptFormats}
                  maxFiles={manifest.limits.maxFiles}
                  maxFileSizeMb={manifest.limits.maxFileSizeMb}
                  onFilesSelected={handleFilesSelected}
                  disabled={state === 'processing'}
                  helperText={`Drop your ${manifest.inputFormats.join(', ')} files here`}
                />
              ) : (
                <div className="space-y-6">
                  {/* File List with Reorder Controls */}
                  <FileList
                    files={files}
                    onReorder={setFiles}
                    onRemove={handleRemoveFile}
                    onClearAll={handleClearAll}
                    disabled={state === 'processing'}
                  />

                  {/* Add more files drop area */}
                  <FileDropZone
                    accept={acceptFormats}
                    maxFiles={manifest.limits.maxFiles - files.length}
                    maxFileSizeMb={manifest.limits.maxFileSizeMb}
                    onFilesSelected={handleFilesSelected}
                    disabled={state === 'processing'}
                    className="py-4"
                    helperText="Drop additional files to append"
                  />

                  {/* Options Panel if provided by tool */}
                  {OptionsComponent && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        Configuration & Options
                      </h3>
                      <OptionsComponent
                        options={options}
                        onChange={setOptions}
                        disabled={state === 'processing'}
                      />
                    </div>
                  )}

                  {/* Action Process Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleProcess}
                      disabled={state === 'processing'}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      <span>
                        Convert {files.length} {files.length === 1 ? 'File' : 'Files'} to {manifest.outputFormats.join('/')}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </div>
  );
}

