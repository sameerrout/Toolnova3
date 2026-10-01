/**
 * Toolino Image to Text (OCR) Engine
 * 100% Client-Side In-Browser Optical Character Recognition
 */

import { Document, Paragraph, TextRun, Packer } from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface OcrLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_OCR_LANGUAGES: OcrLanguage[] = [
  { code: 'eng', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'spa', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fra', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'deu', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ita', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'por', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'hin', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'chi_sim', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'chi_tra', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'jpn', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'kor', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'rus', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ara', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'nld', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pol', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'tur', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];

export interface OcrProgress {
  status: string;
  progress: number; // 0 to 100
}

export interface OcrResult {
  text: string;
  confidence: number; // 0 to 100
  wordsCount: number;
  charactersCount: number;
  linesCount: number;
}

export interface PreprocessOptions {
  grayscale: boolean;
  enhanceContrast: boolean;
  binarize: boolean; // High-contrast black & white for documents
  threshold: number; // 0 to 255
  invert: boolean; // Invert colors for dark mode images
}

/**
 * Loads the Tesseract.js script dynamically in the browser
 */
export async function loadTesseract(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Tesseract OCR engine can only run in a browser environment');
  }

  if ((window as any).Tesseract) {
    return (window as any).Tesseract;
  }

  return new Promise((resolve, reject) => {
    // Check if already loading
    const existingScript = document.querySelector('script[src*="tesseract.min.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).Tesseract));
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Tesseract engine')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).Tesseract) {
        resolve((window as any).Tesseract);
      } else {
        reject(new Error('Tesseract script loaded but window.Tesseract not found'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load Tesseract.js from CDN. Please check your internet connection.'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Preprocesses image on an HTML5 canvas for optimal OCR accuracy
 */
export function preprocessCanvas(
  sourceCanvas: HTMLCanvasElement,
  options: PreprocessOptions
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);

  if (!options.grayscale && !options.enhanceContrast && !options.binarize && !options.invert) {
    return canvas;
  }

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const threshold = options.threshold || 128;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Grayscale luminance
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Enhance contrast
    if (options.enhanceContrast) {
      gray = (gray - 128) * 1.4 + 128;
      gray = Math.max(0, Math.min(255, gray));
    }

    // Binarize
    if (options.binarize) {
      gray = gray >= threshold ? 255 : 0;
    }

    // Invert
    if (options.invert) {
      gray = 255 - gray;
    }

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Main OCR recognition runner
 */
export async function recognizeTextFromImage(
  imageSource: File | Blob | string | HTMLCanvasElement,
  languageCode: string = 'eng',
  preprocess?: PreprocessOptions,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  onProgress?.({ status: 'Loading OCR Engine...', progress: 10 });

  const Tesseract = await loadTesseract();

  onProgress?.({ status: `Initializing ${languageCode} language model...`, progress: 25 });

  // Prepare input image element or canvas
  let inputCanvas: HTMLCanvasElement;

  if (imageSource instanceof HTMLCanvasElement) {
    inputCanvas = imageSource;
  } else {
    inputCanvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      let objectUrl: string | null = null;

      if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else {
        objectUrl = URL.createObjectURL(imageSource);
        img.src = objectUrl;
      }

      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve(c);
      };
      img.onerror = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image for text recognition'));
      };
    });
  }

  // Preprocess if requested
  const processedCanvas = preprocess
    ? preprocessCanvas(inputCanvas, preprocess)
    : inputCanvas;

  onProgress?.({ status: 'Recognizing text...', progress: 40 });

  // Create Tesseract worker
  const worker = await Tesseract.createWorker(languageCode, 1, {
    logger: (m: any) => {
      if (m.status === 'recognizing text') {
        const p = 40 + Math.round((m.progress || 0) * 55);
        onProgress?.({ status: 'Extracting characters & words...', progress: p });
      } else if (m.status === 'loading language traineddata') {
        const p = 25 + Math.round((m.progress || 0) * 15);
        onProgress?.({ status: 'Downloading language trained data...', progress: p });
      }
    },
  });

  const { data } = await worker.recognize(processedCanvas);
  await worker.terminate();

  onProgress?.({ status: 'Done!', progress: 100 });

  const text = data.text.trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const lines = text ? text.split('\n').filter((l: string) => l.trim().length > 0) : [];

  return {
    text,
    confidence: Math.round(data.confidence || 0),
    wordsCount: words.length,
    charactersCount: text.length,
    linesCount: lines.length,
  };
}

/**
 * Generates a clean Microsoft Word (.docx) document from extracted text
 */
export async function exportToDocx(text: string, title = 'Extracted Text'): Promise<Blob> {
  const paragraphs = text.split('\n').map((line) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          font: 'Arial',
          size: 24, // 12pt
        }),
      ],
      spacing: { after: 120 },
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                font: 'Arial',
                size: 32, // 16pt
              }),
            ],
            spacing: { after: 240 },
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Generates a clean searchable PDF document from extracted text
 */
export async function exportToPdf(text: string, title = 'Extracted Text'): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 11;
  const lineHeight = 16;
  const margin = 50;
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const maxWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Title
  page.drawText(title, {
    x: margin,
    y: y,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 30;

  // Word wrap logic
  const lines = text.split('\n');
  for (const rawLine of lines) {
    const words = rawLine.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (y < margin + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(currentLine, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= lineHeight;
    }

    // Paragraph gap
    y -= 4;
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

/**
 * Exports text as plain text file (.txt)
 */
export function exportToTxt(text: string): Blob {
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}
