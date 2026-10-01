import { PDFDocument, degrees } from 'pdf-lib';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  RotatePdfOptions,
  RotatePdfOptionsComponent,
} from './RotatePdfOptions';

export const rotatePdfManifest: ToolManifest = {
  id: 'rotate-pdf',
  name: 'Rotate PDF',
  category: 'pdf',
  description:
    'Rotate specific pages or all pages of your PDF by 90°, 180°, or 270° with zero server uploads.',
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
    'ROTATE_90_180_270',
    'ODD_EVEN_PAGE_SELECTION',
    'ALL_PAGE_ROTATION',
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

export const rotatePdfTool: IToolDefinition<RotatePdfOptions> = {
  manifest: rotatePdfManifest,
  defaultOptions: {
    angle: 90,
    targetPages: 'all',
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Rotate PDF supports exactly one PDF file at a time.',
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

  OptionsComponent: RotatePdfOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<RotatePdfOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    onProgress({ progress: 15, statusText: 'Reading PDF document...' });
    const buffer = await file.arrayBuffer();

    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    const pages = pdfDoc.getPages();
    const total = pages.length;

    onProgress({ progress: 40, statusText: `Rotating ${options.targetPages} pages...` });

    for (let i = 0; i < total; i++) {
      if (signal?.aborted) {
        throw new Error('Processing cancelled by user.');
      }

      const pageNumber = i + 1;
      let shouldRotate = false;

      if (options.targetPages === 'all') {
        shouldRotate = true;
      } else if (options.targetPages === 'odd' && pageNumber % 2 !== 0) {
        shouldRotate = true;
      } else if (options.targetPages === 'even' && pageNumber % 2 === 0) {
        shouldRotate = true;
      }

      if (shouldRotate) {
        const page = pages[i];
        const currentRotation = page.getRotation().angle;
        const newRotation = (currentRotation + options.angle) % 360;
        page.setRotation(degrees(newRotation));
      }
    }

    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    onProgress({ progress: 85, statusText: 'Saving rotated PDF...' });
    const pdfBytes = await pdfDoc.save();

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `toolino-rotated-${dateStamp}.pdf`;
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    onProgress({ progress: 100, statusText: 'Rotation complete!' });

    return {
      blob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: blob.size,
    };
  },
};

