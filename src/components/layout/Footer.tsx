'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  // Hide footer on all tool pages
  const isToolPage =
    pathname?.startsWith('/tools/') ||
    pathname?.includes('image-to-pdf') ||
    pathname?.includes('merge-pdf') ||
    pathname?.includes('pdf-merger') ||
    pathname?.includes('split-pdf') ||
    pathname?.includes('pdf-splitter') ||
    pathname?.includes('rotate-pdf') ||
    pathname?.includes('pdf-rotator') ||
    pathname?.includes('watermark-pdf') ||
    pathname?.includes('pdf-page-numbers') ||
    pathname?.includes('organize-pdf') ||
    pathname?.includes('pdf-organizer') ||
    pathname?.includes('compress-pdf') ||
    pathname?.includes('pdf-compressor') ||
    pathname?.includes('pdf-to-image') ||
    pathname?.includes('qr-code-generator') ||
    pathname?.includes('qr-generator') ||
    pathname?.includes('image-compressor') ||
    pathname?.includes('image-resizer') ||
    pathname?.includes('resize-image') ||
    pathname?.includes('edit-pdf') ||
    pathname?.includes('pdf-editor') ||
    pathname?.includes('protect-pdf') ||
    pathname?.includes('pdf-protect') ||
    pathname?.includes('pdf-to-powerpoint') ||
    pathname?.includes('pdf-to-pptx') ||
    pathname?.includes('background-remover') ||
    pathname?.includes('image-converter') ||
    pathname?.includes('convert-image') ||
    pathname?.includes('image-to-text') ||
    pathname?.includes('image-ocr') ||
    pathname?.includes('passport-photo-maker') ||
    pathname?.includes('passport-photo') ||
    pathname?.includes('passport-maker') ||
    pathname?.includes('word-counter') ||
    pathname?.includes('json-formatter') ||
    pathname?.includes('age-calculator') ||
    pathname?.includes('percentage-calculator') ||
    pathname?.includes('emi-calculator') ||
    pathname?.includes('discount-calculator') ||
    pathname?.includes('gst-calculator') ||
    pathname?.includes('pdf-summarizer');

  if (isToolPage) {
    return null;
  }

  return (
    <footer className="bg-blue-900 text-white py-12 border-t border-blue-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-sm">
        {/* Implemented Tools Column 1 */}
        <div className="space-y-2">
          <h3 className="font-bold mb-4 text-white text-base">PDF Creation &amp; Edit</h3>
          <Link href="/tools/image-to-pdf" className="block text-blue-200 hover:text-white transition">
            Image to PDF
          </Link>
          <Link href="/tools/merge-pdf" className="block text-blue-200 hover:text-white transition">
            Merge PDF
          </Link>
          <Link href="/tools/split-pdf" className="block text-blue-200 hover:text-white transition">
            Split PDF
          </Link>
          <Link href="/tools/rotate-pdf" className="block text-blue-200 hover:text-white transition">
            Rotate PDF
          </Link>
          <Link href="/tools/organize-pdf" className="block text-blue-200 hover:text-white transition">
            Organize PDF
          </Link>
          <Link href="/tools/compress-pdf" className="block text-blue-200 hover:text-white transition">
            Compress PDF
          </Link>
          <Link href="/tools/edit-pdf" className="block text-blue-200 hover:text-white transition">
            Edit PDF
          </Link>
          <Link href="/tools/pdf-to-image" className="block text-blue-200 hover:text-white transition">
            PDF to Image
          </Link>
          <Link href="/pdf-summarizer" className="block text-blue-200 hover:text-white transition font-medium">
            PDF Summarizer
          </Link>
        </div>

        {/* Implemented Tools Column 2 */}
        <div className="space-y-2">
          <h3 className="font-bold mb-4 text-white text-base">Security &amp; Formats</h3>
          <Link href="/tools/protect-pdf" className="block text-blue-200 hover:text-white transition">
            Protect PDF
          </Link>
          <Link href="/tools/watermark-pdf" className="block text-blue-200 hover:text-white transition">
            Watermark PDF
          </Link>
          <Link href="/tools/pdf-page-numbers" className="block text-blue-200 hover:text-white transition">
            PDF Page Numbers
          </Link>
          <Link href="/tools/pdf-to-powerpoint" className="block text-blue-200 hover:text-white transition">
            PDF to PowerPoint
          </Link>
          <Link href="/image-compressor" className="block text-blue-200 hover:text-white transition font-medium">
            Image Compressor
          </Link>
          <Link href="/image-resizer" className="block text-blue-200 hover:text-white transition font-medium">
            Image Resizer
          </Link>
          <Link href="/background-remover" className="block text-blue-200 hover:text-white transition font-medium">
            Background Remover
          </Link>
          <Link href="/image-converter" className="block text-blue-200 hover:text-white transition font-medium">
            Image Converter
          </Link>
          <Link href="/passport-photo-maker" className="block text-blue-200 hover:text-white transition font-medium">
            Passport Photo Maker
          </Link>
          <Link href="/image-to-text" className="block text-blue-200 hover:text-white transition font-medium">
            Image to Text (OCR)
          </Link>
          <Link href="/word-counter" className="block text-blue-200 hover:text-white transition font-medium">
            Word Counter
          </Link>
          <Link href="/json-formatter" className="block text-blue-200 hover:text-white transition font-medium">
            JSON Formatter
          </Link>
          <Link href="/age-calculator" className="block text-blue-200 hover:text-white transition font-medium">
            Age Calculator
          </Link>
          <Link href="/percentage-calculator" className="block text-blue-200 hover:text-white transition font-medium">
            Percentage Calculator
          </Link>
          <Link href="/emi-calculator" className="block text-blue-200 hover:text-white transition font-medium">
            EMI Calculator
          </Link>
          <Link href="/discount-calculator" className="block text-blue-200 hover:text-white transition font-medium">
            Discount Calculator
          </Link>
          <Link href="/gst-calculator" className="block text-blue-200 hover:text-white transition font-medium">
            GST Calculator
          </Link>
        </div>

        {/* Platform & Account */}
        <div className="space-y-2">
          <h3 className="font-bold mb-4 text-white text-base">Navigation</h3>
          <Link href="/" className="block text-blue-200 hover:text-white transition">
            Home
          </Link>
          <Link href="/about" className="block text-blue-200 hover:text-white transition">
            About Us
          </Link>
          <Link href="/login" className="block text-blue-200 hover:text-white transition">
            Login
          </Link>
          <Link href="/signup" className="block text-blue-200 hover:text-white transition">
            Sign Up
          </Link>
          <Link href="/pdf-tools" className="block text-blue-200 hover:text-white transition">
            All Tools Catalog
          </Link>
        </div>
      </div>

      {/* Bottom */}
      <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-blue-800/80 flex items-center justify-between text-xs text-blue-300">
        <p>© 2026 Toolino. All rights reserved.</p>
      </div>
    </footer>
  );
}
