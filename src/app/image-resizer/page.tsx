import React from 'react';
import { Metadata } from 'next';
import { ImageResizer } from '@/components/tools/ImageResizer';

export const metadata: Metadata = {
  title: 'Free Image Resizer Online - Resize Photos in Pixels & Ratio | Toolino',
  description:
    'Resize JPG, PNG, WEBP, and AVIF images online for free. Adjust dimensions in pixels or percentage with aspect ratio lock and social media presets. 100% private.',
  alternates: {
    canonical: 'https://toolnova.com/image-resizer',
  },
  openGraph: {
    title: 'Free Image Resizer Online - Toolino',
    description:
      'Resize images in pixels, percentage, or social media presets with aspect ratio lock directly in your browser.',
    url: 'https://toolnova.com/image-resizer',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function ImageResizerPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/image-resizer`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Image Resizer - Toolino',
    url: pageUrl,
    description:
      'Resize JPG, PNG, WEBP, and AVIF images by pixels, percentage, and presets with aspect ratio locking.',
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
        name: 'Image Resizer',
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
      <ImageResizer />
    </>
  );
}
