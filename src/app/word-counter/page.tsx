import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  BookOpen,
  Hash,
  Share2,
  Type,
  CheckCircle2,
} from 'lucide-react';
import { WordCounter } from '@/components/tools/WordCounter';
import { Container } from '@/components/common/Container';

export const metadata: Metadata = {
  title: 'Free Word Counter Online - Character Count, Readability & Keywords | Toolino',
  description:
    'Count words, characters (with and without spaces), sentences, paragraphs, and reading time online for free. Real-time Flesch readability scores, keyword density analysis, case conversion, and social media limits.',
  alternates: {
    canonical: 'https://toolnova.com/word-counter',
  },
  openGraph: {
    title: 'Free Online Word Counter - Toolino',
    description:
      'Real-time word, character, and sentence counter with Flesch readability scores and keyword density analysis directly in your browser.',
    url: 'https://toolnova.com/word-counter',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function WordCounterPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/word-counter`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Word Counter - Toolino',
    url: pageUrl,
    description:
      'Count words, characters, sentences, and paragraphs in real time with Flesch readability scores and keyword density analysis.',
    applicationCategory: 'UtilityApplication',
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
        name: 'Word Counter',
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
        name: 'How is reading time and speaking time estimated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Reading time is calculated based on the average adult reading speed of 225 words per minute (WPM). Speaking time is estimated at a standard conversational presentation pace of 130 WPM.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does the Flesch Reading Ease score mean?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The Flesch Reading Ease score rates text from 0 to 100. Higher scores (60-100) indicate plain, accessible English that is easy for the general public to read. Lower scores (0-50) indicate complex academic or technical material.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is my text stored or sent to any remote server?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Toolino Word Counter operates 100% locally in your web browser. Your text, articles, essays, and notes are never uploaded or saved to any external database.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I check character limits for social media platforms like Twitter, Instagram, and LinkedIn?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! The Social Media & SEO Limits tab tracks character counts against limits for Twitter/X (280), Instagram (2,200), LinkedIn (3,000), Pinterest (500), and Google SEO titles and meta descriptions.',
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
      <WordCounter />

      {/* Educational & SEO Content Section */}
      <section className="bg-white border-t border-slate-200/80 py-16">
        <Container>
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Step-by-Step Workflow Guide */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Real-Time Text Analytics
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                How to Analyze Text with Toolino Word Counter
              </h2>
              <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
                Whether writing an essay, crafting a tweet, or auditing SEO copy, Toolino gives you immediate deep text insights.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    1
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Type or Paste Text</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Enter your content into the clean text area. All word, character, and line metrics calculate instantly as you type.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    2
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Audit Readability & SEO</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Check your Flesch Reading Ease score, inspect 1-word to 3-word keyword density tables, and track social media length limits.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    3
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Transform & Export</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Switch between Title Case, uppercase, or camelCase, clean extra spaces, and copy formatted text or full statistical reports.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">
                Why Writers, Students & Marketers Prefer Toolino Word Counter
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">100% Private In-Browser Execution</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Your unpublished draft, proprietary manuscript, or confidential email never leaves your device. Everything calculates in local browser memory.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Flesch-Kincaid Readability Index</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Gauge sentence complexity, average word length, and school reading level to ensure your message is clear and compelling.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Hash className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Keyword Density & N-Gram Analyzer</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Identify overused words and optimize keyword density for search engines with 1-word, 2-word, and 3-word phrase frequency tables.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Type className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">One-Click Case & Formatting Tools</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Convert between Title Case, UPPERCASE, lowercase, camelCase, snake_case, and kebab-case, or clean duplicate blank lines in one click.
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
                    How is reading time and speaking time estimated?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Reading time is calculated based on the average adult reading speed of 225 words per minute (WPM). Speaking time is estimated at a standard conversational presentation pace of 130 WPM.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    What does the Flesch Reading Ease score mean?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    The Flesch Reading Ease score rates text from 0 to 100. Higher scores (60-100) indicate plain, accessible English that is easy for the general public to read. Lower scores (0-50) indicate complex academic or technical material.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Is my text stored or sent to any remote server?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    No. Toolino Word Counter operates 100% locally in your web browser. Your text, articles, essays, and notes are never uploaded or saved to any external database.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Can I check character limits for social media platforms like Twitter, Instagram, and LinkedIn?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Yes! The Social Media & SEO Limits tab tracks character counts against limits for Twitter/X (280), Instagram (2,200), LinkedIn (3,000), Pinterest (500), and Google SEO titles and meta descriptions.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Tools Internal Links */}
            <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-3xl p-8 border border-blue-100">
              <h3 className="text-base font-bold text-slate-900">Explore More Free Tools</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Boost your productivity with Toolino's suite of free privacy-first web tools.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/image-to-text"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Image to Text (OCR)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/image-converter"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Image Converter</span>
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
