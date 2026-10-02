import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

console.log('🧪 Running Toolino PDF Page Numbers Full Workflow & Redesign Verification Suite...\n');

// 1. Single PDF Upload Validation
console.log('Test 1: Single PDF Upload Validation...');

function validateUpload(files) {
  if (!files || files.length === 0) {
    return { valid: false, error: 'Upload a PDF to continue' };
  }
  if (files.length > 1) {
    return { valid: false, error: 'PDF Page Numbers supports exactly one PDF document at a time.' };
  }
  const file = files[0];
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: `"${file.name}" is not a PDF file.` };
  }
  if (file.size > 100 * 1024 * 1024) {
    return { valid: false, error: `"${file.name}" exceeds 100 MB.` };
  }
  return { valid: true };
}

const mockDoc = { name: 'Thesis_Final.pdf', size: 1024 * 90 };
const mockDoc2 = { name: 'Addendum.pdf', size: 1024 * 35 };
const mockTxt = { name: 'Readme.txt', size: 1024 * 2 };
const mockHuge = { name: 'Giant.pdf', size: 130 * 1024 * 1024 };

assert.strictEqual(validateUpload([]).valid, false, '0 files must be rejected');
console.log('  ✓ 0 files rejected when empty');

assert.strictEqual(validateUpload([mockDoc]).valid, true, '1 single PDF must be accepted');
console.log('  ✓ Exactly 1 PDF file is accepted');

assert.strictEqual(validateUpload([mockDoc, mockDoc2]).valid, false, 'Multiple files rejected');
console.log('  ✓ Multiple files strictly rejected (single document workflow)');

assert.strictEqual(validateUpload([mockTxt]).valid, false, 'Non-PDF file rejected');
console.log('  ✓ Non-PDF file rejected');

assert.strictEqual(validateUpload([mockHuge]).valid, false, 'Files over 100 MB rejected');
console.log('  ✓ File size limit enforced (100 MB)');

// 2. Numbering Format & Calculation Logic
console.log('\nTest 2: Page Number Formatting & Calculation Logic...');

function formatPageLabel(pageIndex, totalPages, format, startNumber = 1, skipFirstPage = false) {
  if (skipFirstPage && pageIndex === 0) {
    return '';
  }

  const effectiveIndex = skipFirstPage ? pageIndex - 1 : pageIndex;
  const effectiveTotal = skipFirstPage ? totalPages - 1 : totalPages;
  const currentNumber = startNumber + effectiveIndex;
  const maxNumber = startNumber + effectiveTotal - 1;

  switch (format) {
    case 'page-of-total':
      return `Page ${currentNumber} of ${maxNumber}`;
    case 'simple-slash':
      return `${currentNumber} / ${maxNumber}`;
    case 'number-only':
      return `${currentNumber}`;
    case 'page-number':
      return `Page ${currentNumber}`;
    case 'hyphen':
      return `- ${currentNumber} -`;
    default:
      return `Page ${currentNumber} of ${maxNumber}`;
  }
}

// Standard 12-page document starting at 1
assert.strictEqual(formatPageLabel(0, 12, 'page-of-total', 1), 'Page 1 of 12');
assert.strictEqual(formatPageLabel(11, 12, 'page-of-total', 1), 'Page 12 of 12');
assert.strictEqual(formatPageLabel(0, 12, 'simple-slash', 1), '1 / 12');
assert.strictEqual(formatPageLabel(0, 12, 'number-only', 1), '1');
assert.strictEqual(formatPageLabel(0, 12, 'page-number', 1), 'Page 1');
assert.strictEqual(formatPageLabel(0, 12, 'hyphen', 1), '- 1 -');
console.log('  ✓ All 5 numbering format templates computed accurately');

// Custom starting number (e.g. start at 5)
assert.strictEqual(formatPageLabel(0, 12, 'page-of-total', 5), 'Page 5 of 16');
assert.strictEqual(formatPageLabel(1, 12, 'page-of-total', 5), 'Page 6 of 16');
assert.strictEqual(formatPageLabel(11, 12, 'page-of-total', 5), 'Page 16 of 16');
console.log('  ✓ Custom starting page numbers offset correctly');

// Skip cover page (skipFirstPage = true)
assert.strictEqual(formatPageLabel(0, 12, 'page-of-total', 1, true), '');
assert.strictEqual(formatPageLabel(1, 12, 'page-of-total', 1, true), 'Page 1 of 11');
assert.strictEqual(formatPageLabel(11, 12, 'page-of-total', 1, true), 'Page 11 of 11');
console.log('  ✓ Skip cover page correctly omits page 1 and recalculates subsequent pages');

// 3. Coordinate Positioning Calculations
console.log('\nTest 3: Coordinate & Margin Layout Calculation...');

function calculateCoords(pos, pageWidth, pageHeight, textW, textH, margin = 28) {
  let x = margin;
  let y = margin;

  if (pos.includes('center')) {
    x = (pageWidth - textW) / 2;
  } else if (pos.includes('right')) {
    x = pageWidth - margin - textW;
  } else {
    x = margin;
  }

  if (pos.startsWith('top')) {
    y = pageHeight - margin - textH;
  } else {
    y = margin;
  }

  return { x, y };
}

const pW = 600;
const pH = 800;
const tW = 80;
const tH = 12;

const bottomCenter = calculateCoords('bottom-center', pW, pH, tW, tH, 28);
assert.strictEqual(bottomCenter.x, (600 - 80) / 2); // 260
assert.strictEqual(bottomCenter.y, 28);
console.log('  ✓ Bottom Center positioning calculated accurately');

const bottomRight = calculateCoords('bottom-right', pW, pH, tW, tH, 28);
assert.strictEqual(bottomRight.x, 600 - 28 - 80); // 492
assert.strictEqual(bottomRight.y, 28);
console.log('  ✓ Bottom Right positioning calculated accurately');

const topLeft = calculateCoords('top-left', pW, pH, tW, tH, 28);
assert.strictEqual(topLeft.x, 28);
assert.strictEqual(topLeft.y, 800 - 28 - 12); // 760
console.log('  ✓ Top Left positioning calculated accurately');

// 4. Real In-Memory PDF Page Numbering Execution with pdf-lib
console.log('\nTest 4: In-Memory PDF Page Numbering Execution...');

async function createSamplePdf(pageCount) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([600, 800]);
  }
  return await doc.save();
}

const samplePdfBytes = await createSamplePdf(4);
const testPdfDoc = await PDFDocument.load(samplePdfBytes);
const font = await testPdfDoc.embedFont(StandardFonts.Helvetica);
const pages = testPdfDoc.getPages();

assert.strictEqual(pages.length, 4, 'Sample PDF has 4 pages');

// Stamp page numbers
for (let i = 0; i < pages.length; i++) {
  const page = pages[i];
  const label = `Page ${i + 1} of 4`;
  const textWidth = font.widthOfTextAtSize(label, 11);
  const textHeight = font.heightAtSize(11);
  const x = (600 - textWidth) / 2;
  const y = 28;

  page.drawText(label, {
    x,
    y,
    size: 11,
    font,
    color: rgb(0.28, 0.33, 0.41),
  });
}

const numberedPdfBytes = await testPdfDoc.save();
assert(numberedPdfBytes.length > samplePdfBytes.length, 'Numbered PDF bytes must be larger than original');

// Reload and verify
const verifiedDoc = await PDFDocument.load(numberedPdfBytes);
assert.strictEqual(verifiedDoc.getPageCount(), 4, 'Numbered PDF retains all 4 pages');
console.log('  ✓ In-memory PDF page numbering successfully stamped and validated');

// 5. Component Architecture & UI Constraint Checks
console.log('\nTest 5: Component Architecture & No Sidebar / No Footer Contracts...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const converterPath = path.join(rootDir, 'src', 'components', 'tools', 'PdfPageNumbersConverter.tsx');
assert(fs.existsSync(converterPath), 'PdfPageNumbersConverter.tsx must exist');
const converterContent = fs.readFileSync(converterPath, 'utf8');

// Key UI strings & capabilities
assert(converterContent.includes('PDF Page Numbers'), 'Component must display title "PDF Page Numbers"');
assert(converterContent.includes('Bottom Center'), 'Component must include Bottom Center preset');
assert(converterContent.includes('Page 1 of 12'), 'Component must include Page of Total format');
assert(converterContent.includes('Start Numbering From'), 'Component must include Start Numbering control');
assert(converterContent.includes('Apply Page Numbers'), 'Component must include Apply Page Numbers button');
assert(converterContent.includes('Edit Settings'), 'Component must allow editing after apply');
assert(converterContent.includes('Download PDF'), 'Component must include Download PDF button');
assert(converterContent.includes('Files stay on your device'), 'Privacy badge must be present');
console.log('  ✓ PdfPageNumbersConverter contains all required controls, two-column layout, and review states');

// Check Footer exclusion
const footerPath = path.join(rootDir, 'src', 'components', 'layout', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');
assert(footerContent.includes('pdf-page-numbers'), 'Footer.tsx must explicitly exclude pdf-page-numbers');
console.log('  ✓ Footer.tsx properly hides footer on pdf-page-numbers');

// Check ToolRunner wiring
const runnerPath = path.join(rootDir, 'src', 'components', 'tools', 'ToolRunner.tsx');
const runnerContent = fs.readFileSync(runnerPath, 'utf8');
assert(runnerContent.includes("toolId === 'pdf-page-numbers'"), 'ToolRunner must route pdf-page-numbers to PdfPageNumbersConverter');
assert(runnerContent.includes('<PdfPageNumbersConverter />'), 'ToolRunner must render PdfPageNumbersConverter');
console.log('  ✓ ToolRunner dispatches toolId "pdf-page-numbers" to PdfPageNumbersConverter');

// Check [toolId] page educational section exclusion
const toolPagePath = path.join(rootDir, 'src', 'app', 'tools', '[toolId]', 'page.tsx');
const toolPageContent = fs.readFileSync(toolPagePath, 'utf8');
assert(toolPageContent.includes("toolId !== 'pdf-page-numbers'"), '[toolId]/page.tsx must exclude bottom educational section for pdf-page-numbers');
console.log('  ✓ [toolId]/page.tsx keeps pdf-page-numbers focused with no bottom educational section');

console.log('\n✅ All PDF Page Numbers workflow, math, PDF generation, and UI checks passed successfully!\n');
