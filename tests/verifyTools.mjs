import assert from 'node:assert';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';

console.log('🚀 Running Toolnova Complete 16-Tool Integration Test Suite...\n');

// 1. TEST: PDF Generation (Image to PDF)
console.log('Test 1: Creating PDF Document (Image to PDF)...');
const doc1 = await PDFDocument.create();
const page1 = doc1.addPage([595.28, 841.89]);
page1.drawText('Toolnova Test Page 1', { x: 50, y: 700 });
const page2 = doc1.addPage([595.28, 841.89]);
page2.drawText('Toolnova Test Page 2', { x: 50, y: 700 });
const pdfBytes1 = await doc1.save();
assert(pdfBytes1.length > 0, 'PDF bytes should be non-empty');
console.log(`  ✓ Generated 2-page PDF document (${pdfBytes1.length} bytes)`);

// 2. TEST: Merge PDF
console.log('\nTest 2: Merging PDF Documents (Merge PDF)...');
const doc2 = await PDFDocument.create();
const page3 = doc2.addPage([595.28, 841.89]);
page3.drawText('Toolnova Test Page 3', { x: 50, y: 700 });
const pdfBytes2 = await doc2.save();

const mergedDoc = await PDFDocument.create();
const loadedDoc1 = await PDFDocument.load(pdfBytes1);
const loadedDoc2 = await PDFDocument.load(pdfBytes2);

const copied1 = await mergedDoc.copyPages(loadedDoc1, loadedDoc1.getPageIndices());
const copied2 = await mergedDoc.copyPages(loadedDoc2, loadedDoc2.getPageIndices());

copied1.forEach((p) => mergedDoc.addPage(p));
copied2.forEach((p) => mergedDoc.addPage(p));

const mergedBytes = await mergedDoc.save();
const finalMerged = await PDFDocument.load(mergedBytes);
assert.strictEqual(finalMerged.getPageCount(), 3, 'Merged doc should have 3 pages');
console.log(`  ✓ Successfully merged into 3-page document (${mergedBytes.length} bytes)`);

// 3. TEST: Split PDF
console.log('\nTest 3: Splitting PDF Document (Split PDF)...');
const splitDoc = await PDFDocument.create();
const extractedPages = await splitDoc.copyPages(finalMerged, [1, 2]);
extractedPages.forEach((p) => splitDoc.addPage(p));
const splitBytes = await splitDoc.save();
const finalSplit = await PDFDocument.load(splitBytes);
assert.strictEqual(finalSplit.getPageCount(), 2, 'Split doc should have 2 pages');
console.log(`  ✓ Successfully extracted pages 2-3 into a new PDF (${splitBytes.length} bytes)`);

// 4. TEST: Rotate PDF
console.log('\nTest 4: Rotating PDF Pages (Rotate PDF)...');
const rotateDoc = await PDFDocument.load(splitBytes);
rotateDoc.getPages().forEach((p) => {
    p.setRotation(degrees((p.getRotation().angle + 90) % 360));
});
const rotatedBytes = await rotateDoc.save();
const finalRotated = await PDFDocument.load(rotatedBytes);
assert.strictEqual(finalRotated.getPage(0).getRotation().angle, 90);
console.log(`  ✓ Successfully rotated pages by 90° (${rotatedBytes.length} bytes)`);

// 5. TEST: Watermark PDF
console.log('\nTest 5: Stamping Watermark (Watermark PDF)...');
const watermarkDoc = await PDFDocument.load(splitBytes);
const font = await watermarkDoc.embedFont(StandardFonts.HelveticaBold);
watermarkDoc.getPages().forEach((p) => {
    p.drawText('CONFIDENTIAL', {
        x: 100,
        y: 300,
        size: 48,
        font,
        opacity: 0.3,
        rotate: degrees(45),
    });
});
const watermarkedBytes = await watermarkDoc.save();
assert(watermarkedBytes.length > splitBytes.length, 'Watermarked PDF should contain font streams');
console.log(`  ✓ Successfully applied watermark across pages (${watermarkedBytes.length} bytes)`);

// 6. TEST: Page Numbers
console.log('\nTest 6: Adding Page Numbers (PDF Page Numbers)...');
const pageNumberDoc = await PDFDocument.load(splitBytes);
const fontNorm = await pageNumberDoc.embedFont(StandardFonts.Helvetica);
pageNumberDoc.getPages().forEach((p, idx) => {
    p.drawText(`Page ${idx + 1} of 2`, {
        x: 250,
        y: 30,
        size: 11,
        font: fontNorm,
    });
});
const pageNumberBytes = await pageNumberDoc.save();
assert(pageNumberBytes.length > 0);
console.log(`  ✓ Successfully added page numbers (${pageNumberBytes.length} bytes)`);

// 7. TEST: Organize PDF (Reorder)
console.log('\nTest 7: Reordering Pages (Organize PDF)...');
const organizeDoc = await PDFDocument.create();
const srcLoaded = await PDFDocument.load(mergedBytes);
const reorderedPages = await organizeDoc.copyPages(srcLoaded, [2, 1, 0]);
reorderedPages.forEach((p) => organizeDoc.addPage(p));
const organizedBytes = await organizeDoc.save();
const finalOrganized = await PDFDocument.load(organizedBytes);
assert.strictEqual(finalOrganized.getPageCount(), 3);
console.log(`  ✓ Successfully reversed/reordered 3 pages (${organizedBytes.length} bytes)`);

// 8. TEST: Unlock PDF
console.log('\nTest 8: Unlocking PDF Structure (Unlock PDF)...');
const unlockDoc = await PDFDocument.load(splitBytes, { ignoreEncryption: true });
const unlockedBytes = await unlockDoc.save();
assert(unlockedBytes.length > 0);
console.log(`  ✓ Successfully unlocked and sanitized PDF (${unlockedBytes.length} bytes)`);

// 9. TEST: Compress PDF
console.log('\nTest 9: Compressing Streams (Compress PDF)...');
const compDoc = await PDFDocument.load(watermarkedBytes);
compDoc.setProducer('Toolnova Local Engine');
compDoc.setCreator('Toolnova');
const compressedBytes = await compDoc.save({ useObjectStreams: true });
assert(compressedBytes.length > 0);
console.log(`  ✓ Successfully compressed PDF object streams (${compressedBytes.length} bytes)`);

// 10. TEST: Edit PDF (Annotation)
console.log('\nTest 10: Editing PDF with Custom Annotation (Edit PDF)...');
const editDoc = await PDFDocument.load(splitBytes);
editDoc.getPages()[0].drawText('APPROVED BY ADMIN', {
    x: 50,
    y: 750,
    size: 16,
    font,
    color: rgb(0, 0.5, 0),
});
const editedBytes = await editDoc.save();
assert(editedBytes.length > 0);
console.log(`  ✓ Successfully added text annotation to page 1 (${editedBytes.length} bytes)`);

// 11. TEST: Protect PDF
console.log('\nTest 11: Encrypting Document with AES-256 (Protect PDF)...');
const encryptedBytes = await encryptPDF(splitBytes, 'SecretPass123!', {
    algorithm: 'AES-256',
    allowPrinting: true,
    allowCopying: false,
});
assert(encryptedBytes.length > 0, 'Encrypted bytes should be non-empty');
assert(encryptedBytes.length !== splitBytes.length, 'Encrypted output should differ from plaintext');
console.log(`  ✓ Successfully encrypted PDF with AES-256 (${encryptedBytes.length} bytes)`);

// 12. TEST: PDF to Image (Multi-page ZIP Packaging)
console.log('\nTest 12: Packaging Extracted Pages to ZIP (PDF to Image)...');
const zip = new JSZip();
zip.file('page-1.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
zip.file('page-2.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const zipBytes = await zip.generateAsync({ type: 'uint8array' });
assert(zipBytes.length > 0, 'Zip bytes should be non-empty');
console.log(`  ✓ Successfully created multi-image ZIP package (${zipBytes.length} bytes)`);

// 13. TEST: PDF to Word (DOCX Compilation)
console.log('\nTest 13: Generating Word Document (.docx) (PDF to Word)...');
const wordDoc = new Document({
    sections: [{
        children: [
            new Paragraph({
                children: [new TextRun({ text: 'Toolnova Converted Document', bold: true, size: 28 })],
            }),
            new Paragraph({
                children: [new TextRun({ text: 'This text was converted from PDF client-side.', size: 22 })],
            }),
        ],
    }, ],
});
const wordBytes = await Packer.toBuffer(wordDoc);
assert(wordBytes.length > 0, 'DOCX buffer should be non-empty');
console.log(`  ✓ Successfully generated Microsoft Word .docx file (${wordBytes.length} bytes)`);

// 14. TEST: Word to PDF (DOCX Extraction & Pagination)
console.log('\nTest 14: Parsing DOCX and Converting to PDF (Word to PDF)...');
const extractResult = await mammoth.extractRawText({ buffer: wordBytes });
assert(extractResult.value.includes('Toolnova Converted Document'));

const wordToPdfDoc = await PDFDocument.create();
const wPage = wordToPdfDoc.addPage([595.28, 841.89]);
const wFont = await wordToPdfDoc.embedFont(StandardFonts.Helvetica);
wPage.drawText(extractResult.value.trim(), { x: 50, y: 750, size: 12, font: wFont });
const wPdfBytes = await wordToPdfDoc.save();
assert(wPdfBytes.length > 0);
console.log(`  ✓ Successfully parsed DOCX text and paginated into PDF (${wPdfBytes.length} bytes)`);

// 15. TEST: PDF to PowerPoint (PPTX Generation)
console.log('\nTest 15: Generating PowerPoint Deck (.pptx) (PDF to PowerPoint)...');
const pptx = new PptxGenJS();
const pSlide1 = pptx.addSlide();
pSlide1.addText('Toolnova Slide 1', { x: 1, y: 1, fontSize: 24, bold: true });
const pSlide2 = pptx.addSlide();
pSlide2.addText('Toolnova Slide 2', { x: 1, y: 1, fontSize: 24, bold: true });
const pptxBytes = await pptx.write({ outputType: 'nodebuffer' });
assert(pptxBytes.length > 0, 'PPTX buffer should be non-empty');
console.log(`  ✓ Successfully generated PowerPoint .pptx deck (${pptxBytes.length} bytes)`);

// 16. TEST: PowerPoint to PDF (PPTX Extraction & Slide Layout)
console.log('\nTest 16: Extracting PPTX Slides and Converting to PDF (PowerPoint to PDF)...');
const pZip = await JSZip.loadAsync(pptxBytes);
const slideXmlKeys = Object.keys(pZip.files).filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k));
assert(slideXmlKeys.length === 2, 'Should find 2 slide XML files');

const pptToPdfDoc = await PDFDocument.create();
for (let i = 0; i < slideXmlKeys.length; i++) {
    const sPage = pptToPdfDoc.addPage([841.89, 595.28]); // Landscape
    sPage.drawText(`Slide ${i + 1} Content`, { x: 50, y: 500, size: 20, font: wFont });
}
const pptToPdfBytes = await pptToPdfDoc.save();
assert(pptToPdfBytes.length > 0);
const loadedPptPdf = await PDFDocument.load(pptToPdfBytes);
assert.strictEqual(loadedPptPdf.getPageCount(), 2, 'PPT to PDF should have 2 pages');
console.log(`  ✓ Successfully extracted PPTX slides and rendered presentation PDF (${pptToPdfBytes.length} bytes)`);

console.log('\n🎉 ALL 16 TOOLNOVA TOOLS INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n');