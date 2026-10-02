/**
 * Filename + path helpers.
 *
 * The two hard requirements from the ZIP tool spec live here because they are
 * pure logic and are therefore unit-tested without a browser:
 *
 *  1. duplicate archive entry names must be de-duplicated as `file (1).txt`
 *  2. folder uploads must preserve the relative directory structure
 */

/** Characters that are illegal in a ZIP entry or on Windows/macOS filesystems. */
const ILLEGAL_CHARS = /[<>:"|?*\u0000-\u001f]/g;
const RESERVED_WINDOWS_NAMES =
  /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.[^.]*)?$/i;

/** Replaces the extension of a filename. Handles dotfiles correctly. */
export function replaceExtension(fileName: string, extension: string): string {
  const dot = fileName.lastIndexOf('.');
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return `${stem}${ext}`;
}

/** Returns the lowercase extension including the dot, or `''` when absent. */
export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0 || dot === fileName.length - 1) return '';
  return fileName.slice(dot).toLowerCase();
}

/** Filename without its extension. `'a.b.pdf'` -> `'a.b'`. */
export function getStem(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/**
 * Splits an archive-safe base name and extension.
 * A dotfile such as `.gitignore` is treated as having no extension.
 */
export function splitName(fileName: string): { stem: string; ext: string } {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) return { stem: fileName, ext: '' };
  return { stem: fileName.slice(0, dot), ext: fileName.slice(dot) };
}

/**
 * Makes a single path segment safe for a ZIP entry: strips control characters
 * and OS-reserved characters, collapses whitespace, prevents `..` traversal,
 * trims trailing dots/spaces (invalid on Windows) and guarantees a non-empty
 * result.
 */
export function sanitizeSegment(segment: string): string {
  let safe = segment
    .replace(ILLEGAL_CHARS, '_')
    .replace(/\\/g, '/')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove any traversal attempt.
  safe = safe.replace(/^\.+$/, '').replace(/\.\.+/g, '.');

  // Windows strips trailing dots and spaces silently - do it explicitly.
  safe = safe.replace(/[. ]+$/, '');

  if (safe === '') safe = 'file';
  if (RESERVED_WINDOWS_NAMES.test(safe)) safe = `_${safe}`;
  return safe;
}

/**
 * Normalises a full relative path (as produced by a folder upload) into
 * sanitized, forward-slash-separated segments.
 *
 * `'My Docs\\2024/..\\report.pdf'` -> `'My Docs/report.pdf'`
 */
export function sanitizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment !== '' && segment !== '.')
    .map(sanitizeSegment)
    .join('/');
}

/** Directory portion of a sanitized path, `''` when the file is at the root. */
export function dirName(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? '' : path.slice(0, index);
}

/** Final segment of a sanitized path. */
export function baseName(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? path : path.slice(index + 1);
}

/** Joins already-sanitized segments, ignoring empty ones. */
export function joinPath(...parts: (string | undefined | null)[]): string {
  return parts
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .map((part) => part.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''))
    .filter((part) => part.length > 0)
    .join('/');
}

/**
 * Allocates collision-free names inside a single archive.
 *
 * The first `report.txt` keeps its name; each later duplicate becomes
 * `report (1).txt`, `report (2).txt`, ... Extensions are preserved, and the
 * counter continues past existing suffixes so a real `report (1).txt` cannot
 * be overwritten by a generated one.
 *
 * @param desiredName the wanted entry name, may include directories
 * @param taken       the set of names already used; mutated in place
 */
export function allocateUniqueName(desiredName: string, taken: Set<string>): string {
  const normalized = sanitizePath(desiredName) || 'file';
  if (!taken.has(normalized)) {
    taken.add(normalized);
    return normalized;
  }

  const dir = dirName(normalized);
  const base = baseName(normalized);
  const { stem, ext } = splitName(base);

  let counter = 1;
  // The cap is a safety valve for pathological inputs; 10k duplicates in one
  // folder is already far beyond any real archive.
  for (; counter <= 10_000; counter += 1) {
    const candidate = joinPath(dir, `${stem} (${counter})${ext}`);
    if (!taken.has(candidate)) {
      taken.add(candidate);
      return candidate;
    }
  }

  const fallback = joinPath(dir, `${stem} (${Date.now()})${ext}`);
  taken.add(fallback);
  return fallback;
}

/** Stable, filesystem-safe archive name derived from the user's input. */
export function sanitizeArchiveName(name: string, fallback = 'archive'): string {
  const withoutZip = name.replace(/\.zip$/i, '');
  const safe = sanitizeSegment(withoutZip).replace(/\//g, '-');
  return `${safe === 'file' ? fallback : safe}.zip`;
}

/**
 * Relative path used as a ZIP entry, derived from a `File`.
 *
 * `webkitRelativePath` is set by folder uploads and looks like
 * `holiday/2024/beach.jpg`; when "keep folder structure" is off we fall back to
 * the bare filename.
 */
export function entryPathFor(file: File, keepStructure: boolean): string {
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (keepStructure && relative && relative.length > 0) {
    return sanitizePath(relative);
  }
  return sanitizePath(file.name);
}

/**
 * True when a file's bytes are already compressed, so ZIP should *store* it
 * instead of wasting CPU on deflate (which would make it larger, not smaller).
 */
const COMPRESSED_EXTENSIONS = new Set([
  // images
  '.jpg', '.jpeg', '.jpe', '.png', '.gif', '.webp', '.avif', '.heic', '.heif', '.jxl', '.bmp',
  // video / audio
  '.mp4', '.m4v', '.mov', '.mkv', '.webm', '.avi', '.mpg', '.mpeg', '.wmv', '.flv',
  '.mp3', '.m4a', '.aac', '.ogg', '.oga', '.opus', '.wma', '.flac',
  // archives
  '.zip', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.rar', '.zst', '.lz', '.lzma', '.jar', '.apk',
  // office / document containers (already deflate-compressed internally)
  '.docx', '.docm', '.xlsx', '.xlsm', '.pptx', '.pptm', '.odt', '.ods', '.odp', '.epub',
  '.pdf', '.djvu',
  // other compressed formats
  '.woff', '.woff2', '.eot', '.webp2', '.jbig2', '.ccitt',
]);

/** True when {@link COMPRESSED_EXTENSIONS} contains this filename's extension. */
export function isPrecompressed(fileName: string): boolean {
  return COMPRESSED_EXTENSIONS.has(getExtension(fileName));
}

/** Extensions the browser can safely preview inline as an image. */
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.svg', '.ico',
]);

export function isImageFileName(fileName: string): boolean {
  return IMAGE_EXTENSIONS.has(getExtension(fileName));
}

/** Extensions that are definitely not images, used for the "type" column. */
export function describeFileType(file: { name: string; type: string }): string {
  const ext = getExtension(file.name);
  if (file.type && file.type !== 'application/octet-stream') {
    const subtype = file.type.split('/')[1];
    if (subtype) return subtype.replace(/^x-/, '').toUpperCase();
  }
  if (ext) return ext.slice(1).toUpperCase();
  return 'FILE';
}
