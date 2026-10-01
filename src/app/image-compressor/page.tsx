import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sliders,
  FileCheck,
  Layers,
} from 'lucide-react';
import { ImageCompressor } from '@/components/tools/ImageCompressor';
import { Container } from '@/components/common/Container';

export const metadata: Metadata = {
  title: 'Free Image Compressor Online - Compress JPG, PNG, WebP | Toolino',
  description:
    'Compress JPG, PNG, WEBP, and AVIF images online for free without losing quality. 100% private, client-side browser compression with target file size controls.',
  alternates: {
    canonical: 'https://toolnova.com/image-compressor',
  },
  openGraph: {
    title: 'Free Image Compressor Online - Toolino',
    description:
      'Compress JPG, PNG, WEBP, and AVIF images directly in your browser. Fast, secure, and private.',
    url: 'https://toolnova.com/image-compressor',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function ImageCompressorPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/image-compressor`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Image Compressor - Toolino',
    url: pageUrl,
    description:
      'Compress JPG, PNG, WEBP, and AVIF images directly in your browser with quality and target size controls.',
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
        name: 'Image Compressor',
        item: pageUrl,
      },
    ],
  };

  const faqs = [
    {
      q: 'How does client-side image compression work in Toolino?',
      a: 'Toolino processes your images entirely inside your browser using hardware-accelerated HTML5 Canvas and modern Web APIs. The pixels are decoded and re-encoded locally with optimized quantization tables without ever uploading your files to an external server.',
    },
    {
      q: 'Which image formats are supported?',
      a: 'We support JPG, JPEG, PNG, WEBP, and AVIF (on compatible modern browsers). You can compress images in their original format or convert them to WebP or JPG during compression.',
    },
    {
      q: 'Can I compress multiple images simultaneously?',
      a: 'Yes. You can drag and drop multiple images at once, adjust global compression settings or target file sizes, and download all compressed files together in a convenient ZIP archive.',
    },
    {
      q: 'What is the "Target File Size" feature?',
      a: 'Target File Size allows you to specify a desired maximum file size (for example, 200 KB for an online portal or job application). The engine runs an iterative binary search to calculate the optimal quality and resolution needed to hit your target.',
    },
    {
      q: 'Is my data secure and private?',
      a: 'Absolutely. 100% of processing happens locally on your computer or mobile device. Toolino never transmits, stores, or inspects your photos or documents.',
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
      <ImageCompressor />

      {/* Educational & SEO Content Section */}
      <section className="bg-white border-t border-slate-200/80 py-16">
        <Container size="lg">
          <div className="max-w-4xl mx-auto space-y-16">
            {/* 1. How It Works Section */}
            <div>
              <div className="text-center mb-10">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  Simple Workflow
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  How to Compress Images in 3 Simple Steps
                </h2>
                <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                  Optimize your photographs and website graphics in seconds with zero complicated setup.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                    1
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Upload Images</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Drag and drop one or multiple JPG, PNG, WEBP, or AVIF photos into the upload zone or click to browse.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                    2
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Configure Compression</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Select a preset like Balanced (75%), customize the quality slider, or enter a strict target file size in KB.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                    3
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Preview &amp; Download</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Review your savings percentage and file size reductions, then download individual images or grab the entire ZIP package.
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
                  High-Performance Browser Architecture
                </h2>
                <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                  Built to deliver desktop-grade image compression without compromising data privacy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Zero Server Uploads</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    All image compression algorithms execute locally within your browser sandbox. Your personal photos, IDs, and graphics never touch external servers or cloud storage.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-3 mb-3">
                    <Sliders className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Target File Size Search</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Need an image under 100 KB or 200 KB for government forms or university applications? Enter your target and the engine adjusts quantization parameters automatically.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-3 mb-3">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Batch Processing &amp; ZIP Bundling</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Easily optimize dozens of photos at once. A single click bundles all compressed assets into a neatly organized ZIP archive.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Hardware Accelerated</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Leverages modern GPU-accelerated Canvas and Web Workers to process large 4K and 8K camera photos smoothly without freezing the browser interface.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. FAQ Section */}
            <div>
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                  Got Questions?
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

            {/* 4. Related Image Tools */}
            <div className="border-t border-slate-200 pt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Related Tools</h3>
                  <p className="text-xs text-slate-500">
                    Explore complementary tools in the Toolino suite.
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
                  href="/image-to-pdf"
                  className="group bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full inline-block mb-2">
                      Popular
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
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-100/60 px-2 py-0.5 rounded-full inline-block mb-2">
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

                <Link
                  href="/tools/compress-pdf"
                  className="group bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full inline-block mb-2">
                      PDF Suite
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Compress PDF
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Reduce PDF document size while preserving crisp typography and vector assets.
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
