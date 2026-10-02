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
    </>
  );
}
