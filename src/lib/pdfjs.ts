/**
 * pdf.js loader with a locally bundled worker.
 *
 * The worker is resolved through the bundler (`new URL(..., import.meta.url)`),
 * so pdf.js is served from the same origin as the rest of the site. Nothing is
 * fetched from a CDN - which matters both for privacy and because a
 * Content-Security-Policy with no third-party `script-src` would otherwise block
 * rendering entirely.
 *
 * `pdfjs-dist` is roughly 350 KB gzipped, so it is only ever reached through
 * this module, and this module is only imported by the tools that actually
 * render pages (PDF to Image, Organise PDF, Edit PDF, Split PDF previews).
 */

import { AppError } from './errors';

type PdfJsModule = typeof import('pdfjs-dist');

let pdfjsPromise: Promise<PdfJsModule> | null = null;

/**
 * Loads pdf.js once per page and configures its worker.
 *
 * Safe to call concurrently: the first call wins and the promise is memoized.
 */
export async function getPdfjs(): Promise<PdfJsModule> {
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = (async () => {
    const pdfjs = await import('pdfjs-dist');

    // A module worker keeps the main thread free while pages rasterise.
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    return pdfjs;
  })();

  return pdfjsPromise;
}

export type PdfDocumentProxy = Awaited<
  ReturnType<PdfJsModule['getDocument']>['promise']
>;

/**
 * Opens a PDF for rendering.
 *
 * The caller **must** call {@link destroyPdfDocument} in a `finally` block. A
 * leaked `PDFDocumentProxy` holds the entire (potentially very large) parsed
 * document in memory, which is the most common cause of a browser tab becoming
 * unusable after several conversions.
 */
export async function openPdfDocument(data: ArrayBuffer | Uint8Array): Promise<PdfDocumentProxy> {
  const pdfjs = await getPdfjs();
  try {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    // `data` is transferred into the worker, so hand over a copy of the buffer
    // rather than the caller's ArrayBuffer, which they may still need.
    return await pdfjs.getDocument({
      data: bytes.slice(),
      // Fonts referenced by the PDF are drawn with the browser's own font
      // renderer rather than being downloaded, so nothing is fetched from the
      // network while a document is open.
      useSystemFonts: true,
      disableFontFace: false,
    }).promise;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/password/i.test(message)) {
      throw new AppError('PASSWORD_REQUIRED', 'This PDF is password protected.', {
        hint: 'Remove the password in a PDF reader, then try again. This tool cannot unlock encrypted files.',
      });
    }
    throw new AppError('CORRUPT_FILE', 'This file could not be read as a PDF.', {
      hint: 'The file may be damaged or may not be a PDF at all.',
    });
  }
}

/** Releases a pdf.js document and its worker-side buffers. */
export async function destroyPdfDocument(document: PdfDocumentProxy | null): Promise<void> {
  if (!document) return;
  try {
    await document.destroy();
  } catch {
    // Already destroyed, or the worker was terminated by cancellation.
  }
}

/** A4 at 72 points per inch, the unit PDF uses internally. */
export const PDF_POINTS_PER_INCH = 72;

/** Named page sizes in PDF points (portrait). */
export const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89, label: 'A4 (210 × 297 mm)' },
  letter: { width: 612, height: 792, label: 'US Letter (8.5 × 11 in)' },
  legal: { width: 612, height: 1008, label: 'US Legal (8.5 × 14 in)' },
  a3: { width: 841.89, height: 1190.55, label: 'A3 (297 × 420 mm)' },
  a5: { width: 419.53, height: 595.28, label: 'A5 (148 × 210 mm)' },
} as const;

export type PageSizeKey = keyof typeof PAGE_SIZES;

/** Converts millimetres to PDF points. */
export function mmToPoints(mm: number): number {
  return (mm / 25.4) * PDF_POINTS_PER_INCH;
}

/** Converts inches to PDF points. */
export function inchesToPoints(inches: number): number {
  return inches * PDF_POINTS_PER_INCH;
}

/** Renders one page to a canvas and returns it as a PNG or JPEG blob. */
export async function renderPageToBlob(
  page: Awaited<ReturnType<PdfDocumentProxy['getPage']>>,
  options: {
    scale: number;
    format: 'png' | 'jpeg';
    quality: number;
    /** Hard cap on the longest edge, from the device profile. */
    maxEdge: number;
    background?: string;
  }
): Promise<{ blob: Blob; width: number; height: number }> {
  const baseViewport = page.getViewport({ scale: 1 });
  let scale = options.scale;

  const longest = Math.max(baseViewport.width, baseViewport.height) * scale;
  if (options.maxEdge > 0 && longest > options.maxEdge) {
    scale = scale * (options.maxEdge / longest);
  }

  const viewport = page.getViewport({ scale });
  const width = Math.max(1, Math.floor(viewport.width));
  const height = Math.max(1, Math.floor(viewport.height));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new AppError('UNSUPPORTED_DEVICE', 'Your browser blocked canvas rendering.');
  }

  // PDF pages are transparent; fill white so JPEG output does not come out black.
  context.fillStyle = options.background ?? '#ffffff';
  context.fillRect(0, 0, width, height);

  try {
    await page.render({ canvasContext: context, viewport, canvas }).promise;

    const mime = options.format === 'png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result && result.size > 0) resolve(result);
          else reject(new AppError('UNKNOWN', 'The browser could not encode this page.'));
        },
        mime,
        options.format === 'png' ? undefined : options.quality
      );
    });

    return { blob, width, height };
  } finally {
    // Release the backing store immediately: a 3000 px canvas is ~36 MB.
    canvas.width = 1;
    canvas.height = 1;
  }
}
