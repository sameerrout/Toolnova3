import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  PdfPageNumbersOptions,
  PdfPageNumbersOptionsComponent,
} from './PdfPageNumbersOptions';

export const pdfPageNumbersManifest: ToolManifest = {
  id: 'pdf-page-numbers',
  name: 'PDF Page Numbers',
  category: 'pdf',
  description:
    'Insert customizable page numbers, header/footer text, and numbering styles to your PDF.',
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
    'POSITION_TOP_BOTTOM_LEFT_CENTER_RIGHT',
    'FLEXIBLE_NUMBERING_FORMATS',
    'CUSTOM_START_NUMBER',
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

export const pdfPageNumbersTool: IToolDefinition<PdfPageNumbersOptions> = {
  manifest: pdfPageNumbersManifest,
  defaultOptions: {
    position: 'bottom-center',
    format: 'page-of-total',
    startNumber: 1,
    fontSize: 11,
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please upload exactly one PDF file to add page numbers.',
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

  OptionsComponent: PdfPageNumbersOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<PdfPageNumbersOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    onProgress({ progress: 15, statusText: 'Reading PDF document...' });
    const buffer = await file.arrayBuffer();

    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    onProgress({ progress: 35, statusText: 'Calculating layout and stamping page numbers...' });

    const margin = 28; // 28pt padding from edges

    for (let i = 0; i < totalPages; i++) {
      if (signal?.aborted) {
        throw new Error('Processing cancelled by user.');
      }

      const page = pages[i];
      const { width, height } = page.getSize();
      const currentNumber = options.startNumber + i;

      let label = '';
      if (options.format === 'page-of-total') {
        label = `Page ${currentNumber} of ${options.startNumber + totalPages - 1}`;
      } else if (options.format === 'simple-slash') {
        label = `${currentNumber} / ${options.startNumber + totalPages - 1}`;
      } else {
        label = `${currentNumber}`;
      }

      const textWidth = font.widthOfTextAtSize(label, options.fontSize);
      const textHeight = font.heightAtSize(options.fontSize);

      let x = margin;
      let y = margin;

      // Calculate X coordinate
      if (options.position.includes('center')) {
        x = (width - textWidth) / 2;
      } else if (options.position.includes('right')) {
        x = width - margin - textWidth;
      } else {
        x = margin;
      }

      // Calculate Y coordinate
      if (options.position.startsWith('top')) {
        y = height - margin - textHeight;
      } else {
        y = margin;
      }

      page.drawText(label, {
        x,
        y,
        size: options.fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      const currentPercent = Math.round(35 + (i / totalPages) * 50);
      onProgress({
        progress: currentPercent,
        statusText: `Adding number to page ${i + 1} of ${totalPages}...`,
        currentStep: `${i + 1}/${totalPages}`,
      });
    }

    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    onProgress({ progress: 90, statusText: 'Saving numbered PDF...' });
    const pdfBytes = await pdfDoc.save();

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `toolnova-numbered-${dateStamp}.pdf`;
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    onProgress({ progress: 100, statusText: 'Page numbering complete!' });

    return {
      blob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: blob.size,
    };
  },
};

