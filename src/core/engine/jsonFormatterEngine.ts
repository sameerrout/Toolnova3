/**
 * Toolino JSON Formatter, Validator & Converter Engine
 * 100% Client-Side Processing
 */

export interface JsonParseError {
  isValid: false;
  message: string;
  line: number;
  column: number;
}

export interface JsonParseSuccess {
  isValid: true;
  parsed: any;
  sizeBytes: number;
  keysCount: number;
  depth: number;
}

export type JsonValidationResult = JsonParseError | JsonParseSuccess;

export type IndentOption = '2-spaces' | '4-spaces' | 'tab' | 'minify';

/**
 * Calculates max nesting depth of a parsed object or array
 */
export function getObjectDepth(obj: any): number {
  if (obj === null || typeof obj !== 'object') return 0;
  let max = 0;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      max = Math.max(max, getObjectDepth(obj[key]));
    }
  }
  return 1 + max;
}

/**
 * Counts total keys recursively in an object or array
 */
export function countObjectKeys(obj: any): number {
  if (obj === null || typeof obj !== 'object') return 0;
  let count = 0;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      count++;
      count += countObjectKeys(obj[key]);
    }
  }
  return count;
}

/**
 * Validates JSON and extracts exact line and column of syntax errors
 */
export function validateJson(rawText: string): JsonValidationResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      isValid: false,
      message: 'JSON input is empty.',
      line: 1,
      column: 1,
    };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const keysCount = countObjectKeys(parsed);
    const depth = getObjectDepth(parsed);

    return {
      isValid: true,
      parsed,
      sizeBytes: new Blob([trimmed]).size,
      keysCount,
      depth,
    };
  } catch (err: any) {
    const msg: string = err.message || 'SyntaxError: Invalid JSON';

    // Parse line and column from error message if available (e.g. "at position 42" or "line 3 column 5")
    let line = 1;
    let column = 1;

    // Pattern: "at position 123"
    const posMatch = msg.match(/at position (\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const lines = trimmed.slice(0, pos).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    } else {
      // Pattern: "line 2 column 5"
      const lineColMatch = msg.match(/line (\d+) column (\d+)/i);
      if (lineColMatch) {
        line = parseInt(lineColMatch[1], 10);
        column = parseInt(lineColMatch[2], 10);
      }
    }

    return {
      isValid: false,
      message: msg,
      line,
      column,
    };
  }
}

/**
 * Formats JSON with customizable indentation (2 spaces, 4 spaces, tab, minify)
 */
export function formatJson(rawText: string, indent: IndentOption): string {
  const val = validateJson(rawText);
  if (!val.isValid) {
    throw new Error(val.message);
  }

  switch (indent) {
    case '2-spaces':
      return JSON.stringify(val.parsed, null, 2);
    case '4-spaces':
      return JSON.stringify(val.parsed, null, 4);
    case 'tab':
      return JSON.stringify(val.parsed, null, '\t');
    case 'minify':
      return JSON.stringify(val.parsed);
    default:
      return JSON.stringify(val.parsed, null, 2);
  }
}

/**
 * Automatically repairs common JSON syntax mistakes:
 * - Trailing commas in arrays and objects
 * - Single quotes instead of double quotes
 * - Unquoted object keys
 * - JS/Python booleans (True, False, None)
 * - Single line and block comments
 */
export function repairJson(rawText: string): string {
  let cleaned = rawText;

  // 1. Remove single-line comments // ...
  cleaned = cleaned.replace(/\/\/[^\n\r]*/g, '');

  // 2. Remove multi-line comments /* ... */
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

  // 3. Replace Python constants: True, False, None
  cleaned = cleaned.replace(/\bTrue\b/g, 'true');
  cleaned = cleaned.replace(/\bFalse\b/g, 'false');
  cleaned = cleaned.replace(/\bNone\b/g, 'null');

  // 4. Replace single quotes with double quotes around string literals
  // Matches 'something' where neither quote is escaped
  cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

  // 5. Quote unquoted keys (e.g. { name: "John" } -> { "name": "John" })
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_$-]+)\s*:/g, '$1"$2":');

  // 6. Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // Test if repaired output is valid
  const testVal = validateJson(cleaned);
  if (testVal.isValid) {
    return JSON.stringify(testVal.parsed, null, 2);
  }

  return cleaned;
}

/**
 * Converts JSON to CSV format (flattens array of objects)
 */
export function jsonToCsv(parsed: any): string {
  let items: any[] = [];

  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    // If object with an array property, use that array
    const arrayProp = Object.values(parsed).find((v) => Array.isArray(v));
    if (arrayProp) {
      items = arrayProp as any[];
    } else {
      items = [parsed];
    }
  } else {
    throw new Error('JSON must be an array or object to convert to CSV');
  }

  if (items.length === 0) return '';

  // Collect all unique keys
  const headers = Array.from(
    new Set(
      items.flatMap((item) =>
        typeof item === 'object' && item !== null ? Object.keys(item) : ['value']
      )
    )
  );

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCsv).join(',');
  const rows = items.map((item) => {
    if (typeof item !== 'object' || item === null) {
      return escapeCsv(item);
    }
    return headers.map((h) => escapeCsv(item[h])).join(',');
  });

  return [headerRow, ...rows].join('\n');
}

/**
 * Converts JSON to clean XML format
 */
export function jsonToXml(parsed: any, rootName = 'root'): string {
  const toXml = (obj: any, tagName: string, indent = 0): string => {
    const spaces = ' '.repeat(indent);
    if (obj === null || obj === undefined) {
      return `${spaces}<${tagName}/>`;
    }
    if (typeof obj !== 'object') {
      const safe = String(obj)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `${spaces}<${tagName}>${safe}</${tagName}>`;
    }

    if (Array.isArray(obj)) {
      return obj
        .map((item) => toXml(item, 'item', indent))
        .join('\n');
    }

    const children = Object.entries(obj)
      .map(([k, v]) => {
        const safeTag = k.replace(/[^a-zA-Z0-9_-]/g, '_');
        return toXml(v, safeTag, indent + 2);
      })
      .join('\n');

    return `${spaces}<${tagName}>\n${children}\n${spaces}</${tagName}>`;
  };

  return `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(parsed, rootName, 0)}`;
}

/**
 * Converts JSON to clean YAML representation
 */
export function jsonToYaml(parsed: any, indent = 0): string {
  let target = parsed;
  if (indent === 0 && typeof target === 'string') {
    try {
      const obj = JSON.parse(target);
      if (typeof obj === 'object' && obj !== null) target = obj;
    } catch {
      // not a json string
    }
  }
  const spaces = ' '.repeat(indent);

  if (target === null) return `${spaces}null`;
  if (typeof target !== 'object') {
    if (typeof target === 'string') {
      if (target.includes('\n') || target.includes(':') || target.includes('#')) {
        return `${spaces}"${target.replace(/"/g, '\\"')}"`;
      }
      return `${spaces}${target}`;
    }
    return `${spaces}${target}`;
  }

  if (Array.isArray(target)) {
    if (target.length === 0) return `${spaces}[]`;
    return target
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const itemYaml = jsonToYaml(item, indent + 2).trimStart();
          return `${spaces}- ${itemYaml}`;
        }
        return `${spaces}- ${String(item)}`;
      })
      .join('\n');
  }

  const entries = Object.entries(target);
  if (entries.length === 0) return `${spaces}{}`;

  return entries
    .map(([k, v]) => {
      const keyStr = `${spaces}${k}:`;
      if (v !== null && typeof v === 'object') {
        const childYaml = jsonToYaml(v, indent + 2);
        if (Array.isArray(v)) {
          return `${keyStr}\n${childYaml}`;
        }
        return `${keyStr}\n${childYaml}`;
      }
      return `${keyStr} ${String(v)}`;
    })
    .join('\n');
}

/**
 * Sample JSON templates
 */
export const SAMPLE_JSON_TEMPLATES = {
  ecommerceOrder: {
    order_id: 'ORD-2026-98124',
    customer: {
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      membership: 'VIP Gold',
    },
    items: [
      { id: 'PROD-01', name: 'Ultra-Light Titanium Watch', quantity: 1, price: 289.99 },
      { id: 'PROD-02', name: 'Leather Charging Sleeve', quantity: 2, price: 34.5 },
    ],
    summary: {
      subtotal: 358.99,
      tax: 28.72,
      shipping: 0.0,
      total: 387.71,
    },
    status: 'SHIPPED',
    tracking: 'TRK-9812481-US',
  },
  userProfile: {
    user_id: 'usr_89a0f41',
    username: 'alex_developer',
    email: 'alex.dev@toolnova.com',
    profile: {
      bio: 'Full-stack cloud architect & open-source contributor',
      location: 'San Francisco, CA',
      skills: ['TypeScript', 'Next.js', 'WebAssembly', 'TailwindCSS'],
      active: true,
      last_login: '2026-09-29T21:45:00Z',
    },
  },
  apiResponse: {
    status: 'success',
    code: 200,
    pagination: {
      page: 1,
      per_page: 25,
      total_records: 1250,
      total_pages: 50,
    },
    data: [
      { id: 101, title: 'Optimizing Canvas Graphics', read_time_min: 4 },
      { id: 102, title: 'Biometric Passport Layouts', read_time_min: 7 },
      { id: 103, title: 'Client-Side Neural Segmentation', read_time_min: 12 },
    ],
  },
};
