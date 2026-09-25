import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-12 border-t border-blue-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
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
        </div>

        {/* Implemented Tools Column 2 */}
        <div className="space-y-2">
          <h3 className="font-bold mb-4 text-white text-base">Security &amp; Formats</h3>
          <Link href="/tools/protect-pdf" className="block text-blue-200 hover:text-white transition">
            Protect PDF
          </Link>
          <Link href="/tools/unlock-pdf" className="block text-blue-200 hover:text-white transition">
            Unlock PDF
          </Link>
          <Link href="/tools/watermark-pdf" className="block text-blue-200 hover:text-white transition">
            Watermark PDF
          </Link>
          <Link href="/tools/pdf-page-numbers" className="block text-blue-200 hover:text-white transition">
            PDF Page Numbers
          </Link>
          <Link href="/tools/pdf-to-word" className="block text-blue-200 hover:text-white transition">
            PDF to Word
          </Link>
          <Link href="/tools/word-to-pdf" className="block text-blue-200 hover:text-white transition">
            Word to PDF
          </Link>
          <Link href="/tools/pdf-to-powerpoint" className="block text-blue-200 hover:text-white transition">
            PDF to PowerPoint
          </Link>
          <Link href="/tools/powerpoint-to-pdf" className="block text-blue-200 hover:text-white transition">
            PowerPoint to PDF
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
            All 17 Tools Catalog
          </Link>
        </div>

        {/* Privacy & Security */}
        <div className="space-y-3 col-span-2 md:col-span-1">
          <h3 className="font-bold text-white text-base">Privacy &amp; Security</h3>
          <p className="text-xs text-blue-200 leading-relaxed">
            Choose from browser-based tools and server-powered conversions. ToolNova selects the appropriate processing method for each tool. Server-assisted jobs use isolated temporary sandboxes with automated cleanup.
          </p>
          <div className="inline-block rounded-md bg-blue-800/90 border border-blue-700 px-3 py-1 text-xs text-emerald-300 font-semibold">
            🛡️ Ephemeral &amp; In-Browser Security
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-blue-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-300 gap-3">
        <p>© 2026 ToolNova. All rights reserved.</p>
        <p className="text-blue-400">Created by Sameer Rout &amp; Sampangi Sony</p>
      </div>
    </footer>
  );
}
