'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  ShieldCheck,
  Filter,
  ArrowLeft,
} from 'lucide-react';
import { Container } from '@/components/common/Container';
import { SearchBar } from '@/components/common/SearchBar';
import { ToolCard } from '@/components/common/ToolCard';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';

function PdfToolsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'popular'>('all');

  // Strictly filter only real, implemented tools
  const implementedTools = useMemo(() => {
    return TOOLS_CATALOG.filter((t) => t.isAvailable);
  }, []);

  const filteredTools = useMemo(() => {
    return implementedTools.filter((tool) => {
      // 1. Text Search Filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.inputFormats.some((fmt) => fmt.toLowerCase().includes(query)) ||
        tool.outputFormats.some((fmt) => fmt.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Tab Filter
      if (activeFilter === 'popular') return tool.isPopular;

      return true;
    });
  }, [implementedTools, searchQuery, activeFilter]);

  return (
    <div className="py-10 md:py-16 bg-gray-50 min-h-screen">
      <Container size="xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900">PDF Tools</span>
        </div>

        {/* Category Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <FileText className="h-3.5 w-3.5" />
              <span>Available Tools ({implementedTools.length})</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              PDF &amp; Document Tools
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Fast, privacy-focused online tools for your daily document tasks.
              Convert, merge, split, rotate, watermark, stamp page numbers, and organize your PDFs with browser processing and secure server conversion.
            </p>
          </div>

          {/* Privacy badge */}
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 self-start md:self-auto">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">Verified Privacy &amp; Security</p>
              <p className="text-[11px] text-emerald-700">Browser execution &amp; ephemeral sandboxes</p>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search bar */}
          <div className="w-full sm:max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search available tools (e.g. Image to PDF, Merge, Split)..."
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Active Tools ({implementedTools.length})
            </button>
            <button
              onClick={() => setActiveFilter('popular')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'popular'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Popular Tools
            </button>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="mt-8">
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Filter className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No tools found</h3>
              <p className="text-xs text-slate-500 mt-1">
                No tools matched your search for &quot;{searchQuery}&quot;. Try another search term.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="mt-4 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Clear search filter
              </button>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

export default function PdfToolsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-400">Loading tools...</div>}>
      <PdfToolsContent />
    </Suspense>
  );
}
