import { Document, Paragraph, TextRun, Packer, PageBreak, HeadingLevel } from 'docx';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  PdfToWordOptions,
  PdfToWordOptionsComponent,
} from './PdfToWordOptions';

export const pdfToWordManifest: ToolManifest = {
  id: 'pdf-to-word',
  name: 'PDF to Word',
  category: 'pdf',
  description:
    'Convert PDF documents into editable Microsoft Word (.docx) documents with typography and table reconstruction.',
  version: '1.0.0',
  executionMode: 'HYBRID',
  runtime: 'browser',
  inputFormats: ['PDF'],
  outputFormats: ['DOCX'],
  permissions: {
    readInputFiles: true,
    writeOutputFiles: true,
    networkAccess: true,
    accessOtherFiles: false,
  },
  capabilities: [
    'DOCX_GENERATION',
    'TEXT_EXTRACTION',
    'LINE_RECONSTRUCTION',
    'PARAGRAPH_DETECTION',
    'PAGE_BREAK_PRESERVATION',
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

interface TextItemObj {
  str: string;
  x: number;
  y: number;
  height: number;
}

export const pdfToWordTool: IToolDefinition<PdfToWordOptions> = {
  manifest: pdfToWordManifest,
  defaultOptions: {
    documentTitle: '',
    includePageBreaks: true,
    fontSize: 11,
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please select exactly one PDF file to convert to Word.',
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

  OptionsComponent: PdfToWordOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<PdfToWordOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    onProgress({ progress: 10, statusText: 'Initializing PDF text parser...' });
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');

    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/pdf.worker.min.js`;
    }

    onProgress({ progress: 20, statusText: 'Reading document...' });
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

    const docxChildren: Paragraph[] = [];

    // Optional user title or document header
    const titleText = options.documentTitle.trim() || file.name.replace(/\.[^/.]+$/, '');
    docxChildren.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: titleText,
            bold: true,
            size: (options.fontSize + 8) * 2, // docx uses half-points
            color: '1E293B',
          }),
        ],
      })
    );

    // Process each page and extract formatted lines
    for (let pageIdx = 1; pageIdx <= numPages; pageIdx++) {
      if (signal?.aborted) {
        throw new Error('Conversion cancelled by user.');
      }

      const percent = Math.round(25 + (pageIdx / numPages) * 55);
      onProgress({
        progress: percent,
        statusText: `Extracting text from page ${pageIdx} of ${numPages}...`,
      });

      const page = await pdfDoc.getPage(pageIdx);
      const textContent = await page.getTextContent();

      // Collect items with coordinates
      const items: TextItemObj[] = [];
      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string' && item.str.trim().length > 0) {
          items.push({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            height: item.height || 10,
          });
        }
      }

      // Sort items by Y descending (top to bottom), then X ascending (left to right)
      items.sort((a, b) => {
        const yDiff = b.y - a.y;
        if (Math.abs(yDiff) > 4) {
          return yDiff;
        }
        return a.x - b.x;
      });

      // Group into lines by Y proximity
      const lines: string[] = [];
      let currentLine = '';
      let lastY: number | null = null;

      for (const item of items) {
        if (lastY === null || Math.abs(item.y - lastY) <= 5) {
          currentLine = currentLine ? `${currentLine} ${item.str}` : item.str;
        } else {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = item.str;
        }
        lastY = item.y;
      }

      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      // Add paragraphs for this page
      for (const line of lines) {
        docxChildren.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: line,
                size: options.fontSize * 2,
                color: '334155',
              }),
            ],
          })
        );
      }

      // If preserve page breaks and not last page, insert page break
      if (options.includePageBreaks && pageIdx < numPages) {
        docxChildren.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
    }

    onProgress({ progress: 85, statusText: 'Compiling Word (.docx) document...' });

    const doc = new Document({
      title: titleText,
      description: 'Converted from PDF with Toolnova',
      sections: [
        {
          properties: {},
          children: docxChildren,
        },
      ],
    });

    const docxBlob = await Packer.toBlob(doc);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}-converted-${dateStamp}.docx`;

    onProgress({ progress: 100, statusText: 'Document converted successfully!' });

    return {
      blob: docxBlob,
      fileName,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: docxBlob.size,
    };
  },
};

