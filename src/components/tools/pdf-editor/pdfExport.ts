import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import {
  EditorPage,
  WatermarkConfig,
  HeaderFooterConfig,
  PageNumberConfig,
  PageSetupConfig,
  TextElement,
  ImageElement,
  HighlightElement,
} from './types';

// Convert hex color (#RRGGBB) to pdf-lib rgb
export function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
    const g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
    const b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
    return rgb(r, g, b);
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

// Convert data URL (SVG or PNG) to PNG ArrayBuffer via browser canvas
async function rasterizeImage(src: string): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 500;
      canvas.height = img.naturalHeight || 340;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(new Uint8Array(reader.result));
          } else {
            resolve(null);
          }
        };
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generateEditedPdf({
  pages,
  originalPdfBuffer,
  watermark,
  headerFooter,
  pageNumbers,
  pageSetup,
  password,
}: {
  pages: EditorPage[];
  originalPdfBuffer?: ArrayBuffer | null;
  watermark?: WatermarkConfig;
  headerFooter?: HeaderFooterConfig;
  pageNumbers?: PageNumberConfig;
  pageSetup?: PageSetupConfig;
  password?: string;
}): Promise<Uint8Array> {
  let pdfDoc: PDFDocument;

  // Standard A4 width and height in points
  const pageWidth = pageSetup?.orientation === 'landscape' ? 841.89 : 595.28;
  const pageHeight = pageSetup?.orientation === 'landscape' ? 595.28 : 841.89;

  let srcDoc: PDFDocument | null = null;
  if (originalPdfBuffer) {
    srcDoc = await PDFDocument.load(originalPdfBuffer);
    pdfDoc = await PDFDocument.create();
  } else {
    pdfDoc = await PDFDocument.create();
  }

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  for (let i = 0; i < pages.length; i++) {
    const editorPage = pages[i];
    let pdfPage;

    if (
      srcDoc &&
      editorPage.sourcePageIndex !== undefined &&
      editorPage.sourcePageIndex < srcDoc.getPageCount()
    ) {
      const [copiedPage] = await pdfDoc.copyPages(srcDoc, [editorPage.sourcePageIndex]);
      pdfPage = pdfDoc.addPage(copiedPage);
    } else {
      pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
    }

    // Set page rotation if changed
    if (editorPage.rotation) {
      pdfPage.setRotation(degrees(editorPage.rotation % 360));
    }

    const { width, height } = pdfPage.getSize();
    // Scale factor from editor canvas (600px width baseline)
    const canvasWidth = editorPage.canvasWidth || 600;
    const canvasHeight =
      editorPage.canvasHeight ||
      (editorPage.height && editorPage.width
        ? (canvasWidth / editorPage.width) * editorPage.height
        : (height / width) * canvasWidth);
    const scaleX = width / canvasWidth;
    const scaleY = height / canvasHeight;

    // If default proposal template, draw background template elements
    if (!originalPdfBuffer) {
      if (editorPage.customTemplateType === 'proposal') {
        // Draw Header
        pdfPage.drawText('Toolino', {
          x: 42 * scaleX,
          y: height - 45 * scaleY,
          size: 11,
          font: fontBold,
          color: rgb(0.2, 0.25, 0.35),
        });
        pdfPage.drawText('September 28, 2025', {
          x: (width - 150) * scaleX,
          y: height - 45 * scaleY,
          size: 9,
          font: fontRegular,
          color: rgb(0.4, 0.45, 0.55),
        });

        // Draw Big Title
        pdfPage.drawText('Project Proposal', {
          x: 42 * scaleX,
          y: height - 105 * scaleY,
          size: 32,
          font: fontBold,
          color: rgb(0.08, 0.18, 0.4),
        });
        pdfPage.drawText('Building a smarter, simpler way to work.', {
          x: 42 * scaleX,
          y: height - 128 * scaleY,
          size: 14,
          font: fontRegular,
          color: rgb(0.3, 0.4, 0.5),
        });

        // "Our Features" Heading
        pdfPage.drawText('Our Features', {
          x: 42 * scaleX,
          y: height - 380 * scaleY,
          size: 16,
          font: fontBold,
          color: rgb(0.1, 0.15, 0.25),
        });

        // 4 Feature Category Cards
        // 1. PDF Tools
        pdfPage.drawRectangle({
          x: 42 * scaleX,
          y: height - 490 * scaleY,
          width: 245 * scaleX,
          height: 95 * scaleY,
          color: rgb(0.98, 0.98, 1),
          borderColor: rgb(0.9, 0.93, 0.98),
          borderWidth: 1,
        });
        pdfPage.drawText('PDF Tools', {
          x: 82 * scaleX,
          y: height - 425 * scaleY,
          size: 12,
          font: fontBold,
          color: rgb(0.1, 0.15, 0.25),
        });
        pdfPage.drawText('• Edit PDF\n• Merge / Split PDF\n• Compress PDF', {
          x: 82 * scaleX,
          y: height - 475 * scaleY,
          size: 9,
          font: fontRegular,
          lineHeight: 14,
          color: rgb(0.35, 0.4, 0.5),
        });

        // 2. Image Tools
        pdfPage.drawRectangle({
          x: 305 * scaleX,
          y: height - 490 * scaleY,
          width: 245 * scaleX,
          height: 95 * scaleY,
          color: rgb(0.97, 1, 0.98),
          borderColor: rgb(0.88, 0.96, 0.92),
          borderWidth: 1,
        });
        pdfPage.drawText('Image Tools', {
          x: 345 * scaleX,
          y: height - 425 * scaleY,
          size: 12,
          font: fontBold,
          color: rgb(0.1, 0.15, 0.25),
        });
        pdfPage.drawText('• Image Compressor\n• Resize & Convert\n• Background Remover', {
          x: 345 * scaleX,
          y: height - 475 * scaleY,
          size: 9,
          font: fontRegular,
          lineHeight: 14,
          color: rgb(0.35, 0.4, 0.5),
        });

        // 3. Calculators
        pdfPage.drawRectangle({
          x: 42 * scaleX,
          y: height - 605 * scaleY,
          width: 245 * scaleX,
          height: 95 * scaleY,
          color: rgb(0.99, 0.98, 1),
          borderColor: rgb(0.93, 0.9, 0.98),
          borderWidth: 1,
        });
        pdfPage.drawText('Calculators', {
          x: 82 * scaleX,
          y: height - 540 * scaleY,
          size: 12,
          font: fontBold,
          color: rgb(0.1, 0.15, 0.25),
        });
        pdfPage.drawText('• Percentage Calculator\n• CGPA Calculator\n• EMI Calculator', {
          x: 82 * scaleX,
          y: height - 590 * scaleY,
          size: 9,
          font: fontRegular,
          lineHeight: 14,
          color: rgb(0.35, 0.4, 0.5),
        });

        // 4. Developer Tools
        pdfPage.drawRectangle({
          x: 305 * scaleX,
          y: height - 605 * scaleY,
          width: 245 * scaleX,
          height: 95 * scaleY,
          color: rgb(0.97, 0.98, 1),
          borderColor: rgb(0.88, 0.92, 0.99),
          borderWidth: 1,
        });
        pdfPage.drawText('Developer Tools', {
          x: 345 * scaleX,
          y: height - 540 * scaleY,
          size: 12,
          font: fontBold,
          color: rgb(0.1, 0.15, 0.25),
        });
        pdfPage.drawText('• JSON Formatter\n• Base64 Encoder\n• URL Encoder', {
          x: 345 * scaleX,
          y: height - 590 * scaleY,
          size: 9,
          font: fontRegular,
          lineHeight: 14,
          color: rgb(0.35, 0.4, 0.5),
        });

        // Quote Box
        pdfPage.drawRectangle({
          x: 42 * scaleX,
          y: height - 685 * scaleY,
          width: 508 * scaleX,
          height: 55 * scaleY,
          color: rgb(0.95, 0.97, 1),
          borderColor: rgb(0.85, 0.9, 0.98),
          borderWidth: 1,
        });
        pdfPage.drawText(
          'More than just tools — Toolino is your all-in-one\nsolution for everyday digital tasks.',
          {
            x: 75 * scaleX,
            y: height - 655 * scaleY,
            size: 10,
            font: fontItalic,
            lineHeight: 15,
            color: rgb(0.15, 0.25, 0.4),
          }
        );

        // Footer
        pdfPage.drawText('Toolino', {
          x: 42 * scaleX,
          y: 35 * scaleY,
          size: 9,
          font: fontRegular,
          color: rgb(0.5, 0.55, 0.6),
        });
        pdfPage.drawText('www.toolnova.com', {
          x: (width - 130) * scaleX,
          y: 35 * scaleY,
          size: 9,
          font: fontRegular,
          color: rgb(0.5, 0.55, 0.6),
        });
      } else if (editorPage.customTemplateType === 'summary') {
        pdfPage.drawText('Executive Summary & Objectives', {
          x: 42 * scaleX,
          y: height - 100 * scaleY,
          size: 24,
          font: fontBold,
          color: rgb(0.08, 0.18, 0.4),
        });
        pdfPage.drawText(
          'Toolino delivers an advanced suite of high-performance client-side browser utilities designed to empower creators, developers, and office professionals.\n\nKey Strategic Pillars:\n1. Zero Server Uploads: Complete privacy and data confidentiality.\n2. Instant Execution: Hardware-accelerated processing in the browser.\n3. Modern Unified User Experience: Clean, accessible, intuitive interfaces.',
          {
            x: 42 * scaleX,
            y: height - 160 * scaleY,
            size: 11,
            font: fontRegular,
            lineHeight: 18,
            color: rgb(0.2, 0.25, 0.35),
          }
        );
      } else if (editorPage.customTemplateType === 'metrics') {
        pdfPage.drawText('Market Impact & Adoption Metrics', {
          x: 42 * scaleX,
          y: height - 100 * scaleY,
          size: 24,
          font: fontBold,
          color: rgb(0.08, 0.18, 0.4),
        });
        pdfPage.drawText(
          'User benchmarks showcase up to 10x faster processing times compared to traditional server-bound web utilities. Zero bandwidth bottlenecks ensure instant document exports and maximum uptime.',
          {
            x: 42 * scaleX,
            y: height - 150 * scaleY,
            size: 11,
            font: fontRegular,
            lineHeight: 17,
            color: rgb(0.2, 0.25, 0.35),
          }
        );
      } else if (editorPage.customTemplateType === 'roadmap') {
        pdfPage.drawText('Technical Specifications & Roadmap', {
          x: 42 * scaleX,
          y: height - 100 * scaleY,
          size: 24,
          font: fontBold,
          color: rgb(0.08, 0.18, 0.4),
        });
        pdfPage.drawText(
          'Timeline & Milestones:\n• Phase 1: Client-side PDF engine integration and full annotation support.\n• Phase 2: Offline PWA capability and local caching.\n• Phase 3: AI-assisted text extraction and OCR integration.',
          {
            x: 42 * scaleX,
            y: height - 150 * scaleY,
            size: 11,
            font: fontRegular,
            lineHeight: 18,
            color: rgb(0.2, 0.25, 0.35),
          }
        );
      } else if (editorPage.customTemplateType === 'thankyou') {
        pdfPage.drawText('Thank You', {
          x: 42 * scaleX,
          y: height - 100 * scaleY,
          size: 30,
          font: fontBold,
          color: rgb(0.08, 0.18, 0.4),
        });
        pdfPage.drawText(
          'Thank you for choosing Toolino. We are dedicated to providing the most reliable and secure web utilities on the internet.\n\nWebsite: https://www.toolnova.com\nSupport: support@toolnova.com',
          {
            x: 42 * scaleX,
            y: height - 160 * scaleY,
            size: 12,
            font: fontRegular,
            lineHeight: 20,
            color: rgb(0.2, 0.25, 0.35),
          }
        );
      }
    }

    // Draw user elements (Text, Images, Highlights, Forms)
    for (const elem of editorPage.elements) {
      if (elem.type === 'text') {
        const textElem = elem as TextElement;
        const font = textElem.bold
          ? fontBold
          : textElem.italic
          ? fontItalic
          : fontRegular;
        const pdfY = height - (textElem.y + textElem.fontSize) * scaleY;
        const pdfX = textElem.x * scaleX;
        const textColor = hexToRgb(textElem.color || '#1e293b');

        // Split by lines if contains newlines or wrap
        const lines = textElem.text.split('\n');
        let currentY = pdfY;
        for (const line of lines) {
          pdfPage.drawText(line, {
            x: pdfX,
            y: currentY,
            size: textElem.fontSize * scaleY,
            font,
            color: textColor,
          });
          currentY -= (textElem.fontSize + 4) * scaleY;
        }
      } else if (elem.type === 'image') {
        const imgElem = elem as ImageElement;
        try {
          const imgBytes = await rasterizeImage(imgElem.src);
          if (imgBytes) {
            const embeddedImg = await pdfDoc.embedPng(imgBytes);
            const pdfY = height - (imgElem.y + imgElem.height) * scaleY;
            pdfPage.drawImage(embeddedImg, {
              x: imgElem.x * scaleX,
              y: pdfY,
              width: imgElem.width * scaleX,
              height: imgElem.height * scaleY,
            });
          }
        } catch (e) {
          console.warn('Failed embedding image to PDF:', e);
        }
      } else if (elem.type === 'highlight') {
        const hl = elem as any;
        const pdfY = height - (hl.y + hl.height) * scaleY;
        const color = hexToRgb(hl.color || '#fef08a');
        pdfPage.drawRectangle({
          x: hl.x * scaleX,
          y: pdfY,
          width: hl.width * scaleX,
          height: hl.height * scaleY,
          color,
          opacity: hl.opacity || 0.4,
        });
      }
    }

    // Draw user pen drawings
    for (const drawing of editorPage.drawings) {
      if (drawing.points.length < 2) continue;
      const strokeColor = hexToRgb(drawing.color || '#2563eb');
      for (let p = 0; p < drawing.points.length - 1; p++) {
        const p1 = drawing.points[p];
        const p2 = drawing.points[p + 1];
        pdfPage.drawLine({
          start: { x: p1.x * scaleX, y: height - p1.y * scaleY },
          end: { x: p2.x * scaleX, y: height - p2.y * scaleY },
          thickness: (drawing.width || 2) * scaleX,
          color: strokeColor,
        });
      }
    }

    // Draw Watermark if active
    if (watermark && watermark.enabled && watermark.text.trim()) {
      const wmColor = hexToRgb(watermark.color || '#94a3b8');
      const angle = watermark.rotation ? degrees(watermark.rotation) : degrees(-45);
      pdfPage.drawText(watermark.text, {
        x: width / 4,
        y: height / 2,
        size: watermark.fontSize || 42,
        font: fontBold,
        color: wmColor,
        opacity: watermark.opacity || 0.25,
        rotate: angle,
      });
    }

    // Draw Header & Footer if active
    if (headerFooter && headerFooter.enabled) {
      if (headerFooter.headerText) {
        pdfPage.drawText(headerFooter.headerText, {
          x: 42 * scaleX,
          y: height - 25 * scaleY,
          size: 9,
          font: fontRegular,
          color: rgb(0.5, 0.55, 0.6),
        });
      }
      if (headerFooter.footerText) {
        pdfPage.drawText(headerFooter.footerText, {
          x: 42 * scaleX,
          y: 20 * scaleY,
          size: 9,
          font: fontRegular,
          color: rgb(0.5, 0.55, 0.6),
        });
      }
    }

    // Draw Page Numbers if active
    if (pageNumbers && pageNumbers.enabled) {
      const curPageNum = i + 1;
      const totalNum = pages.length;
      let text = `${curPageNum}`;
      if (pageNumbers.format === 'page-x-of-y') text = `Page ${curPageNum} of ${totalNum}`;
      else if (pageNumbers.format === 'x-of-y') text = `${curPageNum} / ${totalNum}`;
      else if (pageNumbers.format === 'page-x') text = `Page ${curPageNum}`;

      const font = fontRegular;
      const textWidth = font.widthOfTextAtSize(text, pageNumbers.fontSize || 10);
      let posX = width - 42 * scaleX - textWidth;
      let posY = 20 * scaleY;

      if (pageNumbers.position === 'bottom-center') {
        posX = (width - textWidth) / 2;
      } else if (pageNumbers.position === 'bottom-left') {
        posX = 42 * scaleX;
      } else if (pageNumbers.position === 'top-right') {
        posY = height - 25 * scaleY;
      }

      pdfPage.drawText(text, {
        x: posX,
        y: posY,
        size: pageNumbers.fontSize || 10,
        font,
        color: hexToRgb(pageNumbers.color || '#64748b'),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
