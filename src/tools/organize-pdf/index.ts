import { PDFDocument } from 'pdf-lib';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  OrganizePdfOptions,
  OrganizePdfOptionsComponent,
} from './OrganizePdfOptions';

export const organizePdfManifest: ToolManifest = {
  id: 'organize-pdf',
  name: 'Organize PDF',
  category: 'pdf',
  description:
    'Rearrange, reorder, delete, and duplicate pages in your PDF document with client-side privacy.',
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
    'PAGE_REORDERING',
    'PAGE_DELETION',
    'PAGE_DUPLICATION',
    'REVERSE_ORDER',
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

export const organizePdfTool: IToolDefinition<OrganizePdfOptions> = {
  manifest: organizePdfManifest,
  defaultOptions: {
    pageOrder: '',
    mode: 'custom-order',
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please upload exactly one PDF file to organize.',
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

  OptionsComponent: OrganizePdfOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<OrganizePdfOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    onProgress({ progress: 15, statusText: 'Reading PDF document...' });
    const buffer = await file.arrayBuffer();

    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    const totalPages = srcDoc.getPageCount();

    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    let targetIndices: number[] = [];

    if (options.mode === 'reverse') {
      for (let i = totalPages - 1; i >= 0; i--) {
        targetIndices.push(i);
      }
    } else {
      if (!options.pageOrder.trim()) {
        throw new Error('Please enter the desired page sequence (e.g. 2, 1, 3).');
      }

      const parts = options.pageOrder.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const pageNum = parseInt(trimmed, 10);
        if (isNaN(pageNum)) {
          throw new Error(`Invalid page number: "${trimmed}".`);
        }
        if (pageNum < 1 || pageNum > totalPages) {
          throw new Error(
            `Page ${pageNum} is out of bounds. The document has ${totalPages} ${totalPages === 1 ? 'page' : 'pages'}.`
          );
        }
        targetIndices.push(pageNum - 1);
      }

      if (targetIndices.length === 0) {
        throw new Error('No valid pages found in the specified sequence.');
      }
    }

    onProgress({
      progress: 45,
      statusText: `Reorganizing ${targetIndices.length} pages in new order...`,
    });

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);

    for (const page of copiedPages) {
      newDoc.addPage(page);
    }

    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    onProgress({ progress: 85, statusText: 'Saving organized PDF...' });
    const pdfBytes = await newDoc.save();

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `toolnova-organized-${dateStamp}.pdf`;
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    onProgress({ progress: 100, statusText: 'Organization complete!' });

    return {
      blob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: blob.size,
    };
  },
};

