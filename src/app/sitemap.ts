import { MetadataRoute } from 'next';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const now = new Date();

  // Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pdf-tools`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic tool landing pages
  const toolRoutes: MetadataRoute.Sitemap = TOOLS_CATALOG.filter(
    (t) => t.isAvailable
  ).map((tool) => ({
    url: `${baseUrl}/tools/${tool.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // Direct vanity SEO aliases
  const vanityAliases = [
    'pdf-to-word',
    'word-to-pdf',
    'pdf-to-powerpoint',
    'qr-code-generator',
    'compress-pdf',
    'merge-pdf',
    'split-pdf',
  ].map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  return [...staticRoutes, ...toolRoutes, ...vanityAliases];
}
