import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { ToolRunner } from '@/components/tools/ToolRunner';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';
import { getToolSeoData } from '@/data/toolsSeoContent';
import { Container } from '@/components/common/Container';
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

  const relatedToolItems = TOOLS_CATALOG.filter((t) =>
    seo.relatedTools.includes(t.id)
  );

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

      {/* Immediate Interactive Tool Runner */}
      <ToolRunner toolId={toolId} />

      {/* Other tools preserve their educational section; dedicated standalone tools are strictly focused application UI */}
      {toolId !== 'image-to-pdf' && toolId !== 'merge-pdf' && toolId !== 'split-pdf' && toolId !== 'pdf-to-image' && toolId !== 'rotate-pdf' && toolId !== 'edit-pdf' && toolId !== 'image-compressor' && toolId !== 'image-resizer' && toolId !== 'background-remover' && toolId !== 'image-converter' && toolId !== 'passport-photo-maker' && toolId !== 'image-to-text' && toolId !== 'word-counter' && toolId !== 'json-formatter' && toolId !== 'age-calculator' && toolId !== 'percentage-calculator' && toolId !== 'emi-calculator' && toolId !== 'discount-calculator' && toolId !== 'pdf-summarizer' && toolId !== 'gst-calculator' && (
        <section className="bg-slate-50/60 border-t border-slate-200/80 py-16">
          <Container size="lg">
            <div className="max-w-4xl mx-auto space-y-16">
              {/* 1. How It Works Section */}
              <div>
                <div className="text-center mb-10">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Simple Workflow
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                    How to Use {tool.name}
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                    Follow these simple steps to process your files in seconds with zero complicated setup.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {seo.howTo.map((item) => (
                    <div
                      key={item.step}
                      className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                        {item.step}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Key Features & Architectural Highlights */}
              <div>
                <div className="text-center mb-10">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    Capabilities
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                    High-Performance Architecture
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                    Engineered for stability, memory efficiency, and accurate file fidelity across all device types.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {seo.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3.5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs"
                    >
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">
                          {feat.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {feat.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Transparent Security & Privacy Model */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold tracking-wider uppercase text-emerald-300">
                      Data Integrity & Privacy
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3">
                    Zero Persistent Data Retention
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed mb-4">
                    Toolino prioritizes operational security. Client-side tools execute directly inside your browser memory. For complex conversions that require backend worker execution, files are processed in ephemeral, isolated sandboxes and automatically wiped immediately upon completion.
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-blue-200 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-300" /> Sandboxed Isolation
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Automatic File Purge
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-300" /> No Account Required
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Frequently Asked Questions */}
              <div>
                <div className="text-center mb-10">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    FAQ
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                    Frequently Asked Questions
                  </h2>
                </div>

                <div className="space-y-4">
                  {seo.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs"
                    >
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2.5 mb-2">
                        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{faq.q}</span>
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed pl-6.5">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Related Tools */}
              {relatedToolItems.length > 0 && (
                <div className="border-t border-slate-200 pt-12">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Related Document & PDF Tools
                      </h3>
                      <p className="text-xs text-slate-500">
                        Explore complementary tools in the Toolino platform suite.
                      </p>
                    </div>
                    <Link
                      href="/pdf-tools"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <span>View All Tools</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {relatedToolItems.map((rTool) => (
                      <Link
                        key={rTool.id}
                        href={`/tools/${rTool.id}`}
                        className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mb-2">
                            {rTool.badge || 'Fast'}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {rTool.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {rTool.description}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                          <span>Open Tool</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
