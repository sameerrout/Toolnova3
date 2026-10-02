import React from 'react';
import { Metadata } from 'next';
import { BackgroundRemover } from '@/components/tools/BackgroundRemover';

export const metadata: Metadata = {
  title: 'Free Background Remover Online - Remove BG in 1-Click | Toolino',
  description:
    'Remove image backgrounds instantly online for free. Transparent PNG cutouts, custom solid and gradient backgrounds, edge feathering, and 100% private client-side processing.',
  alternates: {
    canonical: 'https://toolnova.com/background-remover',
  },
  openGraph: {
    title: 'Free Online Background Remover - Toolino',
    description:
      'Remove image backgrounds instantly in your browser with zero data uploads. Clean cutouts, transparent PNGs, and custom studio backgrounds.',
    url: 'https://toolnova.com/background-remover',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function BackgroundRemoverPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/background-remover`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Background Remover - Toolino',
    url: pageUrl,
    description:
      'Remove image backgrounds instantly online for free. 100% private in-browser cutout generator with color replacement and edge feathering.',
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
        name: 'Background Remover',
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
      <BackgroundRemover />
    </>
  );
}
