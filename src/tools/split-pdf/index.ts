import { PDFDocument } from 'pdf-lib';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  SplitPdfOptions,
  SplitPdfOptionsComponent,
} from './SplitPdfOptions';

export const splitPdfManifest: ToolManifest = {
  id: 'split-pdf',
  name: 'Split PDF',
  category: 'pdf',
  description:
    'Extract individual pages or custom page ranges from a PDF document into a new file.',
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
    'PAGE_RANGE_EXTRACTION',
    'CUSTOM_PAGE_SELECTION',
    'BOUNDS_VALIDATION',
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

function parsePageIndices(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr.trim()) {
    throw new Error('Please specify at least one page or page range to extract.');
  }

  const indices = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range expression: "${trimmed}".`);
      }
      if (start > end) {
        throw new Error(`Start page (${start}) cannot be greater than end page (${end}).`);
      }
      if (start < 1 || end > totalPages) {
        throw new Error(
          `Range "${trimmed}" is out of bounds. The document has ${totalPages} ${totalPages === 1 ? 'page' : 'pages'}.`
        );
      }

      for (let p = start; p <= end; p++) {
        indices.add(p - 1); // 0-indexed for pdf-lib
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (isNaN(page)) {
        throw new Error(`Invalid page number: "${trimmed}".`);
      }
      if (page < 1 || page > totalPages) {
        throw new Error(
          `Page ${page} is out of bounds. The document has ${totalPages} ${totalPages === 1 ? 'page' : 'pages'}.`
        );
      }
      indices.add(page - 1);
    }
  }

  const result = Array.from(indices).sort((a, b) => a - b);
  if (result.length === 0) {
    throw new Error('No valid pages found in the specified range.');
  }

  return result;
}

export const splitPdfTool: IToolDefinition<SplitPdfOptions> = {
  manifest: splitPdfManifest,
  defaultOptions: {
    pageRanges: '1',
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Split PDF supports exactly one PDF document at a time.',
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

  OptionsComponent: SplitPdfOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<SplitPdfOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    onProgress({ progress: 10, statusText: 'Reading PDF document...' });
    const buffer = await file.arrayBuffer();

    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    const totalPages = srcDoc.getPageCount();

    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    onProgress({ progress: 30, statusText: 'Validating requested page ranges...' });
    const selectedIndices = parsePageIndices(options.pageRanges, totalPages);

    onProgress({
      progress: 50,
      statusText: `Extracting ${selectedIndices.length} pages from ${totalPages}...`,
    });

    const outputDoc = await PDFDocument.create();
    const copiedPages = await outputDoc.copyPages(srcDoc, selectedIndices);

    for (const page of copiedPages) {
      outputDoc.addPage(page);
    }

    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    onProgress({ progress: 85, statusText: 'Compiling split PDF document...' });
    const pdfBytes = await outputDoc.save();

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `toolnova-split-${dateStamp}.pdf`;
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    onProgress({ progress: 100, statusText: 'Split complete!' });

    return {
      blob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: blob.size,
    };
  },
};

