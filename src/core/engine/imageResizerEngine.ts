/**
 * Toolino Client-Side Image Resizer Engine
 * High-performance, pixel-accurate in-browser image resizing with aspect ratio preservation,
 * custom dimensions, percentage scaling, and social media presets.
 */

export interface ResizePreset {
  id: string;
  name: string;
  category: 'social' | 'standard' | 'profile';
  width: number;
  height: number;
  desc?: string;
}

export const RESIZE_PRESETS: ResizePreset[] = [
  // Social Media Presets
  { id: 'ig-square', name: 'Instagram Square', category: 'social', width: 1080, height: 1080, desc: '1:1 ratio' },
  { id: 'ig-portrait', name: 'Instagram Portrait', category: 'social', width: 1080, height: 1350, desc: '4:5 ratio' },
  { id: 'ig-story', name: 'Instagram Story / Reel', category: 'social', width: 1080, height: 1920, desc: '9:16 vertical' },
  { id: 'yt-thumb', name: 'YouTube Thumbnail', category: 'social', width: 1280, height: 720, desc: '16:9 HD' },
  { id: 'yt-banner', name: 'YouTube Banner', category: 'social', width: 2560, height: 1440, desc: 'Channel art' },
  { id: 'fb-post', name: 'Facebook Post', category: 'social', width: 1200, height: 630, desc: 'Landscape' },
  { id: 'linkedin-profile', name: 'LinkedIn Profile', category: 'profile', width: 400, height: 400, desc: 'Avatar' },
  { id: 'wa-profile', name: 'WhatsApp Profile', category: 'profile', width: 500, height: 500, desc: 'Avatar' },
  { id: 'tw-header', name: 'Twitter / X Banner', category: 'social', width: 1500, height: 500, desc: 'Header banner' },

  // Standard Dimension Presets
  { id: '100x100', name: '100 × 100 px', category: 'standard', width: 100, height: 100 },
  { id: '200x200', name: '200 × 200 px', category: 'standard', width: 200, height: 200 },
  { id: '300x300', name: '300 × 300 px', category: 'standard', width: 300, height: 300 },
  { id: '500x500', name: '500 × 500 px', category: 'standard', width: 500, height: 500 },
  { id: '1080x1080', name: '1080 × 1080 px', category: 'standard', width: 1080, height: 1080 },
  { id: 'fhd', name: '1920 × 1080 (Full HD)', category: 'standard', width: 1920, height: 1080 },
  { id: '4k', name: '3840 × 2160 (4K UHD)', category: 'standard', width: 3840, height: 2160 },
];

export interface ResizeOptions {
  mode: 'dimensions' | 'percentage' | 'preset';
  targetWidth: number;
  targetHeight: number;
  percentage?: number; // e.g. 50%
  lockAspectRatio: boolean;
  fitMode: 'scale' | 'cover' | 'contain';
  outputFormat: 'original' | 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number; // 0.05 to 1.0 (default 0.92)
  backgroundColor?: string; // used for 'contain' fit mode padding
}

export interface ResizedImageResult {
  id: string;
  originalFile: File;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  resizedBlob: Blob;
  resizedSize: number;
  resizedWidth: number;
  resizedHeight: number;
  outputFormat: string;
  isUpscaled: boolean;
  previewUrl: string;
  resizedPreviewUrl: string;
}

// Format bytes
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
      reject(new Error(`Failed to decode image "${file.name}". File may be corrupt.`));
    };
    img.src = url;
  });
}

// Convert canvas to Blob
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

// Resolve output mime type
function resolveTargetMime(originalMime: string, selectedOutput: string): string {
  if (selectedOutput !== 'original') {
    return selectedOutput;
  }
  const lower = originalMime.toLowerCase();
  if (lower.includes('png')) return 'image/png';
  if (lower.includes('webp')) return 'image/webp';
  return 'image/jpeg';
}

/**
 * Resizes a single image based on specified options.
 */
export async function resizeSingleImage(
  file: File,
  options: ResizeOptions
): Promise<ResizedImageResult> {
  const img = await loadImage(file);
  const origW = img.naturalWidth;
  const origH = img.naturalHeight;

  let finalW = origW;
  let finalH = origH;

  if (options.mode === 'percentage') {
    const scale = (options.percentage || 100) / 100;
    finalW = Math.max(1, Math.round(origW * scale));
    finalH = Math.max(1, Math.round(origH * scale));
  } else {
    // Mode 'dimensions' or 'preset'
    finalW = Math.max(1, Math.round(options.targetWidth || origW));
    finalH = Math.max(1, Math.round(options.targetHeight || origH));

    if (options.lockAspectRatio) {
      const origAspect = origW / origH;
      // If user adjusted width, compute height accordingly
      if (options.targetWidth && !options.targetHeight) {
        finalH = Math.max(1, Math.round(finalW / origAspect));
      } else if (options.targetHeight && !options.targetWidth) {
        finalW = Math.max(1, Math.round(finalH * origAspect));
      } else {
        // Both provided: adapt to match aspect ratio based on width
        finalH = Math.max(1, Math.round(finalW / origAspect));
      }
    }
  }

  const isUpscaled = finalW > origW || finalH > origH;

  const canvas = document.createElement('canvas');
  canvas.width = finalW;
  canvas.height = finalH;
  const ctx = canvas.getContext('2d', { alpha: true });

  if (!ctx) {
    throw new Error('Canvas 2D context creation failed.');
  }

  // Handle fit modes
  if (options.fitMode === 'contain') {
    // Letterbox with background or transparent
    if (options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, finalW, finalH);
    }
    const ratio = Math.min(finalW / origW, finalH / origH);
    const renderW = Math.round(origW * ratio);
    const renderH = Math.round(origH * ratio);
    const offsetX = Math.round((finalW - renderW) / 2);
    const offsetY = Math.round((finalH - renderH) / 2);
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  } else if (options.fitMode === 'cover') {
    // Crop center to fill
    const ratio = Math.max(finalW / origW, finalH / origH);
    const renderW = Math.round(origW * ratio);
    const renderH = Math.round(origH * ratio);
    const offsetX = Math.round((finalW - renderW) / 2);
    const offsetY = Math.round((finalH - renderH) / 2);
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  } else {
    // Standard scale / stretch to exact width & height
    ctx.drawImage(img, 0, 0, finalW, finalH);
  }

  const targetMime = resolveTargetMime(file.type, options.outputFormat);
  const finalBlob = await canvasToBlob(
    canvas,
    targetMime,
    targetMime === 'image/png' ? 1.0 : Math.max(0.1, options.quality || 0.92)
  );

  const previewUrl = URL.createObjectURL(file);
  const resizedPreviewUrl = URL.createObjectURL(finalBlob);

  return {
    id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    originalFile: file,
    originalSize: file.size,
    originalWidth: origW,
    originalHeight: origH,
    resizedBlob: finalBlob,
    resizedSize: finalBlob.size,
    resizedWidth: finalW,
    resizedHeight: finalH,
    outputFormat: targetMime,
    isUpscaled,
    previewUrl,
    resizedPreviewUrl,
  };
}
