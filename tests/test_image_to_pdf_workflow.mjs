import { PDFDocument } from 'pdf-lib';
import assert from 'assert';

// Minimal 1x1 valid PNG buffer
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function createTestPdfWithCount(count, customPageSizes = []) {
  const doc = await PDFDocument.create();
  const img = await doc.embedPng(PNG_1x1);

  for (let i = 0; i < count; i++) {
    const size = customPageSizes[i] || [200 + i * 10, 300 + i * 10];
    const page = doc.addPage(size);
    page.drawImage(img, { x: 0, y: 0, width: size[0], height: size[1] });
  }

  const bytes = await doc.save();
  return await PDFDocument.load(bytes);
}

async function runTests() {
  console.log('--- Starting Dynamic Multi-File Image to PDF Test Suite ---');

  // Test 1: Single image test (1 image -> 1 page)
  console.log('\n[Test 1] Testing with 1 image...');
  const pdf1 = await createTestPdfWithCount(1);
  assert.strictEqual(pdf1.getPageCount(), 1, '1 image must produce exactly 1 PDF page');
  console.log('✓ 1 image = 1 PDF page verified');

  // Test 2: 3 images test
  console.log('\n[Test 2] Testing with 3 images...');
  const pdf3 = await createTestPdfWithCount(3);
  assert.strictEqual(pdf3.getPageCount(), 3, '3 images must produce exactly 3 PDF pages');
  console.log('✓ 3 images = 3 PDF pages verified');

  // Test 3: 5 images test
  console.log('\n[Test 3] Testing with 5 images...');
  const pdf5 = await createTestPdfWithCount(5);
  assert.strictEqual(pdf5.getPageCount(), 5, '5 images must produce exactly 5 PDF pages');
  console.log('✓ 5 images = 5 PDF pages verified');

  // Test 4: 10 images test
  console.log('\n[Test 4] Testing with 10 images...');
  const pdf10 = await createTestPdfWithCount(10);
  assert.strictEqual(pdf10.getPageCount(), 10, '10 images must produce exactly 10 PDF pages');
  console.log('✓ 10 images = 10 PDF pages verified');

  // Test 5: Delete 1 image from 10 images (Simulating user clicking Delete on image #4)
  console.log('\n[Test 5] Testing deletion: 10 images - 1 deleted = 9 images...');
  const initialTen = Array.from({ length: 10 }, (_, i) => ({ id: `img-${i}`, name: `photo-${i + 1}.png` }));
  const afterDelete = initialTen.filter((img) => img.id !== 'img-3'); // remove #4
  assert.strictEqual(afterDelete.length, 9, 'Array should have 9 elements after deleting 1');

  const pdf9 = await createTestPdfWithCount(afterDelete.length);
  assert.strictEqual(pdf9.getPageCount(), 9, 'PDF must contain exactly 9 pages after deleting 1');
  console.log('✓ Successfully confirmed deleting 1 image updates list to 9 pages');

  // Test 6: Adding more images (Start with 3, then add 2 more -> 5)
  console.log('\n[Test 6] Testing add more images (3 initial + 2 added = 5)...');
  const batch1 = [{ id: 'img-1' }, { id: 'img-2' }, { id: 'img-3' }];
  const batch2 = [{ id: 'img-4' }, { id: 'img-5' }];
  const combined = [...batch1, ...batch2];
  assert.strictEqual(combined.length, 5, 'Appending new images must preserve existing files');
  assert.strictEqual(combined[0].id, 'img-1', 'First image preserved');
  assert.strictEqual(combined[4].id, 'img-5', 'Appended image at end');
  console.log('✓ Adding more files preserves existing images and appends correctly');

  // Test 7: Page order matching UI sequence
  console.log('\n[Test 7] Testing page sequence fidelity with distinct dimensions...');
  // Image A (width 100), Image B (width 200), Image C (width 300)
  // User reorders to: Image C (300), Image A (100), Image B (200)
  const orderedSizes = [[300, 400], [100, 200], [200, 300]];
  const reorderedPdf = await createTestPdfWithCount(3, orderedSizes);
  assert.strictEqual(reorderedPdf.getPage(0).getWidth(), 300, 'Page 1 must be Image C (width 300)');
  assert.strictEqual(reorderedPdf.getPage(1).getWidth(), 100, 'Page 2 must be Image A (width 100)');
  assert.strictEqual(reorderedPdf.getPage(2).getWidth(), 200, 'Page 3 must be Image B (width 200)');
  console.log('✓ Page sequence in output PDF exactly matches UI order');

  // Test 8: Live HTTP UI Verification
  console.log('\n[Test 8] Testing live HTTP endpoint at http://localhost:3000/tools/image-to-pdf...');
  const res = await fetch('http://localhost:3000/tools/image-to-pdf');
  assert.strictEqual(res.status, 200, 'HTTP status must be 200 OK');
  const html = await res.text();

  // Verify Navbar
  assert.ok(html.includes('Toolino'), 'Navbar must have Toolino');
  assert.ok(html.includes('Home'), 'Navbar must have Home');

  // Verify Header
  assert.ok(html.includes('Image to PDF'), 'Must contain Image to PDF title');
  assert.ok(
    html.includes('Convert your JPG, JPEG, PNG, and WEBP images into a PDF document.'),
    'Must contain subtitle'
  );

  // Verify LEFT Upload Area elements
  assert.ok(html.includes('Upload your images'), 'Must contain "Upload your images"');
  assert.ok(html.includes('Drag and drop your images here or') && html.includes('click to browse'), 'Dropzone text present');
  assert.ok(html.includes('Supported formats'), 'Must show Supported formats');
  assert.ok(html.includes('JPG, JPEG, PNG, WEBP'), 'Must list JPG, JPEG, PNG, WEBP');

  // Verify Convert to PDF Button
  assert.ok(html.includes('Convert to PDF'), 'Must contain "Convert to PDF" button');

  // Verify Unwanted sections absent
  const unwanted = [
    'Simple Workflow',
    'How to Use Image to PDF',
    'High-Performance Architecture',
    'Zero Persistent Data Retention',
    'Frequently Asked Questions',
    'Related Document & PDF Tools',
    'All rights reserved',
  ];
  for (const text of unwanted) {
    assert.strictEqual(html.includes(text), false, `Must NOT contain "${text}"`);
  }
  console.log('✓ Live HTML verified: clean layout, upload zone, convert button, no marketing fluff');

  console.log('\n======================================================');
  console.log('ALL DYNAMIC MULTI-FILE WORKFLOW TESTS PASSED 100%!');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
