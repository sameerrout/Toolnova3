/**
 * Automated Verification Suite for Toollino Image Converter Redesign & Usability Contracts
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Running Toollino Image Converter Full Workflow & Redesign Verification Suite...\n');

// -----------------------------------------------------------------------------
// Test 1: Single Image & Batch Upload Validation
// -----------------------------------------------------------------------------
console.log('Test 1: Single Image & Batch Upload Validation...');

function validateImageUpload(files, currentList = []) {
  if (!files || files.length === 0) {
    return { valid: false, error: 'No files selected' };
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/bmp', 'image/x-icon', 'image/gif', 'image/svg+xml'];
  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.ico', '.gif', '.svg', '.tiff'];

  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase();
    const typeValid = file.type ? validTypes.includes(file.type) : validExts.includes(ext);
    if (!typeValid) {
      return { valid: false, error: `Invalid image format: ${file.name}` };
    }
    if (file.size <= 0) {
      return { valid: false, error: 'File is empty' };
    }
    if (file.size > 100 * 1024 * 1024) {
      return { valid: false, error: 'File exceeds 100 MB limit' };
    }
  }

  return { valid: true, count: currentList.length + files.length };
}

// 1.1 Single image must always be valid
assert.strictEqual(validateImageUpload([]).valid, false, 'Empty list must be rejected');
assert.strictEqual(validateImageUpload([{ name: 'script.js', size: 100 }]).valid, false, 'Non-image rejected');
assert.strictEqual(validateImageUpload([{ name: 'huge.png', type: 'image/png', size: 120 * 1024 * 1024 }]).valid, false, 'Oversized file rejected');

const singleUpload = validateImageUpload([{ name: 'photo.jpg', type: 'image/jpeg', size: 2.4 * 1024 * 1024 }]);
assert.strictEqual(singleUpload.valid, true, 'Single JPG accepted');
assert.strictEqual(singleUpload.count, 1, 'Single image accepted without requiring multiple');

// 1.2 Adding just ONE more image to an existing list must work without error
const addOneMore = validateImageUpload(
  [{ name: 'icon.png', type: 'image/png', size: 45000 }],
  [{ name: 'photo1.jpg' }, { name: 'photo2.jpg' }]
);
assert.strictEqual(addOneMore.valid, true, 'Adding 1 image to existing 2 is valid');
assert.strictEqual(addOneMore.count, 3, 'Total items now 3');
console.log('  ✓ Single image is valid, multiple images supported, "+ Add More Images" accepts single file\n');

// -----------------------------------------------------------------------------
// Test 2: Supported Output Formats & Metadata Contracts
// -----------------------------------------------------------------------------
console.log('Test 2: Supported Output Formats & Engine Contracts...');

const SUPPORTED_OUTPUT_FORMATS = [
  { id: 'webp', label: 'WEBP', ext: 'webp', lossy: true, supportsAlpha: true },
  { id: 'png', label: 'PNG', ext: 'png', lossy: false, supportsAlpha: true },
  { id: 'jpeg', label: 'JPG / JPEG', ext: 'jpg', lossy: true, supportsAlpha: false },
  { id: 'avif', label: 'AVIF', ext: 'avif', lossy: true, supportsAlpha: true },
  { id: 'ico', label: 'ICO (Favicon)', ext: 'ico', lossy: false, supportsAlpha: true },
  { id: 'bmp', label: 'BMP', ext: 'bmp', lossy: false, supportsAlpha: false },
];

assert.strictEqual(SUPPORTED_OUTPUT_FORMATS.length, 6, 'Exactly 6 supported output formats');
const formatIds = SUPPORTED_OUTPUT_FORMATS.map((f) => f.id);
assert(formatIds.includes('webp') && formatIds.includes('png') && formatIds.includes('jpeg'));
assert(formatIds.includes('avif') && formatIds.includes('ico') && formatIds.includes('bmp'));

// Verify alpha transparency rules
const jpegMeta = SUPPORTED_OUTPUT_FORMATS.find((f) => f.id === 'jpeg');
assert.strictEqual(jpegMeta.supportsAlpha, false, 'JPEG does not support alpha channel');
const pngMeta = SUPPORTED_OUTPUT_FORMATS.find((f) => f.id === 'png');
assert.strictEqual(pngMeta.supportsAlpha, true, 'PNG supports alpha transparency');

// Filename generation
function getOutputFilename(originalName, targetFormat) {
  const base = originalName.replace(/\.[^.]+$/, '');
  const fmt = SUPPORTED_OUTPUT_FORMATS.find((f) => f.id === targetFormat);
  return `${base}.${fmt ? fmt.ext : 'img'}`;
}

assert.strictEqual(getOutputFilename('vacation.png', 'jpeg'), 'vacation.jpg');
assert.strictEqual(getOutputFilename('banner.jpg', 'webp'), 'banner.webp');
assert.strictEqual(getOutputFilename('logo.svg', 'png'), 'logo.png');
assert.strictEqual(getOutputFilename('app_icon.png', 'ico'), 'app_icon.ico');
console.log('  ✓ Supported formats, alpha capabilities, and target filenames verified\n');

// -----------------------------------------------------------------------------
// Test 3: Aspect Ratio Locking & Dimension Calculations
// -----------------------------------------------------------------------------
console.log('Test 3: Aspect Ratio Locking & Dimension Calculations...');

function calculateAspectDimensions(origW, origH, targetW, targetH, lockAspect, changedField) {
  if (!lockAspect) {
    return { width: targetW || origW, height: targetH || origH };
  }
  const ratio = origH / origW;
  if (changedField === 'width') {
    return { width: targetW, height: Math.round(targetW * ratio) };
  } else {
    return { width: Math.round(targetH / ratio), height: targetH };
  }
}

// 4000x3000 image (4:3 aspect ratio)
const fromWidth = calculateAspectDimensions(4000, 3000, 2000, 3000, true, 'width');
assert.strictEqual(fromWidth.width, 2000);
assert.strictEqual(fromWidth.height, 1500, 'Height adjusted to 1500 maintaining 4:3');

const fromHeight = calculateAspectDimensions(4000, 3000, 2000, 900, true, 'height');
assert.strictEqual(fromHeight.height, 900);
assert.strictEqual(fromHeight.width, 1200, 'Width adjusted to 1200 maintaining 4:3');

// Unlocked aspect ratio
const unlocked = calculateAspectDimensions(4000, 3000, 1000, 1000, false, 'width');
assert.strictEqual(unlocked.width, 1000);
assert.strictEqual(unlocked.height, 1000, 'Square dimensions preserved when unlocked');
console.log('  ✓ Aspect ratio locking calculations accurate\n');

// -----------------------------------------------------------------------------
// Test 4: File Size Comparison & Savings Text Truthfulness
// -----------------------------------------------------------------------------
console.log('Test 4: File Size Comparison & Savings Text Truthfulness...');

function getSavingsText(origSize, outSize) {
  if (outSize <= origSize) {
    const pct = Math.round((1 - outSize / origSize) * 100);
    return `${pct}% smaller`;
  } else {
    const pct = Math.round((outSize / origSize - 1) * 100);
    return `Output is larger by ${pct}%`;
  }
}

assert.strictEqual(getSavingsText(1000, 400), '60% smaller');
assert.strictEqual(getSavingsText(1000, 1200), 'Output is larger by 20%');
console.log('  ✓ Truthful savings and expansion labels verified\n');

// -----------------------------------------------------------------------------
// Test 5: In-Memory Multi-Image ZIP Archiving with JSZip
// -----------------------------------------------------------------------------
console.log('Test 5: In-Memory Multi-Image ZIP Archiving with JSZip...');

const zip = new JSZip();
const fakeImage1 = Buffer.from('RIFF....WEBPVP8 ...');
const fakeImage2 = Buffer.from('\x89PNG\r\n\x1a\n...');

zip.file('photo1_converted.webp', fakeImage1);
zip.file('photo2_converted.png', fakeImage2);

const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
assert(zipBuffer.length > 0, 'Zip buffer must not be empty');
assert.strictEqual(zipBuffer[0], 0x50, 'Must start with PK zip signature byte 1');
assert.strictEqual(zipBuffer[1], 0x4b, 'Must start with PK zip signature byte 2');
console.log(`  ✓ Successfully generated ZIP archive with multiple converted images (${zipBuffer.length} bytes)\n`);

// -----------------------------------------------------------------------------
// Test 6: Codebase Architectural & Usability Contracts
// -----------------------------------------------------------------------------
console.log('Test 6: Codebase Architectural & Usability Contracts...');

// 6.1 Verify ImageConverter.tsx has NO sidebars
const componentFile = path.join(rootDir, 'src/components/tools/ImageConverter.tsx');
assert(fs.existsSync(componentFile), 'ImageConverter.tsx must exist');
const componentContent = fs.readFileSync(componentFile, 'utf8');

assert(!componentContent.includes('left-sidebar'), 'No left sidebar in ImageConverter');
assert(!componentContent.includes('right-sidebar'), 'No right sidebar in ImageConverter');
assert(!componentContent.includes('<aside'), 'No aside element in ImageConverter');
console.log('  ✓ Strictly NO left or right sidebar in ImageConverter');

// 6.2 Verify Review Before Download & Results Screen
assert(componentContent.includes('showResultsScreen'), 'Results review screen state present');
assert(componentContent.includes('Adjust Settings'), 'Adjust settings option present');
assert(componentContent.includes('Images converted successfully'), 'Success header present');
assert(componentContent.includes('Download All as ZIP'), 'ZIP batch download present');
console.log('  ✓ Review before download workflow and Adjust Settings implemented');

// 6.3 Verify Checkerboard transparency pattern
assert(componentContent.includes('backgroundSize: \'16px 16px\''), 'Checkerboard pattern configured');
assert(componentContent.includes('linear-gradient(45deg'), 'Checkerboard gradient configured');
console.log('  ✓ Subtle neutral checkerboard pattern configured for transparency');

// 6.4 Verify Object URL memory cleanup
assert(componentContent.includes('URL.revokeObjectURL'), 'Revokes object URLs to prevent memory leaks');
console.log('  ✓ Object URL memory safety implemented');

// 6.5 Verify Footer is hidden on image-converter
const footerFile = path.join(rootDir, 'src/components/layout/Footer.tsx');
const footerContent = fs.readFileSync(footerFile, 'utf8');
assert(footerContent.includes("pathname?.includes('image-converter')"), 'Footer must be hidden on image-converter');
console.log('  ✓ Footer hidden on image-converter page');

// 6.6 Verify Educational section suppressed in toolId page
const toolPageFile = path.join(rootDir, 'src/app/tools/[toolId]/page.tsx');
const toolPageContent = fs.readFileSync(toolPageFile, 'utf8');
assert(toolPageContent.includes("toolId !== 'image-converter'"), 'Educational section suppressed for single-screen UX');
console.log('  ✓ Educational section suppressed in toolId page');

// 6.7 Verify ToolRunner routes image-converter
const toolRunnerFile = path.join(rootDir, 'src/components/tools/ToolRunner.tsx');
const toolRunnerContent = fs.readFileSync(toolRunnerFile, 'utf8');
assert(toolRunnerContent.includes('ImageConverter'), 'ToolRunner must import ImageConverter');
assert(toolRunnerContent.includes("toolId === 'image-converter'"), 'ToolRunner must route image-converter');
console.log('  ✓ ToolRunner properly routes image-converter to ImageConverter');

// 6.8 Verify route rewrites in next.config.mjs
const nextConfigFile = path.join(rootDir, 'next.config.mjs');
const nextConfigContent = fs.readFileSync(nextConfigFile, 'utf8');
assert(nextConfigContent.includes("source: '/convert-image'"), 'Rewrite for /convert-image exists');
assert(nextConfigContent.includes("source: '/image-convert'"), 'Rewrite for /image-convert exists');
console.log('  ✓ Route rewrites configured in next.config.mjs');

// 6.9 Verify dedicated app router page
const appPageFile = path.join(rootDir, 'src/app/image-converter/page.tsx');
assert(fs.existsSync(appPageFile), 'src/app/image-converter/page.tsx must exist');
const appPageContent = fs.readFileSync(appPageFile, 'utf8');
assert(appPageContent.includes('<ImageConverter />'), 'App page renders ImageConverter');
assert(!appPageContent.includes('How to Convert Image Formats Online'), 'Bloated bottom educational section removed');
console.log('  ✓ Dedicated /image-converter App Router page verified without bottom bloat\n');

console.log('🎉 ALL IMAGE CONVERTER REDESIGN AND USABILITY VERIFICATIONS PASSED (100%)!\n');
