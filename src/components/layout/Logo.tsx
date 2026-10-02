import { BRAND } from '@/lib/site';

/**
 * Logo mark + wordmark.
 *
 * A pure inline SVG so there is no image request, no layout shift and no
 * external dependency. The mark reads as a stack of sheets (a browser window
 * over a document) with a lock notch, which is the product in one glyph.
 */
export function Logo({
  className,
  showWordmark = true,
  size = 32,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={className}>
      <span className="flex items-center gap-2">
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          role="img"
          aria-label={`${BRAND.name} logo`}
          className="shrink-0"
        >
          <rect width="32" height="32" rx="8" fill="#1f47d6" />
          <path d="M9 8.5h9.5L23 13v10.5H9V8.5Z" fill="#ffffff" opacity="0.95" />
          <path d="M18.5 8.5 23 13h-4.5V8.5Z" fill="#bcd3ff" />
          <rect x="12" y="15" width="5" height="1.6" rx="0.8" fill="#1f47d6" opacity="0.55" />
          <rect x="12" y="18" width="8" height="1.6" rx="0.8" fill="#1f47d6" opacity="0.35" />
          <circle cx="22" cy="22" r="4.2" fill="#0f172a" />
          <path
            d="M20.4 22.1v-1a1.6 1.6 0 0 1 3.2 0v1"
            stroke="#ffffff"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="19.8" y="22" width="4.4" height="3.2" rx="0.9" fill="#ffffff" />
        </svg>
        {showWordmark ? (
          <span className="text-lg font-bold tracking-tight text-slate-900">{BRAND.name}</span>
        ) : null}
      </span>
    </span>
  );
}
