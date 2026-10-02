import type { Metadata } from 'next';
import { absoluteUrl, BRAND, SITE_URL } from '@/lib/site';

/**
 * Metadata builders.
 *
 * Every page in the site goes through {@link buildMetadata} so that canonical
 * URLs, Open Graph and Twitter cards can never be forgotten or drift apart.
 * Titles and descriptions are stored per page (never auto-generated from body
 * text) because Google rewrites generic ones.
 */

export interface BuildMetadataOptions {
  /** 50-60 characters, written to fit rather than truncated. */
  title: string;
  /** 140-160 characters. */
  description: string;
  /** Site-relative path with a trailing slash, e.g. `/tools/create-zip/`. */
  path: string;
  /** Override the default OG image. */
  image?: string;
  /** Set for pages that must stay out of the index (none currently). */
  noIndex?: boolean;
  keywords?: string[];
  /** Article metadata for blog posts. */
  publishedTime?: string;
  modifiedTime?: string;
}

/** Default social preview image, 1200x630, served from `public/`. */
export const DEFAULT_OG_IMAGE = '/og-default.png';

export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  keywords,
  publishedTime,
  modifiedTime,
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl(image ?? DEFAULT_OG_IMAGE);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type: publishedTime ? 'article' : 'website',
      url,
      title,
      description,
      siteName: BRAND.name,
      locale: 'en_GB',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${BRAND.name} — ${title}`,
        },
      ],
      ...(publishedTime ? { publishedTime, modifiedTime: modifiedTime ?? publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      ...(BRAND.twitter ? { site: BRAND.twitter, creator: BRAND.twitter } : {}),
    },
  };
}

/** Root metadata shared by every route, defined once in `app/layout.tsx`. */
export const ROOT_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — Free Online Tools That Never Upload Your Files`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.name, url: SITE_URL }],
  creator: BRAND.name,
  publisher: BRAND.name,
  category: 'technology',
  formatDetection: { telephone: false, address: false, email: false },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
  // Ads and analytics are loaded from the consent banner, so no third-party
  // preconnect is declared here to keep the critical path short.
  other: {
    'format-detection': 'telephone=no',
  },
};

/**
 * Metadata for a paginated or filtered list page.
 * Sets `noIndex` on anything that is not page 1 to avoid thin duplicates.
 */
export function buildListMetadata(options: BuildMetadataOptions & { isFirstPage: boolean }): Metadata {
  return buildMetadata({ ...options, noIndex: !options.isFirstPage });
}
