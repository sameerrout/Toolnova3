import React from 'react';
import { Metadata } from 'next';
import { AgeCalculator } from '@/components/tools/AgeCalculator';

export const metadata: Metadata = {
  title: 'Age Calculator - Exact Chronological Age, Birthday Countdown & Milestones | Toolino',
  description:
    'Calculate your exact chronological age in years, months, days, hours, and seconds. Discover your next birthday countdown, zodiac sign, birth day of week, and date difference calculations instantly.',
  keywords: [
    'age calculator',
    'chronological age calculator',
    'exact age in days',
    'birthday countdown',
    'date difference calculator',
    'calculate age from date of birth',
    'working days calculator',
    'zodiac calculator',
    'how old am i',
  ],
  alternates: {
    canonical: 'https://toolnova.com/age-calculator',
  },
  openGraph: {
    title: 'Age Calculator - Chronological Age & Birthday Countdown | Toolino',
    description:
      'Free, instant chronological age calculator. Calculate exact age in years, months, days, minutes, and seconds. Includes next birthday countdown and astrology signs.',
    url: 'https://toolnova.com/age-calculator',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function AgeCalculatorPage() {
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Toolino Age Calculator',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Fast, precise chronological age and date difference calculator with next birthday countdown, time units, and astrological analysis.',
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
        name: 'Calculators',
        item: 'https://toolnova.com/utility-tools',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Age Calculator',
        item: 'https://toolnova.com/age-calculator',
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How is chronological age calculated precisely?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Chronological age is calculated by finding the exact difference between your date of birth and the target date (or current moment). The calculation takes into account varying days per month (28, 29, 30, or 31) and leap years, ensuring that month and day counts match standard legal definitions.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I calculate what my age will be on a future date?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Simply change the "Calculate Age On" field to any future date (such as a retirement date, college graduation, or milestone anniversary) to see your exact age on that day.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the Date Difference Calculator mode?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The Date Difference tab allows you to calculate the duration between any two arbitrary dates. It provides total calendar days, business/working days (Monday through Friday), weekend days, and weeks.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is my birth date stored or transmitted anywhere?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. All calculations are executed 100% locally in your web browser. No dates or personal metrics are ever sent to a server or recorded in any database.',
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

      <AgeCalculator />
    </>
  );
}
