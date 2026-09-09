import JSZip from 'jszip';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  PdfToImageOptions,
  PdfToImageOptionsComponent,
} from './PdfToImageOptions';

export const pdfToImageManifest: ToolManifest = {
  id: 'pdf-to-image',
  name: 'PDF to Image',
  category: 'pdf',
  description:
    'Extract pages from your PDF documents into high-resolution PNG or JPG images, with ZIP export for multi-page documents.',
  version: '1.0.0',
  executionMode: 'LOCAL',
  runtime: 'browser',
  inputFormats: ['PDF'],
  outputFormats: ['PNG', 'JPG', 'ZIP'],
  permissions: {
    readInputFiles: true,
    writeOutputFiles: true,
    networkAccess: false,
    accessOtherFiles: false,
  },
  capabilities: [
    'PAGE_EXTRACTION',
    'CANVAS_RENDERING',
    'HIGH_DPI_EXPORT',
    'ZIP_ARCHIVING',
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

function parsePageSelection(rangesStr: string, totalPages: number): number[] {
  if (!rangesStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>();
  const parts = rangesStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          pages.add(i);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        pages.add(num);
      }
    }
  }

  const result = Array.from(pages).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i + 1);
}

export const pdfToImageTool: IToolDefinition<PdfToImageOptions> = {
  manifest: pdfToImageManifest,
  defaultOptions: {
    format: 'png',
    scale: 2.0,
    pageRanges: '',
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please select exactly one PDF file to convert.',
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

  OptionsComponent: PdfToImageOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<PdfToImageOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;
    const dateStamp = new Date().toISOString().slice(0, 10);

    onProgress({ progress: 10, statusText: 'Loading PDF rendering engine...' });
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');

    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/pdf.worker.min.js`;
    }

    onProgress({ progress: 20, statusText: 'Reading document bytes...' });
    const buffer = await file.arrayBuffer();

    if (signal?.aborted) {
      throw new Error('Conversion cancelled by user.');
    }

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    const targetPages = parsePageSelection(options.pageRanges, totalPages);
    const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg';
    const ext = options.format === 'png' ? 'png' : 'jpg';

    const renderedImages: { name: string; blob: Blob }[] = [];

    for (let i = 0; i < targetPages.length; i++) {
      if (signal?.aborted) {
        throw new Error('Conversion cancelled by user.');
      }

      const pageNum = targetPages[i];
      const percent = Math.round(25 + ((i + 1) / targetPages.length) * 65);
      onProgress({
        progress: percent,
        statusText: `Rendering page ${pageNum} of ${totalPages}...`,
      });

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: options.scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Unable to initialize HTML5 Canvas rendering context.');
      }

      // Render white background for JPEG
      if (options.format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      await page.render(renderContext).promise;

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), mimeType, options.format === 'jpeg' ? 0.92 : undefined);
      });

      if (!blob) {
        throw new Error(`Failed to generate image blob for page ${pageNum}.`);
      }

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      renderedImages.push({
        name: `${baseName}-page-${pageNum}.${ext}`,
        blob,
      });
    }

    onProgress({ progress: 95, statusText: 'Packaging output...' });

    // If only 1 image rendered, return that image directly
    if (renderedImages.length === 1) {
      const single = renderedImages[0];
      onProgress({ progress: 100, statusText: 'Complete!' });
      return {
        blob: single.blob,
        fileName: single.name,
        mimeType,
        sizeBytes: single.blob.size,
      };
    }

    // Multiple images: bundle into ZIP archive
    const zip = new JSZip();
    for (const img of renderedImages) {
      zip.file(img.name, img.blob);
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/zip',
    });
    const zipName = `toolnova-images-${dateStamp}.zip`;

    onProgress({ progress: 100, statusText: 'Export complete!' });

    return {
      blob: zipBlob,
      fileName: zipName,
      mimeType: 'application/zip',
      sizeBytes: zipBlob.size,
    };
  },
};

