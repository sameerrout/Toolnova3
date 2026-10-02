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
      'Professional reducing-balance loan EMI calculator with interactive sliders, principal-versus-interest visual breakdown, and complete monthly/yearly amortization schedules.',
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
        name: 'Utility & Financial Tools',
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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is an Equated Monthly Installment (EMI)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'An Equated Monthly Installment (EMI) is a fixed payment amount made by a borrower to a lender at a specified date each calendar month. EMIs apply to both interest and principal each month so that over a specified number of years, the loan is fully paid off.',
        },
      },
      {
        '@type': 'Question',
        name: 'What mathematical formula is used to calculate reducing-balance EMI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The standard reducing-balance formula is: EMI = P × r × (1 + r)^n ÷ ((1 + r)^n - 1), where P is Principal loan amount, r is monthly interest rate (annual interest rate ÷ 12 ÷ 100), and n is loan tenure in total months.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does loan tenure affect total interest paid?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A longer tenure lowers your monthly EMI payment but significantly increases total cumulative interest paid over the life of the loan. Conversely, a shorter tenure increases monthly payments but saves substantial money on interest.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is an Amortization Schedule?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'An amortization schedule is an itemized table listing each periodic loan payment. It details how much of every payment goes toward paying off the principal balance versus servicing accrued interest, along with the remaining balance after each cycle.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does this calculator store my loan or financial data?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. All calculations are executed 100% locally in your client browser. Toolino never uploads, stores, or transmits your loan amounts, interest rates, or financial parameters to any remote server.',
        },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <EmiCalculator />
    </>
  );
}
