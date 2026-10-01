/**
 * Toolino Core Types & Contracts
 * Adheres strictly to the architectural specifications defined in the Master Prompt.
 */

export type ExecutionMode = 'LOCAL' | 'SERVER' | 'HYBRID';

export type ToolCategory =
  | 'pdf'
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'text'
  | 'data'
  | 'developer'
  | 'utility';

export interface ToolPermissions {
  readInputFiles: boolean;
  writeOutputFiles: boolean;
  networkAccess: boolean;
  accessOtherFiles: boolean;
}

export interface ToolLimits {
  maxFiles: number;
  maxFileSizeMb: number;
  maxTotalSizeMb: number;
  allowedMimeTypes?: string[];
}

export interface ToolManifest {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  version: string;
  executionMode: ExecutionMode;
  runtime: 'browser' | 'wasm' | 'web-worker' | 'server';
  inputFormats: string[];
  outputFormats: string[];
  permissions: ToolPermissions;
  capabilities: string[];
  limits: ToolLimits;
  offlineSupport: boolean;
  processingEngine?: 'client-js' | 'python' | 'native-office' | 'hybrid';
  supportsClientSide?: boolean;
  supportsServerSide?: boolean;
  supportsStreaming?: boolean;
  supportsChunking?: boolean;
  supportsCancellation?: boolean;
  estimatedMemoryMb?: number;
  maxPages?: number;
  preferredStrategy?: 'CLIENT_SIDE' | 'FAST_MEMORY' | 'CHUNKED' | 'DISK_BACKED' | 'STREAMING';
  workerId?: string;
  seoSlug?: string;
  categorySlug?: string;
  packageInfo?: {
    entrypoint: string;
    integrityHash?: string;
    sizeBytes?: number;
  };
}

export type ProcessingState =
  | 'idle'
  | 'validating'
  | 'loading-tool'
  | 'processing'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface ProcessingProgress {
  progress: number; // 0 - 100
  statusText: string;
  currentStep?: string;
}

export interface ProcessedOutput {
  blob: Blob;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl?: string;
}

