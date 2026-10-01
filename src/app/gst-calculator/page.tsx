import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { GstCalculator } from '@/components/tools/GstCalculator';
import { Container } from '@/components/common/Container';
import {
  Receipt,
  Building2,
  Globe2,
  ArrowRight,
  ShieldCheck,
  Percent,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'GST Calculator - Calculate CGST, SGST & IGST (Add or Remove GST) | Toolino',
  description:
    'Free online GST calculator for India. Add or remove GST from prices, calculate 5%, 12%, 18%, 28% slabs, and break down Intra-State CGST/SGST vs Inter-State IGST.',
  keywords: [
    'gst calculator',
    'online gst calculator',
    'calculate gst',
    'add gst calculator',
    'remove gst calculator',
    'cgst sgst calculator',
    'igst calculator',
    'gst calculation formula',
    'gst tax rate india',
  ],
  alternates: {
    canonical: 'https://toolnova.com/gst-calculator',
  },
  openGraph: {
    title: 'GST Calculator - Calculate CGST, SGST & IGST | Toolino',
    description:
      'Fast client-side GST tax calculator for India. Add or remove GST with intra-state and inter-state tax breakdowns.',
    url: 'https://toolnova.com/gst-calculator',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function GstCalculatorPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/gst-calculator`;

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Toolino GST Calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    description:
      'Online Goods and Services Tax (GST) calculator for Indian commerce supporting GST-inclusive and GST-exclusive pricing with automatic CGST, SGST, and IGST breakdowns.',
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
        name: 'Utility & Tax Tools',
        item: `${baseUrl}/utility-tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'GST Calculator',
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
        name: 'What is the formula to Add GST to a net base price?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'To add GST (exclusive mode): GST Amount = Base Amount × (GST Rate ÷ 100). The total invoice amount is Base Amount + GST Amount. For example, on ₹10,000 at 18% GST, GST is ₹1,800 and total is ₹11,800.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the formula to Remove GST from a gross price?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'To remove GST (inclusive mode): Base Amount = Gross Amount ÷ (1 + (GST Rate ÷ 100)). The GST portion is Gross Amount - Base Amount. For example, on a ₹11,800 total at 18% GST, base is ₹11,800 ÷ 1.18 = ₹10,000, and GST is ₹1,800.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the difference between CGST, SGST, and IGST?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For intra-state transactions (buyer and seller in the same state), GST is split equally between the Central Government (CGST) and State Government (SGST). For inter-state transactions (across state borders), Integrated GST (IGST) is levied in full.',
        },
      },
      {
        '@type': 'Question',
        name: 'What are the current standard GST rate slabs in India?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The primary GST tax slabs are 0% (essential food grains), 3% (gold and precious jewelry), 5% (household essentials and economy flights), 12% (processed foods and electronics), 18% (most IT services, restaurants, and telecom), and 28% (luxury vehicles and sin goods).',
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
          <span className="text-slate-800 font-semibold">GST Calculator</span>
        </nav>

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            India Goods &amp; Services Tax
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            GST Calculator
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Easily compute GST-inclusive and GST-exclusive prices for invoices, bills, and tax returns with automatic CGST, SGST, and IGST breakdowns.
          </p>
        </div>

        {/* Interactive Tool Component */}
        <GstCalculator />

        {/* Educational Section & Internal Links */}
        <div className="max-w-4xl mx-auto mt-20 pt-12 border-t border-slate-200/80 space-y-16">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Understanding Indian GST: CGST, SGST, and IGST
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Under India&apos;s dual GST framework, both the Central and State Governments levy taxes concurrently. Determining whether a supply is intra-state or inter-state is essential for issuing compliant tax invoices.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Intra-State Supply</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When the location of the supplier and place of supply are in the same State or Union Territory. The GST rate is divided 50/50 between Central GST (CGST) and State GST (SGST).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Inter-State Supply</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When the supplier and place of supply are in different States or Union Territories. The entire tax is levied as Integrated GST (IGST) collected by the Central Government.
                </p>
              </div>
            </div>
          </div>

          {/* Related Tools Internal Linking */}
          <div className="bg-slate-100/70 rounded-3xl border border-slate-200 p-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Explore Companion Financial Calculators</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
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
                href="/discount-calculator"
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                    Discount Calculator
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Stacked sales deals</p>
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
                  <p className="text-[10px] text-slate-400 mt-0.5">Exact age in seconds</p>
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
                  How does reverse GST calculation work?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When a sticker price includes GST, dividing by (1 + rate/100) extracts the exact net base price before tax was added.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Are GST calculations logged or tracked?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No. All calculations run client-side on your local device. Toolino never collects, logs, or transmits financial transaction figures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
