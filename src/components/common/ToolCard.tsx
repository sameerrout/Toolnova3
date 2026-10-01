import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { CatalogTool } from '@/data/toolsCatalog';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils/cn';
import { CLEAN_TOOL_URLS } from '@/app/sitemap';

interface ToolCardProps {
  tool: CatalogTool;
  className?: string;
}

export function ToolCard({ tool, className }: ToolCardProps) {
  const isAvailable = tool.isAvailable;
  const href = isAvailable ? (CLEAN_TOOL_URLS[tool.id] || `/tools/${tool.id}`) : '#';

  const cardContent = (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-xs transition-all duration-200',
        isAvailable
          ? 'border-slate-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
          : 'border-slate-200/80 bg-slate-50/50 opacity-80',
        className
      )}
    >
      <div>
        {/* Header row: Icon */}
        <div className="mb-4">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl',
              isAvailable
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                : 'bg-slate-200 text-slate-500'
            )}
          >
            <FileText className="h-5 w-5" />
          </div>
        </div>

        {/* Tool Name & Description */}
        <h3
          className={cn(
            'text-base font-bold tracking-tight text-slate-900 transition-colors',
            isAvailable && 'group-hover:text-blue-600'
          )}
        >
          {tool.name}
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">
          {tool.description}
        </p>

        {/* Formats row */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Formats:</span>
          {tool.inputFormats.map((fmt) => (
            <span
              key={fmt}
              className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
            >
              {fmt}
            </span>
          ))}
          <span>&rarr;</span>
          {tool.outputFormats.map((fmt) => (
            <span
              key={fmt}
              className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-blue-700"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>

      {/* Footer / Action row */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
        {isAvailable ? (
          <span className="inline-flex items-center gap-1 text-blue-600 group-hover:text-blue-700 group-hover:gap-1.5 transition-all">
            <span>Open Tool</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="text-slate-400 font-normal">On Roadmap</span>
        )}

        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Private</span>
        </div>
      </div>
    </div>
  );

  if (!isAvailable) {
    return cardContent;
  }

  return (
    <Link href={href} className="block">
      {cardContent}
    </Link>
  );
}

