import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PdfSummarizer } from '@/components/tools/PdfSummarizer';
import { Container } from '@/components/common/Container';

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
      'Private in-browser PDF summarizer with instant executive summaries, key takeaways, and custom length controls.',
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
        name: 'Tools',
        item: `${baseUrl}/utility-tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'PDF Summarizer',
        item: pageUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      {/* Schema.org Injections */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Container size="xl">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-slate-500 flex items-center space-x-2">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/utility-tools" className="hover:text-blue-600 transition">
            Tools
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">PDF Summarizer</span>
        </nav>

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Free Private Document Summarizer
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            PDF Summarizer
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Summarize lengthy reports, academic papers, contracts, and ebooks in seconds. Extract executive summaries, bulleted key takeaways, and action items with complete privacy.
          </p>
        </div>

        {/* Interactive Tool Component */}
        <PdfSummarizer />
      </Container>
    </div>
  );
}
