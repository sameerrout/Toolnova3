import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  PowerpointToPdfOptions,
  PowerpointToPdfOptionsComponent,
} from './PowerpointToPdfOptions';

export const powerpointToPdfManifest: ToolManifest = {
  id: 'powerpoint-to-pdf',
  name: 'PowerPoint to PDF',
  category: 'pdf',
  description:
    'Convert PowerPoint (.pptx) presentations into high-quality PDF slide documents.',
  version: '1.0.0',
  executionMode: 'HYBRID',
  runtime: 'browser',
  inputFormats: ['PPT', 'PPTX'],
  outputFormats: ['PDF'],
  permissions: {
    readInputFiles: true,
    writeOutputFiles: true,
    networkAccess: false,
    accessOtherFiles: false,
  },
  capabilities: [
    'PPTX_EXTRACTION',
    'SLIDE_XML_PARSING',
    'PRESENTATION_PDF_LAYOUT',
    'THEME_STYLING',
    'CLIENT_SIDE_ONLY',
  ],
  limits: {
    maxFiles: 1,
    maxFileSizeMb: 50,
    maxTotalSizeMb: 50,
    allowedMimeTypes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
    ],
  },
  offlineSupport: true,
};

interface ParsedSlide {
  slideNumber: number;
  title: string;
  bodyLines: string[];
}

function parseSlideXml(xmlContent: string, slideNumber: number): ParsedSlide {
  // Regex match paragraphs <a:p>...</a:p>
  const paraMatches = Array.from(xmlContent.matchAll(/<a:p[\s>](.*?)<\/a:p>/gs));
  const lines: string[] = [];

  for (const paraMatch of paraMatches) {
    const paraXml = paraMatch[1];
    // Match text elements <a:t>...</a:t>
    const textMatches = Array.from(paraXml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/g));
    const combined = textMatches.map((m) => m[1]).join('').trim();
    if (combined) {
      lines.push(combined);
    }
  }

  const title = lines.length > 0 ? lines[0] : `Slide ${slideNumber}`;
  const bodyLines = lines.length > 1 ? lines.slice(1) : [];

  return {
    slideNumber,
    title,
    bodyLines,
  };
}

export const powerpointToPdfTool: IToolDefinition<PowerpointToPdfOptions> = {
  manifest: powerpointToPdfManifest,
  defaultOptions: {
    orientation: 'landscape',
    theme: 'light',
    includeSlideNumbers: true,
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please select exactly one PowerPoint (.pptx) file to convert.',
      };
    }
    const name = files[0].name.toLowerCase();
    if (!name.endsWith('.pptx') && !name.endsWith('.ppt')) {
      return {
        valid: false,
        error: 'Please select a valid PowerPoint presentation (.pptx or .ppt).',
      };
    }
    return { valid: true };
  },

  OptionsComponent: PowerpointToPdfOptionsComponent,

  process: async ({
    files,
    options,
    onProgress,
    signal,
  }: ToolProcessParams<PowerpointToPdfOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;

    onProgress({ progress: 15, statusText: 'Unpacking PowerPoint presentation package...' });
    const buffer = await file.arrayBuffer();

    if (signal?.aborted) {
      throw new Error('Conversion cancelled by user.');
    }

    const zip = await JSZip.loadAsync(buffer);

    // Find all slide XML files in ppt/slides/slide*.xml
    const slideFileNames = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

    if (slideFileNames.length === 0) {
      throw new Error('No readable slides were found in the PowerPoint document.');
    }

    const parsedSlides: ParsedSlide[] = [];
    for (let i = 0; i < slideFileNames.length; i++) {
      const fileName = slideFileNames[i];
      const xml = await zip.files[fileName].async('text');
      parsedSlides.push(parseSlideXml(xml, i + 1));
    }

    onProgress({ progress: 45, statusText: 'Initializing PDF presentation engine...' });
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page dimensions
    const [pageWidth, pageHeight] =
      options.orientation === 'portrait'
        ? [595.28, 841.89] // A4 portrait
        : [841.89, 595.28]; // A4 landscape

    const isDark = options.theme === 'dark';
    const bgColor = isDark ? rgb(0.09, 0.12, 0.18) : rgb(0.98, 0.99, 1.0);
    const titleColor = isDark ? rgb(0.95, 0.96, 0.98) : rgb(0.1, 0.15, 0.28);
    const bodyColor = isDark ? rgb(0.8, 0.85, 0.9) : rgb(0.25, 0.3, 0.4);
    const accentColor = isDark ? rgb(0.25, 0.5, 0.95) : rgb(0.15, 0.4, 0.9);
    const subtleColor = isDark ? rgb(0.45, 0.5, 0.6) : rgb(0.6, 0.65, 0.7);

    const totalSlides = parsedSlides.length;

    for (let idx = 0; idx < totalSlides; idx++) {
      if (signal?.aborted) {
        throw new Error('Conversion cancelled by user.');
      }

      const percent = Math.round(50 + ((idx + 1) / totalSlides) * 40);
      onProgress({
        progress: percent,
        statusText: `Generating slide page ${idx + 1} of ${totalSlides}...`,
      });

      const slideData = parsedSlides[idx];
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Fill background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: bgColor,
      });

      // Draw top accent banner
      page.drawRectangle({
        x: 0,
        y: pageHeight - 6,
        width: pageWidth,
        height: 6,
        color: accentColor,
      });

      // Presentation & slide indicator header
      const deckName = file.name.replace(/\.[^/.]+$/, '');
      page.drawText(deckName.toUpperCase(), {
        x: 40,
        y: pageHeight - 40,
        size: 9,
        font: boldFont,
        color: accentColor,
      });

      // Slide Title
      let titleY = pageHeight - 85;
      const titleLines = slideData.title.split('\n');
      for (const tLine of titleLines) {
        page.drawText(tLine, {
          x: 40,
          y: titleY,
          size: 22,
          font: boldFont,
          color: titleColor,
        });
        titleY -= 28;
      }

      // Divider line below title
      page.drawLine({
        start: { x: 40, y: titleY + 10 },
        end: { x: pageWidth - 40, y: titleY + 10 },
        thickness: 1,
        color: isDark ? rgb(0.2, 0.25, 0.35) : rgb(0.88, 0.9, 0.94),
      });

      // Body lines / bullet points
      let bodyY = titleY - 25;
      const maxLines = Math.floor((bodyY - 60) / 24);

      for (let lineIdx = 0; lineIdx < Math.min(slideData.bodyLines.length, maxLines); lineIdx++) {
        const text = slideData.bodyLines[lineIdx];

        // Draw bullet point
        page.drawCircle({
          x: 48,
          y: bodyY + 4,
          size: 3,
          color: accentColor,
        });

        // Draw bullet text
        page.drawText(text, {
          x: 62,
          y: bodyY,
          size: 13,
          font,
          color: bodyColor,
        });

        bodyY -= 24;
      }

      // Slide number footer
      if (options.includeSlideNumbers) {
        const slideFooter = `Slide ${idx + 1} of ${totalSlides}`;
        const strWidth = font.widthOfTextAtSize(slideFooter, 9);
        page.drawText(slideFooter, {
          x: pageWidth - 40 - strWidth,
          y: 25,
          size: 9,
          font,
          color: subtleColor,
        });
      }

      // Toolnova branding in bottom left
      page.drawText('TOOLNOVA DOCUMENT PLATFORM', {
        x: 40,
        y: 25,
        size: 8,
        font,
        color: subtleColor,
      });
    }

    onProgress({ progress: 95, statusText: 'Finalizing PDF slide deck...' });
    const pdfBytes = await pdfDoc.save();

    const finalBlob = new Blob([pdfBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}-slides-${dateStamp}.pdf`;

    onProgress({ progress: 100, statusText: 'Slide conversion complete!' });

    return {
      blob: finalBlob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: finalBlob.size,
    };
  },
};

