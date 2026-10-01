/**
 * Toolino Image Converter Engine
 * 100% Client-Side In-Browser Conversion for JPG, PNG, WEBP, AVIF, BMP, ICO, and SVG
 */

export type SupportedOutputFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'bmp' | 'ico';

export interface FormatOption {
  id: SupportedOutputFormat;
  label: string;
  mime: string;
  ext: string;
  lossy: boolean;
  supportsAlpha: boolean;
  description: string;
}

export const SUPPORTED_OUTPUT_FORMATS: FormatOption[] = [
  {
    id: 'webp',
    label: 'WEBP',
    mime: 'image/webp',
    ext: 'webp',
    lossy: true,
    supportsAlpha: true,
    description: 'Modern Google web format. High compression with full alpha transparency support.',
  },
  {
    id: 'png',
    label: 'PNG',
    mime: 'image/png',
    ext: 'png',
    lossy: false,
    supportsAlpha: true,
    description: 'Lossless raster standard. Best for graphics, diagrams, and transparent overlays.',
  },
  {
    id: 'jpeg',
    label: 'JPG / JPEG',
    mime: 'image/jpeg',
    ext: 'jpg',
    lossy: true,
    supportsAlpha: false,
    description: 'Universal standard for photographs. Smallest file sizes with adjustable quality.',
  },
  {
    id: 'avif',
    label: 'AVIF',
    mime: 'image/avif',
    ext: 'avif',
    lossy: true,
    supportsAlpha: true,
    description: 'Next-gen AV1 format offering up to 50% better compression than JPEG.',
  },
  {
    id: 'ico',
    label: 'ICO (Favicon)',
    mime: 'image/x-icon',
    ext: 'ico',
    lossy: false,
    supportsAlpha: true,
    description: 'Windows icon & website favicon format. Generates crisp, square icon files.',
  },
  {
    id: 'bmp',
    label: 'BMP',
    mime: 'image/bmp',
    ext: 'bmp',
    lossy: false,
    supportsAlpha: false,
    description: 'Uncompressed Windows Bitmap. Maximum raw pixel fidelity without compression.',
  },
];

export interface ConversionOptions {
  targetFormat: SupportedOutputFormat;
  quality: number; // 0.1 to 1.0 (for lossy formats)
  backgroundColor?: string; // Fill color when converting transparent image to non-alpha format (e.g. JPG)
  icoSize?: 16 | 32 | 48 | 64 | 128 | 256; // For ICO output
  resizeWidth?: number;
  resizeHeight?: number;
}

export interface ConvertedResult {
  blob: Blob;
  dataUrl: string;
  outputSize: number;
  outputFormat: SupportedOutputFormat;
  outputExtension: string;
  width: number;
  height: number;
}

/**
 * Checks if the user's browser natively supports AVIF canvas encoding
 */
export function isAvifExportSupported(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const url = canvas.toDataURL('image/avif');
    return url.startsWith('data:image/avif');
  } catch {
    return false;
  }
}

/**
 * Encodes an HTMLCanvasElement to a 24-bit uncompressed Windows BMP Blob
 */
export function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context for BMP encoding');

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // BMP rows must be a multiple of 4 bytes
  const rowBytes = width * 3;
  const paddingBytes = (4 - (rowBytes % 4)) % 4;
  const stride = rowBytes + paddingBytes;
  const pixelDataSize = stride * height;
  const fileSize = 54 + pixelDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // --- BITMAPFILEHEADER (14 bytes) ---
  view.setUint16(0, 0x424d, false); // 'BM' magic identifier
  view.setUint32(2, fileSize, true); // Total file size
  view.setUint16(6, 0, true); // Reserved
  view.setUint16(8, 0, true); // Reserved
  view.setUint32(10, 54, true); // Offset to pixel data

  // --- BITMAPINFOHEADER (40 bytes) ---
  view.setUint32(14, 40, true); // Header size
  view.setInt32(18, width, true); // Width
  view.setInt32(22, height, true); // Height (positive = bottom-up)
  view.setUint16(26, 1, true); // Color planes
  view.setUint16(28, 24, true); // Bits per pixel (24-bit RGB)
  view.setUint32(30, 0, true); // Compression (BI_RGB = uncompressed)
  view.setUint32(34, pixelDataSize, true); // Image size
  view.setInt32(38, 2835, true); // Horizontal resolution (72 DPI ~ 2835 ppm)
  view.setInt32(42, 2835, true); // Vertical resolution
  view.setUint32(46, 0, true); // Colors in palette
  view.setUint32(50, 0, true); // Important colors

  // --- Pixel Array (Bottom-Up, BGR byte order) ---
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      const pIdx = rowStart + x * 4;
      view.setUint8(offset++, data[pIdx + 2]); // Blue
      view.setUint8(offset++, data[pIdx + 1]); // Green
      view.setUint8(offset++, data[pIdx]); // Red
    }
    for (let p = 0; p < paddingBytes; p++) {
      view.setUint8(offset++, 0);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Encodes an image into an ICO container containing PNG payload
 */
export async function canvasToIcoBlob(
  canvas: HTMLCanvasElement,
  targetSize: number = 64
): Promise<Blob> {
  // Render square target canvas
  const square = document.createElement('canvas');
  square.width = targetSize;
  square.height = targetSize;
  const sctx = square.getContext('2d');
  if (!sctx) throw new Error('Could not get context for ICO scaling');

  // Center & draw image with high quality smoothing
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';

  const srcAspect = canvas.width / canvas.height;
  let dw = targetSize;
  let dh = targetSize;
  let dx = 0;
  let dy = 0;

  if (srcAspect > 1) {
    dh = Math.round(targetSize / srcAspect);
    dy = Math.round((targetSize - dh) / 2);
  } else {
    dw = Math.round(targetSize * srcAspect);
    dx = Math.round((targetSize - dw) / 2);
  }

  sctx.drawImage(canvas, dx, dy, dw, dh);

  // Convert scaled canvas to PNG blob
  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    square.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to create PNG blob for ICO'));
    }, 'image/png');
  });

  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const icoSize = 6 + 16 + pngBytes.length;
  const buffer = new ArrayBuffer(icoSize);
  const view = new DataView(buffer);

  // --- ICONDIR (6 bytes) ---
  view.setUint16(0, 0, true); // Reserved (must be 0)
  view.setUint16(2, 1, true); // Type (1 = ICO, 2 = CUR)
  view.setUint16(4, 1, true); // Number of images

  // --- ICONDIRENTRY (16 bytes) ---
  const widthByte = targetSize >= 256 ? 0 : targetSize;
  const heightByte = targetSize >= 256 ? 0 : targetSize;
  view.setUint8(6, widthByte); // Width
  view.setUint8(7, heightByte); // Height
  view.setUint8(8, 0); // Palette count (0 = no palette)
  view.setUint8(9, 0); // Reserved
  view.setUint16(10, 1, true); // Color planes
  view.setUint16(12, 32, true); // Bits per pixel (32-bit RGBA)
  view.setUint32(14, pngBytes.length, true); // Size of image data in bytes
  view.setUint32(18, 22, true); // Offset of image data (6 + 16 = 22)

  // Copy PNG image bytes
  const uint8View = new Uint8Array(buffer);
  uint8View.set(pngBytes, 22);

  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Loads an image from File, Blob, or URL into an HTMLImageElement
 */
export function loadImageSource(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image. File may be corrupted or format unsupported.'));
    };
  });
}

/**
 * Core Converter Function: Converts any input image file into the target format
 */
export async function convertSingleImage(
  source: File | Blob,
  options: ConversionOptions
): Promise<ConvertedResult> {
  const img = await loadImageSource(source);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  if (srcWidth === 0 || srcHeight === 0) {
    throw new Error('Image has zero dimensions');
  }

  const outWidth = options.resizeWidth || srcWidth;
  const outHeight = options.resizeHeight || srcHeight;

  // Prepare processing canvas
  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Format definitions
  const targetFmt = SUPPORTED_OUTPUT_FORMATS.find((f) => f.id === options.targetFormat) || SUPPORTED_OUTPUT_FORMATS[0];

  // If format does not support transparency (e.g. JPEG, BMP), fill canvas with solid background (default white)
  if (!targetFmt.supportsAlpha) {
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, outWidth, outHeight);
  }

  // Draw source image onto canvas
  ctx.drawImage(img, 0, 0, outWidth, outHeight);

  let outputBlob: Blob;

  // Format-specific encoding
  if (options.targetFormat === 'bmp') {
    outputBlob = canvasToBmpBlob(canvas);
  } else if (options.targetFormat === 'ico') {
    outputBlob = await canvasToIcoBlob(canvas, options.icoSize || 64);
  } else if (options.targetFormat === 'avif') {
    if (isAvifExportSupported()) {
      outputBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Browser failed to encode AVIF'));
          },
          'image/avif',
          options.quality
        );
      });
    } else {
      // Fallback to WEBP if browser lacks native AVIF encoder
      outputBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Browser failed to encode WEBP fallback'));
          },
          'image/webp',
          options.quality
        );
      });
    }
  } else {
    // Standard formats: PNG, JPEG, WEBP
    const mime = targetFmt.mime;
    const quality = targetFmt.lossy ? options.quality : undefined;

    outputBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to encode image to ${targetFmt.label}`));
        },
        mime,
        quality
      );
    });
  }

  const dataUrl = URL.createObjectURL(outputBlob);

  return {
    blob: outputBlob,
    dataUrl,
    outputSize: outputBlob.size,
    outputFormat: targetFmt.id,
    outputExtension: targetFmt.ext,
    width: outWidth,
    height: outHeight,
  };
}

/**
 * Format bytes helper (e.g. 1024 -> 1.0 KB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
