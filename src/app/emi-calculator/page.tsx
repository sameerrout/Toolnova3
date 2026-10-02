import React from 'react';
import { Metadata } from 'next';
import { EmiCalculator } from '@/components/tools/EmiCalculator';

export const metadata: Metadata = {
  title: 'EMI Calculator - Home Loan, Car Loan & Personal Loan EMI | Toolino',
  description:
    'Free online loan EMI calculator with complete amortization schedule. Calculate monthly EMI, total interest, and repayment timeline for home, car, personal, and education loans.',
  keywords: [
    'emi calculator',
    'loan emi calculator',
    'home loan emi calculator',
    'car loan emi calculator',
    'personal loan emi calculator',
    'education loan emi',
    'amortization schedule',
    'reducing balance emi formula',
    'loan interest calculator',
  ],
  alternates: {
    canonical: 'https://toolnova.com/emi-calculator',
  },
  openGraph: {
    title: 'EMI Calculator - Loan EMI & Amortization Schedule | Toolino',
    description:
      'Calculate monthly EMI, interest breakdown, and repayment schedules for home, car, and personal loans with zero server tracking.',
    url: 'https://toolnova.com/emi-calculator',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function EmiCalculatorPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/emi-calculator`;

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Toolino EMI Calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Interactive reducing-balance loan EMI calculator with complete monthly and annual amortization schedules for home, car, and personal loans.',
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
        name: 'EMI Calculator',
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      {/* Schema.org injections */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <EmiCalculator />
    </>
  );
}
