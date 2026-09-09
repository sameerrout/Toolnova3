import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  EditPdfOptions,
  EditPdfOptionsComponent,
} from './EditPdfOptions';

export const editPdfManifest: ToolManifest = {
  id: 'edit-pdf',
  name: 'Edit PDF',
  category: 'pdf',
  description:
    'Insert text notes, headers, stamps, and annotations directly onto your PDF pages client-side.',
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
    'TEXT_INSERTION',
    'HEADER_FOOTER_ANNOTATION',
    'COLOR_SELECTION',
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

const COLOR_MAP = {
  black: rgb(0.1, 0.1, 0.1),
  blue: rgb(0.1, 0.35, 0.85),
  red: rgb(0.85, 0.15, 0.15),
};

export const editPdfTool: IToolDefinition<EditPdfOptions> = {
  manifest: editPdfManifest,
  defaultOptions: {
    annotationText: 'APPROVED',
    position: 'top-right',
    fontSize: 16,
    textColor: 'blue',
    applyTo: 'first-page',
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please upload exactly one PDF file to edit.',
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

  OptionsComponent: EditPdfOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<EditPdfOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    onProgress({ progress: 15, statusText: 'Reading PDF document...' });
    const buffer = await file.arrayBuffer();

    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    const text = options.annotationText.trim() || 'NOTE';
    const textColor = COLOR_MAP[options.textColor] || COLOR_MAP.black;

    onProgress({ progress: 40, statusText: 'Inserting text annotations...' });

    const pagesToEdit =
      options.applyTo === 'first-page' ? [pages[0]] : pages;

    const margin = 30;

    for (let i = 0; i < pagesToEdit.length; i++) {
      if (signal?.aborted) {
        throw new Error('Processing cancelled by user.');
      }

      const page = pagesToEdit[i];
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, options.fontSize);
      const textHeight = font.heightAtSize(options.fontSize);

      let x = margin;
      let y = margin;

      if (options.position === 'top-left') {
        x = margin;
        y = height - margin - textHeight;
      } else if (options.position === 'top-right') {
        x = width - margin - textWidth;
        y = height - margin - textHeight;
      } else if (options.position === 'bottom-left') {
        x = margin;
        y = margin;
      } else if (options.position === 'bottom-right') {
        x = width - margin - textWidth;
        y = margin;
      }

      page.drawText(text, {
        x,
        y,
        size: options.fontSize,
        font,
        color: textColor,
      });
    }

    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    onProgress({ progress: 85, statusText: 'Saving modified PDF...' });
    const pdfBytes = await pdfDoc.save();

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `toolnova-edited-${dateStamp}.pdf`;
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    onProgress({ progress: 100, statusText: 'PDF updated successfully!' });

    return {
      blob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: blob.size,
    };
  },
};

