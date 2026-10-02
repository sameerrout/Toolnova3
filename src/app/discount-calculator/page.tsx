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
      'Comprehensive multi-mode discount calculator supporting percentage markdown, sequential stacked sales deals, reverse tag pricing, and regional sales tax.',
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
        name: 'Utility & Shopping Tools',
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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do you calculate a discount percentage?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'To calculate discount amount, multiply original price by discount percentage and divide by 100. Then subtract this discount amount from the original price to determine your final checkout total.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do stacked discounts (e.g. 20% off plus extra 10% off) work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Stacked discounts are applied sequentially, not added together. For example, on a ₹1,000 item, the first 20% discount lowers the price to ₹800. The second 10% discount is taken off ₹800 (giving ₹80 off), resulting in a final price of ₹720. That is an effective 28% total discount, not 30%.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is a reverse discount calculation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Reverse discount calculates what an item originally cost before a sale was applied. Formula: Original Price = Sale Price ÷ (1 - (Discount ÷ 100)). For example, if you paid ₹800 after a 20% discount, the original price was ₹800 ÷ 0.80 = ₹1,000.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can sales tax be included in the calculation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! In standard mode, enter your local sales tax rate to automatically see the post-discount taxable amount and final out-the-door checkout sum.',
        },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <DiscountCalculator />
    </>
  );
}
