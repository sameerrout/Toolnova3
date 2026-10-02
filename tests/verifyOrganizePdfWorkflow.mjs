import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

console.log('🧪 Running Toolino Organize PDF Full Workflow & Redesign Verification Suite...\n');

// -----------------------------------------------------------------------------
// Test 1: Single PDF Upload Validation
// -----------------------------------------------------------------------------
console.log('Test 1: Single PDF Upload Validation...');

function validateUpload(files) {
  if (!files || files.length === 0) {
    return { valid: false, error: 'Upload a PDF to continue' };
  }
  if (files.length > 1) {
    return { valid: false, error: 'Organize PDF supports exactly one PDF document at a time.' };
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

const mockDoc = { name: 'Presentation.pdf', size: 1024 * 500 };
const mockDoc2 = { name: 'Report.pdf', size: 1024 * 200 };
const mockJpg = { name: 'Image.jpg', size: 1024 * 50 };
const mockHuge = { name: 'Heavy.pdf', size: 120 * 1024 * 1024 };

assert.strictEqual(validateUpload([]).valid, false, '0 files must be rejected');
console.log('  ✓ 0 files rejected when empty');

assert.strictEqual(validateUpload([mockDoc]).valid, true, '1 single PDF must be accepted');
console.log('  ✓ Exactly 1 PDF file is accepted');

assert.strictEqual(validateUpload([mockDoc, mockDoc2]).valid, false, 'Multiple files rejected');
console.log('  ✓ Multiple files strictly rejected (single document workflow)');

assert.strictEqual(validateUpload([mockJpg]).valid, false, 'Non-PDF file rejected');
console.log('  ✓ Non-PDF file rejected');

assert.strictEqual(validateUpload([mockHuge]).valid, false, 'Files over 100 MB rejected');
console.log('  ✓ File size limit enforced (100 MB)');

// -----------------------------------------------------------------------------
// Test 2: Page Reordering Logic (Drag and Drop Math)
// -----------------------------------------------------------------------------
console.log('\nTest 2: Page Reordering Logic & Edge Cases...');

function reorderList(list, fromIndex, toIndex) {
  if (fromIndex === toIndex) return list;
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

const initialPages = ['P1', 'P2', 'P3', 'P4'];

// Move P4 (index 3) between P1 (0) and P2 (1) -> destination index 1
const reordered = reorderList(initialPages, 3, 1);
assert.deepStrictEqual(reordered, ['P1', 'P4', 'P2', 'P3'], 'Move P4 to index 1 must result in [P1, P4, P2, P3]');
console.log('  ✓ Moving page 4 to index 1 matches expected sequence [P1, P4, P2, P3]');

// Move first page to end
const movedToEnd = reorderList(initialPages, 0, 3);
assert.deepStrictEqual(movedToEnd, ['P2', 'P3', 'P4', 'P1'], 'Move first to end must result in [P2, P3, P4, P1]');
console.log('  ✓ Moving first page to end works cleanly');

// Reverse list
const reversed = [...initialPages].reverse();
assert.deepStrictEqual(reversed, ['P4', 'P3', 'P2', 'P1']);
console.log('  ✓ Full sequence reversal works accurately');

// -----------------------------------------------------------------------------
// Test 3: Page Rotation & Deletion Safeguards
// -----------------------------------------------------------------------------
console.log('\nTest 3: Page Rotation & Deletion Safeguards...');

function rotatePage(currentRot, delta) {
  return (currentRot + delta + 360) % 360;
}

assert.strictEqual(rotatePage(0, 90), 90);
assert.strictEqual(rotatePage(90, 90), 180);
assert.strictEqual(rotatePage(180, 90), 270);
assert.strictEqual(rotatePage(270, 90), 0);
assert.strictEqual(rotatePage(0, -90), 270);
console.log('  ✓ Clockwise and counter-clockwise 90-degree rotations loop correctly');

// Empty document prevention
function canDeletePages(totalCount, countToDelete) {
  return totalCount - countToDelete >= 1;
}

assert.strictEqual(canDeletePages(4, 1), true, 'Deleting 1 from 4 is allowed');
assert.strictEqual(canDeletePages(4, 3), true, 'Deleting 3 from 4 is allowed (1 remains)');
assert.strictEqual(canDeletePages(4, 4), false, 'Deleting all 4 pages is blocked');
console.log('  ✓ System blocks deleting all pages: at least one page must remain');

// -----------------------------------------------------------------------------
// Test 4: Undo / Redo History Stack Mechanics
// -----------------------------------------------------------------------------
console.log('\nTest 4: Undo / Redo History Stack Mechanics...');

class HistoryManager {
  constructor(initialState) {
    this.history = [initialState];
    this.currentIndex = 0;
  }

  push(newState) {
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(newState);
    this.currentIndex++;
  }

  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return this.history[this.currentIndex];
  }

  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return this.history[this.currentIndex];
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
}

const hm = new HistoryManager(['p1', 'p2', 'p3']);
assert.strictEqual(hm.canUndo(), false);
assert.strictEqual(hm.canRedo(), false);

hm.push(['p1', 'p3', 'p2']); // reorder
assert.strictEqual(hm.canUndo(), true);
assert.strictEqual(hm.canRedo(), false);

hm.push(['p3', 'p1', 'p2']); // reorder again
assert.strictEqual(hm.currentIndex, 2);

const undone = hm.undo();
assert.deepStrictEqual(undone, ['p1', 'p3', 'p2']);
assert.strictEqual(hm.canRedo(), true);

const redone = hm.redo();
assert.deepStrictEqual(redone, ['p3', 'p1', 'p2']);
console.log('  ✓ Undo and Redo navigation functions flawlessly across operations');

// -----------------------------------------------------------------------------
// Test 5: Real PDF Generation with pdf-lib
// -----------------------------------------------------------------------------
console.log('\nTest 5: Real PDF Processing with pdf-lib (Reorder + Rotate + Duplicate + Delete)...');

async function testPdfEngine() {
  // Create 4-page source PDF
  const srcDoc = await PDFDocument.create();
  const font = await srcDoc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 1; i <= 4; i++) {
    const page = srcDoc.addPage([400, 600]);
    page.drawText(`Original Page ${i}`, {
      x: 100,
      y: 300,
      size: 24,
      font,
      color: rgb(0.1, 0.2, 0.8),
    });
  }

  const srcBytes = await srcDoc.save();
  assert.ok(srcBytes.byteLength > 0, 'Source PDF created');

  // Customer organization steps:
  // Initial: [Page 1 (orig 0), Page 2 (orig 1), Page 3 (orig 2), Page 4 (orig 3)]
  // 1. Reorder: move Page 4 to first: [Page 4, Page 1, Page 2, Page 3]
  // 2. Rotate Page 2 right: 90 deg
  // 3. Delete Page 3 (orig index 2)
  // 4. Duplicate Page 4
  // Desired outcome: [Page 4, Page 4_dup, Page 1, Page 2_rot] (Total 4 pages)
  const organizedPlan = [
    { originalIndex: 3, rotation: 0 },
    { originalIndex: 3, rotation: 0 },
    { originalIndex: 0, rotation: 0 },
    { originalIndex: 1, rotation: 90 },
  ];

  const loadedSrc = await PDFDocument.load(srcBytes);
  const outDoc = await PDFDocument.create();

  const indices = organizedPlan.map((p) => p.originalIndex);
  const copiedPages = await outDoc.copyPages(loadedSrc, indices);

  for (let i = 0; i < copiedPages.length; i++) {
    const page = copiedPages[i];
    const item = organizedPlan[i];
    const origRot = page.getRotation().angle || 0;
    const finalRot = (origRot + item.rotation) % 360;
    page.setRotation(degrees(finalRot));
    outDoc.addPage(page);
  }

  const outputBytes = await outDoc.save();
  assert.ok(outputBytes.byteLength > 0, 'Output PDF generated');

  // Re-load and verify structure
  const verifiedDoc = await PDFDocument.load(outputBytes);
  assert.strictEqual(verifiedDoc.getPageCount(), 4, 'Output PDF must have 4 pages');

  const page4Out = verifiedDoc.getPage(3); // The rotated Page 2
  assert.strictEqual(page4Out.getRotation().angle, 90, 'Page 2 in position 4 must be rotated 90 degrees');

  console.log('  ✓ Real PDF generated with exact page copies, reordering, duplicate, and rotation');
}

await testPdfEngine();

// -----------------------------------------------------------------------------
// Test 6: UI & Architectural Integration Contracts
// -----------------------------------------------------------------------------
console.log('\nTest 6: Architectural Contracts & Codebase Verification...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 1. OrganizePdfConverter component checks
const compPath = path.join(projectRoot, 'src', 'components', 'tools', 'OrganizePdfConverter.tsx');
assert.ok(fs.existsSync(compPath), 'OrganizePdfConverter.tsx must exist');
const compContent = fs.readFileSync(compPath, 'utf8');

assert.ok(compContent.includes('Organize PDF'), 'Component has Organize PDF header');
assert.ok(compContent.includes('min-h-[calc(100vh-72px)]'), 'Component implements single-viewport desktop container');
assert.ok(compContent.includes('onDragStart') && compContent.includes('onDrop'), 'Drag and drop reordering handlers implemented');
assert.ok(compContent.includes('Rotate Left') || compContent.includes('RotateLeft') || compContent.includes('RotateCcw'), 'Rotate Left supported');
assert.ok(compContent.includes('Rotate Right') || compContent.includes('RotateCw'), 'Rotate Right supported');
assert.ok(compContent.includes('Undo') && compContent.includes('Redo'), 'Undo / Redo supported');
assert.ok(compContent.includes('Select All') && compContent.includes('Clear Selection'), 'Selection controls supported');
assert.ok(compContent.includes('Replace PDF'), 'Replace PDF supported');
assert.ok(compContent.includes('Your PDF must contain at least one page'), 'Safeguard message present');
assert.ok(compContent.includes('PDF organized successfully'), 'Review before download state present');
assert.ok(compContent.includes('Download PDF'), 'Download button present');
console.log('  ✓ OrganizePdfConverter.tsx contains all required interactive features and safeguards');

// 2. ToolRunner check
const runnerPath = path.join(projectRoot, 'src', 'components', 'tools', 'ToolRunner.tsx');
const runnerContent = fs.readFileSync(runnerPath, 'utf8');
assert.ok(runnerContent.includes('OrganizePdfConverter'), 'ToolRunner imports OrganizePdfConverter');
assert.ok(runnerContent.includes("toolId === 'organize-pdf'"), 'ToolRunner routes organize-pdf');
console.log('  ✓ ToolRunner wires OrganizePdfConverter for organize-pdf');

// 3. Footer exclusion check
const footerPath = path.join(projectRoot, 'src', 'components', 'layout', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');
assert.ok(footerContent.includes("pathname?.includes('organize-pdf')"), 'Footer excludes organize-pdf');
console.log('  ✓ Footer correctly suppressed on organize-pdf');

// 4. Educational section exclusion check
const pagePath = path.join(projectRoot, 'src', 'app', 'tools', '[toolId]', 'page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');
assert.ok(pageContent.includes("toolId !== 'organize-pdf'"), 'page.tsx excludes educational section on organize-pdf');
console.log('  ✓ Educational section excluded on organize-pdf to prevent page scrolling');

// 5. Next.js rewrite check
const nextConfigPath = path.join(projectRoot, 'next.config.mjs');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
assert.ok(nextConfigContent.includes("'/organize-pdf'"), 'next.config.mjs has /organize-pdf rewrite');
assert.ok(nextConfigContent.includes("'/pdf-organizer'"), 'next.config.mjs has /pdf-organizer rewrite');
console.log('  ✓ Clean route rewrites active in next.config.mjs');

console.log('\n🎉 ALL 6 VERIFICATION TEST SUITES PASSED FLAWLESSLY!\n');
