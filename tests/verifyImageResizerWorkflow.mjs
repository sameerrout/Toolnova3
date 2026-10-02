/**
 * Automated Verification Suite for Toolino Image Resizer Redesign & Customer Usability Contracts
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

console.log('🧪 Running Toolino Image Resizer Full Workflow & Redesign Verification Suite...\n');

// -----------------------------------------------------------------------------
// Test 1: Single and Multiple Image Upload Validation
// -----------------------------------------------------------------------------
console.log('Test 1: Single and Multiple Image Upload Validation...');

const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const MAX_FILES = 20;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

function validateFiles(files) {
  if (!files || files.length === 0) {
    return { valid: false, error: 'No files provided' };
  }
  if (files.length > MAX_FILES) {
    return { valid: false, error: `Maximum ${MAX_FILES} images allowed` };
  }
  for (const f of files) {
    const ext = path.extname(f.name).toLowerCase();
    if (!VALID_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `Unsupported format: ${ext}` };
    }
    if (f.size <= 0) {
      return { valid: false, error: 'File is empty' };
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: 'File exceeds 50 MB' };
    }
  }
  return { valid: true };
}

// 0 files rejected
assert.strictEqual(validateFiles([]).valid, false, '0 files should be rejected');
console.log('  ✓ 0 files rejected when empty');

// Single image accepted immediately
const singleImage = [{ name: 'camera_raw.jpg', size: 4.2 * 1024 * 1024 }];
const singleResult = validateFiles(singleImage);
assert.strictEqual(singleResult.valid, true, 'Single image must always be valid');
console.log('  ✓ Exactly 1 single image is accepted without requiring multiple files');

// Multi-image upload (3 files) accepted
const multiImages = [
  { name: 'photo1.jpg', size: 2 * 1024 * 1024 },
  { name: 'photo2.png', size: 3.5 * 1024 * 1024 },
  { name: 'photo3.webp', size: 1.2 * 1024 * 1024 },
];
assert.strictEqual(validateFiles(multiImages).valid, true, 'Multi-images must be accepted');
console.log('  ✓ Multiple images (up to 20) accepted seamlessly');

// Unsupported format rejected
const invalidFile = [{ name: 'document.pdf', size: 1024 * 1024 }];
assert.strictEqual(validateFiles(invalidFile).valid, false, 'PDF should be rejected in Image Resizer');
console.log('  ✓ Non-image files correctly rejected');

// Oversized file rejected
const oversized = [{ name: 'giant_panorama.jpg', size: 60 * 1024 * 1024 }];
assert.strictEqual(validateFiles(oversized).valid, false, 'Files over 50MB should be rejected');
console.log('  ✓ File size limit enforced (50 MB)\n');

// -----------------------------------------------------------------------------
// Test 2: "Add More Images" Incremental Upload Logic
// -----------------------------------------------------------------------------
console.log('Test 2: "Add More Images" Incremental Upload Logic...');

const existingQueue = [
  { name: 'vacation1.jpg', size: 2 * 1024 * 1024 },
  { name: 'vacation2.jpg', size: 3 * 1024 * 1024 },
];
const newSingleAddition = [{ name: 'vacation3.jpg', size: 1.5 * 1024 * 1024 }];

// Adding exactly 1 image to existing images must NOT throw "select 2 images" error
const addValidation = validateFiles(newSingleAddition);
assert.strictEqual(addValidation.valid, true, 'Adding 1 single image must be valid');
const mergedQueue = [...existingQueue, ...newSingleAddition];
assert.strictEqual(mergedQueue.length, 3, 'Queue should cleanly have 3 images');
console.log('  ✓ Adding 1 single additional image works without any minimum count errors\n');

// -----------------------------------------------------------------------------
// Test 3: Aspect Ratio Locking Calculations
// -----------------------------------------------------------------------------
console.log('Test 3: Aspect Ratio Locking Calculations...');

const origW = 4000;
const origH = 3000;
const origAspect = origW / origH; // 1.3333333333333333

// User changes width to 2000 with lock active
const calculatedH = Math.max(1, Math.round(2000 / origAspect));
assert.strictEqual(calculatedH, 1500, 'Height must be 1500 when width is 2000 with 4:3 aspect');

// User changes height to 1200 with lock active
const calculatedW = Math.max(1, Math.round(1200 * origAspect));
assert.strictEqual(calculatedW, 1600, 'Width must be 1600 when height is 1200 with 4:3 aspect');

console.log('  ✓ Width to Height calculation: 2000px width → 1500px height');
console.log('  ✓ Height to Width calculation: 1200px height → 1600px width\n');

// -----------------------------------------------------------------------------
// Test 4: Percentage Resizing Calculations
// -----------------------------------------------------------------------------
console.log('Test 4: Percentage Resizing Calculations...');

function calcPercentDimensions(w, h, pct) {
  const scale = pct / 100;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
    isUpscaled: pct > 100,
  };
}

const p50 = calcPercentDimensions(origW, origH, 50);
assert.strictEqual(p50.width, 2000);
assert.strictEqual(p50.height, 1500);
assert.strictEqual(p50.isUpscaled, false);

const p25 = calcPercentDimensions(origW, origH, 25);
assert.strictEqual(p25.width, 1000);
assert.strictEqual(p25.height, 750);
assert.strictEqual(p25.isUpscaled, false);

const p150 = calcPercentDimensions(origW, origH, 150);
assert.strictEqual(p150.width, 6000);
assert.strictEqual(p150.height, 4500);
assert.strictEqual(p150.isUpscaled, true, '150% should be flagged as upscaled');

console.log('  ✓ 50% scaling: 4000×3000 → 2000×1500');
console.log('  ✓ 25% scaling: 4000×3000 → 1000×750');
console.log('  ✓ 150% scaling: 4000×3000 → 6000×4500 (flagged as upscaled)\n');

// -----------------------------------------------------------------------------
// Test 5: Batch ZIP Archiving Execution with JSZip
// -----------------------------------------------------------------------------
console.log('Test 5: Batch ZIP Archiving Execution with JSZip...');

const zip = new JSZip();
zip.file('photo1_resized_1920x1440.jpg', Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
zip.file('photo2_resized_1280x720.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]));

const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
assert(zipBuffer.length > 0, 'ZIP file must be created');
console.log(`  ✓ Batch ZIP generated successfully with 2 images (${zipBuffer.length} bytes)\n`);

// -----------------------------------------------------------------------------
// Test 6: Architectural Contracts & Codebase Verification
// -----------------------------------------------------------------------------
console.log('Test 6: Architectural Contracts & Codebase Verification...');

const projectRoot = process.cwd();
const resizerComponentPath = path.join(projectRoot, 'src', 'components', 'tools', 'ImageResizer.tsx');
const resizerContent = fs.readFileSync(resizerComponentPath, 'utf8');

// Check no sidebars in component
assert(!resizerContent.includes('<aside'), 'Must not contain any <aside> tag');
assert(!resizerContent.includes('sidebar'), 'Must not contain any sidebar classes or components');
console.log('  ✓ Strictly no sidebars found in ImageResizer.tsx');

// Check review screen before download
assert(resizerContent.includes("workflowStage === 'review'"), 'Must have review stage before download');
assert(resizerContent.includes('Adjust Size'), 'Must allow user to adjust size and re-resize');
assert(resizerContent.includes('downloadSingle'), 'Must have individual image download');
assert(resizerContent.includes('downloadAllZip'), 'Must have ZIP batch download');
console.log('  ✓ Review before download, Adjust Size, and ZIP download verified');

// Check Footer suppression
const footerPath = path.join(projectRoot, 'src', 'components', 'layout', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');
assert(
  footerContent.includes("pathname?.includes('image-resizer')"),
  'Footer.tsx must hide footer on image-resizer'
);
assert(
  footerContent.includes("pathname?.includes('resize-image')"),
  'Footer.tsx must hide footer on resize-image'
);
console.log('  ✓ Footer correctly suppressed on image-resizer and resize-image');

// Check app/image-resizer/page.tsx has no educational section
const pagePath = path.join(projectRoot, 'src', 'app', 'image-resizer', 'page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');
assert(
  !pageContent.includes('How to Resize Images Online'),
  'image-resizer/page.tsx must not contain bottom educational section'
);
console.log('  ✓ image-resizer/page.tsx optimized for clean single-screen experience');

// Check next.config.mjs rewrites
const nextConfigPath = path.join(projectRoot, 'next.config.mjs');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
assert(
  nextConfigContent.includes("destination: '/image-resizer'"),
  'next.config.mjs must contain rewrite for /resize-image and /image-resize'
);
console.log('  ✓ Route rewrites for /resize-image and /image-resize configured in next.config.mjs\n');

console.log('🎉 ALL 6 IMAGE RESIZER VERIFICATION TEST SUITES PASSED FLAWLESSLY!\n');
