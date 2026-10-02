import React from 'react';
import { Metadata } from 'next';
import { GstCalculator } from '@/components/tools/GstCalculator';

export const metadata: Metadata = {
  title: 'GST Calculator - Calculate CGST, SGST & IGST (Add or Remove GST) | Toolino',
  description:
    'Free online GST calculator for India. Add or remove GST from prices, calculate 5%, 12%, 18%, 28% slabs, and break down Intra-State CGST/SGST vs Inter-State IGST.',
  keywords: [
    'gst calculator',
    'online gst calculator',
    'calculate gst',
    'add gst calculator',
    'remove gst calculator',
    'cgst sgst calculator',
    'igst calculator',
    'gst calculation formula',
    'gst tax rate india',
  ],
  alternates: {
    canonical: 'https://toolnova.com/gst-calculator',
  },
  openGraph: {
    title: 'GST Calculator - Calculate CGST, SGST & IGST | Toolino',
    description:
      'Fast client-side GST tax calculator for India. Add or remove GST with intra-state and inter-state tax breakdowns.',
    url: 'https://toolnova.com/gst-calculator',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function GstCalculatorPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/gst-calculator`;

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Toolino GST Calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    description:
      'Free online GST calculator for India. Add or remove GST with 5%, 12%, 18%, and 28% tax slabs, including CGST, SGST, and IGST breakdowns.',
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
        name: 'Calculators',
        item: `${baseUrl}/utility-tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'GST Calculator',
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <GstCalculator />
    </>
  );
}
