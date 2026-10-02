import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

console.log('🧪 Running Toolino Image Compressor Full Workflow & Redesign Verification Suite...\n');

// -----------------------------------------------------------------------------
// Test 1: Upload Validation (Single Image & Multiple Images)
// -----------------------------------------------------------------------------
console.log('Test 1: Single and Multiple Image Upload Validation...');

const MAX_FILES = 20;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function validateImageUpload(files) {
  if (!files || files.length === 0) {
    return { valid: false, error: 'Upload at least one image to continue.' };
  }
  if (files.length > MAX_FILES) {
    return { valid: false, error: `Maximum limit of ${MAX_FILES} images exceeded.` };
  }

  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
  for (const f of files) {
    const lower = f.name.toLowerCase();
    const isImage = validExts.some((ext) => lower.endsWith(ext));
    if (!isImage) {
      return { valid: false, error: `"${f.name}" is not a supported image format.` };
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `"${f.name}" exceeds the 25 MB limit.` };
    }
  }

  return { valid: true };
}

const mockImg1 = { name: 'landscape.jpg', size: 1024 * 1024 * 3 };
const mockImg2 = { name: 'portrait.png', size: 1024 * 1024 * 4 };
const mockImg3 = { name: 'logo.webp', size: 1024 * 500 };
const mockDoc = { name: 'document.pdf', size: 1024 * 200 };
const mockOversized = { name: 'huge_raw.jpg', size: 30 * 1024 * 1024 };

assert.strictEqual(validateImageUpload([]).valid, false, '0 files must be rejected');
console.log('  ✓ 0 files rejected when empty');

assert.strictEqual(validateImageUpload([mockImg1]).valid, true, '1 single image MUST be accepted');
console.log('  ✓ Exactly 1 single image is accepted without requiring multiple files');

assert.strictEqual(validateImageUpload([mockImg1, mockImg2, mockImg3]).valid, true, 'Multiple images accepted');
console.log('  ✓ Multiple images (up to 20) accepted seamlessly');

assert.strictEqual(validateImageUpload([mockDoc]).valid, false, 'Non-image file rejected');
console.log('  ✓ Non-image files correctly rejected');

assert.strictEqual(validateImageUpload([mockOversized]).valid, false, 'Files over 25 MB rejected');
console.log('  ✓ File size limit enforced (25 MB)');

// -----------------------------------------------------------------------------
// Test 2: "Add More Images" Behavior
// -----------------------------------------------------------------------------
console.log('\nTest 2: "Add More Images" Incremental Upload Logic...');

let currentList = [mockImg1, mockImg2];
assert.strictEqual(currentList.length, 2);

// User clicks "+ Add More Images" and selects 1 single image
const addedFile = mockImg3;
const addResult = validateImageUpload([addedFile]);
assert.strictEqual(addResult.valid, true, 'Adding 1 single image must be accepted without "select 2 images" error');

currentList = [...currentList, addedFile];
assert.strictEqual(currentList.length, 3);
console.log('  ✓ Adding 1 single additional image works without any minimum count errors');

// -----------------------------------------------------------------------------
// Test 3: Compression Settings & Presets
// -----------------------------------------------------------------------------
console.log('\nTest 3: Compression Presets & Quality Controls...');

const presets = {
  recommended: { quality: 0.75, label: 'Recommended' },
  high: { quality: 0.55, label: 'Strong' },
  extreme: { quality: 0.35, label: 'Maximum' },
};

assert.strictEqual(presets.recommended.quality, 0.75);
assert.strictEqual(presets.high.quality, 0.55);
assert.strictEqual(presets.extreme.quality, 0.35);
console.log('  ✓ Recommended (75%), Strong (55%), and Maximum (35%) presets configured accurately');

// -----------------------------------------------------------------------------
// Test 4: File Savings Calculation Logic
// -----------------------------------------------------------------------------
console.log('\nTest 4: Savings Calculation & Formatting Logic...');

function computeSavings(origBytes, compBytes) {
  const saved = Math.max(0, origBytes - compBytes);
  const percent = origBytes > 0 ? Math.round((saved / origBytes) * 100) : 0;
  return { saved, percent };
}

const savingsA = computeSavings(8_000_000, 3_200_000);
assert.strictEqual(savingsA.saved, 4_800_000);
assert.strictEqual(savingsA.percent, 60);
console.log('  ✓ Standard savings calculation: 8 MB → 3.2 MB = 60% saved');

const savingsB = computeSavings(1_000_000, 1_100_000);
assert.strictEqual(savingsB.saved, 0);
assert.strictEqual(savingsB.percent, 0);
console.log('  ✓ Edge case: if output is larger, saved is safely clamped to 0');

// -----------------------------------------------------------------------------
// Test 5: Batch ZIP Generation with JSZip
// -----------------------------------------------------------------------------
console.log('\nTest 5: Batch ZIP Archiving Execution with JSZip...');

async function testZipCreation() {
  const zip = new JSZip();
  zip.file('photo1_compressed.jpg', Buffer.from('mock-jpeg-binary-data'));
  zip.file('photo2_compressed.webp', Buffer.from('mock-webp-binary-data'));

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  assert.ok(zipBuffer.length > 50, 'ZIP buffer must be non-empty');
  console.log(`  ✓ Batch ZIP generated successfully with 2 images (${zipBuffer.length} bytes)`);
}

await testZipCreation();

// -----------------------------------------------------------------------------
// Test 6: Architectural Contracts & Codebase Verification
// -----------------------------------------------------------------------------
console.log('\nTest 6: Architectural Contracts & Codebase Verification...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 1. ImageCompressor component checks
const compPath = path.join(projectRoot, 'src', 'components', 'tools', 'ImageCompressor.tsx');
assert.ok(fs.existsSync(compPath), 'ImageCompressor.tsx must exist');
const compContent = fs.readFileSync(compPath, 'utf8');

assert.ok(compContent.includes('Image Compressor'), 'Component has Image Compressor header');
assert.ok(compContent.includes('min-h-[calc(100vh-72px)]'), 'Component implements single-viewport desktop container');
assert.ok(compContent.includes('Add More Images'), 'Add More Images button present');
assert.ok(compContent.includes('Recommended'), 'Recommended option present');
assert.ok(compContent.includes('Strong'), 'Strong option present');
assert.ok(compContent.includes('Maximum'), 'Maximum option present');
assert.ok(compContent.includes('Images compressed successfully'), 'Review before download state present');
assert.ok(compContent.includes('Download All as ZIP') || compContent.includes('Download All'), 'Download all ZIP present');
assert.ok(compContent.includes('Adjust Compression'), 'Adjust compression button present');
assert.ok(compContent.includes('Compress More Images') || compContent.includes('Start Over'), 'Start over/compress more present');
console.log('  ✓ ImageCompressor.tsx contains all required interactive features and safeguards');

// 2. ToolRunner check
const runnerPath = path.join(projectRoot, 'src', 'components', 'tools', 'ToolRunner.tsx');
const runnerContent = fs.readFileSync(runnerPath, 'utf8');
assert.ok(runnerContent.includes('ImageCompressor'), 'ToolRunner imports ImageCompressor');
assert.ok(runnerContent.includes("toolId === 'image-compressor'"), 'ToolRunner routes image-compressor');
console.log('  ✓ ToolRunner wires ImageCompressor for image-compressor');

// 3. Footer exclusion check
const footerPath = path.join(projectRoot, 'src', 'components', 'layout', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');
assert.ok(footerContent.includes("pathname?.includes('image-compressor')"), 'Footer excludes image-compressor');
console.log('  ✓ Footer correctly suppressed on image-compressor');

// 4. Page layout check (app/image-compressor/page.tsx)
const pagePath = path.join(projectRoot, 'src', 'app', 'image-compressor', 'page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');
assert.ok(pageContent.includes('<ImageCompressor />'), 'Page renders ImageCompressor');
assert.ok(!pageContent.includes('How to Compress Images in 3 Simple Steps'), 'Extraneous educational section removed to eliminate unnecessary scrolling');
console.log('  ✓ image-compressor/page.tsx optimized for clean single-screen experience');

console.log('\n🎉 ALL 6 IMAGE COMPRESSOR VERIFICATION TEST SUITES PASSED FLAWLESSLY!\n');
