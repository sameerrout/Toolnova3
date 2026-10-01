import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Code2,
  FolderTree,
  FileSpreadsheet,
  Wand2,
  CheckCircle2,
} from 'lucide-react';
import { JsonFormatter } from '@/components/tools/JsonFormatter';
import { Container } from '@/components/common/Container';

export const metadata: Metadata = {
  title: 'Free JSON Formatter & Validator Online - Beautify, Tree View & Convert | Toolino',
  description:
    'Format, validate, beautify, and repair JSON documents online for free. Interactive collapsible tree view, syntax error line/column highlighting, and instant conversion to CSV, XML, and YAML.',
  alternates: {
    canonical: 'https://toolnova.com/json-formatter',
  },
  openGraph: {
    title: 'Free Online JSON Formatter & Validator - Toolino',
    description:
      'Beautify, validate, fix, and convert JSON documents with interactive tree view and CSV/XML/YAML export directly in your browser.',
    url: 'https://toolnova.com/json-formatter',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function JsonFormatterPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/json-formatter`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'JSON Formatter & Validator - Toolino',
    url: pageUrl,
    description:
      'Format, validate, beautify, and repair JSON documents with interactive tree view and CSV/XML/YAML conversion.',
    applicationCategory: 'DeveloperApplication',
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
        name: 'Utility Tools',
        item: `${baseUrl}/utility-tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'JSON Formatter',
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
        name: 'Can this tool fix invalid JSON with trailing commas or unquoted keys?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! The "Fix JSON Syntax" button automatically detects and repairs single quotes, unquoted property keys, trailing commas in objects and arrays, Python constants (True/False/None), and JavaScript comments.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I convert JSON into CSV, XML, or YAML?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Paste or upload your JSON document, then switch to the CSV, XML, or YAML tab. Toolino converts arrays and nested structures instantly and provides 1-click download buttons for each format.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are my JSON API payloads or database credentials sent to any server?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Toolino operates 100% locally inside your web browser. Your private JSON payloads, API responses, and configuration files are never sent over the internet.',
        },
      },
      {
        '@type': 'Question',
        name: 'What indentation options are supported for formatting?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can choose between 2 spaces, 4 spaces, tab indentation, or minified/compact mode with zero whitespace for production web payloads.',
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
      <JsonFormatter />

      {/* Educational & SEO Content Section */}
      <section className="bg-white border-t border-slate-200/80 py-16">
        <Container>
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Step-by-Step Workflow Guide */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Developer Productivity Suite
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                How to Beautify, Validate & Convert JSON Documents
              </h2>
              <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
                Streamline your API debugging and data transformation workflow with Toolino's versatile JSON toolkit.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    1
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Paste or Upload JSON</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Paste minified, unformatted, or broken JSON directly into the editor, or upload a local .json file.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    2
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Validate & Auto-Fix</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Instantly identify syntax errors by line and column. Click "Fix JSON" to automatically clean trailing commas and quotes.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    3
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Inspect & Export</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Navigate collapsible tree nodes or export converted CSV, XML, and YAML files with 1-click downloads.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">
                Why Engineers & Data Analysts Choose Toolino JSON Formatter
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">100% Client-Side Privacy</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      API tokens, database credentials, and production JSON logs are processed entirely in your browser sandbox with zero network requests.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Automated Error Repair</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Automatically cleans up trailing commas, unquoted property keys, single quotes, Python booleans, and code comments.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Interactive Collapsible Tree View</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Visualize complex nested JSON structures with interactive expand/collapse toggles, array index tags, and type indicators.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Instant CSV, XML & YAML Converters</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Convert JSON payloads into spreadsheet-ready CSV tables, standard XML documents, or clean YAML configs with one click.
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
                    Can this tool fix invalid JSON with trailing commas or unquoted keys?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Yes! The "Fix JSON Syntax" button automatically detects and repairs single quotes, unquoted property keys, trailing commas in objects and arrays, Python constants (True/False/None), and JavaScript comments.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    How do I convert JSON into CSV, XML, or YAML?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Paste or upload your JSON document, then switch to the CSV, XML, or YAML tab. Toolino converts arrays and nested structures instantly and provides 1-click download buttons for each format.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Are my JSON API payloads or database credentials sent to any server?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    No. Toolino operates 100% locally inside your web browser. Your private JSON payloads, API responses, and configuration files are never sent over the internet.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    What indentation options are supported for formatting?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    You can choose between 2 spaces, 4 spaces, tab indentation, or minified/compact mode with zero whitespace for production web payloads.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Tools Internal Links */}
            <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-3xl p-8 border border-blue-100">
              <h3 className="text-base font-bold text-slate-900">Explore More Free Utility Tools</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Boost your development workflow with Toolino's suite of free privacy-first web tools.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/word-counter"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Word Counter</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/image-to-text"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Image to Text (OCR)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/qr-code-generator"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>QR Code Generator</span>
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
