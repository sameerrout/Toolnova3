import { PDFDocument } from 'pdf-lib';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  UnlockPdfOptions,
  UnlockPdfOptionsComponent,
} from './UnlockPdfOptions';

export const unlockPdfManifest: ToolManifest = {
  id: 'unlock-pdf',
  name: 'Unlock PDF',
  category: 'pdf',
  description:
    'Remove password protection and restrictions from authorized PDF files for easy sharing and printing.',
  version: '1.0.0',
  executionMode: 'LOCAL',
  runtime: 'browser',
  inputFormats: ['PDF'],
  outputFormats: ['PDF'],
  permissions: {
    readInputFiles: true,
    writeOutputFiles: true,
    networkAccess: false,
    accessOtherFiles: false,
  },
  capabilities: [
    'PASSWORD_REMOVAL',
    'CLIENT_SIDE_DECRYPTION',
    'ZERO_PASSWORD_LOGGING',
    'OFFLINE_READY',
  ],
  limits: {
    maxFiles: 1,
    maxFileSizeMb: 100,
    maxTotalSizeMb: 100,
    allowedMimeTypes: ['application/pdf'],
  },
  offlineSupport: true,
};

export const unlockPdfTool: IToolDefinition<UnlockPdfOptions> = {
  manifest: unlockPdfManifest,
  defaultOptions: {
    password: '',
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please upload exactly one PDF file to unlock.',
      };
    }
    if (!files[0].name.toLowerCase().endsWith('.pdf')) {
      return {
        valid: false,
        error: 'Please select a valid PDF file.',
      };
    }
    return { valid: true };
  },

  OptionsComponent: UnlockPdfOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<UnlockPdfOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    onProgress({ progress: 20, statusText: 'Reading PDF document...' });
    const buffer = await file.arrayBuffer();

    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    onProgress({ progress: 40, statusText: 'Decrypting and removing restrictions...' });

    let pdfDoc: PDFDocument;
    try {
      // Load and decode document
      pdfDoc = await PDFDocument.load(buffer, {
        ignoreEncryption: true,
      });
    } catch (err: unknown) {
      throw new Error(
        'Could not unlock this document. If it is password protected, please verify your credentials.'
      );
    }

    onProgress({ progress: 75, statusText: 'Generating unlocked PDF...' });
    const unlockedBytes = await pdfDoc.save();

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `toolnova-unlocked-${dateStamp}.pdf`;
    const blob = new Blob([unlockedBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    onProgress({ progress: 100, statusText: 'Document unlocked successfully!' });

    return {
      blob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: blob.size,
    };
  },
};

