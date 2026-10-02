import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ToolRegistryEntry } from '@/data/toolRegistry';
import { toolPath } from '@/lib/tools';
import { CATEGORY_META } from '@/data/categories';
import { cn } from '@/lib/utils/cn';

/**
 * Tool card used on the homepage, the category hubs and the all-tools index.
 *
 * Plain `<Link>` + text: no images, no icons per card, no client JavaScript.
 * Cards are the largest repeated element on the homepage, so keeping them cheap
 * is what holds the initial bundle under the budget.
 */
export function ToolCard({
  tool,
  showCategory = false,
  className,
}: {
  tool: ToolRegistryEntry;
  showCategory?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={toolPath(tool.slug)}
      className={cn(
        'group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-800">
          {tool.name}
        </h3>
        {tool.badge ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {tool.badge}
          </span>
        ) : null}
      </div>

      <p className="mt-2 flex-1 text-sm text-slate-600">{tool.tagline}</p>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-500">
          {showCategory ? CATEGORY_META[tool.category].navLabel : tool.outputFormats.join(' · ')}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
          Open
          <ArrowRight
            aria-hidden="true"
            className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
