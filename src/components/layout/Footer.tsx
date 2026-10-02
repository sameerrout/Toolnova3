import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { BRAND, COPYRIGHT_YEAR } from '@/lib/site';
import { CATEGORY_META, CATEGORY_ORDER } from '@/data/categories';
import { getToolsByCategory } from '@/data/toolRegistry';
import { toolPath } from '@/lib/tools';
import { ConsentSettingsLink } from '@/components/consent/ConsentSettingsLink';

/**
 * Site footer.
 *
 * Always rendered, on every route. The previous design hid the footer on 29 of
 * 33 routes, which removed roughly forty internal links from exactly the pages
 * that needed them and left most tool pages with a single inbound link.
 *
 * It also carries the legal links AdSense review requires to be reachable from
 * anywhere on the site.
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <p className="text-lg font-bold text-slate-900">{BRAND.name}</p>
            <p className="mt-2 max-w-xs text-sm text-slate-600">{BRAND.description}</p>
            <p className="mt-4 inline-flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                No uploads. No accounts. Your files are processed by your own browser and never sent
                to a server.
              </span>
            </p>
          </div>

          {CATEGORY_ORDER.map((slug) => (
            <nav key={slug} aria-label={CATEGORY_META[slug].navLabel}>
              <h2 className="text-sm font-semibold text-slate-900">
                <Link href={`/tools/${slug}/`} className="hover:text-brand-700">
                  {CATEGORY_META[slug].navLabel}
                </Link>
              </h2>
              <ul className="mt-3 space-y-2">
                {getToolsByCategory(slug).map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={toolPath(tool.slug)}
                      className="text-sm text-slate-600 transition hover:text-brand-700"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 grid gap-8 border-t border-slate-200 pt-8 sm:grid-cols-3">
          <nav aria-label="Company">
            <h2 className="text-sm font-semibold text-slate-900">Company</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/about/" className="text-slate-600 transition hover:text-brand-700">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact/" className="text-slate-600 transition hover:text-brand-700">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/blog/" className="text-slate-600 transition hover:text-brand-700">
                  Guides and articles
                </Link>
              </li>
              <li>
                <Link href="/tools/" className="text-slate-600 transition hover:text-brand-700">
                  All tools
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="text-sm font-semibold text-slate-900">Legal</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/privacy/" className="text-slate-600 transition hover:text-brand-700">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms/" className="text-slate-600 transition hover:text-brand-700">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies/" className="text-slate-600 transition hover:text-brand-700">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer/" className="text-slate-600 transition hover:text-brand-700">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">Your privacy choices</h2>
            <p className="mt-3 text-sm text-slate-600">
              You can change or withdraw your cookie consent at any time.
            </p>
            <ConsentSettingsLink />
            <p className="mt-4 text-sm text-slate-600">
              Email:{' '}
              <a href={`mailto:${BRAND.email}`} className="text-brand-700 underline hover:text-brand-800">
                {BRAND.email}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {COPYRIGHT_YEAR} {BRAND.name}. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Not affiliated with Google, Adobe, Microsoft or any file-format vendor. Product names are
            used only to describe compatibility.
          </p>
        </div>
      </div>
    </footer>
  );
}
