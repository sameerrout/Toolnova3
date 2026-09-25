export interface ToolSeoData {
  title: string;
  metaDescription: string;
  howTo: { step: string; title: string; desc: string }[];
  features: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  relatedTools: string[];
}

export const TOOLS_SEO_DATA: Record<string, ToolSeoData> = {
  'pdf-to-word': {
    title: 'PDF to Word Converter Online - Free & High Fidelity | Toolnova',
    metaDescription:
      'Convert PDF documents to editable Microsoft Word (.docx) files online. Preserves tables, headings, images, and formatting with fast, secure processing.',
    howTo: [
      {
        step: '1',
        title: 'Upload PDF Document',
        desc: 'Select or drag-and-drop your PDF file into the upload zone.',
      },
      {
        step: '2',
        title: 'Analyze & Convert',
        desc: 'Our engine analyzes document structure, font styles, and layouts to generate a clean DOCX.',
      },
      {
        step: '3',
        title: 'Download Editable Word File',
        desc: 'Save your formatted .docx file directly to your device with one click.',
      },
    ],
    features: [
      {
        title: 'Document Structure Preservation',
        desc: 'Maintains headings, paragraph margins, text alignment, and font characteristics accurately.',
      },
      {
        title: 'Table & List Extraction',
        desc: 'Converts tabular data and bulleted lists into native Microsoft Word elements.',
      },
      {
        title: 'Adaptive Processing Engine',
        desc: 'Processes lightweight files client-side and complex multi-page files through memory-efficient chunked workers.',
      },
      {
        title: 'Zero Persistent Retention',
        desc: 'Uploaded data is processed ephemerally and purged immediately upon download or job completion.',
      },
    ],
    faqs: [
      {
        q: 'How does Toolnova convert PDF to Word?',
        a: 'Toolnova uses an adaptive conversion engine that analyzes document text streams, font metrics, and visual layouts to assemble high-fidelity Microsoft Word (.docx) documents.',
      },
      {
        q: 'Will my formatting and tables be preserved?',
        a: 'Yes, our engine specifically targets paragraphs, headings, tabular data, and visual styling to ensure editable DOCX fidelity.',
      },
      {
        q: 'Are my uploaded files kept secure?',
        a: 'Absolutely. Client-side conversions remain in your browser memory. Server-assisted conversions use isolated temporary directories that are purged automatically upon completion.',
      },
      {
        q: 'Is there a file size limit?',
        a: 'Standard conversions support files up to 50MB directly in the browser and up to 100MB through our backend worker pipeline.',
      },
    ],
    relatedTools: ['word-to-pdf', 'pdf-to-powerpoint', 'compress-pdf', 'merge-pdf'],
  },

  'pdf-to-powerpoint': {
    title: 'PDF to PowerPoint Converter - 1 Page = 1 Slide Guarantee | Toolnova',
    metaDescription:
      'Convert PDF presentations to editable Microsoft PowerPoint (.pptx) decks. Guarantees exactly one PowerPoint slide per PDF page with no blank slides.',
    howTo: [
      {
        step: '1',
        title: 'Select PDF Slides',
        desc: 'Upload your presentation slides or multi-page PDF document.',
      },
      {
        step: '2',
        title: 'Configure Slide Dimensions',
        desc: 'Choose between 16:9 widescreen or 4:3 standard aspect ratio layouts.',
      },
      {
        step: '3',
        title: 'Download PowerPoint Deck',
        desc: 'Download your verified .pptx file with exactly one slide per PDF page.',
      },
    ],
    features: [
      {
        title: '1:1 Page-to-Slide Guarantee',
        desc: 'Strictly ensures that every single PDF page maps to exactly one corresponding PowerPoint slide with zero blank slides.',
      },
      {
        title: 'Aspect Ratio Preservation',
        desc: 'Automatically detects portrait or landscape orientations and centers slides without stretching or distortion.',
      },
      {
        title: 'Large Presentation Support',
        desc: 'Memory-safe chunked processing handles 100+ page presentations without browser or server memory exhaustion.',
      },
      {
        title: 'High-DPI Rendering',
        desc: 'Renders vector graphics and typography crisply for executive-grade slide presentations.',
      },
    ],
    faqs: [
      {
        q: 'Does each PDF page become an individual slide?',
        a: 'Yes. Toolnova enforces a strict 1-to-1 guarantee: a 50-page PDF will always produce an exact 50-slide PowerPoint presentation.',
      },
      {
        q: 'Can I edit the converted PowerPoint presentation?',
        a: 'Yes, the resulting .pptx file opens seamlessly in Microsoft PowerPoint, Google Slides, Keynote, and LibreOffice Impress.',
      },
      {
        q: 'How does Toolnova handle large slide decks?',
        a: 'Our engine uses disk-backed streaming and page-by-page memory reclamation, allowing 100+ slide presentations to convert smoothly.',
      },
    ],
    relatedTools: ['powerpoint-to-pdf', 'pdf-to-word', 'compress-pdf', 'organize-pdf'],
  },

  'word-to-pdf': {
    title: 'Word to PDF Converter Online - Preserve Layout & Fonts | Toolnova',
    metaDescription:
      'Convert DOCX and DOC files to high-resolution PDF documents. Preserves layout, pagination, headings, and fonts across all devices.',
    howTo: [
      {
        step: '1',
        title: 'Upload Word Document',
        desc: 'Select your .docx or .doc file from your computer or mobile device.',
      },
      {
        step: '2',
        title: 'Layout Rendering',
        desc: 'The document rendering engine maps margins, line heights, typography, and page breaks.',
      },
      {
        step: '3',
        title: 'Save PDF',
        desc: 'Download the finalized, print-ready PDF document instantly.',
      },
    ],
    features: [
      {
        title: 'Native Document Pagination',
        desc: 'Maintains page boundaries, headers, footers, and margins identical to the original Word document.',
      },
      {
        title: 'Universal Compatibility',
        desc: 'Generates standard PDF/A-compliant files readable on all desktop and mobile PDF viewers.',
      },
      {
        title: 'Fast Batch Conversion',
        desc: 'Optimized rendering pipeline delivers converted documents in seconds.',
      },
      {
        title: 'Strict Data Protection',
        desc: 'Files are processed in sandboxed environments with instant cleanup.',
      },
    ],
    faqs: [
      {
        q: 'Will my fonts and margins look the same?',
        a: 'Yes, our layout rendering engine preserves document formatting, page margins, paragraph spacing, and embedded graphics.',
      },
      {
        q: 'Is Word to PDF conversion free on Toolnova?',
        a: 'Yes, all core conversion tools on Toolnova are completely free with no registration required.',
      },
    ],
    relatedTools: ['pdf-to-word', 'pdf-to-powerpoint', 'merge-pdf', 'protect-pdf'],
  },

  'qr-code-generator': {
    title: 'Free QR Code Generator - URLs, WiFi, Text, vCard & Custom Colors | Toolnova',
    metaDescription:
      'Create custom high-resolution QR codes for websites, plain text, Wi-Fi networks, phone numbers, and vCards. Download in PNG or vector SVG.',
    howTo: [
      {
        step: '1',
        title: 'Choose QR Data Type',
        desc: 'Select from URL, Text, Email, Phone, Wi-Fi, or vCard contact card.',
      },
      {
        step: '2',
        title: 'Customize Appearance',
        desc: 'Set custom foreground and background colors, resolution, and error correction levels.',
      },
      {
        step: '3',
        title: 'Download or Copy',
        desc: 'Download your QR code as a PNG or SVG image, or copy it directly to your clipboard.',
      },
    ],
    features: [
      {
        title: 'Multi-Format Content Support',
        desc: 'Easily encode website links, Wi-Fi login credentials, contact cards (vCard), emails, and phone numbers.',
      },
      {
        title: 'Vector SVG & High-Res PNG',
        desc: 'Export scalable vector graphics (SVG) for print media or high-density PNG for digital displays.',
      },
      {
        title: 'Custom Color Themes',
        desc: 'Personalize foreground and background colors with real-time live preview.',
      },
      {
        title: '100% In-Browser Privacy',
        desc: 'QR generation runs entirely client-side using JavaScript with zero server network requests.',
      },
    ],
    faqs: [
      {
        q: 'Do the generated QR codes expire?',
        a: 'No! Toolnova generates static QR codes where the data is encoded directly into the matrix. They never expire.',
      },
      {
        q: 'Can I print these QR codes on business cards or posters?',
        a: 'Yes, select the SVG vector format or high-resolution PNG (up to 1024px) for crisp printing at any scale.',
      },
      {
        q: 'Does Toolnova store the data I enter?',
        a: 'Never. The QR code generator runs 100% client-side in your browser; your data never leaves your device.',
      },
    ],
    relatedTools: ['image-to-pdf', 'edit-pdf', 'protect-pdf'],
  },
};

/**
 * Fallback generator for tools that don't have custom bespoke text
 */
export function getToolSeoData(toolId: string, toolName: string, description: string): ToolSeoData {
  if (TOOLS_SEO_DATA[toolId]) {
    return TOOLS_SEO_DATA[toolId];
  }

  return {
    title: `${toolName} Online - Free & Secure | Toolnova`,
    metaDescription: `${description} Fast, privacy-focused online tool by Toolnova. Zero persistent storage.`,
    howTo: [
      {
        step: '1',
        title: 'Upload File',
        desc: `Select or drag-and-drop your document to begin using ${toolName}.`,
      },
      {
        step: '2',
        title: 'Configure Options',
        desc: 'Customize settings according to your document requirements.',
      },
      {
        step: '3',
        title: 'Process & Download',
        desc: 'Click execute to generate your verified output file in seconds.',
      },
    ],
    features: [
      {
        title: 'Instant In-Browser Execution',
        desc: 'Processes tasks efficiently with optimal resource management.',
      },
      {
        title: 'Privacy-First Architecture',
        desc: 'No persistent file storage and strict data isolation.',
      },
      {
        title: 'Mobile & Desktop Optimized',
        desc: 'Responsive user interface engineered for all devices.',
      },
    ],
    faqs: [
      {
        q: `Is ${toolName} free to use?`,
        a: 'Yes, Toolnova provides free access to all utility tools without forced subscriptions or watermarks.',
      },
      {
        q: 'Are my files kept private?',
        a: 'Yes, our platform operates on strict zero-retention principles with client-side or ephemeral processing.',
      },
    ],
    relatedTools: ['merge-pdf', 'split-pdf', 'compress-pdf', 'pdf-to-word'],
  };
}
