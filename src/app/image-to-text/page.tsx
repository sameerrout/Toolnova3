import React from 'react';
import { Metadata } from 'next';
import { ImageToText } from '@/components/tools/ImageToText';

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
      <ImageToText />
    </>
  );
}
