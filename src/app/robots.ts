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
          '/document-tools',
          '/image-tools',
          '/utility-tools',
          '/qr-tools',
          '/about',
          '/tools/',
          '/pdf-to-powerpoint',
          '/qr-code-generator',
        ],
        disallow: [
          '/api/',
          '/jobs/',
          '/download/',
          '/temp/',
          '/login',
          '/signup',
          '/manager',
          '/admin',
          '/dashboard',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
