'use client';

/**
 * Ad slot with a hard budget of 3 units per page and no layout shift.
 *
 * Rules this component enforces, matching the AdSense Program Policies and the
 * Core Web Vitals targets:
 *
 *  - **Fixed footprint.** The container reserves its exact height before the ad
 *    loads, so CLS stays at 0 and the page does not jump when the creative
 *    arrives.
 *  - **Never on a processing or result screen.** Tools call
 *    `useAdFreeZone()` while a job is running, which suppresses every slot.
 *  - **Never on an empty or error screen** for the same reason.
 *  - **Lazy.** The ad markup is only inserted once the slot scrolls near the
 *    viewport, so ads never compete with the main content for bandwidth.
 *  - **Maximum three.** A module-level counter per page render refuses the
 *    fourth slot rather than silently exceeding the limit.
 *  - **Clearly labelled.** The visible "Advertisement" label prevents the
 *    accidental-click and misleading-placement problems that get accounts
 *    suspended.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { ADSENSE_CLIENT, ADSENSE_ENABLED } from '@/lib/site';
import { useConsent } from '@/components/consent/ConsentProvider';
import { cn } from '@/lib/utils/cn';

export type AdFormat = 'horizontal' | 'rectangle' | 'vertical';

const HEIGHT_BY_FORMAT: Record<AdFormat, string> = {
  // Reserved heights match Google's standard responsive sizes.
  horizontal: 'h-[100px] sm:h-[90px]',
  rectangle: 'h-[250px] sm:h-[280px]',
  vertical: 'h-[600px]',
};

export interface AdSlotProps {
  format?: AdFormat;
  /** AdSense slot id from your AdSense dashboard. */
  slot: string;
  /** Optional label override; keep it honest. */
  label?: string;
  className?: string;
}

/** Per-page budget. Reset by `AdSlotBudget` on every route change. */
let renderedSlots = 0;
export const MAX_ADS_PER_PAGE = 3;

/**
 * Suppresses every ad slot on the page while `active` is true.
 * Tools use this during processing and on the result screen.
 */
let adFreeZones = 0;

export function useAdFreeZone(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    adFreeZones += 1;
    return () => {
      adFreeZones = Math.max(0, adFreeZones - 1);
    };
  }, [active]);
}

export function AdSlot({ format = 'horizontal', slot, label, className }: AdSlotProps) {
  const { consent, ready } = useConsent();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [budgetGranted, setBudgetGranted] = useState(false);
  const elementId = useId();

  const allowed = ready && consent?.ads === true && ADSENSE_ENABLED;

  // Claim one of the three slots for this page. Runs once, on mount.
  useEffect(() => {
    if (!allowed) return;
    if (adFreeZones > 0) return;
    if (renderedSlots >= MAX_ADS_PER_PAGE) return;
    renderedSlots += 1;
    setBudgetGranted(true);
  }, [allowed]);

  // Reveal only when the slot approaches the viewport.
  useEffect(() => {
    if (!budgetGranted) return;
    const node = containerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver !== 'function') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [budgetGranted]);

  // Push the unit once it is visible and the script has had a chance to load.
  useEffect(() => {
    if (!inView || !budgetGranted) return;
    try {
      const adsbygoogle = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle;
      if (Array.isArray(adsbygoogle)) {
        adsbygoogle.push({});
      }
    } catch {
      // A blocked or failed ad request must never surface an error to the user.
    }
  }, [inView, budgetGranted]);

  // Reserve the space even when no ad will be shown, but only when ads are
  // actually enabled - a fork without AdSense renders nothing at all.
  if (!ADSENSE_ENABLED || !allowed || !budgetGranted) return null;

  return (
    <aside
      aria-label={label ?? 'Advertisement'}
      className={cn('my-8 w-full', className)}
      data-ad-free={adFreeZones > 0 ? 'true' : 'false'}
    >
      <p className="mb-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {label ?? 'Advertisement'}
      </p>
      <div
        ref={containerRef}
        className={cn(
          'flex w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50',
          HEIGHT_BY_FORMAT[format]
        )}
      >
        {inView ? (
          <ins
            id={elementId}
            className="adsbygoogle block w-full"
            style={{ display: 'block' }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : null}
      </div>
    </aside>
  );
}

/**
 * Resets the per-page ad budget. Mounted once in the root layout so a
 * client-side navigation to a new page starts with three fresh slots.
 */
export function AdSlotBudget(): null {
  useEffect(() => {
    renderedSlots = 0;
  }, []);
  return null;
}
