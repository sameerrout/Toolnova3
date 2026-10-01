import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Maximize2,
  Sliders,
  Layers,
} from 'lucide-react';
import { ImageResizer } from '@/components/tools/ImageResizer';
import { Container } from '@/components/common/Container';

export const metadata: Metadata = {
  title: 'Free Image Resizer Online - Resize Photos in Pixels & Ratio | Toolino',
  description:
    'Resize JPG, PNG, WEBP, and AVIF images online for free. Adjust dimensions in pixels or percentage with aspect ratio lock and social media presets. 100% private.',
  alternates: {
    canonical: 'https://toolnova.com/image-resizer',
  },
  openGraph: {
    title: 'Free Image Resizer Online - Toolino',
    description:
      'Resize images in pixels, percentage, or social media presets with aspect ratio lock directly in your browser.',
    url: 'https://toolnova.com/image-resizer',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function ImageResizerPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/image-resizer`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Image Resizer - Toolino',
    url: pageUrl,
    description:
      'Resize JPG, PNG, WEBP, and AVIF images by pixels, percentage, and presets with aspect ratio locking.',
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
        name: 'Image Resizer',
        item: pageUrl,
      },
    ],
  };

  const faqs = [
    {
      q: 'How do I lock or unlock the aspect ratio?',
      a: 'Click the padlock icon between the width and height inputs. When locked, changing the width automatically updates the height proportionally to prevent image stretching or distortion.',
    },
    {
      q: 'What presets are available?',
      a: 'We provide presets for Instagram (Square 1080×1080, Story 1080×1920, Portrait 1080×1350), YouTube (Thumbnail 1280×720, Banner 2560×1440), LinkedIn, WhatsApp, Full HD (1920×1080), and standard square icons (100×100 to 500×500).',
    },
    {
      q: 'Will resizing my image reduce its quality?',
      a: 'Downscaling an image to smaller dimensions preserves crisp details and reduces file size. If you upscale an image larger than its original resolution, Toolino will display an "Upscaled" warning so you are aware of potential softening.',
    },
    {
      q: 'Can I resize multiple images at once?',
      a: 'Yes. You can upload multiple images simultaneously, apply common dimensions or percentage scaling across all photos, and download them individually or as a single ZIP file.',
    },
    {
      q: 'Are my images uploaded to any server?',
      a: 'No. Resizing is performed 100% client-side inside your browser sandbox using hardware-accelerated Canvas. Your files remain completely private on your local device.',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
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

      {/* Main Interactive Tool Component */}
      <ImageResizer />

      {/* Educational & SEO Content Section */}
      <section className="bg-white border-t border-slate-200/80 py-16">
        <Container size="lg">
          <div className="max-w-4xl mx-auto space-y-16">
            {/* 1. How It Works Section */}
            <div>
              <div className="text-center mb-10">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  Step-by-Step
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  How to Resize Images Online
                </h2>
                <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                  Adjust image dimensions in pixels or percentage without losing visual sharpness.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                    1
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Upload Photos</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Select or drag-and-drop one or multiple JPG, PNG, WEBP, or AVIF files into the upload box.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                    2
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Set Dimensions</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Type exact pixel width and height, choose percentage scaling, or select a pre-made social media preset.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                    3
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Download Results</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Download resized images individually or save all modified images in a single ZIP package.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Key Architectural Features */}
            <div>
              <div className="text-center mb-10">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Capabilities
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  Precise Resizing Controls
                </h2>
                <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                  Engineered for social media creators, web developers, and document workflows.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-3 mb-3">
                    <Maximize2 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Aspect Ratio Locking</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Avoid distorted portraits or squished graphics. Keep proportional dimensions with automatic height recalculation when width changes.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-3 mb-3">
                    <Sliders className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Social Media Presets</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Instant one-click sizing for Instagram posts and stories, YouTube thumbnails and channel banners, LinkedIn profiles, and WhatsApp avatars.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-3 mb-3">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Batch Processing</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Resize entire photo galleries in one go. Export results as individual files or bundle them in a lightweight ZIP archive.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Private &amp; Secure</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Zero data transmission. All canvas drawing and pixel operations execute directly in your web browser.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. FAQ Section */}
            <div>
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                  Common Questions
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 shadow-2xs"
                  >
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2.5 mb-2">
                      <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{faq.q}</span>
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed pl-6.5">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Related Tools */}
            <div className="border-t border-slate-200 pt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Related Tools</h3>
                  <p className="text-xs text-slate-500">
                    Explore complementary image tools on Toolino.
                  </p>
                </div>
                <Link
                  href="/image-tools"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>View All Image Tools</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Link
                  href="/image-compressor"
                  className="group bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full inline-block mb-2">
                      Popular
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Image Compressor
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Reduce image file sizes by up to 90% with target size controls.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-blue-600">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <Link
                  href="/image-to-pdf"
                  className="group bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-100/60 px-2 py-0.5 rounded-full inline-block mb-2">
                      PDF Suite
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Image to PDF
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Convert JPG, PNG, and WebP images into a single customized PDF document.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-blue-600">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <Link
                  href="/tools/pdf-to-image"
                  className="group bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full inline-block mb-2">
                      High-DPI
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      PDF to Image
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Extract pages from your PDF documents into high-resolution PNG or JPG images.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-blue-600">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
