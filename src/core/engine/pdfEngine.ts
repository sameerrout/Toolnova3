import { PDFDocument } from 'pdf-lib';
import { normalizeImageForPdf } from '@/core/engine/imageProcessor';
import { ProcessingProgress } from '@/core/types/tool';

export type PageSizeOption = 'fit' | 'a4' | 'letter' | 'legal';
export type PageOrientationOption = 'auto' | 'portrait' | 'landscape';
export type MarginOption = 'none' | 'small' | 'medium' | 'large';
export type ImageFitOption = 'fit' | 'fill';

export interface ImageToPdfOptions {
  pageSize: PageSizeOption;
  orientation: PageOrientationOption;
  margin: MarginOption;
  imageFit: ImageFitOption;
  quality: number; // 0.1 to 1.0
}

const PAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.0, height: 792.0 },
  legal: { width: 612.0, height: 1008.0 },
};

const MARGIN_VALUES: Record<MarginOption, number> = {
  none: 0,
  small: 20,
  medium: 36,
  large: 54,
};

export async function generatePdfFromImages(
  files: File[],
  options: ImageToPdfOptions,
  onProgress: (p: ProcessingProgress) => void,
  signal?: AbortSignal
): Promise<Blob> {
  if (files.length === 0) {
    throw new Error('No image files provided for PDF conversion.');
  }

  // 1. Initialize PDFDocument
  onProgress({ progress: 10, statusText: 'Initializing PDF document...' });
  const pdfDoc = await PDFDocument.create();

  const total = files.length;
  const margin = MARGIN_VALUES[options.margin] || 0;

  // 2. Process each image sequentially with progress updates
  for (let i = 0; i < total; i++) {
    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    const file = files[i];
    const percent = Math.round(15 + (i / total) * 75);
    onProgress({
      progress: percent,
      statusText: `Processing image ${i + 1} of ${total}: ${file.name}`,
      currentStep: `${i + 1}/${total}`,
    });

    // Normalize image to standard bytes via off-thread canvas
    const normalized = await normalizeImageForPdf(file, options.quality);

    // Embed into PDF document
    const embeddedImg = await pdfDoc.embedJpg(normalized.bytes);

    // Determine target page dimensions
    let pageWidth = normalized.width;
    let pageHeight = normalized.height;

    if (options.pageSize !== 'fit') {
      const standard = PAGE_DIMENSIONS[options.pageSize] || PAGE_DIMENSIONS.a4;
      let targetW = standard.width;
      let targetH = standard.height;

      // Determine orientation
      let isLandscape = false;
      if (options.orientation === 'auto') {
        isLandscape = normalized.width > normalized.height;
      } else if (options.orientation === 'landscape') {
        isLandscape = true;
      }

      if (isLandscape) {
        pageWidth = Math.max(targetW, targetH);
        pageHeight = Math.min(targetW, targetH);
      } else {
        pageWidth = Math.min(targetW, targetH);
        pageHeight = Math.max(targetW, targetH);
      }
    }

    // Add page to PDF
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate printable area after margins
    const printableW = Math.max(10, pageWidth - margin * 2);
    const printableH = Math.max(10, pageHeight - margin * 2);

    let drawWidth = printableW;
    let drawHeight = printableH;
    let drawX = margin;
    let drawY = margin;

    if (options.pageSize === 'fit' || options.imageFit === 'fill') {
      if (options.pageSize === 'fit') {
        drawWidth = pageWidth;
        drawHeight = pageHeight;
        drawX = 0;
        drawY = 0;
      } else {
        drawWidth = printableW;
        drawHeight = printableH;
      }
    } else {
      // Proportionally scale to fit inside printable box (contain)
      const scale = Math.min(
        printableW / normalized.width,
        printableH / normalized.height
      );
      drawWidth = normalized.width * scale;
      drawHeight = normalized.height * scale;

      // Center the image inside the printable area
      drawX = margin + (printableW - drawWidth) / 2;
      drawY = margin + (printableH - drawHeight) / 2;
    }

    page.drawImage(embeddedImg, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  // 3. Finalize and assemble PDF bytes
  if (signal?.aborted) {
    throw new Error('Processing cancelled by user.');
  }

  onProgress({ progress: 95, statusText: 'Compiling final PDF document...' });
  const pdfBytes = await pdfDoc.save();

  onProgress({ progress: 100, statusText: 'PDF generation complete!' });
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}
