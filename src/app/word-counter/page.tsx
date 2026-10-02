import React from 'react';
import { Metadata } from 'next';
import { WordCounter } from '@/components/tools/WordCounter';

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
        name: 'Tools',
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

      {/* Main Tool Application */}
      <WordCounter />
    </>
  );
}
