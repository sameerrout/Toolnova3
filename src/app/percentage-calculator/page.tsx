import React from 'react';
import { Metadata } from 'next';
import { PercentageCalculator } from '@/components/tools/PercentageCalculator';

export const metadata: Metadata = {
  title: 'Percentage Calculator - Calculate Percentages, Discounts, Tips & Margin | Toolino',
  description:
    'Free multi-mode percentage calculator. Quickly calculate X% of Y, percentage increase/decrease, retail discounts, sales tax, restaurant tips, bill splitting, and gross profit margin.',
  keywords: [
    'percentage calculator',
    'percent calculator',
    'calculate percentage increase',
    'percentage decrease calculator',
    'discount calculator',
    'tip calculator',
    'profit margin calculator',
    'markup calculator',
    'what percent of'
  ],
  alternates: {
    canonical: 'https://toolnova.com/percentage-calculator',
  },
  openGraph: {
    title: 'Percentage Calculator - Discounts, Tips, Margin & Changes | Toolino',
    description:
      'Free, instantaneous percentage calculator. Covers basic percentages, percentage change, discounts, tips, and profit margins with step-by-step formula breakdowns.',
    url: 'https://toolnova.com/percentage-calculator',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function PercentageCalculatorPage() {
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Toolino Percentage Calculator',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Multi-mode financial and mathematical percentage calculator with step-by-step breakdowns for discounts, tips, margin, and percentage change.',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://toolnova.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tools',
        item: 'https://toolnova.com/pdf-tools',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Percentage Calculator',
        item: 'https://toolnova.com/percentage-calculator',
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the formula to calculate percentage increase?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Percentage Increase = ((New Value - Old Value) / |Old Value|) × 100%.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the difference between margin and markup?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Gross Margin is profit as a percentage of revenue: ((Revenue - Cost) / Revenue) × 100%. Markup is profit as a percentage of original cost: ((Price - Cost) / Cost) × 100%.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I calculate double discounts during sales?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Consecutive discounts are applied sequentially, not added together. Toolino calculates sequential compounding accurately.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is my calculation data saved or transmitted?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. All calculations occur locally in your web browser. No financial numbers or inputs are transmitted.',
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

      <PercentageCalculator />
    </>
  );
}
