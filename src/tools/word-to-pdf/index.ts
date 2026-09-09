import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  WordToPdfOptions,
  WordToPdfOptionsComponent,
} from './WordToPdfOptions';

export const wordToPdfManifest: ToolManifest = {
  id: 'word-to-pdf',
  name: 'Word to PDF',
  category: 'pdf',
  description:
    'Convert Microsoft Word (.docx) files into clean, shareable PDF documents.',
  version: '1.0.0',
  executionMode: 'HYBRID',
  runtime: 'browser',
  inputFormats: ['DOC', 'DOCX'],
  outputFormats: ['PDF'],
  permissions: {
    readInputFiles: true,
    writeOutputFiles: true,
    networkAccess: false,
    accessOtherFiles: false,
  },
  capabilities: [
    'DOCX_PARSING',
    'PDF_LAYOUT_ENGINE',
    'AUTO_PAGINATION',
    'WORD_WRAPPING',
    'CLIENT_SIDE_ONLY',
  ],
  limits: {
    maxFiles: 1,
    maxFileSizeMb: 50,
    maxTotalSizeMb: 50,
    allowedMimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ],
  },
  offlineSupport: true,
};

// Word wrapping helper for pdf-lib standard fonts
function wrapText(
  text: string,
  maxWidth: number,
  font: any,
  fontSize: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export const wordToPdfTool: IToolDefinition<WordToPdfOptions> = {
  manifest: wordToPdfManifest,
  defaultOptions: {
    pageSize: 'a4',
    fontSize: 11,
    lineSpacing: 1.4,
    margin: 50,
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please select exactly one Word (.docx) file to convert.',
      };
    }
    const name = files[0].name.toLowerCase();
    if (!name.endsWith('.docx') && !name.endsWith('.doc')) {
      return {
        valid: false,
        error: 'Please select a valid Word document (.docx or .doc).',
      };
    }
    return { valid: true };
  },

  OptionsComponent: WordToPdfOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<WordToPdfOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    onProgress({ progress: 15, statusText: 'Parsing Word document structure...' });
    const buffer = await file.arrayBuffer();

    if (signal?.aborted) {
      throw new Error('Conversion cancelled by user.');
    }

    // Extract text content using mammoth
    const extractResult = await mammoth.extractRawText({ arrayBuffer: buffer });
    const rawText = extractResult.value || '';

    if (!rawText.trim()) {
      throw new Error(
        'The selected Word document does not contain readable text or is empty.'
      );
    }

    onProgress({ progress: 40, statusText: 'Initializing PDF layout engine...' });
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page dimensions
    const [pageWidth, pageHeight] =
      options.pageSize === 'letter'
        ? [612, 792]
        : [595.28, 841.89]; // A4 default

    const margin = options.margin;
    const contentWidth = pageWidth - 2 * margin;
    const lineHeight = options.fontSize * options.lineSpacing;

    const paragraphs = rawText.split(/\r?\n+/);
    const wrappedLines: { text: string; isBlank?: boolean }[] = [];

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) {
        wrappedLines.push({ text: '', isBlank: true });
        continue;
      }
      const lines = wrapText(trimmed, contentWidth, font, options.fontSize);
      for (const l of lines) {
        wrappedLines.push({ text: l });
      }
    }

    onProgress({ progress: 60, statusText: 'Laying out PDF pages...' });

    // Distribute lines across pages
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin - 20;

    // Draw document title on first page
    const title = file.name.replace(/\.[^/.]+$/, '');
    currentPage.drawText(title, {
      x: margin,
      y: currentY,
      size: options.fontSize + 4,
      font: boldFont,
      color: rgb(0.1, 0.15, 0.25),
    });
    currentY -= lineHeight * 1.8;

    for (const lineObj of wrappedLines) {
      if (signal?.aborted) {
        throw new Error('Conversion cancelled by user.');
      }

      if (lineObj.isBlank) {
        currentY -= lineHeight * 0.6;
        continue;
      }

      // Check if we need a new page
      if (currentY - lineHeight < margin + 30) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }

      currentPage.drawText(lineObj.text, {
        x: margin,
        y: currentY,
        size: options.fontSize,
        font,
        color: rgb(0.2, 0.25, 0.3),
      });

      currentY -= lineHeight;
    }

    onProgress({ progress: 85, statusText: 'Applying page headers and footers...' });

    // Add footer page numbers to all pages
    const totalPages = pdfDoc.getPageCount();
    const pages = pdfDoc.getPages();
    for (let i = 0; i < totalPages; i++) {
      const p = pages[i];
      const footerText = `Page ${i + 1} of ${totalPages}`;
      const footerWidth = font.widthOfTextAtSize(footerText, 9);
      p.drawText(footerText, {
        x: (pageWidth - footerWidth) / 2,
        y: margin / 2,
        size: 9,
        font,
        color: rgb(0.5, 0.55, 0.6),
      });
    }

    onProgress({ progress: 95, statusText: 'Finalizing PDF output...' });
    const pdfBytes = await pdfDoc.save();

    const finalBlob = new Blob([pdfBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}-converted-${dateStamp}.pdf`;

    onProgress({ progress: 100, statusText: 'Conversion complete!' });

    return {
      blob: finalBlob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: finalBlob.size,
    };
  },
};

