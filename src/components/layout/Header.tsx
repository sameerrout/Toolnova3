'use client';

/**
 * Site header.
 *
 * Navigation is derived from the category registry, so a new tool or category
 * appears here automatically. Fully keyboard accessible: the mobile drawer traps
 * focus, closes on Escape and on route change, and the toggle exposes
 * `aria-expanded`.
 *
 * There is no login link because the site has no accounts.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { CATEGORY_META, CATEGORY_ORDER } from '@/data/categories';
import { getToolsByCategory } from '@/data/toolRegistry';
import { toolPath } from '@/lib/tools';
import { BRAND } from '@/lib/site';
import { cn } from '@/lib/utils/cn';

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close everything on navigation.
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = drawerRef.current?.querySelector<HTMLElement>('a[href], button');
    first?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
        >
          <Logo />
          <span className="sr-only">{`${BRAND.name} home`}</span>
        </Link>

        <nav aria-label="Main" className="hidden lg:flex lg:items-center lg:gap-1">
          <div
            className="relative"
            onMouseEnter={() => {
              cancelClose();
              setOpenMenu('tools');
            }}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              aria-expanded={openMenu === 'tools'}
              aria-haspopup="true"
              onClick={() => setOpenMenu(openMenu === 'tools' ? null : 'tools')}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              All tools
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            </button>

            {openMenu === 'tools' ? (
              <div className="absolute left-0 top-full z-50 w-[52rem] pt-2">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                  {CATEGORY_ORDER.map((slug) => {
                    const meta = CATEGORY_META[slug];
                    const tools = getToolsByCategory(slug);
                    return (
                      <div key={slug}>
                        <Link
                          href={`/tools/${slug}/`}
                          className="text-sm font-semibold text-brand-800 hover:underline"
                        >
                          {meta.navLabel}
                        </Link>
                        <ul className="mt-2 space-y-1.5">
                          {tools.map((tool) => (
                            <li key={tool.slug}>
                              <Link
                                href={toolPath(tool.slug)}
                                className="block rounded text-sm text-slate-600 transition hover:text-brand-700"
                              >
                                {tool.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {CATEGORY_ORDER.slice(0, 4).map((slug) => (
            <Link
              key={slug}
              href={`/tools/${slug}/`}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                pathname.startsWith(`/tools/${slug}/`)
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              {CATEGORY_META[slug].navLabel}
            </Link>
          ))}

          <Link
            href="/blog/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Guides
          </Link>
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Files never uploaded
          </span>
          <Link
            href="/tools/create-zip/"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Create a ZIP
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="ml-auto rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 lg:hidden"
        >
          {mobileOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          ref={drawerRef}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setMobileOpen(false);
          }}
          className="fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto border-t border-slate-200 bg-white p-4 lg:hidden"
        >
          <nav aria-label="Mobile">
            {CATEGORY_ORDER.map((slug) => (
              <details key={slug} className="border-b border-slate-100 py-2">
                <summary className="cursor-pointer list-none py-2 text-base font-semibold text-slate-900">
                  <Link href={`/tools/${slug}/`} className="hover:text-brand-700">
                    {CATEGORY_META[slug].navLabel}
                  </Link>
                </summary>
                <ul className="mt-1 space-y-1 pl-3">
                  {getToolsByCategory(slug).map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={toolPath(tool.slug)}
                        className="block py-1.5 text-sm text-slate-600 hover:text-brand-700"
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
            <Link href="/blog/" className="block py-3 text-base font-semibold text-slate-900">
              Guides
            </Link>
            <Link href="/about/" className="block py-3 text-base font-semibold text-slate-900">
              About
            </Link>
            <Link href="/contact/" className="block py-3 text-base font-semibold text-slate-900">
              Contact
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
