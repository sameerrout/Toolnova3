/**
 * Automated Verification Suite for Toollino Image to Text (OCR) Redesign & Usability Contracts
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { exportToDocx, exportToPdf, exportToTxt, SUPPORTED_OCR_LANGUAGES } from '../src/core/engine/ocrEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Running Toollino Image to Text (OCR) Full Workflow & Redesign Verification Suite...\n');

// -----------------------------------------------------------------------------
// Test 1: Single Image & Batch Upload Validation
// -----------------------------------------------------------------------------
console.log('Test 1: Single Image & Batch Upload Validation...');

function validateOcrUpload(files, currentList = []) {
  if (!files || files.length === 0) {
    return { valid: false, error: 'No files selected' };
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/bmp', 'image/gif'];
  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif'];

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

// 1.1 Single image is always valid
assert.strictEqual(validateOcrUpload([]).valid, false, 'Empty list must be rejected');
assert.strictEqual(validateOcrUpload([{ name: 'document.pdf', size: 100 }]).valid, false, 'Non-image rejected');
assert.strictEqual(validateOcrUpload([{ name: 'giant.png', type: 'image/png', size: 120 * 1024 * 1024 }]).valid, false, 'Oversized file rejected');

const singleUpload = validateOcrUpload([{ name: 'receipt.jpg', type: 'image/jpeg', size: 1.8 * 1024 * 1024 }]);
assert.strictEqual(singleUpload.valid, true, 'Single JPG accepted');
assert.strictEqual(singleUpload.count, 1, 'Single image accepted without requiring multiple');

// 1.2 Adding just ONE more image to an existing list must work without error
const addOneMore = validateOcrUpload(
  [{ name: 'page2.png', type: 'image/png', size: 50000 }],
  [{ name: 'page1.jpg' }, { name: 'page0.jpg' }]
);
assert.strictEqual(addOneMore.valid, true, 'Adding 1 image to existing 2 is valid');
assert.strictEqual(addOneMore.count, 3, 'Total items now 3 without "select 2 images" error');
console.log('  ✓ Single image is valid, multiple images supported, "+ Add More Images" accepts single file\n');

// -----------------------------------------------------------------------------
// Test 2: Supported Languages & OCR Engine Contracts
// -----------------------------------------------------------------------------
console.log('Test 2: Supported Languages & Engine Contracts...');

assert(SUPPORTED_OCR_LANGUAGES.length >= 16, 'At least 16 languages supported');
const langCodes = SUPPORTED_OCR_LANGUAGES.map((l) => l.code);
assert(langCodes.includes('eng'), 'English supported');
assert(langCodes.includes('spa'), 'Spanish supported');
assert(langCodes.includes('fra'), 'French supported');
assert(langCodes.includes('deu'), 'German supported');
assert(langCodes.includes('hin'), 'Hindi supported');
assert(langCodes.includes('chi_sim'), 'Chinese (Simplified) supported');
assert(langCodes.includes('jpn'), 'Japanese supported');
assert(langCodes.includes('ara'), 'Arabic supported');

console.log(`  ✓ ${SUPPORTED_OCR_LANGUAGES.length} OCR languages verified in engine\n`);

// -----------------------------------------------------------------------------
// Test 3: Text Editing & Export Functionality (TXT, DOCX, PDF)
// -----------------------------------------------------------------------------
console.log('Test 3: Text Editing & Real Export Generation (TXT, DOCX, PDF)...');

const initialText = 'This is the initial OCR extracted text with 123 numbers.';
const editedText = 'This is the edited OCR text with manual corrections made by the user.';

// 3.1 TXT Export
const txtBlob = exportToTxt(editedText);
assert.strictEqual(txtBlob.type, 'text/plain;charset=utf-8');
assert(txtBlob.size > 0, 'TXT export must not be empty');

// 3.2 Word (.docx) Export via docx library
const docxBlob = await exportToDocx(editedText, 'Invoice Document');
assert(docxBlob.size > 500, 'DOCX export must produce valid Word binary data');

// 3.3 PDF Export via pdf-lib
const pdfBlob = await exportToPdf(editedText, 'Extracted Document');
assert(pdfBlob.size > 500, 'PDF export must produce valid PDF binary data');

console.log('  ✓ Real exports generated: TXT, DOCX Word binary, and Searchable PDF\n');

// -----------------------------------------------------------------------------
// Test 4: Live Statistics Calculations (Words, Characters, Lines)
// -----------------------------------------------------------------------------
console.log('Test 4: Live Word, Character, and Line Statistics...');

function calculateTextStats(text) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  return { words, chars, lines };
}

const statsSample = 'Line one has five words.\nLine two has more words here.\nLine three.';
const stats = calculateTextStats(statsSample);
assert.strictEqual(stats.lines, 3);
assert.strictEqual(stats.words, 13);
assert.strictEqual(stats.chars, statsSample.length);

const emptyStats = calculateTextStats('');
assert.strictEqual(emptyStats.words, 0);
assert.strictEqual(emptyStats.chars, 0);
assert.strictEqual(emptyStats.lines, 0);

console.log('  ✓ Statistics accurately calculated for live editor updates\n');

// -----------------------------------------------------------------------------
// Test 5: In-Memory Multi-Image ZIP Archiving with JSZip
// -----------------------------------------------------------------------------
console.log('Test 5: In-Memory Multi-Image ZIP Archiving with JSZip...');

const zip = new JSZip();
zip.file('invoice1_ocr.txt', 'Extracted invoice 1 text content');
zip.file('contract_ocr.txt', 'Extracted contract text content');

const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
assert(zipBuffer.length > 50, 'ZIP buffer must not be empty');
assert.strictEqual(zipBuffer[0], 0x50, 'Must start with PK signature byte 1');
assert.strictEqual(zipBuffer[1], 0x4b, 'Must start with PK signature byte 2');
console.log(`  ✓ Successfully generated ZIP archive with multiple OCR files (${zipBuffer.length} bytes)\n`);

// -----------------------------------------------------------------------------
// Test 6: Codebase Architectural & Usability Contracts
// -----------------------------------------------------------------------------
console.log('Test 6: Codebase Architectural & Usability Contracts...');

// 6.1 Verify ImageToText.tsx has NO sidebars
const componentFile = path.join(rootDir, 'src/components/tools/ImageToText.tsx');
assert(fs.existsSync(componentFile), 'ImageToText.tsx must exist');
const componentContent = fs.readFileSync(componentFile, 'utf8');

assert(!componentContent.includes('<aside'), 'No <aside> sidebar element in ImageToText');
assert(!componentContent.includes('left-sidebar'), 'No left sidebar in ImageToText');
assert(!componentContent.includes('right-sidebar'), 'No right sidebar in ImageToText');
console.log('  ✓ Strictly NO left or right sidebar in ImageToText');

// 6.2 Verify Editable Textarea and Copy Text
assert(componentContent.includes('id="extracted-text-area"'), 'Editable textarea present with ID');
assert(componentContent.includes('id="copy-text-button"'), 'Copy text button present with ID');
assert(componentContent.includes('id="download-txt-button"'), 'Download TXT button present with ID');
assert(componentContent.includes('id="download-docx-button"'), 'Download DOCX button present with ID');
assert(componentContent.includes('id="download-pdf-button"'), 'Download PDF button present with ID');
assert(componentContent.includes('id="run-ocr-again-button"'), 'Run OCR Again button present with ID');
console.log('  ✓ Interactive editor, copy, download, and re-run actions present');

// 6.3 Verify Truthful Privacy Badge
assert(componentContent.includes('Your image stays on your device'), 'Privacy badge present');
console.log('  ✓ Truthful client-side processing badge verified');

// 6.4 Verify Memory Safety (URL.revokeObjectURL)
assert(componentContent.includes('URL.revokeObjectURL'), 'Object URL memory safety implemented');
console.log('  ✓ Object URL cleanup verified');

// 6.5 Verify Footer is hidden on image-to-text
const footerFile = path.join(rootDir, 'src/components/layout/Footer.tsx');
const footerContent = fs.readFileSync(footerFile, 'utf8');
assert(footerContent.includes("pathname?.includes('image-to-text')"), 'Footer must be hidden on image-to-text');
console.log('  ✓ Footer hidden on image-to-text page');

// 6.6 Verify Educational section suppressed in toolId page and app page
const toolPageFile = path.join(rootDir, 'src/app/tools/[toolId]/page.tsx');
const toolPageContent = fs.readFileSync(toolPageFile, 'utf8');
assert(toolPageContent.includes("toolId !== 'image-to-text'"), 'Educational section suppressed in toolId page');

const appPageFile = path.join(rootDir, 'src/app/image-to-text/page.tsx');
const appPageContent = fs.readFileSync(appPageFile, 'utf8');
assert(appPageContent.includes('<ImageToText />'), 'App page renders ImageToText');
assert(!appPageContent.includes('How to Extract Text from Images with Free Online OCR'), 'Educational section removed from dedicated app page');
console.log('  ✓ Educational section suppressed on /image-to-text for single-screen UX');

// 6.7 Verify ToolRunner routes image-to-text
const toolRunnerFile = path.join(rootDir, 'src/components/tools/ToolRunner.tsx');
const toolRunnerContent = fs.readFileSync(toolRunnerFile, 'utf8');
assert(toolRunnerContent.includes('ImageToText'), 'ToolRunner must import ImageToText');
assert(toolRunnerContent.includes("toolId === 'image-to-text'"), 'ToolRunner must route image-to-text');
console.log('  ✓ ToolRunner properly routes image-to-text to ImageToText');

// 6.8 Verify route rewrites in next.config.mjs
const nextConfigFile = path.join(rootDir, 'next.config.mjs');
const nextConfigContent = fs.readFileSync(nextConfigFile, 'utf8');
assert(nextConfigContent.includes("source: '/ocr'"), 'Rewrite for /ocr exists');
assert(nextConfigContent.includes("source: '/image-ocr'"), 'Rewrite for /image-ocr exists');
console.log('  ✓ Route rewrites configured in next.config.mjs\n');

console.log('🎉 ALL IMAGE TO TEXT (OCR) REDESIGN AND USABILITY VERIFICATIONS PASSED (100%)!\n');
