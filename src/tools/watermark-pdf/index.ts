import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  WatermarkPdfOptions,
  WatermarkPdfOptionsComponent,
} from './WatermarkPdfOptions';

export const watermarkPdfManifest: ToolManifest = {
  id: 'watermark-pdf',
  name: 'Watermark PDF',
  category: 'pdf',
  description:
    'Add custom text or status watermarks across your PDF pages with adjustable opacity, angle, and sizing.',
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
    'TEXT_WATERMARKING',
    'OPACITY_CONTROL',
    'ROTATION_CONTROL',
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
  gray: rgb(0.5, 0.5, 0.5),
  red: rgb(0.85, 0.15, 0.15),
  blue: rgb(0.15, 0.35, 0.85),
};

export const watermarkPdfTool: IToolDefinition<WatermarkPdfOptions> = {
  manifest: watermarkPdfManifest,
  defaultOptions: {
    text: 'CONFIDENTIAL',
    fontSize: 48,
    opacity: 0.3,
    rotation: 45,
    color: 'gray',
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please upload exactly one PDF file to watermark.',
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

  OptionsComponent: WatermarkPdfOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<WatermarkPdfOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    onProgress({ progress: 15, statusText: 'Reading PDF document...' });
    const buffer = await file.arrayBuffer();

    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const total = pages.length;

    const watermarkColor = COLOR_MAP[options.color] || COLOR_MAP.gray;
    const text = options.text.trim() || 'CONFIDENTIAL';

    onProgress({ progress: 35, statusText: 'Stamping watermarks onto pages...' });

    for (let i = 0; i < total; i++) {
      if (signal?.aborted) {
        throw new Error('Processing cancelled by user.');
      }

      const page = pages[i];
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, options.fontSize);
      const textHeight = font.heightAtSize(options.fontSize);

      // Center the watermark on the page
      const x = (width - textWidth) / 2;
      const y = (height - textHeight) / 2;

      page.drawText(text, {
        x,
        y,
        size: options.fontSize,
        font,
        color: watermarkColor,
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });

      const currentPercent = Math.round(35 + (i / total) * 50);
      onProgress({
        progress: currentPercent,
        statusText: `Watermarking page ${i + 1} of ${total}...`,
        currentStep: `${i + 1}/${total}`,
      });
    }

    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    onProgress({ progress: 90, statusText: 'Saving watermarked PDF...' });
    const pdfBytes = await pdfDoc.save();

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `toolnova-watermarked-${dateStamp}.pdf`;
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    onProgress({ progress: 100, statusText: 'Watermark complete!' });

    return {
      blob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: blob.size,
    };
  },
};

