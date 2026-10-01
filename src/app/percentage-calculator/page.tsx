import React from 'react';
import { Metadata } from 'next';
import { PercentageCalculator } from '@/components/tools/PercentageCalculator';
import { Container } from '@/components/common/Container';
import Link from 'next/link';

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
          <span className="text-slate-800 font-semibold">Percentage Calculator</span>
        </nav>

        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Free Online Percentage Calculator
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Percentage Calculator
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Easily compute percentages, percentage changes, shopping discounts, restaurant tips with bill splitting, and business profit margins with step-by-step mathematical explanations.
          </p>
        </div>

        {/* Interactive Tool Component */}
        <PercentageCalculator />

        {/* Comprehensive SEO & Educational Section */}
        <div className="max-w-4xl mx-auto mt-20 pt-12 border-t border-slate-200/80 space-y-16">
          {/* Guide Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Mastering Percentage Calculations for Everyday Math &amp; Business
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Percentages are used universally across personal finance, retail shopping, business analytics, and school math. Understanding how percentages translate to decimals and proportions helps eliminate costly financial errors.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl mb-2">🏷️</div>
                <h3 className="font-bold text-slate-900 text-sm">Discounts &amp; Sales Tax</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Instantly calculate final checkout totals during promotional sales, accounting for percentage markdown and regional sales tax.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl mb-2">🍽️</div>
                <h3 className="font-bold text-slate-900 text-sm">Tips &amp; Bill Splitting</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Quickly split dining expenses among group friends with customized tip percentages and exact per-person contributions.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl mb-2">📈</div>
                <h3 className="font-bold text-slate-900 text-sm">Profit Margin vs. Markup</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Price e-commerce products properly by understanding the vital difference between gross margin (profit on revenue) and markup (profit on cost).
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
                  What is the formula to calculate X% of Y?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Convert the percentage into a decimal by dividing by 100, then multiply by the total value. For example, 20% of 150 is: (20 ÷ 100) × 150 = 0.20 × 150 = 30.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  How is percentage decrease calculated when a price drops?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Subtract the new lower price from the original price, divide by the original price, and multiply by 100. If a $100 item drops to $75, the decrease is ((100 - 75) ÷ 100) × 100 = 25%.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Why can profit margin never exceed 100%?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Profit margin is profit divided by selling price. Even if your cost is $0, profit equals selling price, making the maximum margin 100%. Markup, on the other hand, can exceed 100%, 200%, or more.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Are calculations executed privately?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Yes, 100% in your browser. No financial data, purchase amounts, or cost prices are sent over the internet or logged to any database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
