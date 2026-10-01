'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics/tracker';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = pathname;
      trackPageView(pathname);
    }
  }, [pathname]);

  return null;
}
