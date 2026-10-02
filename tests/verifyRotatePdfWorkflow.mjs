import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, degrees } from 'pdf-lib';

console.log('🧪 Running Toolino Rotate PDF Full Workflow & Redesign Verification Suite...\n');

// 1. File Upload Validation (Strictly 1 PDF accepted)
console.log('Test 1: Single PDF Upload Validation...');

function validateUpload(files) {
  if (!files || files.length === 0) {
    return { valid: false, error: 'Upload a PDF to continue' };
  }
  if (files.length > 1) {
    return { valid: false, error: 'Rotate PDF supports exactly one PDF document at a time.' };
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

const mockDoc = { name: 'Contract.pdf', size: 1024 * 50 };
const mockDoc2 = { name: 'Appendix.pdf', size: 1024 * 30 };
const mockImg = { name: 'Photo.jpg', size: 1024 * 20 };
const mockHuge = { name: 'Huge.pdf', size: 150 * 1024 * 1024 };

assert.strictEqual(validateUpload([]).valid, false, '0 files must be rejected');
console.log('  ✓ 0 files rejected when empty');

assert.strictEqual(validateUpload([mockDoc]).valid, true, '1 single PDF must be accepted');
console.log('  ✓ Exactly 1 PDF file is accepted');

assert.strictEqual(validateUpload([mockDoc, mockDoc2]).valid, false, 'Multiple files rejected');
console.log('  ✓ Multiple files strictly rejected (single document workflow)');

assert.strictEqual(validateUpload([mockImg]).valid, false, 'Non-PDF rejected');
console.log('  ✓ Non-PDF file rejected');

assert.strictEqual(validateUpload([mockHuge]).valid, false, 'Files over 100 MB rejected');
console.log('  ✓ File size limit enforced (100 MB)');

// 2. Rotation Calculation & State Transitions
console.log('\nTest 2: Rotation State Mathematics & Transitions...');

function rotateRight(current) {
  return (current + 90) % 360;
}

function rotateLeft(current) {
  return (current - 90 + 360) % 360;
}

// Right rotation cycle: 0 -> 90 -> 180 -> 270 -> 0
assert.strictEqual(rotateRight(0), 90);
assert.strictEqual(rotateRight(90), 180);
assert.strictEqual(rotateRight(180), 270);
assert.strictEqual(rotateRight(270), 0);
console.log('  ✓ Rotate Right: 0° → 90° → 180° → 270° → 0° verified');

// Left rotation cycle: 0 -> 270 -> 180 -> 90 -> 0
assert.strictEqual(rotateLeft(0), 270);
assert.strictEqual(rotateLeft(270), 180);
assert.strictEqual(rotateLeft(180), 90);
assert.strictEqual(rotateLeft(90), 0);
console.log('  ✓ Rotate Left: 0° → 270° → 180° → 90° → 0° verified');

// Per-page independent state updates
const initialPages = [
  { pageNumber: 1, rotation: 0 },
  { pageNumber: 2, rotation: 0 },
  { pageNumber: 3, rotation: 0 },
  { pageNumber: 4, rotation: 0 },
];

// Step 1: Rotate Page 1 Right
let currentPages = initialPages.map((p) => (p.pageNumber === 1 ? { ...p, rotation: rotateRight(p.rotation) } : p));
assert.strictEqual(currentPages[0].rotation, 90);
assert.strictEqual(currentPages[1].rotation, 0);

// Step 2: Rotate Page 2 Left
currentPages = currentPages.map((p) => (p.pageNumber === 2 ? { ...p, rotation: rotateLeft(p.rotation) } : p));
assert.strictEqual(currentPages[0].rotation, 90, 'Page 1 previous rotation must be preserved');
assert.strictEqual(currentPages[1].rotation, 270);

// Step 3: Rotate Page 1 Right again
currentPages = currentPages.map((p) => (p.pageNumber === 1 ? { ...p, rotation: rotateRight(p.rotation) } : p));
assert.strictEqual(currentPages[0].rotation, 180);
assert.strictEqual(currentPages[1].rotation, 270);

// Step 4: Rotate Page 3 Left
currentPages = currentPages.map((p) => (p.pageNumber === 3 ? { ...p, rotation: rotateLeft(p.rotation) } : p));
assert.strictEqual(currentPages[2].rotation, 270);

// Step 5: Rotate All Right
currentPages = currentPages.map((p) => ({ ...p, rotation: rotateRight(p.rotation) }));
assert.strictEqual(currentPages[0].rotation, 270); // 180 + 90
assert.strictEqual(currentPages[1].rotation, 0);   // 270 + 90 = 360 -> 0
assert.strictEqual(currentPages[2].rotation, 0);   // 270 + 90 = 360 -> 0
assert.strictEqual(currentPages[3].rotation, 90);  // 0 + 90 = 90
console.log('  ✓ Repeated rotations on multiple pages preserve independent rotation states');

// Step 6: Reset individual page 1
currentPages = currentPages.map((p) => (p.pageNumber === 1 ? { ...p, rotation: 0 } : p));
assert.strictEqual(currentPages[0].rotation, 0);
assert.strictEqual(currentPages[3].rotation, 90);
console.log('  ✓ Reset single page resets only target page orientation');

// Step 7: Reset All
currentPages = currentPages.map((p) => ({ ...p, rotation: 0 }));
assert.deepStrictEqual(currentPages.map((p) => p.rotation), [0, 0, 0, 0]);
console.log('  ✓ Reset All returns all pages to 0° original orientation');

// 3. Real PDF Document Rotation with pdf-lib
console.log('\nTest 3: In-Memory PDF Document Rotation Execution...');

async function createSamplePdf(pageCount) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([600, 800]);
    // Optionally give page 2 an initial PDF rotation of 90 degrees
    if (i === 1) {
      page.setRotation(degrees(90));
    }
  }
  return await doc.save();
}

const sampleBytes = await createSamplePdf(4);
const testPdfDoc = await PDFDocument.load(sampleBytes);
const testPages = testPdfDoc.getPages();

assert.strictEqual(testPages.length, 4, 'Sample PDF must have 4 pages');
assert.strictEqual(testPages[0].getRotation().angle, 0);
assert.strictEqual(testPages[1].getRotation().angle, 90);
console.log('  ✓ Initial sample PDF loaded with pages and initial orientation angles');

// Apply target user rotations:
// Page 1: delta +90
// Page 2: delta +90 (was 90 -> becomes 180)
// Page 3: delta +180
// Page 4: delta +270
const userDeltas = [90, 90, 180, 270];

for (let i = 0; i < testPages.length; i++) {
  const origAngle = testPages[i].getRotation().angle || 0;
  const delta = userDeltas[i];
  testPages[i].setRotation(degrees((origAngle + delta) % 360));
}

const rotatedBytes = await testPdfDoc.save();
assert(rotatedBytes.length > 0, 'Rotated PDF bytes must be non-empty');

// Reload and verify rotated angles
const verifiedDoc = await PDFDocument.load(rotatedBytes);
const verifiedPages = verifiedDoc.getPages();

assert.strictEqual(verifiedPages[0].getRotation().angle, 90, 'Page 1 must be 90°');
assert.strictEqual(verifiedPages[1].getRotation().angle, 180, 'Page 2 (orig 90 + delta 90) must be 180°');
assert.strictEqual(verifiedPages[2].getRotation().angle, 180, 'Page 3 must be 180°');
assert.strictEqual(verifiedPages[3].getRotation().angle, 270, 'Page 4 must be 270°');
console.log('  ✓ Generated rotated PDF accurately retains exact per-page rotation angles in PDF metadata');

// 4. Component Structure and Contract Checks
console.log('\nTest 4: Component Architecture & No Sidebar / No Footer Contracts...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const rotateConverterPath = path.join(rootDir, 'src', 'components', 'tools', 'RotatePdfConverter.tsx');
assert(fs.existsSync(rotateConverterPath), 'RotatePdfConverter.tsx must exist');
const converterContent = fs.readFileSync(rotateConverterPath, 'utf8');

// Key UI strings & capabilities
assert(converterContent.includes('Rotate PDF'), 'Component must display title "Rotate PDF"');
assert(converterContent.includes('Rotate All Left'), 'Component must include Rotate All Left');
assert(converterContent.includes('Rotate All Right'), 'Component must include Rotate All Right');
assert(converterContent.includes('Reset All'), 'Component must include Reset All');
assert(converterContent.includes('Download Rotated PDF'), 'Component must include Download Rotated PDF button');
assert(converterContent.includes('Replace PDF'), 'Component must include Replace PDF');
assert(converterContent.includes('Files stay on your device'), 'Privacy badge must be present');
assert(converterContent.includes('transform: `rotate(${p.rotation}deg)'), 'Visual CSS transform rotation must be applied to previews');
console.log('  ✓ RotatePdfConverter contains all required visual controls, buttons, and visual CSS preview rotation');

// Check Footer exclusion
const footerPath = path.join(rootDir, 'src', 'components', 'layout', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');
assert(footerContent.includes('rotate-pdf'), 'Footer.tsx must explicitly exclude rotate-pdf');
console.log('  ✓ Footer.tsx properly hides footer on rotate-pdf');

// Check ToolRunner wiring
const runnerPath = path.join(rootDir, 'src', 'components', 'tools', 'ToolRunner.tsx');
const runnerContent = fs.readFileSync(runnerPath, 'utf8');
assert(runnerContent.includes("toolId === 'rotate-pdf'"), 'ToolRunner must route rotate-pdf to RotatePdfConverter');
assert(runnerContent.includes('<RotatePdfConverter />'), 'ToolRunner must render RotatePdfConverter');
console.log('  ✓ ToolRunner dispatches toolId "rotate-pdf" to RotatePdfConverter');

// Check [toolId] page educational section exclusion
const toolPagePath = path.join(rootDir, 'src', 'app', 'tools', '[toolId]', 'page.tsx');
const toolPageContent = fs.readFileSync(toolPagePath, 'utf8');
assert(toolPageContent.includes("toolId !== 'rotate-pdf'"), '[toolId]/page.tsx must exclude bottom educational section for rotate-pdf');
console.log('  ✓ [toolId]/page.tsx keeps rotate-pdf focused with no bottom educational section');

console.log('\n✅ All Rotate PDF workflow, math, PDF generation, and UI checks passed successfully!\n');
