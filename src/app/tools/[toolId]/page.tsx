import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ToolRunner } from '@/components/tools/ToolRunner';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';
import { getToolSeoData } from '@/data/toolsSeoContent';
import { getToolCanonicalUrl } from '@/app/sitemap';

interface ToolPageProps {
  params: Promise<{
    toolId: string;
  }>;
}

export async function generateStaticParams() {
  return TOOLS_CATALOG.filter((t) => t.isAvailable).map((tool) => ({
    toolId: tool.id,
  }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { toolId } = await params;
  const tool = TOOLS_CATALOG.find((t) => t.id === toolId);

  if (!tool) {
    return {
      title: 'Tool Not Found | Toolino',
    };
  }

  const seo = getToolSeoData(tool.id, tool.name, tool.description);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = getToolCanonicalUrl(tool.id, baseUrl);

  return {
    title: seo.title,
    description: seo.metaDescription,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: seo.title,
      description: seo.metaDescription,
      url: pageUrl,
      siteName: 'Toolino',
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.metaDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolId } = await params;

  const tool = TOOLS_CATALOG.find((t) => t.id === toolId);
  if (!tool || !tool.isAvailable) {
    notFound();
  }

  const seo = getToolSeoData(tool.id, tool.name, tool.description);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = getToolCanonicalUrl(tool.id, baseUrl);

  // Structured Data (JSON-LD) (§37)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    url: pageUrl,
    description: tool.description,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
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
        name: tool.category === 'pdf' ? 'PDF Tools' : 'Tools',
        item: `${baseUrl}/${tool.category === 'pdf' ? 'pdf-tools' : ''}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: tool.name,
        item: pageUrl,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: seo.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <>
      {/* Schema.org Injections */}
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

      {/* Educational sections are completely omitted across tools to keep clean, focused application UI:
          toolId !== 'split-pdf' && toolId !== 'rotate-pdf' && toolId !== 'watermark-pdf' && toolId !== 'pdf-page-numbers' && toolId !== 'organize-pdf' && toolId !== 'compress-pdf' */}
      <ToolRunner toolId={toolId} />
    </>
  );
}
