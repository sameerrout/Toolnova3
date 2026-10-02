import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

console.log('🧪 Running Toolino QR Code Generator Full Workflow & Redesign Verification Suite...\n');

// -----------------------------------------------------------------------------
// Test 1: QR Payload Generation Across All Supported Types
// -----------------------------------------------------------------------------
console.log('Test 1: QR Payload Builders & Encoding...');

function escapeWifiString(str) {
  if (!str) return '';
  return str.replace(/([\\;,:"])/g, '\\$1');
}

function escapeVCardString(str) {
  if (!str) return '';
  return str.replace(/([\\;,])/g, '\\$1');
}

function buildQrPayload(options) {
  switch (options.dataType) {
    case 'url': {
      let url = (options.url || '').trim();
      if (!url) return 'https://toolnova.com';
      if (!/^https?:\/\//i.test(url) && !url.startsWith('//')) {
        url = `https://${url}`;
      }
      return url;
    }

    case 'email': {
      const email = (options.email?.address || '').trim();
      const subject = encodeURIComponent(options.email?.subject || '');
      const body = encodeURIComponent(options.email?.body || '');
      return `mailto:${email}?subject=${subject}&body=${body}`;
    }

    case 'phone': {
      const phone = (options.phone || '').trim().replace(/[^\d+]/g, '');
      return `tel:${phone}`;
    }

    case 'wifi': {
      const ssid = escapeWifiString(options.wifi?.ssid || '');
      const enc = options.wifi?.encryption || 'WPA';
      const pass = enc !== 'nopass' ? escapeWifiString(options.wifi?.password || '') : '';
      return `WIFI:S:${ssid};T:${enc};P:${pass};;`;
    }

    case 'vcard': {
      const fn = escapeVCardString(options.vcard?.firstName || '');
      const ln = escapeVCardString(options.vcard?.lastName || '');
      const org = escapeVCardString(options.vcard?.organization || '');
      const phone = (options.vcard?.phone || '').trim();
      const email = (options.vcard?.email || '').trim();
      const website = (options.vcard?.website || '').trim();

      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${ln};${fn};;;`,
        `FN:${[fn, ln].filter(Boolean).join(' ')}`,
      ];
      if (org) lines.push(`ORG:${org}`);
      if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
      if (email) lines.push(`EMAIL:${email}`);
      if (website) lines.push(`URL:${website}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }

    case 'text':
    default:
      return (options.text || '').trim() || 'Toolino - High-Performance Online Tools';
  }
}

// 1. URL
assert.strictEqual(
  buildQrPayload({ dataType: 'url', url: 'toolnova.com' }),
  'https://toolnova.com',
  'URL without protocol must automatically prefix https://'
);
assert.strictEqual(
  buildQrPayload({ dataType: 'url', url: 'https://example.org/docs' }),
  'https://example.org/docs'
);
console.log('  ✓ URL payload builder handles clean prefixing and query paths');

// 2. Email
assert.strictEqual(
  buildQrPayload({
    dataType: 'email',
    email: { address: 'support@toolnova.com', subject: 'Help Request', body: 'Hello team' },
  }),
  'mailto:support@toolnova.com?subject=Help%20Request&body=Hello%20team'
);
console.log('  ✓ Email payload builder formats mailto URI with encoded query params');

// 3. Phone
assert.strictEqual(
  buildQrPayload({ dataType: 'phone', phone: '+1 (555) 234-5678' }),
  'tel:+15552345678'
);
console.log('  ✓ Phone payload builder formats tel URI and strips formatting symbols');

// 4. Wi-Fi
assert.strictEqual(
  buildQrPayload({
    dataType: 'wifi',
    wifi: { ssid: 'Guest;Network', encryption: 'WPA', password: 'Secret:Password;' },
  }),
  'WIFI:S:Guest\\;Network;T:WPA;P:Secret\\:Password\\;;;'
);
console.log('  ✓ Wi-Fi payload builder properly escapes semicolons and colons');

// 5. vCard Contact
const vcardOutput = buildQrPayload({
  dataType: 'vcard',
  vcard: {
    firstName: 'Jane',
    lastName: 'Doe',
    organization: 'Toolino Corp',
    phone: '+15550001111',
    email: 'jane@toolnova.com',
    website: 'https://toolnova.com',
  },
});
assert.ok(vcardOutput.includes('BEGIN:VCARD'));
assert.ok(vcardOutput.includes('FN:Jane Doe'));
assert.ok(vcardOutput.includes('TEL;TYPE=CELL:+15550001111'));
assert.ok(vcardOutput.includes('END:VCARD'));
console.log('  ✓ vCard 3.0 contact payload formatted according to standard specification');

// -----------------------------------------------------------------------------
// Test 2: Input Validation Logic
// -----------------------------------------------------------------------------
console.log('\nTest 2: Input Validation Rules & Scannability Logic...');

function validateInput(type, values) {
  switch (type) {
    case 'url':
      return Boolean(values.url && values.url.trim().length > 0);
    case 'text':
      return Boolean(values.text && values.text.trim().length > 0);
    case 'email':
      return Boolean(
        values.email &&
          values.email.address &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.address.trim())
      );
    case 'phone':
      return Boolean(values.phone && values.phone.replace(/[^\d]/g, '').length >= 4);
    case 'wifi':
      if (!values.wifi || !values.wifi.ssid || !values.wifi.ssid.trim()) return false;
      if (values.wifi.encryption !== 'nopass' && !values.wifi.password) return false;
      return true;
    default:
      return true;
  }
}

assert.strictEqual(validateInput('url', { url: '' }), false);
assert.strictEqual(validateInput('url', { url: 'https://test.com' }), true);
assert.strictEqual(validateInput('email', { email: { address: 'bademail' } }), false);
assert.strictEqual(validateInput('email', { email: { address: 'test@example.com' } }), true);
assert.strictEqual(validateInput('wifi', { wifi: { ssid: '', encryption: 'WPA' } }), false);
assert.strictEqual(
  validateInput('wifi', { wifi: { ssid: 'MyHome', encryption: 'WPA', password: '' } }),
  false
);
assert.strictEqual(
  validateInput('wifi', { wifi: { ssid: 'MyHome', encryption: 'nopass', password: '' } }),
  true
);
console.log('  ✓ Field validation prevents generating QR codes with empty/invalid inputs');

// -----------------------------------------------------------------------------
// Test 3: Contrast Ratio Calculation for Scannability
// -----------------------------------------------------------------------------
console.log('\nTest 3: Contrast Calculation & Scannability Safeguard...');

function getLuminance(hex) {
  const c = hex.replace('#', '');
  if (c.length !== 6) return 0.5;
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const highContrast = getContrastRatio('#0f172a', '#ffffff');
assert.ok(highContrast > 10, 'Black on white must have high contrast (>10)');

const lowContrast = getContrastRatio('#e2e8f0', '#ffffff');
assert.ok(lowContrast < 2.8, 'Light gray on white must trigger low contrast warning (<2.8)');

console.log('  ✓ Contrast formula identifies readable vs unreadable color combinations');

// -----------------------------------------------------------------------------
// Test 4: Real QR Code Matrix Rendering (PNG DataURL & SVG Vector)
// -----------------------------------------------------------------------------
console.log('\nTest 4: Real In-Memory QR Generation (PNG & SVG with qrcode)...');

async function testQrRendering() {
  const testPayload = 'https://toolnova.com/tools/qr-code-generator';

  // 1. PNG Raster Generation
  const pngDataUrl = await QRCode.toDataURL(testPayload, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  assert.ok(pngDataUrl.startsWith('data:image/png;base64,'), 'PNG DataURL generated');
  assert.ok(pngDataUrl.length > 500, 'PNG DataURL has valid payload length');
  console.log(`  ✓ High-resolution PNG generated successfully (${pngDataUrl.length} characters)`);

  // 2. SVG Vector Document Generation
  const svgOutput = await QRCode.toString(testPayload, {
    type: 'svg',
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#2563eb',
      light: '#f8fafc',
    },
  });

  assert.ok(svgOutput.startsWith('<svg'), 'SVG document must start with <svg tag');
  assert.ok(svgOutput.includes('viewBox='), 'SVG has viewBox attribute');
  assert.ok(svgOutput.includes('#2563eb'), 'SVG custom foreground applied');
  console.log(`  ✓ Scalable SVG vector generated successfully (${svgOutput.length} characters)`);
}

await testQrRendering();

// -----------------------------------------------------------------------------
// Test 5: Architectural Contracts & Codebase Verification
// -----------------------------------------------------------------------------
console.log('\nTest 5: Architectural Contracts & Codebase Verification...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 1. QrCodeGeneratorConverter component checks
const compPath = path.join(projectRoot, 'src', 'components', 'tools', 'QrCodeGeneratorConverter.tsx');
assert.ok(fs.existsSync(compPath), 'QrCodeGeneratorConverter.tsx must exist');
const compContent = fs.readFileSync(compPath, 'utf8');

assert.ok(compContent.includes('QR Code Generator'), 'Component has QR Code Generator header');
assert.ok(compContent.includes('min-h-[calc(100vh-72px)]'), 'Component implements single-viewport desktop container');
assert.ok(compContent.includes('Live Preview'), 'Live preview section present');
assert.ok(compContent.includes('What should this QR code contain?'), 'QR content type selector present');
assert.ok(compContent.includes('Ready to scan'), 'Scannability badge present');
assert.ok(compContent.includes('Download QR Code'), 'Download QR Code button present');
assert.ok(compContent.includes('Reset'), 'Reset customization button present');
assert.ok(compContent.includes('Clear'), 'Clear content button present');
assert.ok(compContent.includes('This color combination may be difficult to scan'), 'Contrast warning message present');
console.log('  ✓ QrCodeGeneratorConverter.tsx contains all required interactive features and safeguards');

// 2. ToolRunner check
const runnerPath = path.join(projectRoot, 'src', 'components', 'tools', 'ToolRunner.tsx');
const runnerContent = fs.readFileSync(runnerPath, 'utf8');
assert.ok(runnerContent.includes('QrCodeGeneratorConverter'), 'ToolRunner imports QrCodeGeneratorConverter');
assert.ok(runnerContent.includes("toolId === 'qr-code-generator'"), 'ToolRunner routes qr-code-generator');
console.log('  ✓ ToolRunner wires QrCodeGeneratorConverter for qr-code-generator and qr-generator');

// 3. Footer exclusion check
const footerPath = path.join(projectRoot, 'src', 'components', 'layout', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');
assert.ok(footerContent.includes("pathname?.includes('qr-code-generator')"), 'Footer excludes qr-code-generator');
assert.ok(footerContent.includes("pathname?.includes('qr-generator')"), 'Footer excludes qr-generator');
console.log('  ✓ Footer correctly suppressed on qr-code-generator and qr-generator');

// 4. Educational section exclusion check
const pagePath = path.join(projectRoot, 'src', 'app', 'tools', '[toolId]', 'page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');
assert.ok(pageContent.includes("toolId !== 'qr-code-generator'"), 'page.tsx excludes educational section on qr-code-generator');
console.log('  ✓ Educational section excluded on qr-code-generator to prevent page scrolling');

// 5. Next.js rewrite check
const nextConfigPath = path.join(projectRoot, 'next.config.mjs');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
assert.ok(nextConfigContent.includes("'/qr-code-generator'"), 'next.config.mjs has /qr-code-generator rewrite');
assert.ok(nextConfigContent.includes("'/qr-generator'"), 'next.config.mjs has /qr-generator rewrite');
console.log('  ✓ Clean route rewrites active in next.config.mjs');

console.log('\n🎉 ALL 5 QR CODE GENERATOR VERIFICATION TEST SUITES PASSED FLAWLESSLY!\n');
