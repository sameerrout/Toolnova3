import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  FileText,
  Globe,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { ImageToText } from '@/components/tools/ImageToText';
import { Container } from '@/components/common/Container';

export const metadata: Metadata = {
  title: 'Free Image to Text Converter (OCR) Online - Extract Text from Photos | Toolino',
  description:
    'Extract text from images, photos, scans, receipts, and PDF documents online for free. Multi-language OCR support, instant copy to clipboard, and export to TXT, Word (DOCX), and PDF.',
  alternates: {
    canonical: 'https://toolnova.com/image-to-text',
  },
  openGraph: {
    title: 'Free Online Image to Text (OCR) - Toolino',
    description:
      'Extract text from images, photos, and scans with 100% private in-browser OCR. Copy or export to Word DOCX, PDF, and TXT.',
    url: 'https://toolnova.com/image-to-text',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function ImageToTextPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/image-to-text`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Image to Text (OCR) - Toolino',
    url: pageUrl,
    description:
      'Extract text from images, photos, receipts, and scans online for free. 100% private in-browser OCR with DOCX, PDF, and TXT export.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Image Tools',
        item: `${baseUrl}/image-tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Image to Text (OCR)',
        item: pageUrl,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Are my confidential documents or images uploaded to any server?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. All optical character recognition is performed 100% client-side inside your browser sandbox using WebAssembly. Your images, personal documents, and financial receipts never leave your computer or phone.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which languages does Toolino OCR support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Toolino supports over 16 major languages including English, Spanish, French, German, Italian, Portuguese, Hindi, Chinese (Simplified & Traditional), Japanese, Korean, Russian, Arabic, Dutch, Polish, and Turkish.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I export the extracted text directly to Microsoft Word or PDF?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! You can copy text to your clipboard with one click, or export directly to clean formatted Microsoft Word (.docx), searchable PDF (.pdf), or plain text (.txt) files.',
        },
      },
      {
        '@type': 'Question',
        name: 'How can I improve OCR accuracy on low-quality or blurry scans?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Click on "Scan Enhancement Filters" and enable "Enhance Text Contrast" or "Binarize". This converts low-contrast gray backgrounds into sharp black-on-white text for maximum recognition accuracy.',
        },
      },
    ],
  };

  return (
    <>
      {/* Structured Data Script Tags */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Main Tool Application */}
      <ImageToText />

      {/* Educational & SEO Content Section */}
      <section className="bg-white border-t border-slate-200/80 py-16">
        <Container>
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Step-by-Step Workflow Guide */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Simple 3-Step Process
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                How to Extract Text from Images with Free Online OCR
              </h2>
              <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
                Convert scanned PDFs, receipt photos, textbook snapshots, and screenshots into editable digital text instantly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    1
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Upload Image or Scan</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Drag and drop your JPG, PNG, WEBP, or BMP file, or click one of our sample documents to test the OCR engine.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    2
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Choose Language & Filter</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Select your document's primary language. Apply contrast enhancement or binarization filters for faded receipts.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    3
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Edit, Copy & Export</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Review side-by-side extracted text, edit typos in the live editor, and download as Microsoft Word (.docx), PDF, or TXT.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">
                Why Students, Researchers & Businesses Trust Toolino OCR
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">100% Confidential & Secure</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      All optical recognition processes run locally in your browser with WebAssembly. Bank statements, contracts, and private medical bills remain completely private on your device.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Multi-Language Recognition</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Extract text with native language models for English, Spanish, French, German, Hindi, Chinese, Japanese, Arabic, and more.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Export to DOCX, PDF & TXT</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Download genuine Microsoft Word (.docx) documents, searchable PDFs, or clean plain text files without installing third-party desktop software.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Scan Preprocessing Filters</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Adaptive binarization, contrast sharpening, and invert filters clean up grainy mobile camera photos, wrinkles, and dark mode screenshots.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions (FAQ) */}
            <div className="pt-6 border-t border-slate-200/80">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Are my confidential documents or images uploaded to any server?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    No. All optical character recognition is performed 100% client-side inside your browser sandbox using WebAssembly. Your images, personal documents, and financial receipts never leave your computer or phone.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Which languages does Toolino OCR support?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Toolino supports over 16 major languages including English, Spanish, French, German, Italian, Portuguese, Hindi, Chinese (Simplified & Traditional), Japanese, Korean, Russian, Arabic, Dutch, Polish, and Turkish.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Can I export the extracted text directly to Microsoft Word or PDF?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Yes! You can copy text to your clipboard with one click, or export directly to clean formatted Microsoft Word (.docx), searchable PDF (.pdf), or plain text (.txt) files.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    How can I improve OCR accuracy on low-quality or blurry scans?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Click on "Scan Enhancement Filters" and enable "Enhance Text Contrast" or "Binarize". This converts low-contrast gray backgrounds into sharp black-on-white text for maximum recognition accuracy.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Tools Internal Links */}
            <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-3xl p-8 border border-blue-100">
              <h3 className="text-base font-bold text-slate-900">Explore More Free Image Tools</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Boost your productivity with Toolino's suite of free privacy-first web tools.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/image-converter"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Image Converter</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/image-compressor"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Image Compressor</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/background-remover"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Background Remover</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/image-tools"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>All Image Tools</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
