import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';

export const metadata: Metadata = {
  title: 'Document Conversion Tools - PDF to PowerPoint | Toolino',
  description:
    'Free high-fidelity document conversion tools. Convert PDF to PowerPoint online with guaranteed slide layout preservation.',
  alternates: {
    canonical: 'https://toolnova.com/document-tools',
  },
};

export default function DocumentToolsPage() {
  const documentTools = TOOLS_CATALOG.filter(
    (t) =>
      t.isAvailable &&
      (t.id === 'pdf-to-powerpoint')
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
          <span className="font-semibold text-slate-900">Document Tools</span>
        </nav>

        {/* Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Office Document Suite
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            Document Conversion Tools
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Transform PowerPoint presentations and PDFs with layout fidelity and zero persistent file retention.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {documentTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.id}`}
              className="group bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="mb-4">
                  <div className="inline-flex w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 items-center justify-center font-bold text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {tool.name}
                </h2>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                <span>Launch Converter</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
