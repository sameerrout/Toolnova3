/**
 * Error model.
 *
 * Workers can only post structured-cloneable values, so a typed error class is
 * not enough: we serialize failures to a plain {@link SerializedAppError} and
 * rebuild them on the main thread. Every message a user can see comes from
 * here, so the wording stays plain, non-technical and actionable.
 */

export type AppErrorCode =
  | 'UNSUPPORTED_TYPE'
  | 'FILE_TOO_LARGE'
  | 'TOO_MANY_FILES'
  | 'TOTAL_TOO_LARGE'
  | 'EMPTY_FILE'
  | 'CORRUPT_FILE'
  | 'PASSWORD_REQUIRED'
  | 'INVALID_INPUT'
  | 'NO_FILES'
  | 'OUT_OF_MEMORY'
  | 'UNSUPPORTED_DEVICE'
  | 'WORKER_FAILED'
  | 'CANCELLED'
  | 'MODEL_DOWNLOAD_FAILED'
  | 'NETWORK'
  | 'UNKNOWN';

export interface SerializedAppError {
  name: 'AppError';
  code: AppErrorCode;
  message: string;
  /** Optional second line with a concrete next step. */
  hint?: string;
  /** File the error relates to, when applicable. */
  fileName?: string;
}

const DEFAULT_HINTS: Partial<Record<AppErrorCode, string>> = {
  UNSUPPORTED_TYPE: 'Check the accepted formats listed above the file picker.',
  FILE_TOO_LARGE: 'Try a smaller file, or split it into parts first.',
  TOO_MANY_FILES: 'Process the files in smaller batches.',
  TOTAL_TOO_LARGE: 'Remove some files and try again.',
  EMPTY_FILE: 'The file is 0 bytes - it may still be uploading or was saved incorrectly.',
  CORRUPT_FILE: 'The file looks damaged. Try opening it in another app to confirm.',
  PASSWORD_REQUIRED: 'Remove the password in a PDF reader, then try again.',
  INVALID_INPUT: 'Double-check the values you entered.',
  NO_FILES: 'Add at least one file to continue.',
  OUT_OF_MEMORY:
    'Close other browser tabs to free memory, then retry with fewer or smaller files.',
  UNSUPPORTED_DEVICE: 'This tool needs a browser with Web Worker and canvas support.',
  WORKER_FAILED: 'Reload the page and try again. Your files were never uploaded.',
  CANCELLED: undefined,
  MODEL_DOWNLOAD_FAILED: 'Check your connection, then retry. The download is cached afterwards.',
  NETWORK: 'Check your connection and try again.',
  UNKNOWN: 'Reload the page and try again. Nothing was uploaded.',
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly hint?: string;
  readonly fileName?: string;

  constructor(code: AppErrorCode, message: string, options?: { hint?: string; fileName?: string }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.hint = options?.hint ?? DEFAULT_HINTS[code];
    this.fileName = options?.fileName;
  }

  toJSON(): SerializedAppError {
    return {
      name: 'AppError',
      code: this.code,
      message: this.message,
      hint: this.hint,
      fileName: this.fileName,
    };
  }

  static from(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (isSerializedAppError(error)) {
      return new AppError(error.code, error.message, {
        hint: error.hint,
        fileName: error.fileName,
      });
    }
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new AppError('CANCELLED', 'Cancelled.');
      }
      return new AppError('UNKNOWN', error.message || 'Something went wrong.');
    }
    return new AppError('UNKNOWN', 'Something went wrong.');
  }
}

export function isSerializedAppError(value: unknown): value is SerializedAppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { name?: unknown }).name === 'AppError' &&
    typeof (value as { code?: unknown }).code === 'string' &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

/** True when the failure was a deliberate user cancellation. */
export function isCancellation(error: unknown): boolean {
  const app = AppError.from(error);
  return app.code === 'CANCELLED';
}

/**
 * Maps a `DOMException` / low-level browser failure to a friendly AppError.
 * Used around canvas + WebAssembly calls, which throw opaque messages.
 */
export function mapBrowserError(error: unknown, fileName?: string): AppError {
  if (error instanceof AppError) return error;

  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes('out of memory') || lower.includes('allocation failed')) {
    return new AppError('OUT_OF_MEMORY', 'This file needs more memory than the browser can give.', {
      fileName,
    });
  }
  if (lower.includes('password') || lower.includes('encrypted')) {
    return new AppError('PASSWORD_REQUIRED', 'This document is password protected.', { fileName });
  }
  if (lower.includes('invalid pdf') || lower.includes('failed to parse')) {
    return new AppError('CORRUPT_FILE', 'This file could not be read as a valid document.', {
      fileName,
    });
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return new AppError('NETWORK', 'A required download failed.', { fileName });
  }
  return new AppError('UNKNOWN', raw || 'Something went wrong.', { fileName });
}
