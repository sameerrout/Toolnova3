/**
 * Shared client logic for the batch image tools.
 *
 * Compress Image, Resize Image, Convert Image and Passport Photo all need the
 * same loop: validate, decode, transform, collect a result, yield to the browser
 * every few files, and revoke everything at the end. That loop lives here so all
 * four tools behave identically under memory pressure and cancellation.
 */

import { JobReporter, runPool } from '@/lib/progress';
import { AppError, mapBrowserError } from '@/lib/errors';
import { formatBytes, formatDelta } from '@/lib/format';
import { replaceExtension } from '@/lib/filenames';
import {
  closeBitmap,
  decodeImage,
  encodeToTargetSize,
  fitWithin,
  transformImage,
  type OutputImageFormat,
  type TransformOptions,
} from '@/lib/imageClient';

export interface ImageJobInput {
  file: File;
  /** Final output filename, already resolved by the caller. */
  outputName: string;
}

export interface ImageJobOutput {
  /** Original file, kept for the before/after comparison. */
  source: File;
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  bytes: number;
  /** Bytes saved versus the original; negative when the output grew. */
  saved: number;
  /** Populated when this item failed; the job continues for the rest. */
  error?: string;
}

export interface ImageTransformSpec {
  format: OutputImageFormat;
  quality: number;
  /** Exact output size, when the tool is resizing to a fixed dimension. */
  width?: number;
  height?: number;
  /** Fitting rules when an exact size is not given. */
  fit?: { maxWidth?: number; maxHeight?: number; maxEdge?: number };
  /** Exact output size target in bytes; enables the binary-search encoder. */
  targetBytes?: number;
  background?: string;
  preserveTransparency?: boolean;
  maxEdge: number;
}

/**
 * Processes a batch of images.
 *
 * Failures are per-item: one corrupt file does not abort the whole batch, which
 * is what users expect when they drop forty photos in at once. The item's
 * `error` is populated instead and shown inline in the file list.
 */
export async function processImageBatch(
  inputs: ImageJobInput[],
  spec: ImageTransformSpec,
  reporter: JobReporter,
  concurrency: number
): Promise<ImageJobOutput[]> {
  if (inputs.length === 0) {
    throw new AppError('NO_FILES', 'Add at least one image to continue.');
  }

  reporter.beginStage('Processing images', 0.95);

  return runPool(
    inputs,
    Math.max(1, concurrency),
    async (input, index): Promise<ImageJobOutput> => {
      const base: ImageJobOutput = {
        source: input.file,
        blob: input.file,
        fileName: input.outputName,
        width: 0,
        height: 0,
        bytes: input.file.size,
        saved: 0,
      };

      try {
        const result = await transformOne(input.file, spec);
        const output: ImageJobOutput = {
          source: input.file,
          blob: result.blob,
          fileName: input.outputName,
          width: result.width,
          height: result.height,
          bytes: result.blob.size,
          saved: input.file.size - result.blob.size,
        };
        reporter.reportItems(index + 1, inputs.length, `${index + 1} of ${inputs.length}`);
        return output;
      } catch (error) {
        const appError = mapBrowserError(error, input.file.name);
        base.error = appError.message;
        reporter.reportItems(index + 1, inputs.length, `${index + 1} of ${inputs.length}`);
        return base;
      }
    },
    reporter
  );
}

/** Runs one image through the transform, choosing the size-target path when set. */
export async function transformOne(
  file: File,
  spec: ImageTransformSpec
): Promise<{ blob: Blob; width: number; height: number }> {
  // The size-target path needs the bitmap and the canvas at the same time, so it
  // owns its own decode and cleanup.
  if (spec.targetBytes && spec.targetBytes > 0) {
    let bitmap: Awaited<ReturnType<typeof decodeImage>> | null = null;
    try {
      bitmap = await decodeImage(file);
      const size =
        typeof ImageBitmap !== 'undefined' && bitmap instanceof ImageBitmap
          ? { width: bitmap.width, height: bitmap.height }
          : {
              width: (bitmap as HTMLImageElement).naturalWidth,
              height: (bitmap as HTMLImageElement).naturalHeight,
            };

      const fitted = fitWithin(size.width, size.height, {
        maxWidth: spec.width ?? spec.fit?.maxWidth,
        maxHeight: spec.height ?? spec.fit?.maxHeight,
        maxEdge: spec.maxEdge > 0 ? spec.maxEdge : spec.fit?.maxEdge,
      });

      const result = await encodeToTargetSize(
        bitmap,
        fitted.width,
        fitted.height,
        spec.format,
        spec.targetBytes,
        spec.maxEdge,
        spec.background ?? '#ffffff'
      );
      return { blob: result.blob, width: result.width, height: result.height };
    } finally {
      closeBitmap(bitmap);
    }
  }

  const options: TransformOptions = {
    format: spec.format,
    quality: spec.quality,
    width: spec.width,
    height: spec.height,
    fit: spec.fit,
    maxEdge: spec.maxEdge,
    background: spec.background,
    preserveTransparency: spec.preserveTransparency,
  };

  return transformImage(file, options);
}

/** Output filename for a converted image, preserving the extension semantics. */
export function imageOutputName(
  originalName: string,
  format: OutputImageFormat,
  prefix = ''
): string {
  const extension = format === 'jpeg' ? 'jpg' : format;
  const base = replaceExtension(originalName, extension);
  return prefix ? `${prefix}-${base}` : base;
}

/** One-line before/after summary used in the results table. */
export function describeImageResult(output: ImageJobOutput): string {
  if (output.error) return output.error;
  const delta = output.saved === 0 ? '' : ` (${formatDelta(output.source.size, output.bytes)})`;
  return `${output.width}×${output.height} · ${formatBytes(output.bytes)}${delta}`;
}

/** Aggregate statistics for the batch summary. */
export function summariseBatch(outputs: ImageJobOutput[]): {
  succeeded: number;
  failed: number;
  inputBytes: number;
  outputBytes: number;
  savedBytes: number;
  savedPercent: number;
} {
  const succeeded = outputs.filter((output) => !output.error);
  const inputBytes = succeeded.reduce((total, output) => total + output.source.size, 0);
  const outputBytes = succeeded.reduce((total, output) => total + output.bytes, 0);
  const savedBytes = inputBytes - outputBytes;
  return {
    succeeded: succeeded.length,
    failed: outputs.length - succeeded.length,
    inputBytes,
    outputBytes,
    savedBytes,
    savedPercent: inputBytes > 0 ? (savedBytes / inputBytes) * 100 : 0,
  };
}
