import React from 'react';
import { Metadata } from 'next';
import { ImageConverter } from '@/components/tools/ImageConverter';

export const metadata: Metadata = {
  title: 'Free Image Converter Online - Convert JPG, PNG, WEBP, AVIF, BMP, ICO | Toolino',
  description:
    'Convert images between JPG, PNG, WEBP, AVIF, BMP, and ICO formats online for free. Batch conversion, transparency preservation, quality settings, and 100% private in-browser processing.',
  alternates: {
    canonical: 'https://toolnova.com/image-converter',
  },
  openGraph: {
    title: 'Free Online Image Converter - Toolino',
    description:
      'Convert images between JPG, PNG, WEBP, AVIF, BMP, and ICO formats directly in your browser with zero data uploads.',
    url: 'https://toolnova.com/image-converter',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function ImageConverterPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/image-converter`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Image Converter - Toolino',
    url: pageUrl,
    description:
      'Convert images between JPG, PNG, WEBP, AVIF, BMP, and ICO formats online for free. 100% private in-browser batch processing.',
    applicationCategory: 'MultimediaApplication',
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
        name: 'Image Converter',
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
        name: 'Which image formats can I convert between?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can convert images between JPG/JPEG, PNG, WEBP, AVIF, BMP, and ICO formats. Inputs include JPG, PNG, WEBP, AVIF, BMP, GIF, SVG, TIFF, and ICO.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does converting PNG to WEBP keep the transparent background?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! WEBP fully supports alpha transparency, and Toolino preserves transparency completely during conversion.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are my images uploaded to any remote server?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Conversions occur 100% locally on your computer or smartphone using HTML5 Canvas and browser Web APIs. Your images are never sent to external servers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I convert multiple images at once and download as a ZIP file?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, you can queue dozens of images, set custom formats or a global target format, batch process them in parallel, and download everything as a single ZIP archive.',
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
      <ImageConverter />
    </>
  );
}
