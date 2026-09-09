/**
 * Browser-side Image Normalization and Processing Helper
 * Converts any browser-supported image format (JPG, PNG, WEBP) into pure byte buffers.
 */

export interface NormalizedImage {
  bytes: Uint8Array;
  format: 'jpeg' | 'png';
  width: number;
  height: number;
}

export async function normalizeImageForPdf(
  file: File,
  quality = 0.9
): Promise<NormalizedImage> {
  // If it's pure JPEG or PNG and we don't need recompression, we can inspect and use bytes directly
  // However, WEBP or images needing quality adjustments are drawn via OffscreenCanvas / Canvas.
  if (typeof window === 'undefined') {
    throw new Error('Image normalization must be executed in browser context.');
  }

  // Use createImageBitmap if available for high performance and off-thread decoding
  let imgBitmap: ImageBitmap | null = null;
  try {
    imgBitmap = await createImageBitmap(file);
    const { width, height } = imgBitmap;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not acquire 2D canvas context.');
    }

    // Fill white background for transparent images when converting to JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(imgBitmap, 0, 0);

    // Export as JPEG blob with selected quality
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob failed.'));
        },
        'image/jpeg',
        quality
      );
    });

    const buffer = await blob.arrayBuffer();
    return {
      bytes: new Uint8Array(buffer),
      format: 'jpeg',
      width,
      height,
    };
  } finally {
    if (imgBitmap) {
      imgBitmap.close();
    }
  }
}

