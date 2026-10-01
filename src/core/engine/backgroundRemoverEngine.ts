/**
 * Toolino Background Remover Engine
 * 100% Client-Side Privacy-First Intelligent Segmentation & Matting
 */

export interface BackgroundRemovalOptions {
  mode: 'auto' | 'color-key' | 'border-flood';
  keyColor?: { r: number; g: number; b: number } | null;
  tolerance: number; // 1 to 100 (percentage)
  feather: number; // 0 to 15 (pixel radius)
  edgeShift: number; // -10 to +10 (erosion < 0, dilation > 0)
  despill: boolean; // Suppress edge fringe color
  bgType: 'transparent' | 'solid' | 'gradient';
  bgColor: string; // Hex color e.g. '#ffffff' or gradient spec
  gradientType?: 'warm' | 'cool' | 'sunset' | 'dark' | 'neon' | 'mesh';
}

export interface ProcessingProgress {
  stage: string;
  percent: number;
}

export interface RemoveBackgroundResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  maskCanvas: HTMLCanvasElement; // For touch-up brush editing
}

export const GRADIENT_PRESETS: Record<string, { label: string; css: string; stops: [string, string] }> = {
  warm: { label: 'Warm Glow', css: 'from-amber-200 to-orange-400', stops: ['#fde68a', '#fb923c'] },
  cool: { label: 'Ocean Breeze', css: 'from-cyan-300 to-blue-500', stops: ['#67e8f9', '#3b82f6'] },
  sunset: { label: 'Sunset Pastel', css: 'from-pink-300 to-purple-500', stops: ['#f472b6', '#a855f7'] },
  dark: { label: 'Studio Dark', css: 'from-slate-800 to-zinc-950', stops: ['#1e293b', '#09090b'] },
  neon: { label: 'Cyber Violet', css: 'from-fuchsia-500 to-indigo-600', stops: ['#d946ef', '#4f46e5'] },
  mesh: { label: 'Clean Studio Gray', css: 'from-slate-100 to-slate-300', stops: ['#f1f5f9', '#cbd5e1'] },
};

export const COLOR_PRESETS = [
  { label: 'Transparent', value: 'transparent', preview: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px]' },
  { label: 'Studio White', value: '#ffffff', preview: 'bg-white border border-slate-200' },
  { label: 'Clean Off-White', value: '#f8fafc', preview: 'bg-slate-50 border border-slate-200' },
  { label: 'Passport Blue', value: '#0284c7', preview: 'bg-sky-600' },
  { label: 'Official Navy', value: '#1e3a8a', preview: 'bg-blue-900' },
  { label: 'Studio Gray', value: '#64748b', preview: 'bg-slate-500' },
  { label: 'Onyx Black', value: '#09090b', preview: 'bg-zinc-950' },
  { label: 'Soft Rose', value: '#f43f5e', preview: 'bg-rose-500' },
  { label: 'Emerald Green', value: '#10b981', preview: 'bg-emerald-500' },
  { label: 'Electric Purple', value: '#8b5cf6', preview: 'bg-violet-500' },
];

/**
 * Calculates perceptual color distance between two RGB colors (0 to 441)
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  // Redmean color difference gives balanced human perceptual distance
  const rbar = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(
    (2 + rbar / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rbar) / 256) * db * db
  );
}

/**
 * Samples the outer perimeter border pixels to identify the background color cluster
 */
function sampleBorderColors(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sampleStep = 2
): Array<{ r: number; g: number; b: number }> {
  const colors: Array<{ r: number; g: number; b: number }> = [];

  // Top and bottom borders (multiple rows deep)
  const depth = Math.min(5, Math.floor(height / 10));
  for (let d = 0; d < depth; d++) {
    for (let x = 0; x < width; x += sampleStep) {
      // Top
      const topIdx = (d * width + x) * 4;
      colors.push({ r: data[topIdx], g: data[topIdx + 1], b: data[topIdx + 2] });
      // Bottom
      const btmIdx = ((height - 1 - d) * width + x) * 4;
      colors.push({ r: data[btmIdx], g: data[btmIdx + 1], b: data[btmIdx + 2] });
    }
  }

  // Left and right borders
  const sideDepth = Math.min(5, Math.floor(width / 10));
  for (let d = 0; d < sideDepth; d++) {
    for (let y = depth; y < height - depth; y += sampleStep) {
      // Left
      const leftIdx = (y * width + d) * 4;
      colors.push({ r: data[leftIdx], g: data[leftIdx + 1], b: data[leftIdx + 2] });
      // Right
      const rightIdx = (y * width + (width - 1 - d)) * 4;
      colors.push({ r: data[rightIdx], g: data[rightIdx + 1], b: data[rightIdx + 2] });
    }
  }

  return colors;
}

/**
 * Finds the dominant background color representative from sampled border pixels
 */
function findDominantColor(samples: Array<{ r: number; g: number; b: number }>): {
  r: number;
  g: number;
  b: number;
} {
  if (samples.length === 0) return { r: 255, g: 255, b: 255 };

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (const c of samples) {
    sumR += c.r;
    sumG += c.g;
    sumB += c.b;
  }

  return {
    r: Math.round(sumR / samples.length),
    g: Math.round(sumG / samples.length),
    b: Math.round(sumB / samples.length),
  };
}

/**
 * Applies separable 1D box blur to an alpha mask buffer
 */
function blurAlphaMask(
  mask: any,
  width: number,
  height: number,
  radius: number
): any {
  if (radius <= 0) return mask;

  const temp = new Uint8ClampedArray(width * height);
  const result = new Uint8ClampedArray(width * height);

  // Horizontal blur pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      const startX = Math.max(0, x - radius);
      const endX = Math.min(width - 1, x + radius);

      for (let kx = startX; kx <= endX; kx++) {
        sum += mask[rowOffset + kx];
        count++;
      }
      temp[rowOffset + x] = Math.round(sum / count);
    }
  }

  // Vertical blur pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      let count = 0;
      const startY = Math.max(0, y - radius);
      const endY = Math.min(height - 1, y + radius);

      for (let ky = startY; ky <= endY; ky++) {
        sum += temp[ky * width + x];
        count++;
      }
      result[y * width + x] = Math.round(sum / count);
    }
  }

  return result;
}

/**
 * Morphological dilation or erosion on binary alpha mask
 * shift > 0 = dilate (expand foreground)
 * shift < 0 = erode (shrink foreground to cut halo)
 */
function shiftMaskEdges(
  mask: any,
  width: number,
  height: number,
  shift: number
): any {
  if (shift === 0) return mask;

  const absShift = Math.min(Math.abs(shift), 8);
  const isErode = shift < 0;
  const output = new Uint8ClampedArray(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let targetVal = isErode ? 255 : 0;

      for (let dy = -absShift; dy <= absShift; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -absShift; dx <= absShift; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (dx * dx + dy * dy <= absShift * absShift) {
            const val = mask[ny * width + nx];
            if (isErode) {
              if (val < targetVal) targetVal = val;
            } else {
              if (val > targetVal) targetVal = val;
            }
          }
        }
      }
      output[idx] = targetVal;
    }
  }

  return output;
}

/**
 * Main Client-Side Background Removal Engine
 */
export async function removeBackground(
  imageSource: HTMLImageElement | File | Blob | string,
  options: BackgroundRemovalOptions,
  customMaskCanvas?: HTMLCanvasElement | null,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<RemoveBackgroundResult> {
  onProgress?.({ stage: 'Decoding image...', percent: 10 });

  // 1. Load image into memory
  const img = await loadImageElement(imageSource);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (width === 0 || height === 0) {
    throw new Error('Invalid image dimensions');
  }

  // 2. Setup processing canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not initialize 2D rendering context');

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  onProgress?.({ stage: 'Analyzing image edges and background...', percent: 25 });

  // 3. Compute initial alpha mask (255 = foreground, 0 = background)
  let alphaMask: Uint8ClampedArray = new Uint8ClampedArray(width * height);

  if (customMaskCanvas && customMaskCanvas.width === width && customMaskCanvas.height === height) {
    // Reusing manually edited touch-up mask
    const maskCtx = customMaskCanvas.getContext('2d');
    if (maskCtx) {
      const maskData = maskCtx.getImageData(0, 0, width, height).data;
      for (let i = 0; i < width * height; i++) {
        alphaMask[i] = maskData[i * 4 + 3]; // alpha channel
      }
    }
  } else {
    // Fresh automated background segmentation
    const borderSamples = sampleBorderColors(data, width, height, Math.max(1, Math.floor(width / 300)));
    const dominantBg = options.keyColor || findDominantColor(borderSamples);

    // Max distance threshold based on tolerance (0 to 100%)
    // Perceptual distance max is ~584 (black to white in redmean)
    const threshold = (options.tolerance / 100) * 320;
    const falloff = threshold * 0.4; // Soft gradient falloff margin

    onProgress?.({ stage: 'Extracting subject silhouette...', percent: 45 });

    // Connected Component Boundary Flood Fill:
    // Only pixels connected to the borders that match the background are removed.
    // This prevents background-colored interior regions (e.g. eyes, white shirts, logos) from being hollowed out!
    const isBg = new Uint8Array(width * height);
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    // Push all border pixels to flood fill queue
    for (let x = 0; x < width; x++) {
      queue.push(x); // top
      queue.push((height - 1) * width + x); // bottom
    }
    for (let y = 1; y < height - 1; y++) {
      queue.push(y * width); // left
      queue.push(y * width + (width - 1)); // right
    }

    // Flood fill traversal
    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      if (visited[idx]) continue;
      visited[idx] = 1;

      const px = idx % width;
      const py = Math.floor(idx / width);
      const pIdx = idx * 4;

      const r = data[pIdx];
      const g = data[pIdx + 1];
      const b = data[pIdx + 2];

      const dist = colorDistance(r, g, b, dominantBg.r, dominantBg.g, dominantBg.b);

      if (dist <= threshold + falloff) {
        isBg[idx] = 1;

        // Spread to 4 neighbors
        if (px > 0 && !visited[idx - 1]) queue.push(idx - 1);
        if (px < width - 1 && !visited[idx + 1]) queue.push(idx + 1);
        if (py > 0 && !visited[idx - width]) queue.push(idx - width);
        if (py < height - 1 && !visited[idx + width]) queue.push(idx + width);
      }
    }

    // Convert flood-fill results into alpha transparency with soft falloff
    for (let i = 0; i < width * height; i++) {
      if (isBg[i]) {
        const pIdx = i * 4;
        const dist = colorDistance(
          data[pIdx],
          data[pIdx + 1],
          data[pIdx + 2],
          dominantBg.r,
          dominantBg.g,
          dominantBg.b
        );

        if (dist <= threshold) {
          alphaMask[i] = 0; // Completely transparent
        } else {
          // Soft transition edge
          const alphaRatio = (dist - threshold) / (falloff || 1);
          alphaMask[i] = Math.round(Math.min(255, Math.max(0, alphaRatio * 255)));
        }
      } else {
        alphaMask[i] = 255; // Foreground
      }
    }
  }

  onProgress?.({ stage: 'Refining edges & smoothing...', percent: 70 });

  // 4. Edge shift (erosion or dilation)
  if (options.edgeShift !== 0) {
    alphaMask = shiftMaskEdges(alphaMask, width, height, options.edgeShift);
  }

  // 5. Feathering (gaussian/box blur on alpha channel)
  if (options.feather > 0) {
    alphaMask = blurAlphaMask(alphaMask, width, height, options.feather);
  }

  onProgress?.({ stage: 'Applying background and color despill...', percent: 85 });

  // 6. Color despill: neutralize background color tint from edge pixels
  if (options.despill && options.keyColor) {
    const key = options.keyColor;
    for (let i = 0; i < width * height; i++) {
      const alpha = alphaMask[i];
      if (alpha > 0 && alpha < 240) {
        const pIdx = i * 4;
        // Suppress key color component near edges
        data[pIdx] = Math.max(0, Math.min(255, data[pIdx] - Math.round((key.r / 255) * (255 - alpha) * 0.4)));
        data[pIdx + 1] = Math.max(0, Math.min(255, data[pIdx + 1] - Math.round((key.g / 255) * (255 - alpha) * 0.4)));
        data[pIdx + 2] = Math.max(0, Math.min(255, data[pIdx + 2] - Math.round((key.b / 255) * (255 - alpha) * 0.4)));
      }
    }
  }

  // 7. Render final composite canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Could not create output canvas context');

  // Background layer
  if (options.bgType === 'solid' && options.bgColor && options.bgColor !== 'transparent') {
    outCtx.fillStyle = options.bgColor;
    outCtx.fillRect(0, 0, width, height);
  } else if (options.bgType === 'gradient' && options.gradientType) {
    const preset = GRADIENT_PRESETS[options.gradientType] || GRADIENT_PRESETS.warm;
    const grad = outCtx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, preset.stops[0]);
    grad.addColorStop(1, preset.stops[1]);
    outCtx.fillStyle = grad;
    outCtx.fillRect(0, 0, width, height);
  }

  // Foreground with computed alpha mask
  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 3] = alphaMask[i];
  }
  ctx.putImageData(imgData, 0, 0);

  // Composite foreground over background
  outCtx.drawImage(canvas, 0, 0);

  // 8. Create standalone mask canvas for interactive touch-up brushes
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  if (maskCtx) {
    const maskImgData = maskCtx.createImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      maskImgData.data[idx] = 0;
      maskImgData.data[idx + 1] = 0;
      maskImgData.data[idx + 2] = 0;
      maskImgData.data[idx + 3] = alphaMask[i];
    }
    maskCtx.putImageData(maskImgData, 0, 0);
  }

  onProgress?.({ stage: 'Generating final image...', percent: 95 });

  // 9. Export Blob
  const exportFormat = options.bgType === 'transparent' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to generate output image blob'));
      },
      exportFormat,
      0.95
    );
  });

  const dataUrl = URL.createObjectURL(blob);
  onProgress?.({ stage: 'Complete!', percent: 100 });

  return {
    blob,
    dataUrl,
    width,
    height,
    maskCanvas,
  };
}

/**
 * Loads image into HTMLImageElement
 */
function loadImageElement(source: HTMLImageElement | File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (source instanceof HTMLImageElement && source.complete && source.naturalWidth > 0) {
      resolve(source);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image source'));

    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else if (source instanceof HTMLImageElement) {
      img.src = source.src;
    }
  });
}
