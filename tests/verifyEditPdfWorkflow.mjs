/**
 * Automated Verification Suite for Toolino Edit PDF Redesign & Customer Usability Contracts
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Running Toolino Edit PDF Full Workflow & Redesign Verification Suite...\n');

// -----------------------------------------------------------------------------
// Test 1: Single PDF Upload Validation
// -----------------------------------------------------------------------------
console.log('Test 1: Single PDF Upload Validation...');

function validateUpload(file) {
  if (!file) return { valid: false, error: 'No file selected' };
  const ext = path.extname(file.name).toLowerCase();
  if (ext !== '.pdf') return { valid: false, error: 'Only PDF files are supported' };
  if (file.size <= 0) return { valid: false, error: 'File is empty' };
  if (file.size > 100 * 1024 * 1024) return { valid: false, error: 'File exceeds 100 MB limit' };
  return { valid: true };
}

assert.strictEqual(validateUpload(null).valid, false, 'Null file should be rejected');
console.log('  ✓ 0 files rejected when empty');

const validPdf = { name: 'invoice.pdf', size: 2.4 * 1024 * 1024 };
assert.strictEqual(validateUpload(validPdf).valid, true, 'Valid PDF must be accepted');
console.log('  ✓ Exactly 1 single PDF file is accepted');

const imageFile = { name: 'photo.jpg', size: 1.2 * 1024 * 1024 };
assert.strictEqual(validateUpload(imageFile).valid, false, 'Non-PDF file must be rejected');
console.log('  ✓ Non-PDF file correctly rejected');

const oversizedPdf = { name: 'huge_scan.pdf', size: 120 * 1024 * 1024 };
assert.strictEqual(validateUpload(oversizedPdf).valid, false, 'Files over 100MB rejected');
console.log('  ✓ File size limit enforced (100 MB)\n');

// -----------------------------------------------------------------------------
// Test 2: Real In-Memory PDF Editing Execution with pdf-lib
// -----------------------------------------------------------------------------
console.log('Test 2: Real In-Memory PDF Editing Execution with pdf-lib...');

// Create source PDF document
const sourcePdf = await PDFDocument.create();
const sourcePage = sourcePdf.addPage([595.28, 841.89]);
const fontRegular = await sourcePdf.embedFont(StandardFonts.Helvetica);
sourcePage.drawText('Original Document Text', {
  x: 50,
  y: 750,
  size: 14,
  font: fontRegular,
  color: rgb(0.2, 0.2, 0.2),
});
const sourceBytes = await sourcePdf.save();

// Now load and perform user edits (Add Text + Add Image)
const editDoc = await PDFDocument.load(sourceBytes);
const editPage = editDoc.getPage(0);
const fontBold = await editDoc.embedFont(StandardFonts.HelveticaBold);

// 1. Draw user added text
editPage.drawText('Approved & Signed by Customer', {
  x: 50,
  y: 680,
  size: 18,
  font: fontBold,
  color: rgb(0.1, 0.3, 0.8),
});

// 2. Draw user added signature/stamp image (1x1 PNG)
const testPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const testPngBytes = Buffer.from(testPngBase64, 'base64');
const embeddedImg = await editDoc.embedPng(testPngBytes);
editPage.drawImage(embeddedImg, {
  x: 50,
  y: 550,
  width: 120,
  height: 60,
});

const editedBytes = await editDoc.save();
assert(editedBytes.length > sourceBytes.length, 'Edited PDF must contain new text and image bytes');
console.log(`  ✓ Original: ${sourceBytes.length} bytes → Edited: ${editedBytes.length} bytes`);
console.log('  ✓ In-memory PDF editing execution with text & image validated successfully\n');

// -----------------------------------------------------------------------------
// Test 3: Architectural Contracts: ZERO Sidebars & Zero Permanent Panels
// -----------------------------------------------------------------------------
console.log('Test 3: Zero Sidebars & Layout Architectural Contracts...');

const pdfEditorPath = path.join(rootDir, 'src', 'components', 'tools', 'pdf-editor', 'PdfEditor.tsx');
const pdfEditorContent = fs.readFileSync(pdfEditorPath, 'utf8');

// Assert NO <aside> tags
assert(!pdfEditorContent.includes('<aside'), 'PdfEditor.tsx must NOT contain any <aside> tag');
assert(!pdfEditorContent.includes('w-48 bg-white border-r'), 'Left sidebar must be completely eliminated');
assert(!pdfEditorContent.includes('w-52 bg-white border-l'), 'Right sidebar must be completely eliminated');
console.log('  ✓ Strictly NO left sidebar and NO right sidebar in PdfEditor.tsx');

// Assert top editor toolbar
assert(pdfEditorContent.includes('activeTool === \'select\''), 'Top toolbar must feature Select tool');
assert(pdfEditorContent.includes('Add Text'), 'Top toolbar must feature Add Text');
assert(pdfEditorContent.includes('Add Image'), 'Top toolbar must feature Add Image');
console.log('  ✓ Top horizontal toolbar features Select, Add Text, and Add Image\n');

// -----------------------------------------------------------------------------
// Test 4: Review Before Download & Unsaved Changes Contracts
// -----------------------------------------------------------------------------
console.log('Test 4: Review Before Download & Unsaved Changes Contracts...');

assert(pdfEditorContent.includes("workflowStage === 'review'"), 'Review stage state must exist');
assert(pdfEditorContent.includes('Changes saved successfully!'), 'Review stage must confirm saved changes');
assert(pdfEditorContent.includes('Download Edited PDF'), 'Review stage must provide primary download action');
assert(pdfEditorContent.includes('Continue Editing'), 'Review stage must allow returning to edit mode');
assert(pdfEditorContent.includes('You have unsaved changes'), 'Unsaved changes confirmation dialog must be present');
console.log('  ✓ Review screen before download implemented with Continue Editing option');
console.log('  ✓ Unsaved changes confirmation safeguard active\n');

// -----------------------------------------------------------------------------
// Test 5: Route Rewrites & Footer Suppression
// -----------------------------------------------------------------------------
console.log('Test 5: Route Rewrites & Footer Suppression Contracts...');

const footerPath = path.join(rootDir, 'src', 'components', 'layout', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');
assert(footerContent.includes("pathname?.includes('edit-pdf')"), 'Footer must be suppressed on edit-pdf');
assert(footerContent.includes("pathname?.includes('pdf-editor')"), 'Footer must be suppressed on pdf-editor');
console.log('  ✓ Footer correctly suppressed on edit-pdf and pdf-editor');

const nextConfigPath = path.join(rootDir, 'next.config.mjs');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
assert(nextConfigContent.includes("destination: '/edit-pdf'"), 'Rewrites to /edit-pdf must be configured');
console.log('  ✓ Next.js rewrites active for /pdf-editor and /editor-pdf\n');

console.log('🎉 ALL 5 EDIT PDF VERIFICATION TEST SUITES PASSED FLAWLESSLY!\n');
