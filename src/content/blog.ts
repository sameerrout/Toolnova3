/**
 * Blog registry.
 *
 * Eight original articles, each of which is a genuinely useful standalone guide
 * and also supports a cluster of tool pages. Article bodies live in
 * `src/content/blog/<slug>.tsx` as React fragments so they can include real
 * markup (headings, lists, code) without shipping a Markdown parser.
 *
 * Dates are fixed strings rather than `new Date()` so the sitemap and the
 * Article structured data stay stable across builds.
 */

export interface BlogPostMeta {
  slug: string;
  /** 50-60 character <title>. */
  title: string;
  /** 140-160 character meta description. */
  description: string;
  /** On-page <h1>, may be longer and more conversational than `title`. */
  headline: string;
  /** One-sentence summary used on the index card. */
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  /** Rough reading time in minutes, shown on the card and the article. */
  readingMinutes: number;
  /** Tool slugs this article links to (creates the internal link cluster). */
  relatedTools: string[];
  /** Other articles to cross-link. */
  relatedPosts: string[];
  category: 'PDF' | 'Images' | 'Files' | 'Text' | 'Privacy';
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: 'how-to-merge-pdfs-without-uploading-them',
    title: 'How to Merge PDFs Without Uploading Them Anywhere',
    description:
      'Merging PDFs usually means sending your documents to a stranger\u2019s server. Here is how browser-based merging works, when to use it, and what to watch out for.',
    headline: 'How to merge PDFs without uploading them anywhere',
    excerpt:
      'Most free PDF mergers upload your files first. This explains how to combine documents entirely on your own machine, and why the difference matters for contracts and invoices.',
    publishedAt: '2025-11-04',
    readingMinutes: 7,
    relatedTools: ['merge-pdf', 'split-pdf', 'organize-pdf', 'compress-pdf'],
    relatedPosts: ['how-to-compress-images-for-the-web', 'how-to-create-a-zip-file-on-any-device'],
    category: 'PDF',
  },
  {
    slug: 'how-to-compress-images-for-the-web',
    title: 'How to Compress Images for the Web Without Losing Quality',
    description:
      'A practical guide to choosing formats, quality settings and dimensions so your images load fast without looking soft, including target file size techniques.',
    headline: 'How to compress images for the web without ruining them',
    excerpt:
      'Format choice matters more than the quality slider. This covers WebP and AVIF, why PNG is wrong for photos, and how to hit an exact target file size.',
    publishedAt: '2025-11-12',
    readingMinutes: 9,
    relatedTools: ['compress-image', 'resize-image', 'convert-image', 'remove-background'],
    relatedPosts: ['how-to-merge-pdfs-without-uploading-them', 'what-your-photos-reveal-about-you'],
    category: 'Images',
  },
  {
    slug: 'how-to-create-a-zip-file-on-any-device',
    title: 'How to Create a ZIP File on Windows, Mac, Linux, iOS and Android',
    description:
      'Every built-in way to make a ZIP on every major platform, plus what to do when you are on a locked-down machine with no archive tool installed.',
    headline: 'How to create a ZIP file on any device',
    excerpt:
      'Windows, macOS, Linux, iPhone and Android all ship a ZIP tool, but they hide it in different places. Here is where, plus the browser fallback when you have nothing.',
    publishedAt: '2025-11-20',
    readingMinutes: 8,
    relatedTools: ['create-zip', 'extract-zip', 'compress-image', 'compress-pdf'],
    relatedPosts: ['zip-vs-7z-vs-rar-which-archive-format', 'how-to-merge-pdfs-without-uploading-them'],
    category: 'Files',
  },
  {
    slug: 'zip-vs-7z-vs-rar-which-archive-format',
    title: 'ZIP vs 7z vs RAR: Which Archive Format Should You Use?',
    description:
      'A straight comparison of compression ratio, compatibility, encryption and tooling for the three archive formats you are most likely to be handed.',
    headline: 'ZIP vs 7z vs RAR: which archive format should you actually use?',
    excerpt:
      'ZIP wins on compatibility, 7z wins on size, RAR wins on almost nothing. Here is the trade-off in plain terms, with guidance for sending files to other people.',
    publishedAt: '2025-11-27',
    readingMinutes: 6,
    relatedTools: ['create-zip', 'extract-zip'],
    relatedPosts: ['how-to-create-a-zip-file-on-any-device', 'how-to-share-large-files'],
    category: 'Files',
  },
  {
    slug: 'how-to-share-large-files',
    title: 'How to Share Large Files Without Paying for Cloud Storage',
    description:
      'Practical ways to send big files to other people: shrinking them first, splitting archives, using what you already pay for, and avoiding uploads entirely.',
    headline: 'How to share large files without paying for cloud storage',
    excerpt:
      'Before you buy more storage, try shrinking the files. This covers what actually reduces size, how to split archives, and when a link is the wrong answer.',
    publishedAt: '2025-12-03',
    readingMinutes: 7,
    relatedTools: ['create-zip', 'compress-image', 'compress-pdf', 'split-pdf'],
    relatedPosts: ['zip-vs-7z-vs-rar-which-archive-format', 'how-to-compress-images-for-the-web'],
    category: 'Files',
  },
  {
    slug: 'what-your-photos-reveal-about-you',
    title: 'What Your Photos Reveal About You (and How to Strip It)',
    description:
      'EXIF metadata in photos can include GPS coordinates, device serial numbers and timestamps. Here is what is stored, who can read it, and how to remove it.',
    headline: 'What your photos reveal about you, and how to strip it',
    excerpt:
      'A photo taken at home can carry the exact coordinates of your house. This explains EXIF data, what each field holds, and the simplest ways to remove it.',
    publishedAt: '2025-12-10',
    readingMinutes: 8,
    relatedTools: ['compress-image', 'resize-image', 'convert-image', 'remove-background'],
    relatedPosts: ['how-to-compress-images-for-the-web', 'is-it-safe-to-upload-files-to-online-converters'],
    category: 'Privacy',
  },
  {
    slug: 'is-it-safe-to-upload-files-to-online-converters',
    title: 'Is It Safe to Upload Files to Free Online Converters?',
    description:
      'What actually happens to a file you upload to a free converter: retention windows, subprocessors, terms of service, and the questions worth asking first.',
    headline: 'Is it safe to upload files to free online converters?',
    excerpt:
      'The honest answer is "sometimes, and you usually cannot tell". This is how to read a privacy policy for the details that matter, and when not to upload at all.',
    publishedAt: '2025-12-17',
    readingMinutes: 7,
    relatedTools: ['create-zip', 'merge-pdf', 'compress-pdf', 'remove-background'],
    relatedPosts: ['what-your-photos-reveal-about-you', 'how-to-merge-pdfs-without-uploading-them'],
    category: 'Privacy',
  },
  {
    slug: 'pdf-page-numbers-and-bates-numbering-explained',
    title: 'PDF Page Numbers and Bates Numbering Explained',
    description:
      'How to add page numbers to a PDF properly, why numbering differs from pagination, and when legal teams need Bates numbering instead of simple numbering.',
    headline: 'PDF page numbers and Bates numbering explained',
    excerpt:
      'Page numbers are not as simple as they look: covers, roman numerals, ranges and legal Bates stamps all behave differently. Here is how to get them right.',
    publishedAt: '2026-01-02',
    readingMinutes: 6,
    relatedTools: ['pdf-page-numbers', 'watermark-pdf', 'organize-pdf', 'split-pdf'],
    relatedPosts: ['how-to-merge-pdfs-without-uploading-them', 'is-it-safe-to-upload-files-to-online-converters'],
    category: 'PDF',
  },
];

const POSTS_BY_SLUG = new Map(BLOG_POSTS.map((post) => [post.slug, post]));

export function getPost(slug: string): BlogPostMeta | undefined {
  return POSTS_BY_SLUG.get(slug);
}

export function getRelatedPosts(slug: string): BlogPostMeta[] {
  const post = POSTS_BY_SLUG.get(slug);
  if (!post) return [];
  return post.relatedPosts
    .map((related) => POSTS_BY_SLUG.get(related))
    .filter((entry): entry is BlogPostMeta => Boolean(entry));
}

/** Newest first, which is the order the index page renders. */
export function getPostsByDate(): BlogPostMeta[] {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
