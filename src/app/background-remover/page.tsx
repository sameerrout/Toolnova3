import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Palette,
  Sliders,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { BackgroundRemover } from '@/components/tools/BackgroundRemover';
import { Container } from '@/components/common/Container';

export const metadata: Metadata = {
  title: 'Free Background Remover Online - Remove BG in 1-Click | Toolino',
  description:
    'Remove image backgrounds instantly online for free. Transparent PNG cutouts, custom solid and gradient backgrounds, edge feathering, and 100% private client-side processing.',
  alternates: {
    canonical: 'https://toolnova.com/background-remover',
  },
  openGraph: {
    title: 'Free Online Background Remover - Toolino',
    description:
      'Remove image backgrounds instantly in your browser with zero data uploads. Clean cutouts, transparent PNGs, and custom studio backgrounds.',
    url: 'https://toolnova.com/background-remover',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function BackgroundRemoverPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/background-remover`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Background Remover - Toolino',
    url: pageUrl,
    description:
      'Remove image backgrounds instantly online for free. 100% private in-browser cutout generator with color replacement and edge feathering.',
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
        name: 'Background Remover',
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
        name: 'Are my photos uploaded to any external server?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. All image segmentation and background removal processes occur 100% locally within your web browser using HTML5 Canvas and offscreen matting algorithms. Your photos never leave your device.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I replace the background with a custom color or gradient?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! You can choose between transparent PNG cutouts, solid colors (including passport blue, studio white, or custom hex codes), and modern studio gradients.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I remove halos or fringes around hair and clothing edges?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use the Halo Removal slider (edge shift) to contract the mask by 1 to 3 pixels, and adjust the Edge Feathering slider to smoothly blend borders without pixelation.',
        },
      },
      {
        '@type': 'Question',
        name: 'What if certain background areas are not removed automatically?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use the Eyedropper tool to click on the leftover color, adjust the Color Tolerance slider, or use the interactive Erase brush to manually touch up any region.',
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
      <BackgroundRemover />

      {/* Educational & SEO Content Section */}
      <section className="bg-white border-t border-slate-200/80 py-16">
        <Container>
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Step-by-Step Workflow Guide */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Simple 3-Step Process
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                How to Remove Backgrounds from Any Image Online
              </h2>
              <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
                Toolino delivers studio-quality cutouts without expensive subscriptions or complicated design software.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    1
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Upload Your Photo</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Drag and drop your JPG, PNG, or WebP photo into the dropzone, or pick one of the sample images to test instantly.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    2
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Fine-Tune & Style</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Adjust tolerance and feathering sliders, sample colors with the eyedropper, or apply passport blue and studio white backdrops.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    3
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Download or Copy</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Download full-resolution transparent PNG cutouts or copy directly to your clipboard for instant pasting into Canva, Figma, or Word.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">
                Why Creators & Businesses Choose Toolino Background Remover
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">100% Private & In-Browser</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Unlike cloud services that send your personal portraits or confidential e-commerce products to third-party servers, Toolino executes all processing directly inside your browser sandbox.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Instant Background Replacement</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Switch effortlessly between transparent alpha cutouts, official passport blue/white studio backgrounds, and vibrant modern aesthetic gradients.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Edge Feathering & Halo Removal</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Eliminate unsightly white halos and rough pixelated borders with sub-pixel morphological erosion, despill filters, and smooth alpha blending.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Interactive Split Comparison & Touch-up</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Inspect your cutouts with an interactive Before / After slider. Use the precision touch-up eraser brush to fine-tune individual details.
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
                    Are my photos uploaded to any external server?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    No. All image segmentation and background removal processes occur 100% locally within your web browser using HTML5 Canvas and offscreen matting algorithms. Your photos never leave your device.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Can I replace the background with a custom color or gradient?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Yes! You can choose between transparent PNG cutouts, solid colors (including passport blue, studio white, or custom hex codes), and modern studio gradients.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    How do I remove halos or fringes around hair and clothing edges?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Use the Halo Removal slider (edge shift) to contract the mask by 1 to 3 pixels, and adjust the Edge Feathering slider to smoothly blend borders without pixelation.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    What if certain background areas are not removed automatically?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Use the Eyedropper tool to click on the leftover color, adjust the Color Tolerance slider, or use the interactive Erase brush to manually touch up any region.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Tools Internal Links */}
            <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-3xl p-8 border border-blue-100">
              <h3 className="text-base font-bold text-slate-900">Explore More Free Image Tools</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Boost your productivity with Toolino's suite of free privacy-first web tools.
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
