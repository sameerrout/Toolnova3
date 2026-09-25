import { MetadataRoute } from 'next';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';

// Canonical clean URL mapping for major tools (§36, §43)
export const CLEAN_TOOL_URLS: Record<string, string> = {
  'pdf-to-word': '/pdf-to-word',
  'word-to-pdf': '/word-to-pdf',
  'pdf-to-powerpoint': '/pdf-to-powerpoint',
  'powerpoint-to-pdf': '/powerpoint-to-pdf',
  'qr-code-generator': '/qr-code-generator',
};

export function getToolCanonicalUrl(toolId: string, baseUrl: string = 'https://toolnova.com'): string {
  const cleanPath = CLEAN_TOOL_URLS[toolId];
  return `${baseUrl}${cleanPath || `/tools/${toolId}`}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const now = new Date();

  // Core canonical indexable category and platform pages (§36, §42, §43)
  // Strictly excludes /login, /signup, /api, /download, and internal endpoints
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
      url: `${baseUrl}/document-tools`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/image-tools`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/utility-tools`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/qr-tools`,
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
  ];

  // Canonical tool landing pages (every tool listed exactly once at its canonical URL)
  const toolRoutes: MetadataRoute.Sitemap = TOOLS_CATALOG.filter(
    (t) => t.isAvailable
  ).map((tool) => ({
    url: getToolCanonicalUrl(tool.id, baseUrl),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [...staticRoutes, ...toolRoutes];
}
