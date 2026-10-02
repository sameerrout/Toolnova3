import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbEntry } from '@/lib/seo/schema';

/**
 * Visible breadcrumb navigation.
 *
 * Pairs with the `BreadcrumbList` JSON-LD emitted by each page: the markup and
 * the structured data must describe the same trail, and the last crumb is the
 * current page so it is not a link.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbEntry[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-600">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-x-1.5">
              {item.path && !isLast ? (
                <Link
                  href={item.path}
                  className="rounded transition hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  {item.name}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="font-medium text-slate-900">
                  {item.name}
                </span>
              )}
              {!isLast ? (
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
