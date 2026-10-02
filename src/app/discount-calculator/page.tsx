import React from 'react';
import { Metadata } from 'next';
import { DiscountCalculator } from '@/components/tools/DiscountCalculator';

export const metadata: Metadata = {
  title: 'Discount Calculator - Calculate Percentage Off, Sale Price & Stacked Deals | Toolino',
  description:
    'Free online discount calculator. Calculate sale prices, exact savings, stacked sequential discounts (e.g. 20% + 10% off), reverse discounts, and sales tax.',
  keywords: [
    'discount calculator',
    'percentage off calculator',
    'sale price calculator',
    'stacked discount calculator',
    'sequential discounts',
    'reverse discount calculator',
    'how to calculate discount',
    'shopping savings calculator',
  ],
  alternates: {
    canonical: 'https://toolnova.com/discount-calculator',
  },
  openGraph: {
    title: 'Discount Calculator - Sale Price & Stacked Discounts | Toolino',
    description:
      'Fast client-side discount calculator. Calculate single and stacked discounts, reverse list prices, and sales tax instantly.',
    url: 'https://toolnova.com/discount-calculator',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function DiscountCalculatorPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/discount-calculator`;

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Toolino Discount Calculator',
    applicationCategory: 'ShoppingApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Fast client-side discount calculator for single and stacked discounts, sales tax, and reverse original prices.',
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
        name: 'Tools',
        item: `${baseUrl}/utility-tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Discount Calculator',
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

      <DiscountCalculator />
    </>
  );
}
