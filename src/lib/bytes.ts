/**
 * Object-URL + blob lifecycle bookkeeping.
 *
 * Every tool creates temporary object URLs (previews, downloads, worker blobs).
 * On a 2 GB phone, leaking a few of these is the difference between working and
 * a crashed tab, so all of them are registered here and revoked in one call
 * after a job finishes or the component unmounts.
 */

export class UrlRegistry {
  private readonly urls = new Set<string>();

  /** Creates an object URL and tracks it for later revocation. */
  create(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  /** Revokes one URL and stops tracking it. Safe to call twice. */
  revoke(url: string | null | undefined): void {
    if (!url) return;
    if (!this.urls.has(url)) return;
    URL.revokeObjectURL(url);
    this.urls.delete(url);
  }

  /** Revokes everything. Call from `useEffect` cleanup and after downloads. */
  revokeAll(): void {
    for (const url of this.urls) URL.revokeObjectURL(url);
    this.urls.clear();
  }

  get size(): number {
    return this.urls.size;
  }
}

/**
 * Triggers a browser download for a blob or an existing object URL.
 *
 * Uses a real `<a download>` click - no window.open, no redirect, no interstitial
 * page. That matters for AdSense review: the download must be exactly what the
 * user asked for.
 */
export function triggerDownload(url: string, fileName: string): void {
  if (typeof document === 'undefined') return;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/** Converts a blob to a data URL. Only for small text/JSON payloads. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the generated file.'));
    reader.readAsDataURL(blob);
  });
}

/** Reads a blob as UTF-8 text with a hard cap so a 500 MB file cannot hang the tab. */
export async function blobToText(blob: Blob, maxBytes = 32 * 1024 * 1024): Promise<string> {
  const slice = blob.size > maxBytes ? blob.slice(0, maxBytes) : blob;
  return slice.text();
}

/** Reads a blob as an ArrayBuffer. */
export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

/**
 * Releases a canvas eagerly. Setting both dimensions to 1x1 is the only
 * cross-browser way to force Safari and Chromium to free the backing store
 * before garbage collection runs.
 */
export function releaseCanvas(canvas: HTMLCanvasElement | OffscreenCanvas | null): void {
  if (!canvas) return;
  try {
    canvas.width = 1;
    canvas.height = 1;
  } catch {
    // Some browsers throw on detached OffscreenCanvas - nothing to do.
  }
}

/** Prompts the user for a save location using the File System Access API. */
export interface FileSystemWritableSink {
  write: (chunk: Uint8Array) => Promise<void>;
  close: () => Promise<void>;
  abort: () => Promise<void>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}

interface FileSystemFileHandleLike {
  createWritable: () => Promise<{
    write: (data: Uint8Array | Blob) => Promise<void>;
    close: () => Promise<void>;
    abort: () => Promise<void>;
  }>;
}

type WindowWithFilePicker = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandleLike>;
};

/** True when the browser can stream a download straight to disk. */
export function supportsFileSystemAccess(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as WindowWithFilePicker).showSaveFilePicker === 'function'
  );
}

/**
 * Opens a disk-backed sink so an archive never has to fit in memory.
 * Returns `null` when the user cancels the picker or the API is unavailable,
 * letting the caller fall back to an in-memory blob.
 */
export async function openDiskSink(
  suggestedName: string,
  mimeType: string
): Promise<FileSystemWritableSink | null> {
  const picker = (window as WindowWithFilePicker).showSaveFilePicker;
  if (typeof picker !== 'function') return null;

  const extension = suggestedName.slice(suggestedName.lastIndexOf('.'));
  let handle: FileSystemFileHandleLike;
  try {
    handle = await picker({
      suggestedName,
      types: [{ description: 'File', accept: { [mimeType]: [extension] } }],
    });
  } catch {
    // AbortError when the user closes the picker - caller falls back in memory.
    return null;
  }

  const writable = await handle.createWritable();
  return {
    write: (chunk: Uint8Array) => writable.write(chunk),
    close: () => writable.close(),
    abort: () => writable.abort(),
  };
}

/**
 * True when the page is running from a `file://` URL. Blob downloads and
 * workers are restricted there, so the UI shows an explicit warning.
 */
export function isFileProtocol(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'file:';
}
