/** Formatting helpers shared by every tool's UI. Pure functions, unit-tested. */

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Formats a byte count the way a file manager does: binary units, one decimal
 * above 10, and no trailing `.0`.
 *
 * `formatBytes(0)` -> `'0 B'`, `formatBytes(1536)` -> `'1.5 KB'`.
 */
export function formatBytes(bytes: number, fractionDigits?: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;

  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = fractionDigits ?? (value >= 100 ? 0 : value >= 10 ? 1 : 2);
  const rounded = value.toFixed(digits).replace(/\.0+$/, '');
  return `${rounded} ${BYTE_UNITS[unitIndex]}`;
}

/** Compact duration for progress text: `820 ms`, `4.2 s`, `1 m 12 s`. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0 ms';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds >= 10 ? 0 : 1)} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes} m ${rest.toString().padStart(2, '0')} s`;
}

/** `0.4281` -> `'43%'`. Clamped to 0..100. */
export function formatPercent(ratio: number): string {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));
  return `${Math.round(clamped * 100)}%`;
}

/** Signed percentage change, e.g. `-62%` for a compression result. */
export function formatDelta(from: number, to: number): string {
  if (from <= 0) return '0%';
  const delta = ((to - from) / from) * 100;
  const rounded = Math.round(delta);
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

/** `12.4` -> `'12.4'`, `12.0` -> `'12'` (avoids noisy `.0` in results). */
export function formatNumber(value: number, maxDigits = 2): string {
  if (!Number.isFinite(value)) return '0';
  return Number(value.toFixed(maxDigits)).toString();
}

/**
 * Currency-ish display without forcing a locale on the user.
 * Uses `Intl.NumberFormat` with 2 decimals and the caller's symbol.
 */
export function formatMoney(value: number, symbol = '$', maxDigits = 2): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${symbol}${safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDigits,
  })}`;
}

/** Long, human date used by the calculators and the blog index. */
export function formatDate(
  input: Date | string | number,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/** `2024-03-09` - stable, sortable, used in `<time dateTime>`. */
export function toIsoDate(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/** Single-line preview for file lists / diff panes. */
export function truncate(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

/**
 * Keeps a filename readable when the middle is more informative than the end
 * (long camera / scan filenames), preserving the extension.
 */
export function truncateMiddle(text: string, max = 42): string {
  if (text.length <= max) return text;
  const dot = text.lastIndexOf('.');
  const ext = dot > 0 ? text.slice(dot) : '';
  const stem = dot > 0 ? text.slice(0, dot) : text;
  const keep = Math.max(4, Math.floor((max - ext.length - 1) / 2));
  return `${stem.slice(0, keep)}…${stem.slice(-keep)}${ext}`;
}
