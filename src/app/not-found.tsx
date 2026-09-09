import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/common/Container';

export default function NotFound() {
  return (
    <Container size="sm" className="py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-6">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Tool Not Found
      </h1>
      <p className="mt-3 text-sm text-slate-600 max-w-md mx-auto">
        The tool or page you requested could not be located. It may be planned
        for a future release or moved.
      </p>

      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
        <Link
          href="/pdf-tools"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Explore PDF Tools</span>
        </Link>
      </div>
    </Container>
  );
}

