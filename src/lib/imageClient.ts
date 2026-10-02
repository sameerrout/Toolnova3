/**
 * Canvas image engine.
 *
 * Shared by Compress Image, Resize Image, Convert Image, Image to PDF, PDF to
 * Image and Passport Photo. Everything here is written for low-end devices:
 *
 *  - `createImageBitmap` is preferred (decodes off the main thread)
 *  - every bitmap is `close()`d and every canvas is released to 1x1 afterwards
 *  - downscaling is done in halving steps, which is both faster and produces a
 *    much better result than a single large `drawImage` on mobile GPUs
 *  - a hard pixel budget prevents a 12000x12000 canvas from killing the tab
 */

import { AppError, mapBrowserError } from './errors';

export type OutputImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export interface EncodeOptions {
  format: OutputImageFormat;
  /** 0..1, only meaningful for jpeg/webp/avif. */
  quality: number;
  /** Keep a fully transparent background instead of filling it. */
  preserveTransparency?: boolean;
  /** Background colour used when the output format cannot store alpha. */
  background?: string;
}

/** Total pixel budget for a single canvas (≈ 40 MP ≈ 160 MB at 4 bytes/px). */
export const MAX_CANVAS_PIXELS = 40_000_000;

const MIME_BY_FORMAT: Record<OutputImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

const EXTENSION_BY_FORMAT: Record<OutputImageFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
};

export function mimeForFormat(format: OutputImageFormat): string {
  return MIME_BY_FORMAT[format];
}

export function extensionForFormat(format: OutputImageFormat): string {
  return EXTENSION_BY_FORMAT[format];
}

/** Formats the browser can *encode*. Probed once and memoized. */
let encodeSupport: Record<OutputImageFormat, boolean> | null = null;

export function detectEncodeSupport(): Record<OutputImageFormat, boolean> {
  if (encodeSupport) return encodeSupport;
  if (typeof document === 'undefined') {
    return { jpeg: true, png: true, webp: false, avif: false };
  }

  const probe = (mime: string): boolean => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const url = canvas.toDataURL(mime);
      canvas.width = 1;
      canvas.height = 1;
      return url.startsWith(`data:${mime}`);
    } catch {
      return false;
    }
  };

  encodeSupport = {
    jpeg: true,
    png: true,
    webp: probe('image/webp'),
    avif: probe('image/avif'),
  };
  return encodeSupport;
}

/** Decodes a file into an `ImageBitmap` (or an `HTMLImageElement` fallback). */
export async function decodeImage(
  source: Blob
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // `imageOrientation: 'from-image'` respects EXIF rotation, which phone
      // photos rely on. Ignored by browsers that predate the option.
      return await createImageBitmap(source, { imageOrientation: 'from-image' });
    } catch {
      // Fall through to the <img> path, which handles SVG and odd formats.
    }
  }
  return decodeWithImageElement(source);
}

function decodeWithImageElement(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new AppError('CORRUPT_FILE', 'This image could not be decoded by your browser.', {
          hint: 'HEIC/HEIF photos from iPhones are not supported by most browsers. Export as JPG first.',
        })
      );
    };
    image.src = url;
  });
}

export function bitmapSize(bitmap: ImageBitmap | HTMLImageElement): {
  width: number;
  height: number;
} {
  if (typeof ImageBitmap !== 'undefined' && bitmap instanceof ImageBitmap) {
    return { width: bitmap.width, height: bitmap.height };
  }
  const image = bitmap as HTMLImageElement;
  return { width: image.naturalWidth || image.width, height: image.naturalHeight || image.height };
}

export function closeBitmap(bitmap: ImageBitmap | HTMLImageElement | null): void {
  if (!bitmap) return;
  if (typeof ImageBitmap !== 'undefined' && bitmap instanceof ImageBitmap) {
    bitmap.close();
    return;
  }
  const image = bitmap as HTMLImageElement;
  image.src = '';
}

export interface FitOptions {
  maxWidth?: number;
  maxHeight?: number;
  /** Hard cap on the longest edge, additionally applied after fitting. */
  maxEdge?: number;
}

/**
 * Fits `width`x`height` inside the given box without upscaling.
 * Returns integral dimensions of at least 1 px.
 */
export function fitWithin(
  width: number,
  height: number,
  options: FitOptions
): { width: number; height: number; scaled: boolean } {
  const { maxWidth, maxHeight, maxEdge } = options;
  let scale = 1;

  if (maxEdge && maxEdge > 0) {
    const longest = Math.max(width, height);
    if (longest > maxEdge) scale = Math.min(scale, maxEdge / longest);
  }
  if (maxWidth && maxWidth > 0 && width * scale > maxWidth) {
    scale = Math.min(scale, maxWidth / width);
  }
  if (maxHeight && maxHeight > 0 && height * scale > maxHeight) {
    scale = Math.min(scale, maxHeight / height);
  }

  if (scale >= 1) return { width, height, scaled: false };
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scaled: true,
  };
}

/**
 * Guards against allocating a canvas the device cannot handle.
 * Throws a friendly, actionable error instead of letting the tab die.
 */
export function assertCanvasBudget(width: number, height: number, maxEdge: number): void {
  const pixels = width * height;
  if (pixels > MAX_CANVAS_PIXELS) {
    throw new AppError(
      'OUT_OF_MEMORY',
      `That output would be ${width}x${height} pixels, which is too large to render safely.`,
      { hint: 'Choose a smaller width or height and try again.' }
    );
  }
  if (maxEdge > 0 && Math.max(width, height) > maxEdge) {
    throw new AppError(
      'INVALID_INPUT',
      `The longest edge is limited to ${maxEdge} px on this device.`,
      { hint: 'Lower the size and try again.' }
    );
  }
}

/** Creates a canvas, preferring `OffscreenCanvas` when available. */
export function createCanvas(
  width: number,
  height: number
): { canvas: HTMLCanvasElement | OffscreenCanvas; ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D } {
  if (typeof OffscreenCanvas === 'function') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (ctx) return { canvas, ctx };
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new AppError('UNSUPPORTED_DEVICE', 'Your browser blocked canvas rendering.');
  }
  return { canvas, ctx };
}

/**
 * Draws `source` into a canvas of exactly `targetWidth`x`targetHeight`.
 *
 * Large reductions are performed in halving passes because a single-step
 * downscale of a 4000 px photo to 400 px aliases badly on every browser.
 */
function drawScaled(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  source: ImageBitmap | HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): void {
  const sourceSize = bitmapSize(source);
  const steps: { width: number; height: number }[] = [];
  let currentWidth = sourceSize.width;
  let currentHeight = sourceSize.height;

  while (currentWidth / 2 >= targetWidth && currentHeight / 2 >= targetHeight) {
    currentWidth = Math.max(targetWidth, Math.floor(currentWidth / 2));
    currentHeight = Math.max(targetHeight, Math.floor(currentHeight / 2));
    steps.push({ width: currentWidth, height: currentHeight });
  }

  if (steps.length === 0) {
    draw(ctx, source, targetWidth, targetHeight);
    return;
  }

  // Intermediate canvases hold each halving result; only one is alive at a time.
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index] as { width: number; height: number };
    const isLast = index === steps.length - 1;
    const { canvas: scratch, ctx: scratchCtx } = createCanvas(step.width, step.height);
    scratchCtx.imageSmoothingEnabled = true;
    scratchCtx.imageSmoothingQuality = 'high';
    draw(scratchCtx, source, step.width, step.height);

    if (isLast) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      draw(ctx, scratch as unknown as CanvasImageSource, targetWidth, targetHeight);
    } else {
      // Feed the scratch canvas back in as the next source.
      source = scratch as unknown as ImageBitmap;
    }
  }
}

function draw(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
}

export interface TransformResult {
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
}

export interface TransformOptions extends EncodeOptions {
  /** Exact output size. When omitted, `fit` is applied to the source size. */
  width?: number;
  height?: number;
  /** Fitting rules used when `width`/`height` are not both given. */
  fit?: FitOptions;
  /** Hard device limit for the longest edge (0 = unlimited). */
  maxEdge: number;
}

/**
 * Decodes, resizes, re-encodes and fully releases every temporary resource.
 * This is the single entry point used by all image tools.
 */
export async function transformImage(
  source: Blob,
  options: TransformOptions
): Promise<TransformResult> {
  let bitmap: ImageBitmap | HTMLImageElement | null = null;
  let canvas: HTMLCanvasElement | OffscreenCanvas | null = null;

  try {
    bitmap = await decodeImage(source);
    const sourceSize = bitmapSize(bitmap);

    let targetWidth = options.width ?? 0;
    let targetHeight = options.height ?? 0;

    if (!targetWidth || !targetHeight) {
      const fit = options.fit ?? {};
      const fitted = fitWithin(sourceSize.width, sourceSize.height, {
        maxWidth: targetWidth || fit.maxWidth,
        maxHeight: targetHeight || fit.maxHeight,
        maxEdge: Math.min(
          options.maxEdge > 0 ? options.maxEdge : Number.POSITIVE_INFINITY,
          fit.maxEdge ?? Number.POSITIVE_INFINITY
        ),
      });
      targetWidth = targetWidth || fitted.width;
      targetHeight = targetHeight || fitted.height;
    }

    assertCanvasBudget(targetWidth, targetHeight, options.maxEdge);

    const created = createCanvas(targetWidth, targetHeight);
    canvas = created.canvas;
    const ctx = created.ctx;

    const needsFlatten = options.format !== 'png' && options.preserveTransparency !== true;
    if (needsFlatten) {
      ctx.fillStyle = options.background ?? '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    if (targetWidth === sourceSize.width && targetHeight === sourceSize.height) {
      draw(ctx, bitmap as unknown as CanvasImageSource, targetWidth, targetHeight);
    } else {
      drawScaled(ctx, bitmap, targetWidth, targetHeight);
    }

    const blob = await canvasToBlob(canvas, options.format, options.quality);

    return { blob, width: targetWidth, height: targetHeight, bytes: blob.size };
  } catch (error) {
    throw mapBrowserError(error);
  } finally {
    closeBitmap(bitmap);
    if (canvas) {
      try {
        canvas.width = 1;
        canvas.height = 1;
      } catch {
        // Detached OffscreenCanvas - already unreachable.
      }
    }
  }
}

/** Encodes a canvas, falling back to PNG when the format is unsupported. */
export async function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  format: OutputImageFormat,
  quality: number
): Promise<Blob> {
  const mime = MIME_BY_FORMAT[format];
  const support = detectEncodeSupport();
  const effectiveMime = support[format] ? mime : MIME_BY_FORMAT.png;
  const effectiveQuality = format === 'png' ? undefined : clamp01(quality);

  if (typeof OffscreenCanvas === 'function' && canvas instanceof OffscreenCanvas) {
    const blob = await canvas.convertToBlob({ type: effectiveMime, quality: effectiveQuality });
    if (blob.size > 0) return blob;
    throw new AppError('UNKNOWN', 'The browser produced an empty image.');
  }

  const htmlCanvas = canvas as HTMLCanvasElement;
  return new Promise<Blob>((resolve, reject) => {
    htmlCanvas.toBlob(
      (blob) => {
        if (blob && blob.size > 0) {
          resolve(blob);
          return;
        }
        reject(
          new AppError('UNKNOWN', 'The browser could not encode this image.', {
            hint: 'Try a different output format such as JPG or PNG.',
          })
        );
      },
      effectiveMime,
      effectiveQuality
    );
  });
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.8;
  return Math.min(1, Math.max(0.01, value));
}

/**
 * Binary-searches the JPEG/WebP quality needed to land under `targetBytes`.
 *
 * This is what makes "compress to 200 KB" honest: we measure real encoder
 * output rather than guessing from a ratio table. Bounded to 7 iterations so it
 * stays fast on slow devices.
 */
export async function encodeToTargetSize(
  bitmap: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  format: OutputImageFormat,
  targetBytes: number,
  maxEdge: number,
  background = '#ffffff'
): Promise<TransformResult> {
  assertCanvasBudget(width, height, maxEdge);

  const created = createCanvas(width, height);
  const canvas = created.canvas;
  const ctx = created.ctx;

  try {
    if (format !== 'png') {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
    }
    const sourceSize = bitmapSize(bitmap);
    if (sourceSize.width === width && sourceSize.height === height) {
      draw(ctx, bitmap as unknown as CanvasImageSource, width, height);
    } else {
      drawScaled(ctx, bitmap, width, height);
    }

    let low = 0.05;
    let high = 0.96;
    let best: Blob | null = null;

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const quality = (low + high) / 2;
      const candidate = await canvasToBlob(canvas, format, quality);
      if (candidate.size <= targetBytes) {
        best = candidate;
        low = quality;
        if (candidate.size >= targetBytes * 0.9) break;
      } else {
        high = quality;
      }
    }

    // Nothing fit: return the smallest attempt we produced.
    if (!best) best = await canvasToBlob(canvas, format, 0.05);
    return { blob: best, width, height, bytes: best.size };
  } finally {
    try {
      canvas.width = 1;
      canvas.height = 1;
    } catch {
      // Already detached.
    }
  }
}

/**
 * Produces a small preview data URL for a file, used by the file list thumbnails.
 * Always downscales to keep the string tiny on low-memory devices.
 */
export async function createThumbnail(
  source: Blob,
  maxEdge = 96,
  quality = 0.7
): Promise<string | null> {
  try {
    const result = await transformImage(source, {
      format: 'jpeg',
      quality,
      maxEdge,
      fit: { maxEdge },
      background: '#f1f5f9',
    });
    const buffer = await result.blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let index = 0; index < bytes.length; index += chunk) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}
