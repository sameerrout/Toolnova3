'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/common/Container';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Technical detail logged only to internal console, not exposed in UI (§51)
    console.error('Toolnova runtime boundary caught error:', error);
  }, [error]);

  return (
    <Container size="sm" className="py-20">
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          An unexpected issue interrupted your operation. Your files and data
          remain safe on your device.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
          >
            <Home className="h-4 w-4 text-slate-500" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </Container>
  );
}

