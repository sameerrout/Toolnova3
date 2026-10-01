import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Sliders,
  ArrowLeftRight,
} from 'lucide-react';
import { ImageConverter } from '@/components/tools/ImageConverter';
import { Container } from '@/components/common/Container';

export const metadata: Metadata = {
  title: 'Free Image Converter Online - Convert JPG, PNG, WEBP, AVIF, BMP, ICO | Toolino',
  description:
    'Convert images between JPG, PNG, WEBP, AVIF, BMP, and ICO formats online for free. Batch conversion, transparency preservation, quality settings, and 100% private in-browser processing.',
  alternates: {
    canonical: 'https://toolnova.com/image-converter',
  },
  openGraph: {
    title: 'Free Online Image Converter - Toolino',
    description:
      'Convert images between JPG, PNG, WEBP, AVIF, BMP, and ICO formats directly in your browser with zero data uploads.',
    url: 'https://toolnova.com/image-converter',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function ImageConverterPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/image-converter`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Image Converter - Toolino',
    url: pageUrl,
    description:
      'Convert images between JPG, PNG, WEBP, AVIF, BMP, and ICO formats online for free. 100% private in-browser batch processing.',
    applicationCategory: 'MultimediaApplication',
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
        name: 'Image Tools',
        item: `${baseUrl}/image-tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Image Converter',
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
        name: 'Which image formats can I convert between?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can convert images between JPG/JPEG, PNG, WEBP, AVIF, BMP, and ICO formats. Inputs include JPG, PNG, WEBP, AVIF, BMP, GIF, SVG, TIFF, and ICO.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does converting PNG to WEBP keep the transparent background?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! WEBP fully supports alpha transparency, and Toolino preserves transparency completely during conversion.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are my images uploaded to any remote server?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Conversions occur 100% locally on your computer or smartphone using HTML5 Canvas and browser Web APIs. Your images are never sent to external servers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I convert multiple images at once and download as a ZIP file?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, you can queue dozens of images, set custom formats or a global target format, batch process them in parallel, and download everything as a single ZIP archive.',
        },
      },
    ],
  };

  return (
    <>
      {/* Structured Data Script Tags */}
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

      {/* Main Tool Application */}
      <ImageConverter />

      {/* Educational & SEO Content Section */}
      <section className="bg-white border-t border-slate-200/80 py-16">
        <Container>
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Step-by-Step Workflow Guide */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Quick 3-Step Process
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                How to Convert Image Formats Online
              </h2>
              <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
                Transform any image file into web-optimized WEBP, lossless PNG, lightweight JPG, or website favicon ICO in seconds.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    1
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Upload Images</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Drag and drop or select one or multiple photos in JPG, PNG, WEBP, AVIF, BMP, GIF, or SVG formats.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    2
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Choose Output Format</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Select your target format globally or per image. Fine-tune quality sliders and matte background colors if needed.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    3
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Download Converted Files</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Click "Convert All" and download individual converted files or package all results into a single ZIP archive.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">
                Why Professionals Choose Toolino Image Converter
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">100% Private In-Browser Conversion</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Files are processed in memory using client-side Web APIs and HTML5 Canvas. Your sensitive graphic files are never sent across the internet.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Universal Format Support</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Easily transform between WEBP, PNG, JPG, AVIF, uncompressed BMP, and multi-size ICO favicon files.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Alpha Transparency Preservation</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Converting PNG to modern WEBP maintains full alpha transparency, while converting to JPG lets you choose a clean custom background fill color.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">High-Speed Batch Processing</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Convert dozens of images simultaneously with real-time progress indicators and instant 1-click ZIP archive packaging.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions (FAQ) */}
            <div className="pt-6 border-t border-slate-200/80">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Which image formats can I convert between?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    You can convert images between JPG/JPEG, PNG, WEBP, AVIF, BMP, and ICO formats. Inputs include JPG, PNG, WEBP, AVIF, BMP, GIF, SVG, TIFF, and ICO.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Does converting PNG to WEBP keep the transparent background?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Yes! WEBP fully supports alpha transparency, and Toolino preserves transparency completely during conversion.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Are my images uploaded to any remote server?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    No. Conversions occur 100% locally on your computer or smartphone using HTML5 Canvas and browser Web APIs. Your images are never sent to external servers.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Can I convert multiple images at once and download as a ZIP file?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Yes, you can queue dozens of images, set custom formats or a global target format, batch process them in parallel, and download everything as a single ZIP archive.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Tools Internal Links */}
            <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-3xl p-8 border border-blue-100">
              <h3 className="text-base font-bold text-slate-900">Explore More Free Image Tools</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Boost your workflow with Toolino's suite of free privacy-first web tools.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/image-compressor"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Image Compressor</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/image-resizer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Image Resizer</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/background-remover"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Background Remover</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/image-tools"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>All Image Tools</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
