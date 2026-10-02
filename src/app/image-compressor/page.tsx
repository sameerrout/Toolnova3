import React from 'react';
import { Metadata } from 'next';
import { ImageCompressor } from '@/components/tools/ImageCompressor';

export const metadata: Metadata = {
  title: 'Free Image Compressor Online - Compress JPG, PNG, WebP | Toolino',
  description:
    'Compress JPG, PNG, WEBP, and AVIF images online for free without losing quality. 100% private, client-side browser compression with target file size controls.',
  alternates: {
    canonical: 'https://toolnova.com/image-compressor',
  },
  openGraph: {
    title: 'Free Image Compressor Online - Toolino',
    description:
      'Compress JPG, PNG, WEBP, and AVIF images directly in your browser. Fast, secure, and private.',
    url: 'https://toolnova.com/image-compressor',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function ImageCompressorPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/image-compressor`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Image Compressor - Toolino',
    url: pageUrl,
    description:
      'Compress JPG, PNG, WEBP, and AVIF images directly in your browser with quality and target size controls.',
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
        name: 'Image Compressor',
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      {/* Schema.org Injections */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Main Interactive Tool Component */}
      <ImageCompressor />
    </>
  );
}
