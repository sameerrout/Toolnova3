'use client';

/**
 * Re-opens the consent banner from the footer or the Cookie Policy page.
 *
 * A visible, always-available way to change or withdraw consent is an explicit
 * GDPR requirement, and AdSense review looks for it too.
 */

import { useConsent } from '@/components/consent/ConsentProvider';

export function ConsentSettingsLink({ className }: { className?: string }) {
  const { reopen } = useConsent();

  return (
    <button
      type="button"
      onClick={reopen}
      className={
        className ??
        'mt-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'
      }
    >
      Change cookie settings
    </button>
  );
}
