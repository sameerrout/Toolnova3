import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PdfSummarizer } from '@/components/tools/PdfSummarizer';
import { Container } from '@/components/common/Container';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  BookOpen,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'PDF Summarizer - Summarize PDF Documents Online Free | Toolino',
  description:
    'Free client-side PDF summarizer. Instantly extract key takeaways, executive summaries, and section breakdowns from research papers, reports, and books with 100% privacy.',
  keywords: [
    'pdf summarizer',
    'summarize pdf',
    'ai pdf summarizer',
    'free pdf summary tool',
    'summarize pdf document',
    'extract key points from pdf',
    'research paper summarizer',
    'private pdf summarizer',
  ],
  alternates: {
    canonical: 'https://toolnova.com/pdf-summarizer',
  },
  openGraph: {
    title: 'PDF Summarizer - Summarize PDF Documents Online | Toolino',
    description:
      'Extract executive summaries, key takeaways, and section breakdowns from any PDF with 100% in-browser privacy.',
    url: 'https://toolnova.com/pdf-summarizer',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function PdfSummarizerPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/pdf-summarizer`;

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Toolino PDF Summarizer',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Private client-side PDF summarization tool providing key takeaways, sentence extraction, executive summaries, and section breakdowns without server uploads.',
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
        name: 'PDF Tools',
        item: `${baseUrl}/pdf-tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'PDF Summarizer',
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
        name: 'How does the PDF Summarizer work without uploading my files?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Toolino leverages client-side PDF parsing and natural language text-ranking algorithms directly in your browser sandbox. The PDF text is tokenized, ranked, and summarized in local device memory without sending any pages or document text over the internet.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can this tool summarize scanned or image-based PDFs?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Text-based PDFs with digital font streams are summarized immediately. For scanned paper documents or photocopies, the tool detects that pages lack extractable text and prompts you with OCR processing guidance.',
        },
      },
      {
        '@type': 'Question',
        name: 'What summary formats are available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can choose between Short (concise overview), Detailed (comprehensive synopsis), Key Points (numbered bullet takeaways), and Section-by-Section (chapter and page breakdown).',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I export the generated summary?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! You can copy the summary with one click, or download it as a plain text file (.txt), formatted Markdown (.md), or compiled PDF (.pdf).',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
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

      <Container size="xl">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-slate-500 flex items-center space-x-2">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/pdf-tools" className="hover:text-blue-600 transition">
            PDF Tools
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">PDF Summarizer</span>
        </nav>

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            100% Private Client-Side NLP
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            PDF Summarizer
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Extract executive summaries, critical takeaways, and structured section breakdowns from lengthy documents, reports, and ebooks in seconds with zero data transmission.
          </p>
        </div>

        {/* Interactive Tool Component */}
        <PdfSummarizer />

        {/* Educational Section & Internal Links */}
        <div className="max-w-4xl mx-auto mt-20 pt-12 border-t border-slate-200/80 space-y-16">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Why Privacy-First Local PDF Summarization Matters
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Proprietary contracts, financial statements, medical records, and legal briefs cannot be safely uploaded to unverified third-party cloud services. Toolino executes document extraction and sentence ranking entirely within your local device sandbox.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Zero Data Retention</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your PDF files are parsed into temporary browser memory and purged immediately when you close the tab.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Extractive Salience</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  TF-IDF frequency analysis and position heuristics extract verified factual statements without AI hallucinations.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <Layers className="w-8 h-8 text-indigo-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Chapter Chunking</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Large multi-page publications are divided into modular sections preserving original heading structure.
                </p>
              </div>
            </div>
          </div>

          {/* Related Tools Internal Linking */}
          <div className="bg-slate-100/70 rounded-3xl border border-slate-200 p-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Explore Companion PDF Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <Link
                href="/edit-pdf"
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                    Edit PDF
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Annotate &amp; modify</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/tools/compress-pdf"
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                    Compress PDF
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Shrink PDF file size</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/image-to-text"
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                    Image to Text (OCR)
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Scanned text extraction</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/tools/merge-pdf"
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                    Merge PDF
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Combine documents</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Is there a file size limit for PDF summarization?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Toolino processes documents up to 100 MB directly in your computer memory using streaming chunk algorithms that avoid browser freezing.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  What makes extractive summarization reliable?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Extractive summarization selects the actual sentences that carry the highest informational density directly from the author&apos;s text, preventing invented facts, hallucinations, or misattributions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
