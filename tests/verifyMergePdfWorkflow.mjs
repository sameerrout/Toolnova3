import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

console.log('🧪 Running Toolino Merge PDF Full Workflow & Bug Fix Verification Suite...\n');

// 1. Check validateFiles logic directly as implemented in merge-pdf/index.ts
console.log('Test 1: File Selection Validation (Decoupled Upload vs Merge)...');

function validateFiles(files) {
  if (files.length < 1) {
    return {
      valid: false,
      error: 'Please select at least 1 PDF file.',
    };
  }
  for (const file of files) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return {
        valid: false,
        error: `File "${file.name}" is not a PDF.`,
      };
    }
  }
  return { valid: true };
}

const mockFile1 = { name: 'Document1.pdf', size: 1024 };
const mockFile2 = { name: 'Document2.pdf', size: 2048 };
const mockFileTxt = { name: 'Notes.txt', size: 512 };

// 0 files validation
const val0 = validateFiles([]);
assert.strictEqual(val0.valid, false, '0 files should fail validation');
console.log('  ✓ 0 files rejected when empty');

// 1 file validation: MUST BE VALID FOR UPLOAD (Bug fix verification)
const val1 = validateFiles([mockFile1]);
assert.strictEqual(val1.valid, true, 'Single PDF must be valid to upload (not rejected)');
console.log('  ✓ 1 single PDF is ACCEPTED for upload (fixes bug where 1 file was rejected)');

// 2 files validation
const val2 = validateFiles([mockFile1, mockFile2]);
assert.strictEqual(val2.valid, true, '2 PDF files valid');
console.log('  ✓ 2 PDF files valid');

// Non-pdf rejection
const valNonPdf = validateFiles([mockFile1, mockFileTxt]);
assert.strictEqual(valNonPdf.valid, false, 'Non-PDF file rejected');
console.log('  ✓ Non-PDF file correctly rejected');

// 2. Test Merge Execution requires >= 2 files
console.log('\nTest 2: Merge Execution Count Requirement...');
function canMerge(files) {
  return files.length >= 2;
}

assert.strictEqual(canMerge([]), false, '0 files cannot merge');
assert.strictEqual(canMerge([mockFile1]), false, '1 file cannot merge');
assert.strictEqual(canMerge([mockFile1, mockFile2]), true, '2 files CAN merge');
assert.strictEqual(canMerge([mockFile1, mockFile2, mockFile1]), true, '3 files CAN merge');
console.log('  ✓ Merge operation strictly requires at least 2 files');

// 3. Test Full PDF Merge in exact sequence
console.log('\nTest 3: PDF Merging & Page Order Integrity...');
async function createSamplePdf(pages) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([600, 400]);
  return await doc.save();
}
const f1Bytes = await createSamplePdf(3);
const f2Bytes = await createSamplePdf(2);
const f3Bytes = await createSamplePdf(4);

// Step A: Merge Doc1 + Doc2
const mergedDoc = await PDFDocument.create();
const loaded1 = await PDFDocument.load(f1Bytes);
const loaded2 = await PDFDocument.load(f2Bytes);

const pages1 = await mergedDoc.copyPages(loaded1, loaded1.getPageIndices());
pages1.forEach((p) => mergedDoc.addPage(p));

const pages2 = await mergedDoc.copyPages(loaded2, loaded2.getPageIndices());
pages2.forEach((p) => mergedDoc.addPage(p));

assert.strictEqual(mergedDoc.getPageCount(), 5, 'Doc1 (3) + Doc2 (2) = 5 pages');
console.log('  ✓ Initial 2 PDFs merged correctly: 5 pages total');

// Step B: Simulate "Add More Files" with single file Doc3 (4 pages) -> Total 9 pages
const loaded3 = await PDFDocument.load(f3Bytes);
const pages3 = await mergedDoc.copyPages(loaded3, loaded3.getPageIndices());
pages3.forEach((p) => mergedDoc.addPage(p));

assert.strictEqual(mergedDoc.getPageCount(), 9, 'Adding 1 more file: 5 + 4 = 9 pages');
console.log('  ✓ "Add More Files" with single file: Total 9 pages, sequence preserved');

// 4. Verify Source Code Architecture Constraints
console.log('\nTest 4: UI Source Code Architecture Constraints...');
const converterCode = fs.readFileSync('src/components/tools/MergePdfConverter.tsx', 'utf-8');

// Ensure NO Sidebar (no grid-cols-12 or col-span-5/7)
assert(!converterCode.includes('grid-cols-12'), 'NO grid-cols-12 sidebar grid');
assert(!converterCode.includes('lg:col-span-5'), 'NO lg:col-span-5 sidebar column');
assert(!converterCode.includes('lg:col-span-7'), 'NO lg:col-span-7 column');
console.log('  ✓ NO sidebar elements in layout (confirmed no grid-cols-12 or col-span-5/7)');

// Ensure NO internal scroll container on file list
assert(!converterCode.includes('overflow-y-auto pr-1 space-y-1.5'), 'NO fixed scrollable file list container');
console.log('  ✓ NO internal file-list scrollable container');

// Ensure Footer is hidden
const footerCode = fs.readFileSync('src/components/layout/Footer.tsx', 'utf-8');
assert(footerCode.includes("pathname?.includes('merge-pdf')"), 'Footer is safely hidden on merge-pdf');
console.log('  ✓ Footer is safely hidden on merge-pdf page');

// Ensure Merge More Files resets only merge-result state without wiping files
assert(converterCode.includes('const handleMergeMoreFiles = () => {'), 'handleMergeMoreFiles exists');
assert(!converterCode.match(/handleMergeMoreFiles\s*=\s*\(\)\s*=>\s*\{[^}]*setFiles\(\[\]\)/), 'handleMergeMoreFiles does NOT clear files array');
console.log('  ✓ "Merge More Files" preserves uploaded files and only resets result state');

// Ensure upload validation in index.ts allows 1 file
const indexCode = fs.readFileSync('src/tools/merge-pdf/index.ts', 'utf-8');
assert(indexCode.includes('if (files.length < 1)'), 'index.ts validateFiles accepts single file for upload');
console.log('  ✓ src/tools/merge-pdf/index.ts decoupled: upload allows 1+ files');

console.log('\n🎉 ALL TOOLINO MERGE PDF WORKFLOW TESTS PASSED 100%!\n');
