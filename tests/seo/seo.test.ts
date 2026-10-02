import { describe, it, expect } from 'vitest';
import { TOOL_REGISTRY } from '@/data/toolRegistry';
import { TOOL_CONTENT } from '@/data/toolContent';
import { TOOL_SLUGS, toolPath } from '@/lib/tools';
import { countContentWords } from '@/content/types';

describe('SEO & Metadata Integrity Verification', () => {
  it('registers all 27 canonical tools with matching slugs', () => {
    expect(TOOL_REGISTRY.length).toBe(TOOL_SLUGS.length);
    const registrySlugs = TOOL_REGISTRY.map((t) => t.slug).sort();
    const definedSlugs = [...TOOL_SLUGS].sort();
    expect(registrySlugs).toEqual(definedSlugs);
  });

  it('guarantees clean canonical URL format (/tools/<slug>/) for every tool', () => {
    for (const tool of TOOL_REGISTRY) {
      const url = toolPath(tool.slug);
      expect(url).toBe(`/tools/${tool.slug}/`);
      expect(url.startsWith('/tools/')).toBe(true);
      expect(url.endsWith('/')).toBe(true);
    }
  });

  it('verifies SEO title length and meta description length per tool', () => {
    for (const tool of TOOL_REGISTRY) {
      expect(tool.metaTitle.length).toBeGreaterThanOrEqual(40);
      expect(tool.metaTitle.length).toBeLessThanOrEqual(75);

      expect(tool.metaDescription.length).toBeGreaterThanOrEqual(100);
      expect(tool.metaDescription.length).toBeLessThanOrEqual(180);

      expect(tool.related.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('enforces rich content: at least 400 words and at least 5 FAQs for every tool', () => {
    for (const slug of TOOL_SLUGS) {
      const content = TOOL_CONTENT[slug];
      expect(content, `Missing content for ${slug}`).toBeDefined();

      const words = countContentWords(content);
      expect(
        words,
        `Tool "${slug}" has only ${words} words; minimum required is 400.`
      ).toBeGreaterThanOrEqual(400);

      expect(
        content.faqs.length,
        `Tool "${slug}" has only ${content.faqs.length} FAQs; minimum required is 5.`
      ).toBeGreaterThanOrEqual(5);

      expect(content.howTo.steps.length).toBeGreaterThanOrEqual(3);
      expect(content.benefits.items.length).toBeGreaterThanOrEqual(4);
      expect(content.privacy.paragraphs.length).toBeGreaterThanOrEqual(2);
    }
  });
});
