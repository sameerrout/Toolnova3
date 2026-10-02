import { graph } from '@/lib/seo/schema';

/**
 * Renders a JSON-LD `@graph` document.
 *
 * A Server Component on purpose: the markup must be in the static HTML for
 * crawlers, and it must not add to the client bundle. The payload is escaped so
 * a stray `</script>` inside any string cannot break out of the tag.
 */
export function JsonLd({ nodes }: { nodes: Record<string, unknown>[] }) {
  if (nodes.length === 0) return null;
  const payload = graph(nodes).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      // The payload is built server-side from typed constants, never from user
      // input, and `<` is escaped above.
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
