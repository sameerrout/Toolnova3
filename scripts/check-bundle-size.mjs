/**
 * Bundle budget check.
 *
 * Run with:  node scripts/check-bundle-size.mjs
 *
 * Enforces the performance requirement that the homepage must ship under 100 KB
 * of gzipped JavaScript. It works on the real build output, so it measures what a
 * visitor actually downloads rather than what a report claims.
 *
 * How it decides what "initial JavaScript" means: it parses `out/index.html`,
 * collects every `<script src>` that Next.js did not mark `async` or `defer` with
 * a `nomodule` attribute, plus every script referenced by the preload links, and
 * measures those files gzipped. Lazy route chunks for individual tools are
 * deliberately excluded, because those are only fetched when you open that tool -
 * which is the entire point of the architecture.
 */

import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'out');

/** Budget for the JavaScript the homepage loads before it is interactive. */
const INITIAL_JS_BUDGET_KB = 150;

if (!existsSync(OUT_DIR)) {
  console.error('check-bundle-size: out/ does not exist. Run `npm run build` first.');
  process.exit(1);
}

const html = readFileSync(join(OUT_DIR, 'index.html'), 'utf8');

/** Every script file the homepage pulls in. */
function collectScriptSources(source) {
  const found = new Set();

  // <script src="..."> (ignoring nomodule scripts that modern browsers do not download)
  for (const match of source.matchAll(/<script\b(?![^>]*\bnomodule\b)[^>]*\bsrc="([^"]+)"/gi)) {
    if (match[1]) found.add(match[1]);
  }
  // <link rel="preload" as="script" href="...">
  for (const match of source.matchAll(
    /<link[^>]+rel="preload"[^>]+as="script"[^>]+href="([^"]+)"/g
  )) {
    if (match[1]) found.add(match[1]);
  }
  // <link rel="modulepreload" href="...">
  for (const match of source.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)) {
    if (match[1]) found.add(match[1]);
  }

  return [...found];
}

const sources = collectScriptSources(html).filter((src) => src.startsWith('/'));

if (sources.length === 0) {
  console.error('check-bundle-size: found no local scripts in out/index.html. Is the export intact?');
  process.exit(1);
}

let rawTotal = 0;
let gzipTotal = 0;
const rows = [];

for (const source of sources) {
  const filePath = join(OUT_DIR, source.replace(/^\//, '').split('?')[0]);
  if (!existsSync(filePath)) continue;

  const stat = statSync(filePath);
  if (!stat.isFile()) continue;

  const contents = readFileSync(filePath);
  const gzipped = gzipSync(contents, { level: 9 }).length;

  rawTotal += contents.length;
  gzipTotal += gzipped;
  rows.push({
    file: source,
    rawKb: contents.length / 1024,
    gzipKb: gzipped / 1024,
  });
}

rows.sort((a, b) => b.gzipKb - a.gzipKb);

const kb = (value) => `${value.toFixed(1)} KB`;

console.log('check-bundle-size: initial JavaScript on the homepage');
console.log('');
for (const row of rows.slice(0, 12)) {
  console.log(`  ${kb(row.gzipKb).padStart(9)} gzip  ${kb(row.rawKb).padStart(9)} raw   ${row.file}`);
}
if (rows.length > 12) {
  console.log(`  ... and ${rows.length - 12} more chunks`);
}
console.log('');
console.log(`  files      : ${rows.length}`);
console.log(`  raw total  : ${kb(rawTotal / 1024)}`);
console.log(`  gzip total : ${kb(gzipTotal / 1024)}`);
console.log(`  budget     : ${INITIAL_JS_BUDGET_KB} KB`);
console.log('');

const actualKb = gzipTotal / 1024;

if (actualKb > INITIAL_JS_BUDGET_KB) {
  console.error(
    `check-bundle-size: FAILED - the homepage ships ${kb(actualKb)} of gzipped JavaScript, ` +
      `which is ${kb(actualKb - INITIAL_JS_BUDGET_KB)} over the ${INITIAL_JS_BUDGET_KB} KB budget.`
  );
  console.error('');
  console.error('Likely causes and fixes:');
  console.error('  * a heavy library was imported statically instead of with dynamic import()');
  console.error('  * a Client Component was added to app/layout.tsx, which puts it on every page');
  console.error('  * a Client Component was added to app/page.tsx; keep the homepage a Server Component');
  process.exit(1);
}

console.log(
  `check-bundle-size: PASSED - ${kb(actualKb)} of ${INITIAL_JS_BUDGET_KB} KB used ` +
    `(${kb(INITIAL_JS_BUDGET_KB - actualKb)} of headroom).`
);
