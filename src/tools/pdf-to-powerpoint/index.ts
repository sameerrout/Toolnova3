import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  PdfToPowerpointOptions,
  PdfToPowerpointOptionsComponent,
} from './PdfToPowerpointOptions';

export const pdfToPowerpointManifest: ToolManifest = {
  id: 'pdf-to-powerpoint',
  name: 'PDF to PowerPoint',
  category: 'pdf',
  description:
    'Convert PDF presentation slides into visual-fidelity Microsoft PowerPoint (.pptx) decks with 1:1 page-to-slide mapping.',
  version: '1.0.0',
  executionMode: 'HYBRID',
  runtime: 'browser',
  inputFormats: ['PDF'],
  outputFormats: ['PPTX'],
  permissions: {
    readInputFiles: true,
    writeOutputFiles: true,
    networkAccess: true,
    accessOtherFiles: false,
  },
  capabilities: [
    'PPTX_GENERATION',
    'SLIDE_CONVERSION',
    'HIRES_RENDERING',
    'SPEAKER_NOTES_EXTRACTION',
    '1_PAGE_1_SLIDE_GUARANTEE',
    'SERVER_WORKER_PIPELINE',
  ],
  limits: {
    maxFiles: 1,
    maxFileSizeMb: 100,
    maxTotalSizeMb: 100,
    allowedMimeTypes: ['application/pdf'],
  },
  offlineSupport: false,
  processingEngine: 'hybrid',
  supportsClientSide: true,
  supportsServerSide: true,
  supportsChunking: true,
  preferredStrategy: 'CHUNKED',
};

export const pdfToPowerpointTool: IToolDefinition<PdfToPowerpointOptions> = {
  manifest: pdfToPowerpointManifest,
  defaultOptions: {
    slideLayout: '16x9',
    presentationTitle: '',
    resolution: 'high',
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please select exactly one PDF file to convert to PowerPoint.',
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

  OptionsComponent: PdfToPowerpointOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<PdfToPowerpointOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    onProgress({ progress: 10, statusText: 'Initializing presentation engine...' });
    const pptxModule = await import('pptxgenjs');
    const PptxGenJS = pptxModule.default || pptxModule;
    const pptx = new PptxGenJS();

    pptx.layout = options.slideLayout === '4x3' ? 'LAYOUT_4x3' : 'LAYOUT_16x9';
    const deckTitle = options.presentationTitle.trim() || file.name.replace(/\.[^/.]+$/, '');
    pptx.title = deckTitle;
    pptx.subject = 'Converted from PDF with Toolnova';

    onProgress({ progress: 20, statusText: 'Loading PDF document...' });
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');

    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/pdf.worker.min.js`;
    }

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
    const numPages = pdfDoc.numPages;

    const scale = options.resolution === 'high' ? 2.0 : 1.5;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (signal?.aborted) {
        throw new Error('Conversion cancelled by user.');
      }

      const percent = Math.round(25 + (pageNum / numPages) * 55);
      onProgress({
        progress: percent,
        statusText: `Rendering slide ${pageNum} of ${numPages}...`,
      });

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Unable to allocate canvas rendering context.');
      }

      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      // Extract text content for slide notes
      let notesText = '';
      try {
        const textContent = await page.getTextContent();
        const extractedStrings: string[] = [];
        for (const item of textContent.items) {
          if ('str' in item && typeof item.str === 'string' && item.str.trim()) {
            extractedStrings.push(item.str);
          }
        }
        notesText = extractedStrings.join(' ');
      } catch {
        // Non-fatal if text extraction fails
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      // Create slide and embed visual content
      const slide = pptx.addSlide();
      slide.addImage({
        data: imgData,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
      });

      if (notesText) {
        slide.addNotes(notesText);
      }
    }

    onProgress({ progress: 85, statusText: 'Packaging PowerPoint (.pptx) file...' });
    const rawBlob = (await pptx.write({ outputType: 'blob' })) as Blob;
    const pptxBlob = new Blob([rawBlob], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}-presentation-${dateStamp}.pptx`;

    onProgress({ progress: 100, statusText: 'Presentation generated successfully!' });

    return {
      blob: pptxBlob,
      fileName,
      mimeType:
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      sizeBytes: pptxBlob.size,
    };
  },
};

