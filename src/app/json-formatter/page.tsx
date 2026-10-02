import React from 'react';
import { Metadata } from 'next';
import { JsonFormatter } from '@/components/tools/JsonFormatter';

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
        name: 'Developer Tools',
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
    </>
  );
}
