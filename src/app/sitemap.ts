import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { TOOL_REGISTRY } from '@/data/toolRegistry';
import { CATEGORY_ORDER } from '@/data/categories';
import { BLOG_POSTS } from '@/content/blog';
import { toolPath } from '@/lib/tools';

export const dynamic = 'force-static';

/**
 * Fixed content date. Updated deliberately when content changes, so the sitemap
 * does not claim a fresh modification on every deployment - a timestamp that
 * changes on each build tells Google nothing.
 */
const BUILD_DATE = '2026-01-05T00:00:00.000Z';

/**
 * sitemap.xml
 *
 * Generated from the same registries the site renders from, so a new tool or
 * article cannot be forgotten. Every canonical URL appears exactly once:
 *
 *  - `/tools/<tool>/`      one per tool
 *  - `/tools/<category>/`  the five hubs
 *  - `/blog/<slug>/`       one per article
 *  - the fixed and legal pages
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const buildDate = new Date(BUILD_DATE);

  const tools: MetadataRoute.Sitemap = TOOL_REGISTRY.map((tool) => ({
    url: `${SITE_URL}${toolPath(tool.slug)}`,
    lastModified: buildDate,
    changeFrequency: 'weekly',
    priority: tool.featured ? 0.9 : 0.8,
  }));

  const categories: MetadataRoute.Sitemap = CATEGORY_ORDER.map((slug) => ({
    url: `${SITE_URL}/tools/${slug}/`,
    lastModified: buildDate,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const posts: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}/`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: buildDate, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/tools/`, lastModified: buildDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/blog/`, lastModified: buildDate, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${SITE_URL}/about/`, lastModified: buildDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact/`, lastModified: buildDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/privacy/`, lastModified: buildDate, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/terms/`, lastModified: buildDate, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/cookies/`, lastModified: buildDate, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/disclaimer/`, lastModified: buildDate, changeFrequency: 'yearly', priority: 0.4 },
  ];

  return [...staticPages, ...categories, ...tools, ...posts];
}