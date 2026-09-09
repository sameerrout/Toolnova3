export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'FILE_CORRUPTED'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'EMPTY_FILE'
  | 'PROCESSING_FAILED'
  | 'PROCESSING_CANCELLED'
  | 'WORKER_CRASHED'
  | 'OUT_OF_MEMORY'
  | 'NETWORK_ERROR'
  | 'TOOL_NOT_FOUND'
  | 'TOOL_LOAD_ERROR'
  | 'TOOL_INCOMPATIBLE'
  | 'UNKNOWN_ERROR';

export interface AppErrorOptions {
  code: ErrorCode;
  userMessage: string;
  retryable?: boolean;
  technicalDetails?: string;
  cause?: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly userMessage: string;
  public readonly retryable: boolean;
  public readonly technicalDetails?: string;

  constructor(options: AppErrorOptions) {
    super(options.userMessage);
    this.name = 'AppError';
    this.code = options.code;
    this.userMessage = options.userMessage;
    this.retryable = options.retryable ?? false;
    this.technicalDetails = options.technicalDetails;
    if (options.cause) {
      this.cause = options.cause;
    }
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Sanitizes the error for public presentation, ensuring no stack traces
   * or sensitive runtime paths are exposed to end users.
   */
  public toUserSafe(): { code: ErrorCode; message: string; retryable: boolean } {
    return {
      code: this.code,
      message: this.userMessage,
      retryable: this.retryable,
    };
  }
}

/**
 * Normalizes any unknown thrown exception into an AppError with a safe user message.
 */
export function normalizeError(err: unknown, fallbackMessage = 'An unexpected error occurred.'): AppError {
  if (err instanceof AppError) {
    return err;
  }
  if (err instanceof Error) {
    return new AppError({
      code: 'UNKNOWN_ERROR',
      userMessage: fallbackMessage,
      retryable: true,
      technicalDetails: err.message,
      cause: err,
    });
  }
  return new AppError({
    code: 'UNKNOWN_ERROR',
    userMessage: fallbackMessage,
    retryable: true,
    technicalDetails: String(err),
  });
}

