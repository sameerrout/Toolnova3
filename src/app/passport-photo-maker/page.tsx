import React from 'react';
import { Metadata } from 'next';
import { PassportPhotoMaker } from '@/components/tools/PassportPhotoMaker';

export const metadata: Metadata = {
  title: 'Free Passport Photo Maker Online - US, UK, Schengen, India, Canada | Toolino',
  description:
    'Create compliant biometric passport and visa photos online for free. Official US 2x2 inch, UK/EU 35x45mm, India, Canada, and Australia standards. Biometric alignment guide and printable 4x6" photo sheet.',
  alternates: {
    canonical: 'https://toolnova.com/passport-photo-maker',
  },
  openGraph: {
    title: 'Free Online Passport Photo Maker - Toolino',
    description:
      'Create official passport and visa photos directly in your browser with biometric alignment guides and printable 4x6" photo sheets.',
    url: 'https://toolnova.com/passport-photo-maker',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function PassportPhotoMakerPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/passport-photo-maker`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Passport Photo Maker - Toolino',
    url: pageUrl,
    description:
      'Create compliant biometric passport and visa photos online for free. Official standards for US, UK, Schengen, India, Canada, and Australia with 4x6" print sheet.',
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
        name: 'Passport Photo Maker',
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
      <PassportPhotoMaker />
    </>
  );
}
