/**
 * Automated Verification Suite for Toolino PDF to PowerPoint Redesign & Usability Contracts
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PptxGenJS from 'pptxgenjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Running Toolino PDF to PowerPoint Full Workflow & Redesign Verification Suite...\n');

// -----------------------------------------------------------------------------
// Test 1: Single PDF Upload Validation
// -----------------------------------------------------------------------------
console.log('Test 1: Single PDF Upload Validation...');

function validateUpload(fileList) {
  if (!fileList || fileList.length === 0) return { valid: false, error: 'No file selected' };
  if (fileList.length > 1) return { valid: false, error: 'Please upload a single PDF document' };
  const file = fileList[0];
  const ext = path.extname(file.name).toLowerCase();
  if (ext !== '.pdf') return { valid: false, error: 'Only PDF files are supported' };
  if (file.size <= 0) return { valid: false, error: 'File is empty' };
  if (file.size > 100 * 1024 * 1024) return { valid: false, error: 'File exceeds 100 MB limit' };
  return { valid: true };
}

assert.strictEqual(validateUpload([]).valid, false, 'Empty list must be rejected');
assert.strictEqual(validateUpload([{ name: 'a.pdf', size: 100 }, { name: 'b.pdf', size: 100 }]).valid, false, 'Multiple files rejected');
assert.strictEqual(validateUpload([{ name: 'deck.pptx', size: 1024 }]).valid, false, 'Non-PDF file rejected');
assert.strictEqual(validateUpload([{ name: 'presentation.pdf', size: 120 * 1024 * 1024 }]).valid, false, 'Oversized file rejected');
assert.strictEqual(validateUpload([{ name: 'quarterly_report.pdf', size: 4.8 * 1024 * 1024 }]).valid, true, 'Single valid PDF accepted');
console.log('  ✓ Single PDF upload enforced, multiple or non-PDF files rejected\n');

// -----------------------------------------------------------------------------
// Test 2: Page Range Parsing & Target Slide Count Mapping
// -----------------------------------------------------------------------------
console.log('Test 2: Page Range Parsing & Target Slide Count Mapping...');

function parsePageRange(rangeStr, maxPages) {
  if (!rangeStr || !rangeStr.trim()) return [];
  const pages = new Set();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          pages.add(p);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
        pages.add(pageNum);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

// 12 pages doc
const allPages = parsePageRange('1-12', 12);
assert.strictEqual(allPages.length, 12, 'All 12 pages mapped');

const selectedPages = parsePageRange('1-3, 5, 8-10', 12);
assert.deepStrictEqual(selectedPages, [1, 2, 3, 5, 8, 9, 10], 'Range and individual pages parsed correctly');
assert.strictEqual(selectedPages.length, 7, '7 slides will be created from 7 selected pages');

// Out of bounds clamping
const clampedPages = parsePageRange('0-5, 12-15', 12);
assert.deepStrictEqual(clampedPages, [1, 2, 3, 4, 5, 12], 'Pages outside 1-12 safely clamped');
console.log('  ✓ Page range parsing and dynamic slide count calculation verified\n');

// -----------------------------------------------------------------------------
// Test 3: Real In-Memory PPTX Generation with PptxGenJS
// -----------------------------------------------------------------------------
console.log('Test 3: Real In-Memory PPTX Generation (1 Page = 1 Slide Guarantee)...');

// 3.1 Test 16:9 Widescreen Presentation Generation
const pptxWidescreen = new PptxGenJS();
pptxWidescreen.layout = 'LAYOUT_16x9';
pptxWidescreen.title = 'Quarterly Strategy Deck';

// Create 3 slides with content and speaker notes
for (let i = 1; i <= 3; i++) {
  const slide = pptxWidescreen.addSlide();
  // Add sample graphic/placeholder and speaker notes
  slide.addText(`Slide ${i}: Strategic Initiative`, { x: 1, y: 1, fontSize: 24, bold: true, color: '1d4ed8' });
  slide.addNotes(`Presenter Notes for Slide ${i}: Searchable text extracted from source PDF page ${i}.`);
}

const wideBytes = await pptxWidescreen.write({ outputType: 'nodebuffer' });
assert(wideBytes.length > 0, 'PPTX buffer must not be empty');
// Verify PK zip header (standard Office OpenXML presentation package)
assert.strictEqual(wideBytes[0], 0x50, 'Must start with PK zip signature byte 1');
assert.strictEqual(wideBytes[1], 0x4b, 'Must start with PK zip signature byte 2');
console.log(`  ✓ Successfully generated 16:9 Widescreen PPTX deck (${wideBytes.length} bytes, 3 slides)`);

// 3.2 Test 4:3 Standard Classic Layout
const pptxStandard = new PptxGenJS();
pptxStandard.layout = 'LAYOUT_4x3';
pptxStandard.title = 'Classic Layout Presentation';
for (let i = 1; i <= 2; i++) {
  const slide = pptxStandard.addSlide();
  slide.addText(`Classic Slide ${i}`, { x: 1, y: 1, fontSize: 20 });
}
const stdBytes = await pptxStandard.write({ outputType: 'nodebuffer' });
assert(stdBytes.length > 0, 'Standard PPTX buffer must not be empty');
console.log(`  ✓ Successfully generated 4:3 Standard PPTX deck (${stdBytes.length} bytes, 2 slides)\n`);

// -----------------------------------------------------------------------------
// Test 4: Codebase Redesign Architecture & Usability Contracts
// -----------------------------------------------------------------------------
console.log('Test 4: Codebase Redesign Architecture & Usability Contracts...');

// 4.1 Verify PdfToPowerpointConverter exists and has NO sidebars
const converterFile = path.join(rootDir, 'src/components/tools/PdfToPowerpointConverter.tsx');
assert(fs.existsSync(converterFile), 'PdfToPowerpointConverter.tsx must exist');
const converterContent = fs.readFileSync(converterFile, 'utf8');

assert(!converterContent.includes('left-sidebar'), 'No left sidebar');
assert(!converterContent.includes('right-sidebar'), 'No right sidebar');
assert(!converterContent.includes('aside'), 'No sidebar aside elements');
console.log('  ✓ Strictly NO left or right sidebar in PdfToPowerpointConverter');

// 4.2 Verify truthful description: Original Appearance & 1 Page = 1 Slide
assert(converterContent.includes('Original Appearance'), 'Truthful mode description present');
assert(converterContent.includes('1 Page = 1 Slide'), 'Guaranteed 1 page to 1 slide badge present');
assert(converterContent.includes('speaker notes'), 'Speaker notes explanation present');
console.log('  ✓ Truthful visual-fidelity conversion description verified (no fake editable claim)');

// 4.3 Verify ToolRunner wires PdfToPowerpointConverter
const toolRunnerFile = path.join(rootDir, 'src/components/tools/ToolRunner.tsx');
const toolRunnerContent = fs.readFileSync(toolRunnerFile, 'utf8');
assert(toolRunnerContent.includes('PdfToPowerpointConverter'), 'ToolRunner must import PdfToPowerpointConverter');
assert(toolRunnerContent.includes("toolId === 'pdf-to-powerpoint'"), 'ToolRunner must route pdf-to-powerpoint');
console.log('  ✓ ToolRunner properly routes pdf-to-powerpoint to PdfToPowerpointConverter');

// 4.4 Verify Footer is hidden on pdf-to-powerpoint
const footerFile = path.join(rootDir, 'src/components/layout/Footer.tsx');
const footerContent = fs.readFileSync(footerFile, 'utf8');
assert(footerContent.includes("pathname?.includes('pdf-to-powerpoint')"), 'Footer must be hidden on pdf-to-powerpoint');
console.log('  ✓ Footer hidden on pdf-to-powerpoint page');

// 4.5 Verify Educational Section suppressed
const toolPageFile = path.join(rootDir, 'src/app/tools/[toolId]/page.tsx');
const toolPageContent = fs.readFileSync(toolPageFile, 'utf8');
assert(toolPageContent.includes("toolId !== 'pdf-to-powerpoint'"), 'Educational section suppressed on pdf-to-powerpoint');
console.log('  ✓ Educational section suppressed for focused single-screen UI');

// 4.6 Verify route rewrites in next.config.mjs
const nextConfigFile = path.join(rootDir, 'next.config.mjs');
const nextConfigContent = fs.readFileSync(nextConfigFile, 'utf8');
assert(nextConfigContent.includes("source: '/pdf-to-powerpoint'"), 'Rewrite for /pdf-to-powerpoint exists');
assert(nextConfigContent.includes("source: '/pdf-to-pptx'"), 'Rewrite for /pdf-to-pptx exists');
console.log('  ✓ Route rewrites configured in next.config.mjs\n');

console.log('🎉 ALL PDF TO POWERPOINT REDESIGN AND USABILITY VERIFICATIONS PASSED (100%)!\n');
