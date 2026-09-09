'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Sparkles, Zap, ArrowRight, Lock } from 'lucide-react';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';

// Emojis for all 16 active tools
const TOOL_ICONS: Record<string, string> = {
  'image-to-pdf': '🖼️',
  'merge-pdf': '📑',
  'split-pdf': '✂️',
  'rotate-pdf': '🔄',
  'watermark-pdf': '💧',
  'pdf-page-numbers': '🔢',
  'organize-pdf': '📋',
  'unlock-pdf': '🔓',
  'compress-pdf': '🗜️',
  'edit-pdf': '✏️',
  'pdf-to-image': '📸',
  'protect-pdf': '🔒',
  'pdf-to-word': '📝',
  'word-to-pdf': '📄',
  'pdf-to-powerpoint': '📊',
  'powerpoint-to-pdf': '📽️',
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Filter only real, implemented tools
  const activeTools = TOOLS_CATALOG.filter((t) => t.isAvailable);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/pdf-tools?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/pdf-tools');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      {/* Hero Section with animated gradient, entrance effects, and floating badges */}
      <section className="relative text-white py-20 sm:py-28 overflow-hidden hero-gradient">
        <style jsx>{`
          .hero-gradient {
            background: linear-gradient(270deg, #1d4ed8, #2563eb, #3b82f6, #60a5fa, #2563eb);
            background-size: 600% 600%;
            animation: bgMove 14s ease infinite;
          }
          @keyframes bgMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes floatFast {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
          .floating-badge-1 {
            animation: floatSlow 5s ease-in-out infinite;
          }
          .floating-badge-2 {
            animation: floatFast 4s ease-in-out infinite 1s;
          }
          .floating-badge-3 {
            animation: floatSlow 6s ease-in-out infinite 2s;
          }
        `}</style>

        {/* Floating Decorative Badges */}
        <div className="hidden lg:block absolute top-12 left-10 z-10 floating-badge-1">
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md shadow-sm">
            <Lock className="h-3.5 w-3.5 text-emerald-300" />
            <span>Zero Server Uploads</span>
          </div>
        </div>

        <div className="hidden lg:block absolute bottom-16 left-16 z-10 floating-badge-2">
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md shadow-sm">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            <span>Instant Local Processing</span>
          </div>
        </div>

        <div className="hidden lg:block absolute top-16 right-12 z-10 floating-badge-3">
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-200" />
            <span>100% Client-Side Privacy</span>
          </div>
        </div>

        {/* Background wave SVG */}
        <div className="absolute bottom-0 left-0 w-full opacity-20 pointer-events-none">
          <svg viewBox="0 0 1440 320" className="w-full h-auto">
            <path
              fill="#ffffff"
              fillOpacity="0.3"
              d="M0,224L80,218.7C160,213,320,203,480,192C640,181,800,171,960,186.7C1120,203,1280,245,1360,266.7L1440,288L1440,320L0,320Z"
            />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          {/* Tag pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/40 bg-white/15 px-4 py-1 text-xs font-semibold text-white backdrop-blur-xs mb-6 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Private &bull; Fast &bull; Free In-Browser Tools</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-xs">
            All-in-One Free Online Tools
          </h1>

          <p className="mb-10 text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Convert, edit, and optimize PDFs and documents easily. All files stay on your device with 100% client-side execution.
          </p>

          <form onSubmit={handleSearch} className="flex justify-center max-w-2xl mx-auto">
            <div className="flex w-full bg-white rounded-2xl shadow-2xl overflow-hidden p-1 border border-white/40 transition-all focus-within:ring-4 focus-within:ring-blue-400/40">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-3.5 text-gray-700 focus:outline-hidden text-sm sm:text-base placeholder-gray-400"
                placeholder="Search implemented tools (e.g. Image to PDF, Merge, Split)..."
              />
              <button
                type="submit"
                className="bg-blue-600 px-6 sm:px-8 py-3 text-white font-semibold rounded-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer text-sm sm:text-base shadow-sm shrink-0"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Explore Our Tools Section (ONLY real implemented tools) */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
              Explore Our Tools
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Select any of our available client-side tools to get started instantly
            </p>
          </div>

          {/* Grid of ONLY implemented tools */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTools.map((tool) => (
              <Link key={tool.id} href={`/tools/${tool.id}`} className="group block">
                <div className="h-full bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl p-2.5 rounded-xl bg-slate-50 group-hover:bg-blue-50 transition">
                        {TOOL_ICONS[tool.id] || '📄'}
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        100% Local
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-2 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                    <span>Use Tool</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tools Section */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-t border-slate-200 pt-12">
            <h2 className="text-xl font-bold mb-8 text-gray-800">
              Popular Tools
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
              {activeTools
                .filter((t) => t.isPopular || ['image-to-pdf', 'merge-pdf', 'split-pdf', 'watermark-pdf', 'compress-pdf'].includes(t.id))
                .slice(0, 5)
                .map((tool) => (
                  <Link key={tool.id} href={`/tools/${tool.id}`}>
                    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 text-center hover:shadow-lg hover:-translate-y-1 transition duration-200 cursor-pointer h-full flex flex-col items-center justify-center">
                      <div className="text-3xl mb-2">{TOOL_ICONS[tool.id] || '📄'}</div>
                      <div className="text-xs font-bold text-gray-800 line-clamp-1">{tool.name}</div>
                      <span className="inline-block mt-2 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        Ready
                      </span>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
