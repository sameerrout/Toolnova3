import { describe, it, expect } from 'vitest';
import { fitWithin, mimeForFormat, extensionForFormat } from '@/lib/imageClient';
import { replaceExtension, getExtension } from '@/lib/filenames';

describe('Image Primitives & Resizing Maths', () => {
  it('preserves aspect ratio when scaling down to maximum edge', () => {
    // 4000 x 2000 image scaled with maxEdge 2000
    const fitted = fitWithin(4000, 2000, { maxEdge: 2000 });
    expect(fitted.scaled).toBe(true);
    expect(fitted.width).toBe(2000);
    expect(fitted.height).toBe(1000);
  });

  it('does not upscale an image that is already smaller than limits', () => {
    const fitted = fitWithin(800, 600, { maxWidth: 1920, maxHeight: 1080 });
    expect(fitted.scaled).toBe(false);
    expect(fitted.width).toBe(800);
    expect(fitted.height).toBe(600);
  });

  it('correctly maps output formats to MIME types and extensions', () => {
    expect(mimeForFormat('jpeg')).toBe('image/jpeg');
    expect(mimeForFormat('png')).toBe('image/png');
    expect(mimeForFormat('webp')).toBe('image/webp');
    expect(mimeForFormat('avif')).toBe('image/avif');

    expect(extensionForFormat('jpeg')).toBe('jpg');
    expect(extensionForFormat('png')).toBe('png');
    expect(extensionForFormat('webp')).toBe('webp');
    expect(extensionForFormat('avif')).toBe('avif');
  });

  it('safely extracts and replaces file extensions', () => {
    expect(getExtension('photo.JPEG')).toBe('.jpeg');
    expect(getExtension('archive.tar.gz')).toBe('.gz');
    expect(replaceExtension('photo.png', '.webp')).toBe('photo.webp');
    expect(replaceExtension('IMAGE.JPG', '.png')).toBe('IMAGE.png');
  });
});
