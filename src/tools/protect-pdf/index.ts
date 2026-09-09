import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  ProtectPdfOptions,
  ProtectPdfOptionsComponent,
} from './ProtectPdfOptions';

export const protectPdfManifest: ToolManifest = {
  id: 'protect-pdf',
  name: 'Protect PDF',
  category: 'pdf',
  description:
    'Encrypt your PDF with standard passwords and security restrictions to protect confidential contents.',
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
    'AES_256_ENCRYPTION',
    'RC4_LEGACY_ENCRYPTION',
    'USER_PASSWORD_LOCK',
    'PERMISSION_FLAGS',
    'CLIENT_SIDE_ONLY',
  ],
  limits: {
    maxFiles: 1,
    maxFileSizeMb: 100,
    maxTotalSizeMb: 100,
    allowedMimeTypes: ['application/pdf'],
  },
  offlineSupport: true,
};

export const protectPdfTool: IToolDefinition<ProtectPdfOptions> = {
  manifest: protectPdfManifest,
  defaultOptions: {
    password: '',
    confirmPassword: '',
    algorithm: 'AES-256',
    allowPrinting: true,
    allowCopying: true,
    allowModifying: false,
    allowAnnotating: true,
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please select exactly one PDF file to protect.',
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

  OptionsComponent: ProtectPdfOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<ProtectPdfOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    if (!options.password || options.password.trim().length < 4) {
      throw new Error('Please provide a password of at least 4 characters.');
    }

    if (options.password !== options.confirmPassword) {
      throw new Error('Passwords do not match. Please re-enter your password.');
    }

    onProgress({ progress: 15, statusText: 'Reading and validating document...' });
    const buffer = await file.arrayBuffer();

    if (signal?.aborted) {
      throw new Error('Protection cancelled by user.');
    }

    onProgress({ progress: 35, statusText: 'Normalizing document structure...' });
    // Normalize and sanitize PDF structure with pdf-lib
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    pdfDoc.setProducer('Toolnova Security Engine');
    pdfDoc.setCreator('Toolnova');
    const normalizedBytes = await pdfDoc.save();

    if (signal?.aborted) {
      throw new Error('Protection cancelled by user.');
    }

    onProgress({
      progress: 65,
      statusText: `Applying ${options.algorithm} encryption sandbox...`,
    });

    // Encrypt PDF bytes entirely on client device using Web Crypto API
    const encryptedBytes = await encryptPDF(normalizedBytes, options.password, {
      ownerPassword: options.password,
      algorithm: options.algorithm,
      allowPrinting: options.allowPrinting,
      allowCopying: options.allowCopying,
      allowModifying: options.allowModifying,
      allowAnnotating: options.allowAnnotating,
    });

    onProgress({ progress: 95, statusText: 'Generating secure download...' });

    const finalBlob = new Blob([encryptedBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}-protected-${dateStamp}.pdf`;

    onProgress({ progress: 100, statusText: 'Document secured successfully!' });

    return {
      blob: finalBlob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: finalBlob.size,
    };
  },
};
