import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { DiscountCalculator } from '@/components/tools/DiscountCalculator';
import { Container } from '@/components/common/Container';
import {
  Tag,
  Layers,
  ArrowRight,
  TrendingDown,
  ShoppingBag,
  Percent,
  Receipt,
  HelpCircle,
} from 'lucide-react';

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

      <Container size="xl">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-slate-500 flex items-center space-x-2">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/utility-tools" className="hover:text-blue-600 transition">
            Tools
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Discount Calculator</span>
        </nav>

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Free Online Shopping Calculator
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Discount Calculator
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Quickly calculate sale prices, total savings, stacked sequential promotions, and reverse tag pricing with client-side speed.
          </p>
        </div>

        {/* Interactive Tool Component */}
        <DiscountCalculator />

        {/* Educational Section & Internal Links */}
        <div className="max-w-4xl mx-auto mt-20 pt-12 border-t border-slate-200/80 space-y-16">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Shopping Smart: Understanding Promotional Pricing &amp; Stacked Deals
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Retailers frequently market sales using layered discounts (e.g. &ldquo;30% off clearance plus extra 15% off at checkout&rdquo;). Understanding how sequential reductions compound helps shoppers verify receipts and evaluate true bargain value.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <Tag className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Single Percentage Off</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Direct percentage reductions from the sticker price with optional regional sales tax.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <Layers className="w-8 h-8 text-indigo-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Sequential Stacking</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Compound multi-stage promotional codes calculated progressively rather than incorrectly added together.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <ShoppingBag className="w-8 h-8 text-emerald-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Reverse Tag Pricing</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Identify original pre-sale catalog prices when only the discounted receipt total is known.
                </p>
              </div>
            </div>
          </div>

          {/* Related Tools Internal Linking */}
          <div className="bg-slate-100/70 rounded-3xl border border-slate-200 p-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Explore Related Financial Calculators</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <Link
                href="/percentage-calculator"
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                    Percentage Calculator
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Increases &amp; margins</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/gst-calculator"
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                    GST Calculator
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Add or remove GST tax</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/emi-calculator"
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                    EMI Calculator
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Loans &amp; amortization</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/age-calculator"
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                    Age Calculator
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Exact chronological age</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* FAQs */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  What is the difference between stacked and added discounts?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Added discounts add percentages directly (20% + 10% = 30%), whereas stacked discounts calculate the second discount on the already-reduced price (yielding an effective 28% discount).
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Can I calculate multiple quantities at once?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Yes, enter the quantity to calculate total savings and total checkout price across multiple units instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
