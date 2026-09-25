import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Image as ImageIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';

export const metadata: Metadata = {
  title: 'Image Conversion & Processing Tools | Toolnova',
  description:
    'Convert images to PDF, extract PDF pages to high-resolution PNG/JPG ZIP packages, and transform image files directly in your browser.',
  alternates: {
    canonical: 'https://toolnova.com/image-tools',
  },
};

export default function ImageToolsPage() {
  const imageTools = TOOLS_CATALOG.filter(
    (t) => t.isAvailable && (t.id === 'image-to-pdf' || t.id === 'pdf-to-image')
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
          <span className="font-semibold text-slate-900">Image Tools</span>
        </nav>

        {/* Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Image & Graphics Suite
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            Image Conversion Tools
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Convert JPG, PNG, and WEBP graphics to unified PDF documents or extract multi-page PDFs to image packages.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {imageTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.id}`}
              className="group bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {tool.badge || 'Verified'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {tool.name}
                </h2>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                <span>Open Tool</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
