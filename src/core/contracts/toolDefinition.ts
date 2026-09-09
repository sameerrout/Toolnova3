import React from 'react';
import { ToolManifest, ProcessedOutput, ProcessingProgress } from '@/core/types/tool';
import { SelectedFileItem } from '@/components/common/FileItem';

export interface ToolProcessParams<TOptions = unknown> {
  files: SelectedFileItem[];
  options: TOptions;
  onProgress: (progress: ProcessingProgress) => void;
  signal?: AbortSignal;
}

export interface IToolDefinition<TOptions = any> {
  manifest: ToolManifest;
  defaultOptions: TOptions;
  validateFiles?: (files: File[]) => { valid: boolean; error?: string };
  OptionsComponent?: React.ComponentType<{
    options: TOptions;
    onChange: (options: TOptions) => void;
    disabled?: boolean;
  }>;
  process: (params: ToolProcessParams<TOptions>) => Promise<ProcessedOutput>;
}

