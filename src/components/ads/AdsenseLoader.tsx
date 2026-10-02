'use client';

/**
 * AdSense loader.
 *
 * Nothing is requested from Google until the visitor has consented to
 * advertising, which is what the Google EU user consent policy requires. The
 * script is injected once, after `window` is available, and never blocks
 * rendering.
 *
 * When `NEXT_PUBLIC_ADSENSE_CLIENT` is empty the whole component is a no-op, so
 * a fork without an AdSense account ships zero ad code.
 */

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { ADSENSE_CLIENT, ADSENSE_ENABLED } from '@/lib/site';
import { useConsent } from '@/components/consent/ConsentProvider';

export function AdsenseLoader() {
  const { consent, ready } = useConsent();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(ready && consent?.ads === true);
  }, [ready, consent]);

  if (!ADSENSE_ENABLED) return null;
  // Non-personalised ads are still ads: nothing loads before a decision.
  if (!allowed) return null;

  return (
    <Script
      id="adsbygoogle-init"
      // `afterInteractive` keeps the ad script off the critical rendering path,
      // which protects LCP on slow connections.
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      data-ad-frequency-hint="30s"
    />
  );
}
