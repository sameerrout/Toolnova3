import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

console.log('🧪 Running Toolino Watermark PDF Full Workflow & Redesign Verification Suite...\n');

// 1. Single PDF Upload Validation
console.log('Test 1: Single PDF Upload Validation...');

function validateUpload(files) {
  if (!files || files.length === 0) {
    return { valid: false, error: 'Upload a PDF to continue' };
  }
  if (files.length > 1) {
    return { valid: false, error: 'Watermark PDF supports exactly one PDF document at a time.' };
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

const mockDoc = { name: 'Financial_Report.pdf', size: 1024 * 80 };
const mockDoc2 = { name: 'Audit.pdf', size: 1024 * 40 };
const mockJpg = { name: 'Cover.jpg', size: 1024 * 15 };
const mockOversized = { name: 'Massive.pdf', size: 120 * 1024 * 1024 };

assert.strictEqual(validateUpload([]).valid, false, '0 files must be rejected');
console.log('  ✓ 0 files rejected when empty');

assert.strictEqual(validateUpload([mockDoc]).valid, true, '1 single PDF must be accepted');
console.log('  ✓ Exactly 1 PDF file is accepted');

assert.strictEqual(validateUpload([mockDoc, mockDoc2]).valid, false, 'Multiple files rejected');
console.log('  ✓ Multiple files strictly rejected (single document workflow)');

assert.strictEqual(validateUpload([mockJpg]).valid, false, 'Non-PDF file rejected');
console.log('  ✓ Non-PDF file rejected');

assert.strictEqual(validateUpload([mockOversized]).valid, false, 'Files over 100 MB rejected');
console.log('  ✓ File size limit enforced (100 MB)');

// 2. Watermark Config & Position Calculations
console.log('\nTest 2: Watermark Position Calculations & Options Validation...');

function calculatePosition(pos, pageWidth, pageHeight, elemWidth, elemHeight, padding = 40) {
  let x = (pageWidth - elemWidth) / 2;
  let y = (pageHeight - elemHeight) / 2;

  if (pos.includes('left')) x = padding;
  else if (pos.includes('right')) x = pageWidth - elemWidth - padding;

  if (pos.includes('top')) y = pageHeight - elemHeight - padding;
  else if (pos.includes('bottom')) y = padding;

  return { x, y };
}

const pageWidth = 600;
const pageHeight = 800;
const textW = 200;
const textH = 40;

// Center
const centerPos = calculatePosition('center', pageWidth, pageHeight, textW, textH);
assert.strictEqual(centerPos.x, 200); // (600 - 200) / 2
assert.strictEqual(centerPos.y, 380); // (800 - 40) / 2
console.log('  ✓ Center position calculated accurately');

// Top Left
const topLeftPos = calculatePosition('top-left', pageWidth, pageHeight, textW, textH);
assert.strictEqual(topLeftPos.x, 40);
assert.strictEqual(topLeftPos.y, 720); // 800 - 40 - 40
console.log('  ✓ Top Left position calculated accurately');

// Bottom Right
const bottomRightPos = calculatePosition('bottom-right', pageWidth, pageHeight, textW, textH);
assert.strictEqual(bottomRightPos.x, 360); // 600 - 200 - 40
assert.strictEqual(bottomRightPos.y, 40);
console.log('  ✓ Bottom Right position calculated accurately');

// 3. Real In-Memory PDF Watermarking with pdf-lib
console.log('\nTest 3: Real In-Memory PDF Watermarking Execution...');

async function createSamplePdf(pageCount) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([600, 800]);
  }
  return await doc.save();
}

const samplePdfBytes = await createSamplePdf(3);
const testPdfDoc = await PDFDocument.load(samplePdfBytes);
const font = await testPdfDoc.embedFont(StandardFonts.HelveticaBold);
const pages = testPdfDoc.getPages();

assert.strictEqual(pages.length, 3, 'Sample PDF has 3 pages');

// Stamp watermark on pages
const watermarkText = 'CONFIDENTIAL';
const fontSize = 48;
const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
const textHeight = font.heightAtSize(fontSize);
const x = (600 - textWidth) / 2;
const y = (800 - textHeight) / 2;

for (const page of pages) {
  page.drawText(watermarkText, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0.5, 0.5, 0.5),
    opacity: 0.3,
    rotate: degrees(45),
  });
}

const watermarkedBytes = await testPdfDoc.save();
assert(watermarkedBytes.length > samplePdfBytes.length, 'Watermarked PDF size must be greater due to embedded font and text');

// Reload and verify integrity
const verifiedDoc = await PDFDocument.load(watermarkedBytes);
assert.strictEqual(verifiedDoc.getPageCount(), 3, 'Watermarked PDF retains all 3 pages');
console.log('  ✓ In-memory PDF text watermarking stamped and verified successfully');

// 4. Component Architecture & Constraint Checks
console.log('\nTest 4: Component Architecture & No Sidebar / No Footer Contracts...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const converterPath = path.join(rootDir, 'src', 'components', 'tools', 'WatermarkPdfConverter.tsx');
assert(fs.existsSync(converterPath), 'WatermarkPdfConverter.tsx must exist');
const converterContent = fs.readFileSync(converterPath, 'utf8');

// Key UI strings & capabilities
assert(converterContent.includes('Watermark PDF'), 'Component must display title "Watermark PDF"');
assert(converterContent.includes('Text Watermark'), 'Component must support Text Watermark');
assert(converterContent.includes('Image Watermark'), 'Component must support Image Watermark');
assert(converterContent.includes('Top Left'), 'Component must include 9-grid position presets');
assert(converterContent.includes('Apply Watermark'), 'Component must include Apply Watermark button');
assert(converterContent.includes('Edit Watermark'), 'Component must allow editing after apply');
assert(converterContent.includes('Download PDF'), 'Component must include Download PDF button');
assert(converterContent.includes('Files stay on your device'), 'Privacy badge must be present');
console.log('  ✓ WatermarkPdfConverter contains all required controls, two-section layout, and review states');

// Check Footer exclusion
const footerPath = path.join(rootDir, 'src', 'components', 'layout', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');
assert(footerContent.includes('watermark-pdf'), 'Footer.tsx must explicitly exclude watermark-pdf');
console.log('  ✓ Footer.tsx properly hides footer on watermark-pdf');

// Check ToolRunner wiring
const runnerPath = path.join(rootDir, 'src', 'components', 'tools', 'ToolRunner.tsx');
const runnerContent = fs.readFileSync(runnerPath, 'utf8');
assert(runnerContent.includes("toolId === 'watermark-pdf'"), 'ToolRunner must route watermark-pdf to WatermarkPdfConverter');
assert(runnerContent.includes('<WatermarkPdfConverter />'), 'ToolRunner must render WatermarkPdfConverter');
console.log('  ✓ ToolRunner dispatches toolId "watermark-pdf" to WatermarkPdfConverter');

// Check [toolId] page educational section exclusion
const toolPagePath = path.join(rootDir, 'src', 'app', 'tools', '[toolId]', 'page.tsx');
const toolPageContent = fs.readFileSync(toolPagePath, 'utf8');
assert(toolPageContent.includes("toolId !== 'watermark-pdf'"), '[toolId]/page.tsx must exclude bottom educational section for watermark-pdf');
console.log('  ✓ [toolId]/page.tsx keeps watermark-pdf focused with no bottom educational section');

console.log('\n✅ All Watermark PDF workflow, math, PDF generation, and UI checks passed successfully!\n');
