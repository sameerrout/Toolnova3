/**
 * Toolino Passport Photo Maker Engine
 * 100% Client-Side Biometric Passport & Visa Photo Generator
 */

export interface CountryPreset {
  id: string;
  country: string;
  name: string;
  widthMm: number;
  heightMm: number;
  widthInches: number;
  heightInches: number;
  defaultBg: string; // e.g. '#ffffff' or '#f8fafc'
  headMinPercent: number; // Head height min (e.g. 50%)
  headMaxPercent: number; // Head height max (e.g. 69%)
  description: string;
}

export const COUNTRY_PRESETS: CountryPreset[] = [
  {
    id: 'us-passport',
    country: 'United States',
    name: 'US Passport & Visa (2×2 in)',
    widthMm: 51,
    heightMm: 51,
    widthInches: 2,
    heightInches: 2,
    defaultBg: '#ffffff',
    headMinPercent: 50,
    headMaxPercent: 69,
    description: 'Official US State Dept specification for Passports, Visas, and Green Cards (2×2 inches).',
  },
  {
    id: 'uk-eu-passport',
    country: 'UK / EU / Schengen',
    name: 'UK / Schengen / Europe (35×45 mm)',
    widthMm: 35,
    heightMm: 45,
    widthInches: 1.38,
    heightInches: 1.77,
    defaultBg: '#ffffff',
    headMinPercent: 70,
    headMaxPercent: 80,
    description: 'Standard biometric photo for UK HM Passport Office, Schengen Visas, Germany, France, Italy, Spain.',
  },
  {
    id: 'india-passport',
    country: 'India',
    name: 'India Passport (35×45 mm)',
    widthMm: 35,
    heightMm: 45,
    widthInches: 1.38,
    heightInches: 1.77,
    defaultBg: '#ffffff',
    headMinPercent: 70,
    headMaxPercent: 75,
    description: 'Indian Passport Seva standard dimensions (35×45 mm with white background).',
  },
  {
    id: 'india-visa',
    country: 'India',
    name: 'India OCI & Visa (51×51 mm / 2×2 in)',
    widthMm: 51,
    heightMm: 51,
    widthInches: 2,
    heightInches: 2,
    defaultBg: '#ffffff',
    headMinPercent: 60,
    headMaxPercent: 70,
    description: 'Standard 2×2 inch format for Indian Visa, OCI Card, and e-Visa applications.',
  },
  {
    id: 'canada-passport',
    country: 'Canada',
    name: 'Canada Passport (50×70 mm)',
    widthMm: 50,
    heightMm: 70,
    widthInches: 1.97,
    heightInches: 2.76,
    defaultBg: '#ffffff',
    headMinPercent: 44,
    headMaxPercent: 51,
    description: 'Official Passport Canada requirement (50×70 mm, face between 31-36 mm).',
  },
  {
    id: 'canada-visa',
    country: 'Canada',
    name: 'Canada Visa & PR (35×45 mm)',
    widthMm: 35,
    heightMm: 45,
    widthInches: 1.38,
    heightInches: 1.77,
    defaultBg: '#ffffff',
    headMinPercent: 70,
    headMaxPercent: 80,
    description: 'Immigration, Refugees and Citizenship Canada (IRCC) Visa & Permanent Residency standard.',
  },
  {
    id: 'australia-passport',
    country: 'Australia / New Zealand',
    name: 'Australia & New Zealand (35×45 mm)',
    widthMm: 35,
    heightMm: 45,
    widthInches: 1.38,
    heightInches: 1.77,
    defaultBg: '#ffffff',
    headMinPercent: 71,
    headMaxPercent: 80,
    description: 'Australian Passport Office (APO) & Immigration New Zealand (INZ) compliant format.',
  },
  {
    id: 'china-passport',
    country: 'China',
    name: 'China Passport (33×48 mm)',
    widthMm: 33,
    heightMm: 48,
    widthInches: 1.3,
    heightInches: 1.89,
    defaultBg: '#ffffff',
    headMinPercent: 70,
    headMaxPercent: 80,
    description: 'Ministry of Foreign Affairs of China official passport photo standard (33×48 mm).',
  },
  {
    id: 'japan-passport',
    country: 'Japan',
    name: 'Japan Passport (35×45 mm)',
    widthMm: 35,
    heightMm: 45,
    widthInches: 1.38,
    heightInches: 1.77,
    defaultBg: '#ffffff',
    headMinPercent: 70,
    headMaxPercent: 75,
    description: 'Japanese Ministry of Foreign Affairs passport photo dimensions (35×45 mm).',
  },
  {
    id: 'singapore-passport',
    country: 'Singapore',
    name: 'Singapore Passport & NRIC (35×45 mm)',
    widthMm: 35,
    heightMm: 45,
    widthInches: 1.38,
    heightInches: 1.77,
    defaultBg: '#ffffff',
    headMinPercent: 70,
    headMaxPercent: 80,
    description: 'Immigration & Checkpoints Authority (ICA) biometric photo guidelines.',
  },
];

export interface PrintPaperOption {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  widthInches: number;
  heightInches: number;
}

export const PRINT_PAPERS: PrintPaperOption[] = [
  {
    id: '4x6',
    name: '4×6 inch (10×15 cm) Photo Paper',
    widthMm: 101.6,
    heightMm: 152.4,
    widthInches: 4,
    heightInches: 6,
  },
  {
    id: '5x7',
    name: '5×7 inch (13×18 cm) Photo Paper',
    widthMm: 127,
    heightMm: 177.8,
    widthInches: 5,
    heightInches: 7,
  },
  {
    id: 'a4',
    name: 'A4 Standard Document (210×297 mm)',
    widthMm: 210,
    heightMm: 297,
    widthInches: 8.27,
    heightInches: 11.69,
  },
];

export interface PassportRenderOptions {
  preset: CountryPreset;
  dpi: number; // typically 300 or 600
  cropZoom: number; // 0.5 to 3.0
  panX: number; // pixels relative to center
  panY: number;
  rotation: number; // -45 to +45 deg
  backgroundColor: string; // '#ffffff', '#f8fafc', '#e0f2fe', etc.
  addCutLines?: boolean;
}

/**
 * Calculates pixel dimensions for mm size at specified DPI (default 300 DPI)
 */
export function mmToPixels(mm: number, dpi: number = 300): number {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Renders a single cropped passport photo at exact biometric resolution
 */
export async function renderSinglePassportPhoto(
  img: HTMLImageElement,
  options: PassportRenderOptions
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const targetWidth = mmToPixels(options.preset.widthMm, options.dpi);
  const targetHeight = mmToPixels(options.preset.heightMm, options.dpi);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill background
  ctx.fillStyle = options.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Apply transformations (Pan, Zoom, Rotation centered on canvas)
  ctx.save();
  ctx.translate(targetWidth / 2 + options.panX, targetHeight / 2 + options.panY);
  ctx.rotate((options.rotation * Math.PI) / 180);

  // Compute cover scale
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const targetAspect = targetWidth / targetHeight;
  let baseScale = 1;
  if (imgAspect > targetAspect) {
    baseScale = targetHeight / img.naturalHeight;
  } else {
    baseScale = targetWidth / img.naturalWidth;
  }

  const finalScale = baseScale * options.cropZoom;
  const drawW = img.naturalWidth * finalScale;
  const drawH = img.naturalHeight * finalScale;

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // Export blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to render passport photo blob'));
      },
      'image/jpeg',
      0.95
    );
  });

  const dataUrl = URL.createObjectURL(blob);
  return { blob, dataUrl, width: targetWidth, height: targetHeight };
}

/**
 * Generates a print sheet (e.g. 4x6" or A4) with multiple tiled passport photos and cutting lines
 */
export async function renderPassportPrintSheet(
  singlePhotoCanvas: HTMLCanvasElement,
  preset: CountryPreset,
  paper: PrintPaperOption,
  dpi: number = 300,
  addCutLines: boolean = true
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; photoCount: number }> {
  // Sheet dimensions in pixels (paper orientation: landscape if wider)
  const isPaperLandscape = paper.widthMm > paper.heightMm;
  const sheetWidth = mmToPixels(isPaperLandscape ? paper.widthMm : paper.heightMm, dpi);
  const sheetHeight = mmToPixels(isPaperLandscape ? paper.heightMm : paper.widthMm, dpi);

  const photoW = mmToPixels(preset.widthMm, dpi);
  const photoH = mmToPixels(preset.heightMm, dpi);

  const canvas = document.createElement('canvas');
  canvas.width = sheetWidth;
  canvas.height = sheetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get context for print sheet');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // White paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, sheetWidth, sheetHeight);

  // Spacing and margins
  const marginMm = 8; // 8mm paper border margin
  const gapMm = 3; // 3mm spacing between photos
  const marginPx = mmToPixels(marginMm, dpi);
  const gapPx = mmToPixels(gapMm, dpi);

  // Available area
  const availW = sheetWidth - marginPx * 2;
  const availH = sheetHeight - marginPx * 2;

  // Max columns and rows that fit
  const cols = Math.max(1, Math.floor((availW + gapPx) / (photoW + gapPx)));
  const rows = Math.max(1, Math.floor((availH + gapPx) / (photoH + gapPx)));
  const photoCount = cols * rows;

  // Center the grid on the sheet
  const totalGridW = cols * photoW + (cols - 1) * gapPx;
  const totalGridH = rows * photoH + (rows - 1) * gapPx;
  const startX = Math.round((sheetWidth - totalGridW) / 2);
  const startY = Math.round((sheetHeight - totalGridH) / 2);

  // Tile photos
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = startX + c * (photoW + gapPx);
      const py = startY + r * (photoH + gapPx);

      ctx.drawImage(singlePhotoCanvas, px, py, photoW, photoH);

      // Draw subtle cutting border if requested
      if (addCutLines) {
        ctx.strokeStyle = '#cbd5e1'; // light slate
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]); // dashed cut lines
        ctx.strokeRect(px - 0.5, py - 0.5, photoW + 1, photoH + 1);
        ctx.setLineDash([]);
      }
    }
  }

  // Add subtle header metadata label on edge margin
  ctx.fillStyle = '#94a3b8';
  ctx.font = `${Math.round(dpi * 0.035)}px sans-serif`;
  ctx.fillText(
    `Toolino Passport Sheet • ${preset.name} (${preset.widthMm}×${preset.heightMm}mm) • ${dpi} DPI • Printed at 100% Scale`,
    startX,
    startY - mmToPixels(3, dpi)
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to generate print sheet blob'));
      },
      'image/jpeg',
      0.96
    );
  });

  const dataUrl = URL.createObjectURL(blob);
  return { blob, dataUrl, width: sheetWidth, height: sheetHeight, photoCount };
}
