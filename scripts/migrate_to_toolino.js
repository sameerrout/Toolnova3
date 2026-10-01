/**
 * Migration Script: ToolNova -> Toolino
 * Replaces user-facing branding, titles, metadata, Open Graph, schemas, headers,
 * footers, and download labels safely while preserving domains, database, and auth security.
 */

const fs = require('fs');
const path = require('path');

// Helper to replace safely in file
function updateFile(filePath, updater) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  const original = fs.readFileSync(fullPath, 'utf8');
  const updated = updater(original);
  if (original !== updated) {
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes needed in: ${filePath}`);
  }
}

// 1. Package.json
updateFile('package.json', (content) => {
  return content.replace(/"name":\s*"toolnova"/, '"name": "toolino"');
});

// 2. README.md
updateFile('README.md', (content) => {
  return content
    .replace(/# Toolnova/g, '# Toolino')
    .replace(/# ToolNova/g, '# Toolino')
    .replace(/Toolnova/g, 'Toolino')
    .replace(/ToolNova/g, 'Toolino')
    .replace(/TOOLNOVA/g, 'TOOLINO');
});

// 3. Header & Footer
updateFile('src/components/layout/Header.tsx', (content) => {
  return content
    .replace(/alt="ToolNova Logo"/g, 'alt="Toolino Logo"')
    .replace(/Tool<span className="text-blue-600">Nova<\/span>/g, 'Tool<span className="text-blue-600">ino</span>');
});

updateFile('src/components/layout/Footer.tsx', (content) => {
  return content
    .replace(/ToolNova selects/g, 'Toolino selects')
    .replace(/© 2026 ToolNova/g, '© 2026 Toolino');
});

// 4. Root Layout (Title, Metadata, Keywords)
updateFile('src/app/layout.tsx', (content) => {
  return content
    .replace(/title:\s*'ToolNova - All-in-One Free Online Tools'/g, "title: 'Toolino - All-in-One Free Online Tools'")
    .replace(/'ToolNova',/g, "'Toolino',");
});

// 5. Manager Dashboard UI
updateFile('src/app/manager/page.tsx', (content) => {
  return content
    .replace(/The ToolNova Manager dashboard is private/g, 'The Toolino Manager dashboard is private')
    .replace(/TOOLNOVA MANAGER/g, 'TOOLINO MANAGER')
    .replace(/toolnova-analytics-/g, 'toolino-analytics-');
});

// 6. Homepage & About
updateFile('src/app/page.tsx', (content) => {
  return content
    .replace(/ToolNova selects the appropriate/g, 'Toolino selects the appropriate');
});

updateFile('src/app/about/page.tsx', (content) => {
  return content
    .replace(/About ToolNova/g, 'About Toolino')
    .replace(/ToolNova is your/g, 'Toolino is your')
    .replace(/ToolNova is built/g, 'Toolino is built')
    .replace(/alt="About ToolNova"/g, 'alt="About Toolino"');
});

// 7. Login & Signup
updateFile('src/app/login/page.tsx', (content) => {
  return content
    .replace(/alt="ToolNova Logo"/g, 'alt="Toolino Logo"')
    .replace(/Login to ToolNova/g, 'Login to Toolino');
});

updateFile('src/app/signup/page.tsx', (content) => {
  return content
    .replace(/alt="ToolNova Logo"/g, 'alt="Toolino Logo"')
    .replace(/agree to ToolNova/g, 'agree to Toolino');
});

// 8. Error Pages & Result Panel
updateFile('src/app/error.tsx', (content) => {
  return content.replace(/Toolnova runtime boundary/g, 'Toolino runtime boundary');
});

updateFile('src/components/common/ResultPanel.tsx', (content) => {
  return content.replace(/open Toolnova on/g, 'open Toolino on');
});

// 9. Auth & Sessions (backward compatibility preserved)
updateFile('src/lib/auth/serverAuth.ts', (content) => {
  return content
    .replace(
      "const sessionCookie = request.cookies.get('toolnova_session');",
      "const sessionCookie = request.cookies.get('toolino_session') || request.cookies.get('toolnova_session');"
    )
    .replace(
      'error: \'Forbidden: Access restricted strictly to authorized ToolNova managers.\'',
      'error: \'Forbidden: Access restricted strictly to authorized Toolino managers.\''
    );
});

updateFile('src/app/api/auth/login/route.ts', (content) => {
  return content
    .replace(
      "name: 'toolnova_session',",
      "name: 'toolino_session',"
    );
});

updateFile('src/app/api/auth/logout/route.ts', (content) => {
  return content
    .replace(
      "response.cookies.delete('toolnova_session');",
      "response.cookies.delete('toolino_session');\n    response.cookies.delete('toolnova_session');"
    );
});

updateFile('src/app/api/auth/me/route.ts', (content) => {
  return content
    .replace(
      "const sessionCookie = request.cookies.get('toolnova_session');",
      "const sessionCookie = request.cookies.get('toolino_session') || request.cookies.get('toolnova_session');"
    );
});

updateFile('src/app/api/auth/signup/route.ts', (content) => {
  return content
    .replace(
      "name: 'toolnova_session',",
      "name: 'toolino_session',"
    );
});

// 10. Analytics Tracker (localStorage & sessionStorage migration with backward compatibility)
updateFile('src/lib/analytics/tracker.ts', (content) => {
  return content
    .replace(
      "let id = localStorage.getItem('toolnova_anon_id');\n    if (!id || id.length < 10) {\n      id = 'anon_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);\n      localStorage.setItem('toolnova_anon_id', id);\n    }",
      "let id = localStorage.getItem('toolino_anon_id') || localStorage.getItem('toolnova_anon_id');\n    if (!id || id.length < 10) {\n      id = 'anon_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);\n    }\n    localStorage.setItem('toolino_anon_id', id);"
    )
    .replace(
      "let id = sessionStorage.getItem('toolnova_session_id');\n    if (!id || id.length < 10) {\n      id = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);\n      sessionStorage.setItem('toolnova_session_id', id);\n    }",
      "let id = sessionStorage.getItem('toolino_session_id') || sessionStorage.getItem('toolnova_session_id');\n    if (!id || id.length < 10) {\n      id = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);\n    }\n    sessionStorage.setItem('toolino_session_id', id);"
    );
});

// 11. Analytics DB export filenames
updateFile('src/lib/db/analyticsDb.ts', (content) => {
  return content
    .replace(/toolnova-analytics-/g, 'toolino-analytics-');
});

// 12. SEO Content Catalog
updateFile('src/data/toolsSeoContent.ts', (content) => {
  return content
    .replace(/Toolnova/g, 'Toolino')
    .replace(/ToolNova/g, 'Toolino')
    .replace(/TOOLNOVA/g, 'TOOLINO');
});

// 13. Tool Pages
const toolPages = [
  'src/app/age-calculator/page.tsx',
  'src/app/background-remover/page.tsx',
  'src/app/discount-calculator/page.tsx',
  'src/app/document-tools/page.tsx',
  'src/app/edit-pdf/page.tsx',
  'src/app/emi-calculator/page.tsx',
  'src/app/gst-calculator/page.tsx',
  'src/app/image-compressor/page.tsx',
  'src/app/image-converter/page.tsx',
  'src/app/image-resizer/page.tsx',
  'src/app/image-to-pdf/page.tsx',
  'src/app/image-to-text/page.tsx',
  'src/app/image-tools/page.tsx',
  'src/app/json-formatter/page.tsx',
  'src/app/passport-photo-maker/page.tsx',
  'src/app/pdf-summarizer/page.tsx',
  'src/app/pdf-tools/page.tsx',
  'src/app/percentage-calculator/page.tsx',
  'src/app/qr-tools/page.tsx',
  'src/app/tools/[toolId]/page.tsx',
  'src/app/utility-tools/page.tsx',
  'src/app/word-counter/page.tsx',
];

toolPages.forEach((pagePath) => {
  updateFile(pagePath, (content) => {
    return content
      // Titles
      .replace(/ - ToolNova'/g, " - Toolino'")
      .replace(/ - Toolnova'/g, " - Toolino'")
      .replace(/ \| ToolNova'/g, " | Toolino'")
      .replace(/ \| Toolnova'/g, " | Toolino'")
      // siteName
      .replace(/siteName:\s*'Toolnova'/g, "siteName: 'Toolino'")
      .replace(/siteName:\s*'ToolNova'/g, "siteName: 'Toolino'")
      // Structured Data names
      .replace(/name:\s*'ToolNova /g, "name: 'Toolino ")
      .replace(/name:\s*'Toolnova /g, "name: 'Toolino ")
      .replace(/name:\s*'([A-Za-z0-9 ]+) - ToolNova'/g, "name: '$1 - Toolino'")
      // User facing text/descriptions/FAQs
      .replace(/ToolNova Word Counter/g, 'Toolino Word Counter')
      .replace(/ToolNova/g, 'Toolino')
      .replace(/Toolnova/g, 'Toolino')
      .replace(/TOOLNOVA/g, 'TOOLINO');
  });
});

// 14. Tool Components
const toolComponents = [
  'src/components/tools/AgeCalculator.tsx',
  'src/components/tools/BackgroundRemover.tsx',
  'src/components/tools/DiscountCalculator.tsx',
  'src/components/tools/EmiCalculator.tsx',
  'src/components/tools/GstCalculator.tsx',
  'src/components/tools/ImageCompressor.tsx',
  'src/components/tools/ImageConverter.tsx',
  'src/components/tools/ImageResizer.tsx',
  'src/components/tools/ImageToPdfConverter.tsx',
  'src/components/tools/ImageToText.tsx',
  'src/components/tools/JsonFormatter.tsx',
  'src/components/tools/PassportPhotoMaker.tsx',
  'src/components/tools/WordCounter.tsx',
  'src/components/tools/pdf-editor/PdfEditor.tsx',
  'src/components/tools/pdf-editor/pdfExport.ts',
  'src/components/tools/pdf-editor/sampleData.ts',
];

toolComponents.forEach((compPath) => {
  updateFile(compPath, (content) => {
    return content
      .replace(/ToolNova/g, 'Toolino')
      .replace(/Toolnova/g, 'Toolino')
      .replace(/TOOLNOVA/g, 'TOOLINO')
      .replace(/toolnova-/g, 'toolino-')
      .replace(/toolnova_/g, 'toolino_');
  });
});

// 15. Core Engines & Services
const engines = [
  'src/core/engine/ageCalculatorEngine.ts',
  'src/core/engine/backgroundRemoverEngine.ts',
  'src/core/engine/discountCalculatorEngine.ts',
  'src/core/engine/emiCalculatorEngine.ts',
  'src/core/engine/gstCalculatorEngine.ts',
  'src/core/engine/imageCompressorEngine.ts',
  'src/core/engine/imageConverterEngine.ts',
  'src/core/engine/imageResizerEngine.ts',
  'src/core/engine/jsonFormatterEngine.ts',
  'src/core/engine/ocrEngine.ts',
  'src/core/engine/passportPhotoEngine.ts',
  'src/core/engine/pdfSummarizerEngine.ts',
  'src/core/engine/percentageCalculatorEngine.ts',
  'src/core/engine/wordCounterEngine.ts',
  'src/core/types/tool.ts',
];

engines.forEach((engPath) => {
  updateFile(engPath, (content) => {
    return content
      .replace(/ToolNova/g, 'Toolino')
      .replace(/Toolnova/g, 'Toolino')
      .replace(/TOOLNOVA/g, 'TOOLINO');
  });
});

// 16. Tools package
const toolsDir = 'src/tools';
if (fs.existsSync(toolsDir)) {
  const dirs = fs.readdirSync(toolsDir);
  dirs.forEach((d) => {
    const p = path.join(toolsDir, d);
    if (fs.statSync(p).isDirectory()) {
      const idx = path.join(p, 'index.ts');
      if (fs.existsSync(idx)) {
        updateFile(idx, (content) => {
          return content
            .replace(/Toolnova/g, 'Toolino')
            .replace(/ToolNova/g, 'Toolino')
            .replace(/TOOLNOVA/g, 'TOOLINO')
            .replace(/toolnova-/g, 'toolino-');
        });
      }
    }
  });
}

// 17. Update specific tools extra files
updateFile('src/tools/qr-code-generator/QrCodeGeneratorOptions.tsx', (content) => {
  return content.replace(/toolnova-qr-/g, 'toolino-qr-');
});

updateFile('src/tools/qr-code-generator/qrPayload.ts', (content) => {
  return content.replace(/Toolnova - High-Performance Online Tools/g, 'Toolino - High-Performance Online Tools');
});

// 18. Workflow test assertion
updateFile('tests/test_image_to_pdf_workflow.mjs', (content) => {
  return content
    .replace(/assert\.ok\(html\.includes\('ToolNova'\), 'Navbar must have ToolNova'\);/g, "assert.ok(html.includes('Toolino'), 'Navbar must have Toolino');");
});

console.log('\n✅ Brand Migration Script Completed Successfully!\n');
