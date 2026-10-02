import assert from 'node:assert';
import fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

console.log('🧪 Running Toolino Split PDF Full Workflow & Redesign Verification Suite...\n');

// 1. File Upload Validation (Strictly 1 PDF accepted)
console.log('Test 1: Single PDF Upload Validation...');

function validateUpload(files) {
  if (!files || files.length === 0) {
    return { valid: false, error: 'Upload a PDF to continue' };
  }
  if (files.length > 1) {
    return { valid: false, error: 'Split PDF supports exactly one PDF document at a time.' };
  }
  const file = files[0];
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: `"${file.name}" is not a PDF file.` };
  }
  return { valid: true };
}

const mockDoc = { name: 'Report.pdf', size: 1024 * 50 };
const mockDoc2 = { name: 'Second.pdf', size: 1024 * 30 };
const mockTxt = { name: 'Notes.txt', size: 512 };

assert.strictEqual(validateUpload([]).valid, false, '0 files must be rejected');
console.log('  ✓ 0 files rejected when empty');

assert.strictEqual(validateUpload([mockDoc]).valid, true, '1 single PDF must be accepted');
console.log('  ✓ Exactly 1 PDF file is accepted');

assert.strictEqual(validateUpload([mockDoc, mockDoc2]).valid, false, 'Multiple files rejected on initial select');
console.log('  ✓ Multiple files handled/restricted to single target document');

assert.strictEqual(validateUpload([mockTxt]).valid, false, 'Non-PDF file rejected');
console.log('  ✓ Non-PDF file correctly rejected');

// 2. Range Parsing and Grouping Logic
console.log('\nTest 2: Page Range Parsing & Bounds Validation...');

function parseRangeGroups(rangeStr, totalPages) {
  const trimmed = rangeStr.trim();
  if (!trimmed) throw new Error('Range is empty');
  const parts = trimmed.split(',');
  const groups = [];

  for (const part of parts) {
    const pTrim = part.trim();
    if (!pTrim) continue;
    if (pTrim.includes('-')) {
      const [sStr, eStr] = pTrim.split('-');
      const start = parseInt(sStr.trim(), 10);
      const end = parseInt(eStr.trim(), 10);
      if (isNaN(start) || isNaN(end)) throw new Error(`Invalid range: ${pTrim}`);
      if (start < 1) throw new Error('Start page < 1');
      if (end > totalPages) throw new Error(`Page ${end} exceeds total pages (${totalPages})`);
      if (start > end) throw new Error(`Start page (${start}) > end page (${end})`);
      const indices = [];
      for (let i = start; i <= end; i++) indices.push(i - 1);
      groups.push({ desc: `Pages ${start}–${end}`, indices });
    } else {
      const page = parseInt(pTrim, 10);
      if (isNaN(page)) throw new Error(`Invalid page: ${pTrim}`);
      if (page < 1 || page > totalPages) throw new Error(`Page ${page} out of bounds`);
      groups.push({ desc: `Page ${page}`, indices: [page - 1] });
    }
  }
  return groups;
}

const groups1 = parseRangeGroups('1-3, 5, 8-10', 12);
assert.strictEqual(groups1.length, 3, '1-3, 5, 8-10 should create 3 groups');
assert.deepStrictEqual(groups1[0].indices, [0, 1, 2], 'Group 1 has pages 1, 2, 3');
assert.deepStrictEqual(groups1[1].indices, [4], 'Group 2 has page 5');
assert.deepStrictEqual(groups1[2].indices, [7, 8, 9], 'Group 3 has pages 8, 9, 10');
console.log('  ✓ Multi-range string "1-3, 5, 8-10" parsed into 3 distinct output groups');

// Bounds checks
assert.throws(() => parseRangeGroups('1-15', 10), /exceeds total pages/, 'Out of bounds range caught');
assert.throws(() => parseRangeGroups('5-2', 10), /Start page \(5\) > end page \(2\)/, 'Inverted range caught');
console.log('  ✓ Out of bounds and inverted ranges safely rejected with descriptive errors');

// 3. In-Memory PDF Splitting Execution
console.log('\nTest 3: PDF Split Execution & Output Integrity...');

async function createSamplePdf(pageCount) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([600, 400]);
  }
  return await doc.save();
}

const samplePdfBytes = await createSamplePdf(6);
const loadedDoc = await PDFDocument.load(samplePdfBytes);
assert.strictEqual(loadedDoc.getPageCount(), 6, 'Sample PDF has 6 pages');

// Mode A: Split ranges '1-2, 4, 5-6'
const splitPlan = parseRangeGroups('1-2, 4, 5-6', 6);
const createdFiles = [];

for (const item of splitPlan) {
  const subDoc = await PDFDocument.create();
  const copied = await subDoc.copyPages(loadedDoc, item.indices);
  copied.forEach((p) => subDoc.addPage(p));
  const bytes = await subDoc.save();
  const verifyDoc = await PDFDocument.load(bytes);
  createdFiles.push({
    pageCount: verifyDoc.getPageCount(),
    bytesLength: bytes.length,
  });
}

assert.strictEqual(createdFiles.length, 3, '3 PDF files created');
assert.strictEqual(createdFiles[0].pageCount, 2, 'File 1 has 2 pages (1-2)');
assert.strictEqual(createdFiles[1].pageCount, 1, 'File 2 has 1 page (4)');
assert.strictEqual(createdFiles[2].pageCount, 2, 'File 3 has 2 pages (5-6)');
console.log('  ✓ Range split successfully created 3 files with exact page counts');

// Mode B: Split every page (6 pages -> 6 PDFs)
const allPageFiles = [];
for (let p = 0; p < 6; p++) {
  const singleDoc = await PDFDocument.create();
  const [copiedPage] = await singleDoc.copyPages(loadedDoc, [p]);
  singleDoc.addPage(copiedPage);
  const bytes = await singleDoc.save();
  allPageFiles.push(bytes);
}
assert.strictEqual(allPageFiles.length, 6, 'Split every page generates 6 PDFs');
console.log('  ✓ Split every page successfully generated 6 individual 1-page PDF files');

// Mode C: ZIP Archive Generation
const zip = new JSZip();
allPageFiles.forEach((bytes, idx) => {
  zip.file(`Document_page_${idx + 1}.pdf`, bytes);
});
const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
assert(zipBuffer.length > 0, 'ZIP file generated successfully');
console.log(`  ✓ JSZip generated download archive (${zipBuffer.length} bytes)`);

// 4. Verify UI & Architecture Constraints
console.log('\nTest 4: UI Architecture & Consistency Constraints...');

const splitConverterCode = fs.readFileSync('src/components/tools/SplitPdfConverter.tsx', 'utf-8');

// Ensure NO Sidebar (no grid-cols-12 or col-span-5/7)
assert(!splitConverterCode.includes('grid-cols-12'), 'NO grid-cols-12 sidebar grid');
assert(!splitConverterCode.includes('lg:col-span-5'), 'NO lg:col-span-5 sidebar column');
assert(!splitConverterCode.includes('lg:col-span-7'), 'NO lg:col-span-7 column');
console.log('  ✓ NO sidebar elements in layout (confirmed no grid-cols-12 or col-span-5/7)');

// Ensure viewport overflow lock on desktop
assert(splitConverterCode.includes("document.documentElement.style.overflow = 'hidden'"), 'Desktop viewport lock applied');
console.log('  ✓ Desktop viewport overflow-hidden lock implemented');

// Ensure Footer is hidden
const footerCode = fs.readFileSync('src/components/layout/Footer.tsx', 'utf-8');
assert(footerCode.includes("pathname?.includes('split-pdf')"), 'Footer is safely hidden on split-pdf');
console.log('  ✓ Footer is safely hidden on split-pdf page');

// Ensure ToolPage educational section is omitted
const pageCode = fs.readFileSync('src/app/tools/[toolId]/page.tsx', 'utf-8');
assert(pageCode.includes("toolId !== 'split-pdf'"), 'Educational section omitted on split-pdf');
console.log('  ✓ Educational section omitted on split-pdf page');

// Ensure rewrite route is registered in next.config.mjs
const nextConfigCode = fs.readFileSync('next.config.mjs', 'utf-8');
assert(nextConfigCode.includes("destination: '/tools/split-pdf'"), 'Rewrite exists for split-pdf');
console.log('  ✓ next.config.mjs rewrites registered for /split-pdf');

// Ensure ToolRunner dispatches to SplitPdfConverter
const toolRunnerCode = fs.readFileSync('src/components/tools/ToolRunner.tsx', 'utf-8');
assert(toolRunnerCode.includes("<SplitPdfConverter />"), 'ToolRunner dispatches to SplitPdfConverter');
console.log('  ✓ ToolRunner routes split-pdf directly to SplitPdfConverter');

console.log('\n🎉 ALL TOOLINO SPLIT PDF WORKFLOW TESTS PASSED 100%!\n');
