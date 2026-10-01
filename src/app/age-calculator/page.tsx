import React from 'react';
import { Metadata } from 'next';
import { AgeCalculator } from '@/components/tools/AgeCalculator';
import { Container } from '@/components/common/Container';
import Link from 'next/link';

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
    'how old am i'
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
        name: 'Tools',
        item: 'https://toolnova.com/pdf-tools',
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
    <div className="min-h-screen bg-slate-50/50 py-10">
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

      <Container size="lg">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-slate-500 flex items-center space-x-2">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/pdf-tools" className="hover:text-blue-600 transition">
            Tools
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Age Calculator</span>
        </nav>

        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Free Online Chronological Calculator
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Age Calculator
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Calculate your exact age in years, months, days, minutes, and seconds. View your upcoming birthday countdown, astrological signs, lifetime milestones, and business date differences.
          </p>
        </div>

        {/* Interactive Tool Component */}
        <AgeCalculator />

        {/* Comprehensive SEO & Educational Section */}
        <div className="max-w-4xl mx-auto mt-20 pt-12 border-t border-slate-200/80 space-y-16">
          {/* Guide Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Understanding Chronological Age &amp; Date Calculations
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Chronological age represents the exact time elapsed since an individual's birth. Unlike simple yearly subtraction (which may yield inaccurate month or day counts depending on whether your birthday has passed this year), Toolino's engine executes calendar-aware arithmetic that honors the dynamic length of every Gregorian month (including 28/29-day Februarys).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl mb-2">🎂</div>
                <h3 className="font-bold text-slate-900 text-sm">Exact Birthday Countdown</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Accurately tracks how many days, hours, and minutes remain until your next birthday anniversary, including the day of the week it will fall on.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl mb-2">♈</div>
                <h3 className="font-bold text-slate-900 text-sm">Western &amp; Lunar Zodiac</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Instantly correlates your date of birth with traditional Western astrological signs and Chinese lunar zodiac animal cycles.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl mb-2">💼</div>
                <h3 className="font-bold text-slate-900 text-sm">Business Days Difference</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Compute duration between project deadlines, contracts, or events, separating working days (Monday-Friday) from weekend days.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  How does leap year impact age calculations?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Leap years add a 29th day to February every 4 years (with century exceptions). Our engine evaluates calendar month bounds dynamically, ensuring users born on February 29th receive appropriate anniversary schedules and day counts.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Can I determine my age on a specific future retirement date?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Yes. Switch the "Calculate Age On" date to your target milestone date (e.g., retirement day in 2040) to instantly see your exact years, months, and days at that future milestone.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  How are heartbeats and breaths estimated?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lifetime estimates are calculated based on standard biological averages: ~80 resting beats per minute for heart rate and ~16 breaths per minute for respiratory rate over your total days lived.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Are my personal dates private?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  100% private. All processing occurs locally within your browser's JavaScript engine. No dates, times, or personal profiles are transmitted to any server.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
