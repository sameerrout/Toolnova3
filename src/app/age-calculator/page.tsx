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
        name: 'How does leap year affect age calculations?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Toolino uses real Gregorian calendar rules. Leap years (with 366 days and Feb 29) are fully factored into day counts and date differences.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the difference between chronological age and gestational age?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Chronological age begins at birth. Gestational age starts from the first day of the mother’s last menstrual period.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are heartbeats and breaths estimated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Lifetime estimates are calculated based on standard biological averages: ~80 resting beats per minute for heart rate and ~16 breaths per minute for respiratory rate over your total days lived.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are my personal dates private?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '100% private. All processing occurs locally within your browser’s JavaScript engine. No dates, times, or personal profiles are transmitted to any server.',
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
