import JSZip from 'jszip';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';

export interface PdfToImageOptions {
  format?: 'png';
  scale?: number;
}

export const pdfToImageManifest: ToolManifest = {
  id: 'pdf-to-image',
  name: 'PDF to Image',
  category: 'pdf',
  description:
    'Convert PDF document pages into high-quality, crystal-clear PNG images with automatic ZIP export for multi-page files.',
  version: '1.0.0',
  executionMode: 'LOCAL',
  runtime: 'browser',
  inputFormats: ['PDF'],
  outputFormats: ['PNG', 'ZIP'],
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

export const pdfToImageTool: IToolDefinition<PdfToImageOptions> = {
  manifest: pdfToImageManifest,
  defaultOptions: {
    format: 'png',
    scale: 2.0,
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

  // OptionsComponent is intentionally omitted to give users high-quality PNG conversion directly without configuration friction

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

    // High quality: 2.0x scale (150-200 DPI) for crystal-clear text and graphics
    const scale = Math.max(options?.scale || 2.0, 2.0);
    const mimeType = 'image/png';
    const ext = 'png';

    const renderedImages: { name: string; blob: Blob }[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (signal?.aborted) {
        throw new Error('Conversion cancelled by user.');
      }

      const percent = Math.round(25 + (pageNum / totalPages) * 65);
      onProgress({
        progress: percent,
        statusText: `Rendering page ${pageNum} of ${totalPages} in high quality...`,
      });

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Unable to initialize HTML5 Canvas rendering context.');
      }

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      await page.render(renderContext).promise;

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), mimeType);
      });

      if (!blob) {
        throw new Error(`Failed to generate high quality image blob for page ${pageNum}.`);
      }

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      renderedImages.push({
        name: `${baseName}-page-${pageNum}.${ext}`,
        blob,
      });
    }

    onProgress({ progress: 95, statusText: 'Packaging output...' });

    // If only 1 image rendered, return that high quality image directly
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
    const zipName = `toolino-high-quality-images-${dateStamp}.zip`;

    onProgress({ progress: 100, statusText: 'Export complete!' });

    return {
      blob: zipBlob,
      fileName: zipName,
      mimeType: 'application/zip',
      sizeBytes: zipBlob.size,
    };
  },
};
