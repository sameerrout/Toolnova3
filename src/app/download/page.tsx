'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Download, ArrowLeft } from 'lucide-react';

export default function DownloadPage() {
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 py-14 text-center text-white">
        <h1 className="text-4xl font-bold mb-2">Conversion Completed</h1>
        <p className="opacity-90 text-blue-100">
          Your file has been successfully converted
        </p>
      </section>

      {/* Download Box */}
      <div className="flex justify-center items-center mt-16 px-4">
        <div className="bg-white p-12 rounded-2xl shadow-xl text-center w-full max-w-[420px]">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600 stroke-[3]" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-gray-700">
            Your file is ready
          </h2>

          <p className="text-gray-500 mb-8 text-sm">
            Click the button below to download your converted file
          </p>

          <Link
            href="/pdf-tools"
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-lg font-semibold shadow-md transition-all cursor-pointer"
          >
            <Download className="h-5 w-5" />
            <span>Download File</span>
          </Link>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Convert another document</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

