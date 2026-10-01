import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  generatePdfFromImages,
  ImageToPdfOptions,
} from '@/core/engine/pdfEngine';
import { ImageToPdfOptionsComponent } from './ImageToPdfOptions';

export const imageToPdfManifest: ToolManifest = {
  id: 'image-to-pdf',
  name: 'Image to PDF',
  category: 'pdf',
  description:
    'Convert multiple JPG, PNG, and WEBP images into a clean PDF document. Reorder pages, customize page size, orientation, margins, and quality directly in your browser.',
  version: '1.0.0',
  executionMode: 'LOCAL',
  runtime: 'browser',
  inputFormats: ['JPG', 'JPEG', 'PNG', 'WEBP'],
  outputFormats: ['PDF'],
  permissions: {
    readInputFiles: true,
    writeOutputFiles: true,
    networkAccess: false,
    accessOtherFiles: false,
  },
  capabilities: [
    'MULTI_IMAGE_INPUT',
    'PAGE_REORDERING',
    'PAGE_SIZES_A4_LETTER_LEGAL_FIT',
    'ORIENTATION_AUTO_PORTRAIT_LANDSCAPE',
    'CUSTOM_MARGINS',
    'IMAGE_COMPRESSION_QUALITY',
    'OFFLINE_READY',
  ],
  limits: {
    maxFiles: 50,
    maxFileSizeMb: 30,
    maxTotalSizeMb: 150,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  offlineSupport: true,
};

export const defaultImageToPdfOptions: ImageToPdfOptions = {
  pageSize: 'a4',
  orientation: 'auto',
  margin: 'small',
  imageFit: 'fit',
  quality: 0.85,
};

export const imageToPdfTool: IToolDefinition<ImageToPdfOptions> = {
  manifest: imageToPdfManifest,
  defaultOptions: defaultImageToPdfOptions,

  validateFiles: (files: File[]) => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
      if (!hasValidExt) {
        return {
          valid: false,
          error: `File "${file.name}" has an unsupported format. Supported formats: JPG, JPEG, PNG, WEBP.`,
        };
      }
    }
    return { valid: true };
  },

  OptionsComponent: ImageToPdfOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<ImageToPdfOptions>): Promise<ProcessedOutput> => {
    const rawFiles = files.map((f) => f.file);

    const pdfBlob = await generatePdfFromImages(
      rawFiles,
      options,
      onProgress,
      signal
    );

    // Format output filename
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `toolino-converted-${dateStamp}.pdf`;

    return {
      blob: pdfBlob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: pdfBlob.size,
    };
  },
};

