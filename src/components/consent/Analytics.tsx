'use client';

/**
 * Google Analytics 4 loader.
 *
 * Loads only after the visitor consents to analytics. Also sends a manual
 * `page_view` on client-side route changes, because the App Router does not
 * trigger a full page load and GA4 would otherwise miss navigations.
 *
 * When `NEXT_PUBLIC_GA_ID` is empty this is a no-op.
 */

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { GA_ENABLED, GA_ID } from '@/lib/site';
import { useConsent } from './ConsentProvider';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function Analytics() {
  const { consent, ready } = useConsent();
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  const allowed = ready && consent?.analytics === true && GA_ENABLED;
  const isFirstLoad = lastPath.current === null;

  useEffect(() => {
    if (!allowed || typeof window === 'undefined') return;
    if (lastPath.current === pathname) return;

    // The initial page_view is sent by the config call; only send later ones.
    if (isFirstLoad) {
      lastPath.current = pathname;
      return;
    }

    lastPath.current = pathname;
    window.gtag?.('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [allowed, pathname, isFirstLoad]);

  if (!allowed) return null;

  return (
    <>
      <Script
        id="ga4-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_ID}', {
  anonymize_ip: true,
  send_page_view: true,
  cookie_flags: 'SameSite=None;Secure'
});
        `.trim()}
      </Script>
    </>
  );
}
