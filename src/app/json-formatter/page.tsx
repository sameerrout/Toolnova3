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
      <JsonFormatter />
    </>
  );
}
