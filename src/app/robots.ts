import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pdf-tools',
          '/about',
          '/tools/',
          '/pdf-to-word',
          '/word-to-pdf',
          '/pdf-to-powerpoint',
          '/qr-code-generator',
          '/pdf-compressor',
          '/pdf-merger',
          '/pdf-splitter',
        ],
        disallow: [
          '/api/',
          '/jobs/',
          '/download/',
          '/temp/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
