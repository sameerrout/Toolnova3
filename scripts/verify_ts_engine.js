/**
 * Toolnova Phase 30 Verification Script
 * Validates the Client-Side TypeScript PDF to DOCX Engine on real PDFs.
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// Import compiled engine
const { PdfToDocxConverter } = require('../dist/test_engine/converter');

async function runTests() {
  console.log('================================================================');
  console.log('Toolnova Phase 30: Client-Side TypeScript Engine Verification');
  console.log('================================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // -------------------------------------------------------------
  // Test 1: Convert sample_5page.pdf
  // -------------------------------------------------------------
  console.log('\n--- Test 1: Converting sample_5page.pdf ---');
  const samplePdfPath = path.resolve('backend/temp/test_runs/sample_5page.pdf');
  assert(fs.existsSync(samplePdfPath), `Sample PDF exists at ${samplePdfPath}`);

  const sampleBuffer = fs.readFileSync(samplePdfPath);
  const progressLogs = [];

  const t0 = Date.now();
  const sampleDocxBlob = await PdfToDocxConverter.convert(
    sampleBuffer,
    {
      defaultFont: 'Calibri',
      detectTables: true,
      extractImages: true,
      extractDiagrams: true,
      extractHyperlinks: true,
      extractFootnotes: true,
    },
    (pct, msg) => {
      progressLogs.push({ pct, msg });
    }
  );
  const durationMs = Date.now() - t0;

  assert(sampleDocxBlob instanceof Blob, 'Conversion returned a valid Blob instance');
  assert(sampleDocxBlob.size > 1000, `Output DOCX size is valid (${sampleDocxBlob.size} bytes)`);
  assert(progressLogs.length >= 4, `Progress callbacks triggered (${progressLogs.length} updates recorded)`);
  assert(progressLogs[progressLogs.length - 1].pct === 100, 'Final progress reaches 100%');
  console.log(`  Conversion completed in ${durationMs}ms`);

  // Inspect DOCX contents with JSZip
  const docxArrayBuffer = await sampleDocxBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(docxArrayBuffer);

  assert(zip.file('[Content_Types].xml') !== null, '[Content_Types].xml is present in package');
  assert(zip.file('_rels/.rels') !== null, '_rels/.rels is present in package');
  assert(zip.file('docProps/core.xml') !== null, 'docProps/core.xml is present in package');
  assert(zip.file('docProps/app.xml') !== null, 'docProps/app.xml is present in package');
  assert(zip.file('word/document.xml') !== null, 'word/document.xml is present in package');
  assert(zip.file('word/styles.xml') !== null, 'word/styles.xml is present in package');
  assert(zip.file('word/_rels/document.xml.rels') !== null, 'word/_rels/document.xml.rels is present in package');

  const docXml = await zip.file('word/document.xml').async('text');
  assert(docXml.includes('<w:document'), 'word/document.xml has root <w:document>');
  assert(docXml.includes('<w:body>'), 'word/document.xml has <w:body>');
  assert(docXml.includes('<w:sectPr>'), 'word/document.xml has section properties <w:sectPr>');
  assert(docXml.includes('<w:p>'), 'word/document.xml contains paragraph elements');

  // Save artifact for inspection
  const outSampleDocx = path.resolve('backend/temp/test_runs/sample_5page_ts_converted.docx');
  fs.writeFileSync(outSampleDocx, Buffer.from(docxArrayBuffer));
  console.log(`  Saved verified DOCX to: ${outSampleDocx}`);

  // -------------------------------------------------------------
  // Test 2: Convert subset page range (pages 1-3) of 57-page bda_pdf.pdf
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Converting pages 1-3 of bda_pdf.pdf ---');
  const bdaPdfPath = path.resolve('backend/storage/jobs/09c4147b-b1e6-4ed1-9865-b626f5433d2e/input/bda_pdf.pdf');
  assert(fs.existsSync(bdaPdfPath), `BDA PDF exists at ${bdaPdfPath}`);

  const bdaBuffer = fs.readFileSync(bdaPdfPath);
  const t1 = Date.now();
  const bdaDocxBlob = await PdfToDocxConverter.convert(
    bdaBuffer,
    {
      pageRange: [1, 3],
      defaultFont: 'Arial',
      detectTables: true,
      extractHyperlinks: true,
    },
    (pct, msg) => {
      // Progress
    }
  );
  const bdaDurationMs = Date.now() - t1;

  assert(bdaDocxBlob.size > 2000, `BDA pages 1-3 converted successfully (${bdaDocxBlob.size} bytes in ${bdaDurationMs}ms)`);
  const bdaZip = await JSZip.loadAsync(await bdaDocxBlob.arrayBuffer());
  assert(bdaZip.file('word/document.xml') !== null, 'BDA DOCX has valid word/document.xml');

  const bdaDocXml = await bdaZip.file('word/document.xml').async('text');
  assert(bdaDocXml.length > 500, 'BDA document XML has substantive content');

  // Save artifact for inspection
  const outBdaDocx = path.resolve('backend/temp/test_runs/bda_pages1_3_ts_converted.docx');
  fs.writeFileSync(outBdaDocx, Buffer.from(await bdaDocxBlob.arrayBuffer()));
  console.log(`  Saved verified DOCX to: ${outBdaDocx}`);

  // -------------------------------------------------------------
  // Test 3: Options toggles & title override verification
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Title override & custom font verification ---');
  const customDocxBlob = await PdfToDocxConverter.convert(
    sampleBuffer,
    {
      titleOverride: 'Custom Toolnova Document Title',
      defaultFont: 'Times New Roman',
      pageRange: [1, 1],
    }
  );
  const customZip = await JSZip.loadAsync(await customDocxBlob.arrayBuffer());
  const coreXml = await customZip.file('docProps/core.xml').async('text');
  assert(coreXml.includes('Custom Toolnova Document Title'), 'Custom title is correctly written to docProps/core.xml');

  const stylesXml = await customZip.file('word/styles.xml').async('text');
  assert(stylesXml.includes('Times New Roman'), 'Custom default font is correctly set in styles.xml');

  console.log('\n================================================================');
  console.log(`All Phase 30 Client-Side Engine Tests Passed: ${passedTests}/${totalTests}`);
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
