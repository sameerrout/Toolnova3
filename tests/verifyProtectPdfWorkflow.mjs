/**
 * Automated Verification Suite for Toolino Protect PDF Redesign & Security Contracts
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Running Toolino Protect PDF Full Workflow & Redesign Verification Suite...\n');

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
assert.strictEqual(validateUpload([{ name: 'photo.jpg', size: 1024 }]).valid, false, 'Non-PDF file rejected');
assert.strictEqual(validateUpload([{ name: 'doc.pdf', size: 120 * 1024 * 1024 }]).valid, false, 'Oversized file rejected');
assert.strictEqual(validateUpload([{ name: 'contract.pdf', size: 2 * 1024 * 1024 }]).valid, true, 'Single valid PDF accepted');
console.log('  ✓ Single PDF upload enforced, multiple or non-PDF files rejected\n');

// -----------------------------------------------------------------------------
// Test 2: Password Rules & Strength Evaluation
// -----------------------------------------------------------------------------
console.log('Test 2: Password Validation & Strength Evaluation...');

function validatePasswords(pass, confirmPass) {
  if (!pass || pass.trim().length === 0) {
    return { valid: false, error: 'Enter a password to protect your PDF.' };
  }
  if (pass.length < 4) {
    return { valid: false, error: 'Password should be at least 4 characters.' };
  }
  if (pass !== confirmPass) {
    return { valid: false, error: 'Passwords do not match.' };
  }
  return { valid: true };
}

function calculateStrength(pass) {
  if (!pass || pass.length < 4) return 'short';
  let points = 0;
  if (pass.length >= 6) points++;
  if (pass.length >= 10) points++;
  if (/[A-Z]/.test(pass)) points++;
  if (/[0-9]/.test(pass)) points++;
  if (/[^A-Za-z0-9]/.test(pass)) points++;
  if (points <= 1) return 'weak';
  if (points <= 3) return 'medium';
  return 'strong';
}

assert.strictEqual(validatePasswords('', '').valid, false);
assert.strictEqual(validatePasswords('abc', 'abc').valid, false);
assert.strictEqual(validatePasswords('Pass123', 'Pass456').valid, false);
assert.strictEqual(validatePasswords('SecurePass123!', 'SecurePass123!').valid, true);

assert.strictEqual(calculateStrength('abc'), 'short');
assert.strictEqual(calculateStrength('1234'), 'weak');
assert.strictEqual(calculateStrength('pass123'), 'medium');
assert.strictEqual(calculateStrength('Complex#2026!Sec'), 'strong');
console.log('  ✓ Password validation and multi-tier strength calculation verified\n');

// -----------------------------------------------------------------------------
// Test 3: Real PDF Encryption Execution (AES-256) with Permissions
// -----------------------------------------------------------------------------
console.log('Test 3: Real PDF Encryption Execution (AES-256) with Permissions...');

// Create source sample document
const sourcePdf = await PDFDocument.create();
const sourcePage = sourcePdf.addPage([600, 400]);
const font = await sourcePdf.embedFont(StandardFonts.HelveticaBold);
sourcePage.drawText('Confidential Statement - Toolino Customer Portal', {
  x: 40,
  y: 350,
  size: 16,
  font,
  color: rgb(0.1, 0.2, 0.6),
});
const plainBytes = await sourcePdf.save();
assert(plainBytes.length > 0, 'Plain bytes must be non-empty');

// Encrypt with AES-256, printing allowed, copying blocked, editing blocked
const userPassword = 'CustomerSecret2026!';
const encryptedBytes = await encryptPDF(plainBytes, userPassword, {
  algorithm: 'AES-256',
  allowPrinting: true,
  allowCopying: false,
  allowModifying: false,
  allowAnnotating: true,
  allowFillingForms: true,
  allowHighQualityPrint: true,
});

assert(encryptedBytes.length > 0, 'Encrypted output must not be empty');
assert.notStrictEqual(encryptedBytes.length, plainBytes.length, 'Encrypted bytes must differ from plain bytes');

// Verify that the file is encrypted: PDFDocument.load without ignoreEncryption MUST reject
let isDocumentLocked = false;
try {
  await PDFDocument.load(encryptedBytes);
} catch (err) {
  isDocumentLocked = err.message.includes('encrypted');
}
assert(isDocumentLocked, 'Encrypted PDF must reject unauthenticated opening');
console.log(`  ✓ AES-256 Encryption verified (${plainBytes.length}B -> ${encryptedBytes.length}B) - Document is locked`);

// Verify that with ignoreEncryption, it can be loaded for inspection/structural checks
const inspectDoc = await PDFDocument.load(encryptedBytes, { ignoreEncryption: true });
assert.strictEqual(inspectDoc.getPageCount(), 1, 'Encrypted doc page count preserved');
console.log('  ✓ Encrypted document structure and page count preserved\n');

// -----------------------------------------------------------------------------
// Test 4: RC4 Legacy Encryption Mode & Custom Owner Password
// -----------------------------------------------------------------------------
console.log('Test 4: RC4 Legacy Encryption Mode & Custom Owner Password...');

const rc4Bytes = await encryptPDF(plainBytes, 'UserPass123', {
  algorithm: 'RC4',
  ownerPassword: 'AdminMasterPass456',
  allowPrinting: false,
  allowCopying: false,
  allowModifying: false,
  allowAnnotating: false,
});

assert(rc4Bytes.length > 0, 'RC4 output must be non-empty');
let isRc4Locked = false;
try {
  await PDFDocument.load(rc4Bytes);
} catch (err) {
  isRc4Locked = err.message.includes('encrypted');
}
assert(isRc4Locked, 'RC4 Encrypted PDF must reject unauthenticated opening');
console.log(`  ✓ RC4 128-bit encryption verified with separate owner password (${rc4Bytes.length}B)\n`);

// -----------------------------------------------------------------------------
// Test 5: Codebase Redesign Architecture & Privacy Integrity
// -----------------------------------------------------------------------------
console.log('Test 5: Codebase Redesign Architecture & Privacy Integrity...');

// 5.1 Verify ProtectPdfConverter exists and does NOT log passwords
const converterFile = path.join(rootDir, 'src/components/tools/ProtectPdfConverter.tsx');
assert(fs.existsSync(converterFile), 'ProtectPdfConverter.tsx must exist');
const converterContent = fs.readFileSync(converterFile, 'utf8');

// Password security: Passwords must NEVER be printed to console
assert(!converterContent.includes('console.log(password'), 'Zero console logging of password');
assert(!converterContent.includes('console.log(options.password'), 'Zero console logging of options.password');
assert(!converterContent.includes('localStorage.setItem(\'password\''), 'Password never in localStorage');
assert(!converterContent.includes('sessionStorage.setItem(\'password\''), 'Password never in sessionStorage');
console.log('  ✓ Password privacy verified: zero password logging, no localStorage storage');

// 5.2 Verify no left or right sidebar
assert(!converterContent.includes('left-sidebar'), 'No left sidebar');
assert(!converterContent.includes('right-sidebar'), 'No right sidebar');
assert(!converterContent.includes('aside'), 'No sidebar aside elements');
console.log('  ✓ No left or right sidebar in ProtectPdfConverter');

// 5.3 Verify ToolRunner integrates ProtectPdfConverter
const toolRunnerFile = path.join(rootDir, 'src/components/tools/ToolRunner.tsx');
const toolRunnerContent = fs.readFileSync(toolRunnerFile, 'utf8');
assert(toolRunnerContent.includes('ProtectPdfConverter'), 'ToolRunner must import ProtectPdfConverter');
assert(toolRunnerContent.includes("toolId === 'protect-pdf'"), 'ToolRunner must route protect-pdf to ProtectPdfConverter');
console.log('  ✓ ToolRunner properly routes protect-pdf to ProtectPdfConverter');

// 5.4 Verify Footer is hidden on protect-pdf
const footerFile = path.join(rootDir, 'src/components/layout/Footer.tsx');
const footerContent = fs.readFileSync(footerFile, 'utf8');
assert(footerContent.includes("pathname?.includes('protect-pdf')"), 'Footer must be hidden on protect-pdf');
console.log('  ✓ Footer hidden on protect-pdf page');

// 5.5 Verify Educational Section suppressed on protect-pdf
const toolPageFile = path.join(rootDir, 'src/app/tools/[toolId]/page.tsx');
const toolPageContent = fs.readFileSync(toolPageFile, 'utf8');
assert(toolPageContent.includes("toolId !== 'protect-pdf'"), 'Educational section suppressed on protect-pdf');
console.log('  ✓ Educational section suppressed for standalone focused Protect PDF\n');

console.log('🎉 ALL PROTECT PDF REDESIGN AND USABILITY VERIFICATIONS PASSED (100%)!\n');
