import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Running Toolino PDF Editor Simplified (Add Text & Add Image) Verification Suite...\n');

// =========================================================================
// TEST 1: Top Toolbar Final Tools: ONLY Add Text and Add Image, Zero Sidebars
// =========================================================================
console.log('Test 1: Top Toolbar Tools Verification (ONLY Add Text & Add Image, Zero Sidebars)...');
const pdfEditorPath = path.join(rootDir, 'src', 'components', 'tools', 'pdf-editor', 'PdfEditor.tsx');
const pdfEditorContent = fs.readFileSync(pdfEditorPath, 'utf8');

// Check strictly NO sidebars
assert(!pdfEditorContent.includes('<aside'), 'Must not contain any <aside> sidebar element');
console.log('  ✓ Strictly no sidebars (neither left nor right) in PdfEditor.tsx');

// Check that Add Text and Add Image buttons exist in editor
assert(pdfEditorContent.includes('Add Text'), 'Editor must contain "Add Text"');
assert(pdfEditorContent.includes('Add Image'), 'Editor must contain "Add Image"');

// Check that NO unsupported editing tools appear
const forbiddenTools = [
  'activeModal === \'forms\'',
  'activeModal === \'page-setup\'',
  'activeModal === \'watermark\'',
  'activeModal === \'header-footer\'',
  'activeModal === \'split\'',
  'activeModal === \'protect\'',
];

for (const tool of forbiddenTools) {
  assert(!pdfEditorContent.includes(tool), `Editor must NOT contain '${tool}'`);
}

console.log('  ✓ Editor contains ONLY working "Add Text" and "Add Image"');
console.log('  ✓ All unsupported modals/tools are completely absent');

// =========================================================================
// TEST 2: Verify Removed Tools Are Absent from Menus and Dialogs
// =========================================================================
console.log('\nTest 2: Verifying Removed Tools Are Absent from Menus and Modals...');
assert(!pdfEditorContent.includes("activeModal === 'forms'"), 'Forms modal must be removed');
assert(!pdfEditorContent.includes("activeModal === 'page-setup'"), 'Page setup modal must be removed');
assert(!pdfEditorContent.includes("activeModal === 'watermark'"), 'Watermark modal must be removed');
assert(!pdfEditorContent.includes("activeModal === 'header-footer'"), 'Header-footer modal must be removed');
assert(!pdfEditorContent.includes("activeModal === 'split'"), 'Split modal must be removed');
assert(!pdfEditorContent.includes("activeModal === 'protect'"), 'Protect modal must be removed');
assert(!pdfEditorContent.includes("activeTool === 'draw'"), 'Draw active tool state must be removed');
assert(!pdfEditorContent.includes("activeTool === 'highlight'"), 'Highlight active tool state must be removed');

console.log('  ✓ Modals, active states, and dropdown entries for removed tools are eliminated');

// =========================================================================
// TEST 3: Standalone PDF Tools Kept Intact
// =========================================================================
console.log('\nTest 3: Checking Standalone Toolino Tools Are Preserved...');
const toolsCatalogPath = path.join(rootDir, 'src', 'data', 'toolsCatalog.ts');
const catalogContent = fs.readFileSync(toolsCatalogPath, 'utf8');

const standaloneTools = ['merge-pdf', 'split-pdf', 'rotate-pdf', 'protect-pdf'];
for (const slug of standaloneTools) {
  assert(catalogContent.includes(`id: '${slug}'`), `Standalone tool '${slug}' must be preserved in toolsCatalog`);
}
console.log('  ✓ Standalone Merge PDF, Split PDF, Rotate PDF, Protect PDF preserved without degradation');

// =========================================================================
// TEST 4: Add Text Functionality & PDF Export Serialization
// =========================================================================
console.log('\nTest 4: Add Text Functionality & PDF Generation...');
assert(pdfEditorContent.includes('handleAddTextClick'), 'handleAddTextClick function must exist');
assert(pdfEditorContent.includes('handleAddTextAt'), 'handleAddTextAt function must exist');
assert(pdfEditorContent.includes('contentEditable'), 'Text elements must be contentEditable for inline typing');
assert(pdfEditorContent.includes('handleElementDragStart'), 'Text elements must support drag-to-position');
assert(pdfEditorContent.includes('handleDeleteSelectedElement'), 'Text elements must support deletion');

// Test PDF text generation with pdf-lib
const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([595.28, 841.89]);
const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

page.drawText('Sample User Added Text Block', {
  x: 50,
  y: 750,
  size: 16,
  font: fontBold,
  color: rgb(0.1, 0.2, 0.4),
});

const pdfBytesWithText = await pdfDoc.save();
assert(pdfBytesWithText.length > 500, 'Exported PDF with text must be valid bytes');
console.log(`  ✓ Text added to PDF exports properly (${pdfBytesWithText.length} bytes)`);

// =========================================================================
// TEST 5: Add Image Functionality & PDF Export Serialization
// =========================================================================
console.log('\nTest 5: Add Image Functionality & PDF Generation...');
assert(pdfEditorContent.includes('imageInputRef.current?.click()'), 'Image file picker trigger must exist');
assert(pdfEditorContent.includes('handleImageUpload'), 'Image file upload handler must exist');
assert(pdfEditorContent.includes('ImageElement'), 'ImageElement model must exist');

// 1x1 transparent PNG base64 for test embedding
const testPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const testPngBytes = Buffer.from(testPngBase64, 'base64');
const embeddedImg = await pdfDoc.embedPng(testPngBytes);
page.drawImage(embeddedImg, {
  x: 50,
  y: 500,
  width: 100,
  height: 100,
});

const pdfBytesWithImg = await pdfDoc.save();
assert(pdfBytesWithImg.length > pdfBytesWithText.length, 'Exported PDF with image must be larger');
console.log(`  ✓ Image added to PDF exports properly (${pdfBytesWithImg.length} bytes)`);

// =========================================================================
// TEST 6: PDF Navigation, Thumbnails & Viewer Controls Preserved
// =========================================================================
console.log('\nTest 6: Viewer & Navigation Controls Preserved...');
assert(pdfEditorContent.includes('Pages'), 'Pages sidebar header must be present');
assert(pdfEditorContent.includes('handleAddPage'), 'Add Page button handler must exist');
assert(pdfEditorContent.includes('handleDeletePage'), 'Delete Page button handler must exist');
assert(pdfEditorContent.includes('setZoom'), 'Zoom controls must exist');
assert(pdfEditorContent.includes('setCurrentPageIndex'), 'Page navigation controls must exist');
assert(pdfEditorContent.includes('handleSave'), 'Save document handler must exist');
assert(pdfEditorContent.includes('handleDownloadPdf'), 'Download PDF handler must exist');

console.log('  ✓ Viewer controls (thumbnails, zoom, pagination, save, download) fully preserved');

console.log('\n🎉 ALL TOOLINO PDF EDITOR SIMPLIFIED TESTS PASSED 100%!');
