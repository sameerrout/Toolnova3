/**
 * Long-form SEO content for tool pages.
 *
 * Requirements this type enforces:
 *  - at least 400 words of original prose per tool (tested in
 *    `tests/seo/content.test.ts`)
 *  - a step-by-step "how to use" section that is also emitted as HowTo JSON-LD
 *  - a privacy explanation, because "your files never leave your device" is the
 *    product's core claim and must be stated on every page
 *  - 5-8 genuinely different FAQs that match FAQPage structured data exactly
 *  - a benefits list and a "good to know" list of real limitations
 *
 * The prose lives here rather than inside components so it can be validated and
 * so the page components stay small. Every tool has its own text - nothing is
 * boilerplate repeated across pages.
 */

export interface ContentSection {
  /** `<h2>` text. */
  heading: string;
  /** Paragraphs rendered in order. Plain text, no markup. */
  paragraphs: string[];
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: string[];
}

export interface HowToStepContent {
  name: string;
  text: string;
}

export interface FaqContent {
  question: string;
  answer: string;
}

export interface ToolContent {
  /** `<h2>` for the intro block and the opening paragraph(s). */
  overviewHeading: string;
  overview: string[];
  howTo: {
    heading: string;
    intro: string;
    steps: HowToStepContent[];
  };
  benefits: {
    heading: string;
    intro: string;
    items: { title: string; text: string }[];
  };
  privacy: {
    heading: string;
    paragraphs: string[];
  };
  /** Honest limitations. Required so no page over-promises. */
  goodToKnow: {
    heading: string;
    items: string[];
  };
  faqs: FaqContent[];
  /** Word count of the whole content block, computed by the test. */
}

/** Counts the words in a tool content block, used by the SEO test. */
export function countContentWords(content: ToolContent): number {
  const chunks: string[] = [
    content.overviewHeading,
    ...content.overview,
    content.howTo.heading,
    content.howTo.intro,
    ...content.howTo.steps.flatMap((step) => [step.name, step.text]),
    content.benefits.heading,
    content.benefits.intro,
    ...content.benefits.items.flatMap((item) => [item.title, item.text]),
    content.privacy.heading,
    ...content.privacy.paragraphs,
    content.goodToKnow.heading,
    ...content.goodToKnow.items,
    ...content.faqs.flatMap((faq) => [faq.question, faq.answer]),
  ];
  return chunks
    .join(' ')
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}
