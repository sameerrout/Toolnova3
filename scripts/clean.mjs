/**
 * Removes build output and caches.
 *
 * Run with:  npm run clean
 *
 * Deliberately conservative: it only ever deletes paths this project owns, and it
 * prints each one before removing it. `public/` is never touched because it holds
 * committed source assets (ads.txt, favicon.svg) alongside generated ones.
 */

import { existsSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Paths the build produces. Never add a source directory here. */
const TARGETS = ['.next', 'out', 'coverage', 'tsconfig.tsbuildinfo'];

const ALLOWED = new Set(TARGETS.map((target) => join(ROOT, target)));

let removed = 0;

for (const target of TARGETS) {
  const absolute = join(ROOT, target);

  // Guard: refuse to touch anything that escaped the project root.
  if (!ALLOWED.has(absolute) || !absolute.startsWith(ROOT)) {
    console.error(`clean: refusing to remove unexpected path ${absolute}`);
    process.exitCode = 1;
    continue;
  }

  if (!existsSync(absolute)) continue;

  const kind = statSync(absolute).isDirectory() ? 'directory' : 'file';
  console.log(`clean: removing ${kind} ${relative(ROOT, absolute)}`);
  rmSync(absolute, { recursive: true, force: true });
  removed += 1;
}

console.log(
  removed === 0
    ? 'clean: nothing to remove, the workspace is already clean'
    : `clean: removed ${removed} item${removed === 1 ? '' : 's'}`
);
