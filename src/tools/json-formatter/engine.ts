/**
 * JSON Formatter — pure parsing, formatting and statistics.
 *
 * No React and no DOM: every function takes text (or a parsed value) and
 * returns a plain result object, so the same code backs the UI, the CSV export
 * and the unit tests.
 *
 * Error reporting is the interesting part. `JSON.parse` throws a `SyntaxError`
 * whose wording changes between JavaScript engines and between engine versions:
 *
 *   - older V8:  `Unexpected token } in JSON at position 42`
 *   - newer V8:  `Unexpected token '}', "{"a":1,}" is not valid JSON`
 *   - some V8:   `Expected property name or '}' in JSON at position 1 (line 1 column 2)`
 *
 * We read whatever numbers the message offers *and* recompute the line and
 * column from the position by counting characters in the original text, so the
 * caret the user sees is always consistent with their input.
 */

import { formatBytes, formatNumber } from '@/lib/format';

export interface JsonError {
  /** Cleaned-up engine message, e.g. `Unexpected token }`. */
  message: string;
  /** 1-based line number. */
  line: number;
  /** 1-based column number. */
  column: number;
  /** Offending line plus a caret line pointing at the column. */
  snippet: string;
  /** 0-based character offset, or 0 when the engine did not report one. */
  position: number;
}

export type JsonValidation = { valid: true } | { valid: false; error: JsonError };

export type JsonIndent = 2 | 4 | '\t';

export type JsonFormatResult = { ok: true; output: string } | { ok: false; error: JsonError };

export interface JsonStats {
  /** Every value in the document, including containers. */
  nodes: number;
  /** Nesting depth; a bare scalar document has depth 1. */
  depth: number;
  /** Total number of object properties. */
  keys: number;
  arrays: number;
  objects: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  /** Size of the minified document in UTF-8 bytes. */
  bytes: number;
}

export interface JsonSizeComparison {
  savedBytes: number;
  /** Positive when the output is smaller. */
  percent: number;
  label: string;
}

/** UTF-8 byte length, counted directly so no DOM or Node API is required. */
export function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      // High surrogate: a valid pair is 4 bytes, a lone one is replaced by 3.
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/** Human description of a JSON value's type, used in error messages. */
export function describeJsonValue(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  switch (typeof value) {
    case 'object':
      return 'an object';
    case 'string':
      return 'a string';
    case 'number':
      return 'a number';
    case 'boolean':
      return 'a boolean';
    case 'undefined':
      return 'missing';
    default:
      return typeof value;
  }
}

/**
 * Works out the line and column of a character offset.
 * Columns and lines are 1-based, matching every text editor.
 */
function locate(text: string, position: number): { line: number; column: number } {
  const clamped = Math.min(Math.max(Math.trunc(position) || 0, 0), text.length);
  let line = 1;
  let lastBreak = -1;
  for (let index = 0; index < clamped; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
      lastBreak = index;
    }
  }
  return { line, column: clamped - lastBreak };
}

/** Inverse of {@link locate}: the offset of a 1-based line/column pair. */
function offsetOf(text: string, line: number, column: number): number {
  if (!Number.isFinite(line) || !Number.isFinite(column)) return 0;
  const lines = text.split('\n');
  const targetLine = Math.min(Math.max(Math.trunc(line), 1), lines.length);
  let offset = 0;
  for (let index = 0; index < targetLine - 1; index += 1) {
    offset += (lines[index] ?? '').length + 1;
  }
  return offset + Math.max(0, Math.trunc(column) - 1);
}

/** The offending line plus a caret marking the exact column. */
function buildSnippet(text: string, line: number, column: number): string {
  const lines = text.split(/\r\n|\r|\n/);
  const rawLine = (lines[line - 1] ?? '').replace(/\t/g, '  ');
  const lineText = rawLine.length > 160 ? `${rawLine.slice(0, 157)}…` : rawLine;
  const caretAt = Math.min(Math.max(column - 1, 0), Math.max(lineText.length - 1, 0));
  return `${lineText}\n${' '.repeat(caretAt)}^`;
}

/** Strips engine-specific padding from a `SyntaxError` message. */
function cleanMessage(message: string): string {
  let cleaned = message
    .replace(/,\s*"[\s\S]*"\s*is not valid JSON\.?/, '')
    .replace(/\s+at position \d+(\s*\(line \d+ column \d+\))?/, '')
    .replace(/\s+in JSON( at position \d+)?/, '')
    .replace(/\s*\(line \d+ column \d+\)/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length === 0) cleaned = 'This is not valid JSON.';
  if (!/[.!?]$/.test(cleaned)) cleaned += '.';
  return cleaned;
}

/**
 * Turns any thrown value from `JSON.parse` into a {@link JsonError}.
 * Always returns a usable line/column pair, defaulting to 1:1.
 */
export function describeJsonSyntaxError(error: unknown, text: string): JsonError {
  const raw = error instanceof Error ? error.message : String(error ?? 'Invalid JSON');
  const positionMatch = /at position (\d+)/.exec(raw);
  const lineColumnMatch = /line (\d+) column (\d+)/.exec(raw);

  let position = 0;
  let line: number;
  let column: number;

  if (positionMatch?.[1] !== undefined) {
    position = Number(positionMatch[1]);
    const located = locate(text, position);
    line = located.line;
    column = located.column;
  } else if (lineColumnMatch?.[1] !== undefined && lineColumnMatch[2] !== undefined) {
    line = Number(lineColumnMatch[1]);
    column = Number(lineColumnMatch[2]);
    position = offsetOf(text, line, column);
  } else {
    // Newer engines drop the position entirely; fall back to the start.
    line = 1;
    column = 1;
  }

  return {
    message: cleanMessage(raw),
    line,
    column,
    snippet: buildSnippet(text, line, column),
    position,
  };
}

/** A byte-order mark is legal in a file but not inside `JSON.parse`. */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; error: JsonError };

/** Parses JSON, returning an error object instead of throwing. */
export function parseJson(text: string): JsonParseResult {
  const source = stripBom(typeof text === 'string' ? text : '');
  if (source.trim().length === 0) {
    return {
      ok: false,
      error: {
        message: 'Nothing to parse yet. Paste or type some JSON.',
        line: 1,
        column: 1,
        snippet: '^',
        position: 0,
      },
    };
  }

  try {
    return { ok: true, value: JSON.parse(source) as unknown };
  } catch (error) {
    return { ok: false, error: describeJsonSyntaxError(error, source) };
  }
}

/** Validates JSON text without keeping the parsed value. */
export function validateJson(text: string): JsonValidation {
  const parsed = parseJson(text);
  return parsed.ok ? { valid: true } : { valid: false, error: parsed.error };
}

/** Indents JSON with 2 spaces, 4 spaces or a tab. */
export function formatJson(text: string, indent: JsonIndent = 2): JsonFormatResult {
  const parsed = parseJson(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    return { ok: true, output: JSON.stringify(parsed.value, null, indent) ?? 'null' };
  } catch (error) {
    return { ok: false, error: describeJsonSyntaxError(error, text) };
  }
}

/** Removes every insignificant space from the document. */
export function minifyJson(text: string): JsonFormatResult {
  const parsed = parseJson(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    return { ok: true, output: JSON.stringify(parsed.value) ?? 'null' };
  } catch (error) {
    return { ok: false, error: describeJsonSyntaxError(error, text) };
  }
}

/**
 * Sorts object keys alphabetically, recursively.
 *
 * Arrays keep their order — only the keys inside their elements are sorted —
 * because reordering an array would change the meaning of the data.
 */
export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sortKeysDeep(item));
  if (value === null || typeof value !== 'object') return value;

  const source = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort((a, b) => a.localeCompare(b))) {
    sorted[key] = sortKeysDeep(source[key]);
  }
  return sorted;
}

/** Formats JSON with every object's keys in alphabetical order. */
export function sortJsonKeys(text: string, indent: JsonIndent = 2): JsonFormatResult {
  const parsed = parseJson(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    return { ok: true, output: JSON.stringify(sortKeysDeep(parsed.value), null, indent) ?? 'null' };
  } catch (error) {
    return { ok: false, error: describeJsonSyntaxError(error, text) };
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCsvSafe(value: unknown): boolean {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/**
 * True when the value can be written as CSV: a non-empty array in which every
 * item is an object whose values are all scalars.
 */
export function canConvertToCsv(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;

  for (const row of value) {
    if (!isPlainObject(row)) return false;
    const values = Object.values(row);
    if (values.length === 0) return false;
    for (const cell of values) {
      if (!isCsvSafe(cell)) return false;
    }
  }
  return true;
}

/** Escapes one CSV cell, quoting only when it is needed. */
export function escapeCsvCell(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ''
      : typeof value === 'number'
        ? Object.is(value, -0)
          ? '0'
          : String(value)
        : typeof value === 'boolean'
          ? value
            ? 'true'
            : 'false'
          : String(value);

  const needsQuotes = /[",\r\n]/.test(text) || /^\s|\s$/.test(text);
  if (!needsQuotes) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Converts an array of flat objects into CSV, using the union of all keys as
 * the header row. Throws a plain `Error` with an explanation when the shape is
 * not convertible, so the caller can show it verbatim.
 */
export function jsonToCsv(value: unknown): string {
  if (!Array.isArray(value)) {
    throw new Error(
      `CSV export needs a JSON array of flat objects, but this document is ${describeJsonValue(
        value
      )}. Wrap the data in an array, or copy it as JSON instead.`
    );
  }
  if (value.length === 0) {
    throw new Error('The array is empty, so there is nothing to convert to CSV.');
  }

  const headers: string[] = [];
  value.forEach((row, index) => {
    if (!isPlainObject(row)) {
      throw new Error(
        `Every item in the array must be an object. Item ${index + 1} is ${describeJsonValue(row)}.`
      );
    }
    for (const [key, cell] of Object.entries(row)) {
      if (!isCsvSafe(cell)) {
        throw new Error(
          `The value of "${key}" in item ${index + 1} is ${describeJsonValue(
            cell
          )}. Flatten nested data first, then convert again.`
        );
      }
      if (!headers.includes(key)) headers.push(key);
    }
  });

  if (headers.length === 0) {
    throw new Error('The objects in this array have no properties, so there are no columns to write.');
  }

  const lines: string[] = [headers.map((header) => escapeCsvCell(header)).join(',')];
  for (const row of value as Record<string, unknown>[]) {
    lines.push(headers.map((header) => escapeCsvCell(row[header] ?? null)).join(','));
  }
  return lines.join('\r\n');
}

/** Walks a parsed value and counts everything the statistics panel shows. */
export function getJsonStats(value: unknown): JsonStats {
  const stats: JsonStats = {
    nodes: 0,
    depth: 0,
    keys: 0,
    arrays: 0,
    objects: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    bytes: 0,
  };

  const walk = (node: unknown, level: number): void => {
    stats.nodes += 1;
    if (level > stats.depth) stats.depth = level;

    if (node === null) {
      stats.nulls += 1;
      return;
    }

    if (Array.isArray(node)) {
      stats.arrays += 1;
      for (const item of node) walk(item, level + 1);
      return;
    }

    switch (typeof node) {
      case 'object': {
        stats.objects += 1;
        for (const child of Object.values(node as Record<string, unknown>)) {
          stats.keys += 1;
          walk(child, level + 1);
        }
        return;
      }
      case 'string':
        stats.strings += 1;
        return;
      case 'number':
        stats.numbers += 1;
        return;
      case 'boolean':
        stats.booleans += 1;
        return;
      default:
        return;
    }
  };

  if (value !== undefined) walk(value, 1);

  try {
    const serialised = JSON.stringify(value);
    stats.bytes = serialised === undefined ? 0 : utf8ByteLength(serialised);
  } catch {
    stats.bytes = 0;
  }

  return stats;
}

/** Compares two sizes and produces a plain-English label. */
export function formatBytesSaved(beforeBytes: number, afterBytes: number): JsonSizeComparison {
  const before = Number.isFinite(beforeBytes) ? Math.max(0, beforeBytes) : 0;
  const after = Number.isFinite(afterBytes) ? Math.max(0, afterBytes) : 0;
  const savedBytes = before - after;
  const percent = before > 0 ? (savedBytes / before) * 100 : 0;
  const roundedPercent = Object.is(Math.round(percent), -0) ? 0 : Math.round(percent);

  let label: string;
  if (before === 0) label = 'nothing to compare yet';
  else if (savedBytes > 0) label = `${formatBytes(savedBytes)} smaller (${formatNumber(percent, 1)}%)`;
  else if (savedBytes < 0) {
    label = `${formatBytes(-savedBytes)} larger (${formatNumber(-percent, 1)}%)`;
  } else label = 'exactly the same size';

  return { savedBytes, percent: roundedPercent, label };
}
