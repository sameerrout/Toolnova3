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
        name: 'How do you calculate percentage increase or decrease?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Percentage change is calculated using the formula: ((New Value - Original Value) ÷ Original Value) × 100. If the result is positive, it represents an increase; if negative, it is a decrease.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the difference between Profit Margin and Markup?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Profit Margin is the percentage of selling price that is profit: (Profit ÷ Selling Price) × 100. Markup is the percentage added on top of the cost: (Profit ÷ Cost) × 100. For example, an item costing $50 and selling for $100 has a 50% margin and a 100% markup.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the Discount and Sales Tax mode work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'First, the discount amount is deducted from the original price to determine the pre-tax price. Then, sales tax is applied to the discounted price to determine the final checkout total.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can this tool split dining bills and tips evenly?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Enter your bill amount, select your desired tip percentage (e.g. 15%, 18%, 20%), and set how many people are splitting the bill to see exact tip and total owed per person.',
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
