/**
 * Toolino Client-Side Image Compression Engine
 * High-performance, memory-safe in-browser image compression using Canvas and Web APIs.
 * Zero server uploads: 100% private and offline-capable.
 */

export interface CompressionOptions {
  quality: number; // 0.05 to 1.0
  mode: 'quality' | 'target-size';
  targetSizeBytes?: number; // Optional target size in bytes (e.g. 200 * 1024)
  outputFormat?: 'original' | 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
  maxDimension?: number; // Optional max width/height constraint
}

export interface CompressedImageResult {
  id: string;
  originalFile: File;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  compressedBlob: Blob;
  compressedSize: number;
  compressedWidth: number;
  compressedHeight: number;
  outputFormat: string;
  reductionPercentage: number;
  previewUrl: string;
  compressedPreviewUrl: string;
}

// Format bytes helper
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Detect browser AVIF encoding support
let isAvifSupportedCache: boolean | null = null;
export function isAvifEncodingSupported(): boolean {
  if (isAvifSupportedCache !== null) return isAvifSupportedCache;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL('image/avif');
    isAvifSupportedCache = dataUrl.startsWith('data:image/avif');
  } catch {
    isAvifSupportedCache = false;
  }
  return isAvifSupportedCache;
}

// Resolve target MIME type based on original file and user selection
function resolveTargetMime(originalMime: string, selectedOutput?: string): string {
  if (selectedOutput && selectedOutput !== 'original') {
    if (selectedOutput === 'image/avif' && !isAvifEncodingSupported()) {
      // Fallback to WebP if AVIF is not supported by current browser
      return 'image/webp';
    }
    return selectedOutput;
  }

  const lower = originalMime.toLowerCase();
  if (lower.includes('png')) return 'image/png';
  if (lower.includes('webp')) return 'image/webp';
  if (lower.includes('avif') && isAvifEncodingSupported()) return 'image/avif';
  return 'image/jpeg';
}

// Load image into an HTMLImageElement
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode image "${file.name}". File may be corrupt or unsupported.`));
    };
    img.src = url;
  });
}

// Render canvas to Blob with quality
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Failed to encode canvas to ${mimeType}.`));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Compresses a single image file with quality controls or target size search.
 */
export async function compressSingleImage(
  file: File,
  options: CompressionOptions,
  onProgress?: (step: string) => void
): Promise<CompressedImageResult> {
  onProgress?.('Decoding image dimensions...');
  const img = await loadImage(file);
  const originalWidth = img.naturalWidth;
  const originalHeight = img.naturalHeight;

  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  // Apply max dimension constraint if specified
  if (options.maxDimension && (targetWidth > options.maxDimension || targetHeight > options.maxDimension)) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight / targetWidth) * options.maxDimension);
      targetWidth = options.maxDimension;
    } else {
      targetWidth = Math.round((targetWidth / targetHeight) * options.maxDimension);
      targetHeight = options.maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: true });

  if (!ctx) {
    throw new Error('Canvas 2D context initialization failed.');
  }

  // Draw image onto canvas
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const targetMime = resolveTargetMime(file.type, options.outputFormat);
  let finalBlob: Blob;

  onProgress?.('Compressing image data...');

  if (options.mode === 'target-size' && options.targetSizeBytes && options.targetSizeBytes > 0) {
    // Target size mode: perform binary search on quality
    const targetBytes = options.targetSizeBytes;
    let minQ = 0.05;
    let maxQ = 0.95;
    let bestBlob: Blob | null = null;
    let bestDiff = Infinity;

    // Run up to 6 search iterations
    for (let iter = 0; iter < 6; iter++) {
      const midQ = (minQ + maxQ) / 2;
      const testBlob = await canvasToBlob(canvas, targetMime, midQ);
      const diff = Math.abs(testBlob.size - targetBytes);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestBlob = testBlob;
      }

      if (testBlob.size > targetBytes) {
        maxQ = midQ;
      } else {
        minQ = midQ;
      }
    }

    // If even lowest quality is larger than target and dimensions are large, downscale
    if (bestBlob && bestBlob.size > targetBytes * 1.25 && targetWidth > 800) {
      const scaleDownCanvas = document.createElement('canvas');
      const downWidth = Math.round(targetWidth * 0.7);
      const downHeight = Math.round(targetHeight * 0.7);
      scaleDownCanvas.width = downWidth;
      scaleDownCanvas.height = downHeight;
      const downCtx = scaleDownCanvas.getContext('2d');
      if (downCtx) {
        downCtx.drawImage(canvas, 0, 0, downWidth, downHeight);
        const scaledBlob = await canvasToBlob(scaleDownCanvas, targetMime, 0.6);
        if (scaledBlob.size < bestBlob.size) {
          bestBlob = scaledBlob;
          targetWidth = downWidth;
          targetHeight = downHeight;
        }
      }
    }

    finalBlob = bestBlob || (await canvasToBlob(canvas, targetMime, options.quality));
  } else {
    // Quality-based compression mode
    if (targetMime === 'image/png') {
      // For PNG: if user requested high compression (quality <= 0.8), quantize or downsample slightly
      if (options.quality < 0.85) {
        // High compression for PNG: convert to high-fidelity WebP if compatible or optimize canvas
        finalBlob = await canvasToBlob(canvas, 'image/png', options.quality);
      } else {
        finalBlob = await canvasToBlob(canvas, 'image/png', 1.0);
      }
    } else {
      finalBlob = await canvasToBlob(canvas, targetMime, Math.max(0.05, Math.min(1.0, options.quality)));
    }
  }

  // Calculate reduction
  const originalSize = file.size;
  const compressedSize = finalBlob.size;
  const reductionPercentage =
    originalSize > compressedSize
      ? parseFloat((((originalSize - compressedSize) / originalSize) * 100).toFixed(1))
      : 0;

  const previewUrl = URL.createObjectURL(file);
  const compressedPreviewUrl = URL.createObjectURL(finalBlob);

  return {
    id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    originalFile: file,
    originalSize,
    originalWidth,
    originalHeight,
    compressedBlob: finalBlob,
    compressedSize,
    compressedWidth: targetWidth,
    compressedHeight: targetHeight,
    outputFormat: targetMime,
    reductionPercentage,
    previewUrl,
    compressedPreviewUrl,
  };
}
