import React from 'react';
import { Metadata } from 'next';
import { GstCalculator } from '@/components/tools/GstCalculator';

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
        name: 'Calculators',
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

      <GstCalculator />
    </>
  );
}
