import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { EmiCalculator } from '@/components/tools/EmiCalculator';
import { Container } from '@/components/common/Container';
import {
  Calculator,
  Home,
  Car,
  User,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Percent,
  Receipt,
  HelpCircle,
} from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50/50 py-10">
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
          <span className="text-slate-800 font-semibold">EMI Calculator</span>
        </nav>

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Free Online Loan Calculator
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Loan EMI Calculator
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Instantly calculate monthly loan installments, principal-to-interest ratios, and comprehensive repayment schedules for Home, Car, Personal, and Education financing.
          </p>
        </div>

        {/* Interactive Tool Component */}
        <EmiCalculator />

        {/* ----------------------------------------------------------- */}
        {/* EDUCATIONAL & SEO GUIDE SECTION                             */}
        {/* ----------------------------------------------------------- */}
        <div className="max-w-4xl mx-auto mt-20 pt-12 border-t border-slate-200/80 space-y-16">
          {/* Guide Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Understanding Loan EMIs &amp; Reducing-Balance Interest
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              When borrowing money from banks or financial institutions, your loan is amortized through monthly payments. In reducing-balance loans, interest is calculated solely on the outstanding principal at the start of each month rather than the initial lump-sum loan amount.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-3">
                  <Home className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Home Loans</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Longer tenures (up to 30 years) keep monthly payments budget-friendly, making early prepayments an effective strategy to reduce total interest.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
                  <Car className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Car &amp; Vehicle Loans</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Medium-term tenures (3 to 7 years) prevent car depreciation from outpacing the remaining loan balance.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Personal Loans</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Shorter tenures (1 to 5 years) minimize interest accumulation on unsecured credit products with higher interest rates.
                </p>
              </div>
            </div>
          </div>

          {/* Related Tools Internal Linking Section */}
          <div className="bg-slate-100/70 rounded-3xl border border-slate-200 p-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Explore Related Financial Calculators</h3>
            <p className="text-xs text-slate-600">
              Toolino provides a suite of fast, client-side financial and utility calculators:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
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
                href="/percentage-calculator"
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                    Percentage Calculator
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Increases, margins &amp; tips</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/discount-calculator"
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                    Discount Calculator
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sequential &amp; stacked sales</p>
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
                  <p className="text-[10px] text-slate-400 mt-0.5">Exact age &amp; date interval</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  What is the difference between flat interest and reducing balance?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  In a flat-rate loan, interest is calculated on the entire original loan amount throughout the full tenure, making it much more expensive. In a reducing-balance loan, interest is recalculated only on the remaining balance each month.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Can I make prepayments to lower my monthly EMI?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Yes! Most lenders allow part-prepayments or foreclosure. When you make extra payments directly toward the principal balance, you can choose to either shorten your loan tenure or reduce your subsequent monthly EMI amount.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  How does the 0% interest calculation behave?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For zero-cost or 0% interest promotional financing schemes, total interest is 0. The monthly EMI simply equals your loan principal divided evenly across the total number of repayment months.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Are calculations executed privately on my device?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Yes, 100% client-side. No financial parameters, loan amounts, or personal income figures ever leave your computer or mobile device.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
