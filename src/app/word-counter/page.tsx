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
    </>
  );
}
