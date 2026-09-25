import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { QrCode, ArrowLeft, ArrowRight } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';

export const metadata: Metadata = {
  title: 'QR Code Generators & Barcode Tools | Toolnova',
  description:
    'Free online QR Code generator tools. Create customized QR codes for website URLs, Wi-Fi passwords, contact cards, emails, and phone numbers in SVG & PNG.',
  alternates: {
    canonical: 'https://toolnova.com/qr-tools',
  },
};

export default function QrToolsPage() {
  const qrTools = TOOLS_CATALOG.filter(
    (t) => t.isAvailable && t.id === 'qr-code-generator'
  );

  return (
    <div className="py-10 md:py-16 bg-gray-50 min-h-screen">
      <Container size="xl">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900">QR Tools</span>
        </nav>

        {/* Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Barcode & QR Suite
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            QR Code Generator & Tools
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Generate high-resolution vector and raster QR codes client-side with zero network latency and complete privacy.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="max-w-2xl mx-auto">
          {qrTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.id}`}
              className="group bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    {tool.badge || 'Vector & Raster'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {tool.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                <span>Create QR Code Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
