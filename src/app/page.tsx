import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck, Zap, WifiOff, Ban, Gauge, Lock } from 'lucide-react';

import { Container } from '@/components/common/Container';
import { ToolCard } from '@/components/common/ToolCard';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/components/tools/ToolPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, faqSchema, webPageSchema } from '@/lib/seo/schema';
import { BRAND } from '@/lib/site';
import { CATEGORY_META, CATEGORY_ORDER } from '@/data/categories';
import { getFeaturedTools, getToolsByCategory, TOOL_REGISTRY } from '@/data/toolRegistry';

/**
 * Server Component on purpose: this page must ship metadata, structured data and
 * the full tool grid as static HTML, and keep the initial JavaScript under
 * 100 KB gzipped. There is no client-side search index here for exactly that
 * reason.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Toolnova — Free Online Tools That Never Upload Your Files',
  description:
    'Free PDF, image, file and calculator tools that run entirely in your browser. Merge PDFs, compress photos, create ZIP files and more, with no uploads and no signup.',
  path: '/',
  keywords: [
    'free online tools',
    'browser based tools',
    'no upload file tools',
    'private pdf tools',
    'client side image compressor',
    'create zip online',
  ],
});

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Nothing is uploaded',
    text: 'There is no server that receives files. Every tool is JavaScript running in your own browser tab, which you can verify in your developer tools.',
  },
  {
    icon: Zap,
    title: 'Instant, because there is no upload',
    text: 'No waiting for a file to travel to a data centre and back. Compression and conversion start the moment you pick a file.',
  },
  {
    icon: WifiOff,
    title: 'Works offline once loaded',
    text: 'Disconnect your network mid-job and the conversion still finishes. Only the two AI tools need a one-time model download.',
  },
  {
    icon: Ban,
    title: 'No accounts, no email, no watermarks',
    text: 'No signup wall, no email harvesting, and no branding stamped onto your output. Open a tool and use it.',
  },
  {
    icon: Gauge,
    title: 'Built for modest devices',
    text: 'Limits scale automatically with your available memory and CPU cores, so a 2 GB phone lowers the batch size instead of crashing the tab.',
  },
  {
    icon: Lock,
    title: 'Honest about limits',
    text: 'Where a browser genuinely cannot match desktop software, the page says so instead of pretending. No silent quality surprises.',
  },
] as const;

const HOME_FAQS = [
  {
    question: 'Are my files really not uploaded?',
    answer: `${BRAND.name} has no backend that accepts files. The site is served as static files and every tool runs in your browser using JavaScript, Web Workers and WebAssembly. You can confirm this yourself by opening your browser developer tools, switching to the Network tab, and watching while you convert a file: no request carries your data anywhere.`,
  },
  {
    question: 'Is it free, and what is the catch?',
    answer:
      'It is free and there is no account. The site is supported by advertising, which is why you will see clearly-labelled ad units on content pages. Ads never appear while a tool is processing or on a result screen, and they are never disguised as buttons or download links.',
  },
  {
    question: 'Which tools need a download the first time?',
    answer:
      'Two of them. Background removal downloads a roughly 40 MB segmentation model, and OCR downloads language data for the language you pick. Both are one-time downloads that the browser then caches. Your image is still processed locally and is never uploaded.',
  },
  {
    question: 'Why do some limits change between devices?',
    answer:
      'Because your browser reports how much memory the device has. On a low-memory phone the tools automatically reduce batch sizes, canvas dimensions and the number of PDF pages handled at once. That is deliberate: it is better to process fewer files per run than to have the tab run out of memory.',
  },
  {
    question: 'Do you keep any record of what I process?',
    answer:
      'No. There is no logging of filenames, no storage of output, and no analytics at all unless you accept the analytics cookie. If you decline, the only thing stored is your consent choice itself, in your own browser.',
  },
  {
    question: 'Can I use these tools on a work computer?',
    answer:
      'Technically yes, and because nothing is uploaded it is often the safer choice for confidential documents. You should still check your employer\u2019s policy on using external websites, and the site needs no installation, no browser extension and no admin rights.',
  },
];

export default function HomePage() {
  const featured = getFeaturedTools();
  const totalTools = TOOL_REGISTRY.length;

  return (
    <>
      <JsonLd
        nodes={[
          webPageSchema({
            path: '/',
            name: `${BRAND.name} — free online tools that never upload your files`,
            description: BRAND.description,
          }),
          breadcrumbSchema([{ name: 'Home' }]),
          faqSchema(HOME_FAQS),
        ]}
      />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
              Files are processed on your device, never on a server
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Free online tools that never upload your files
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {totalTools} browser-based tools for PDFs, images, archives and everyday sums. Merge a
              contract, shrink a photo, or zip a folder without handing your documents to a stranger
              &rsquo;s server.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/tools/create-zip/" className="btn-primary">
                Create a ZIP file
              </Link>
              <Link href="/tools/" className="btn-secondary">
                Browse all {totalTools} tools
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              No account. No email. No watermark. Nothing to install.
            </p>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------- Featured */}
      <Container className="py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Most used tools</h2>
            <p className="mt-1 text-sm text-slate-600">
              The tools people reach for most often, all running locally.
            </p>
          </div>
          <Link href="/tools/" className="text-sm font-semibold text-brand-700 hover:underline">
            See all {totalTools} tools →
          </Link>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((tool) => (
            <li key={tool.slug}>
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>
      </Container>

      {/* One unit, well below the fold and below real content. */}
      <Container>
        <AdSlot slot={AD_SLOTS.hubTop} format="horizontal" />
      </Container>

      {/* -------------------------------------------------------- By category */}
      {CATEGORY_ORDER.map((categorySlug) => {
        const meta = CATEGORY_META[categorySlug];
        const tools = getToolsByCategory(categorySlug);
        return (
          <Container key={categorySlug} className="py-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  <Link href={`/tools/${categorySlug}/`} className="hover:text-brand-800">
                    {meta.title}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-slate-600">{meta.intro}</p>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
              </span>
            </div>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <li key={tool.slug}>
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
          </Container>
        );
      })}

      {/* ----------------------------------------------------------- Why us */}
      <section className="border-y border-slate-200 bg-slate-50">
        <Container className="py-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Why a browser-only tool is different
          </h2>
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            &ldquo;Free online converter&rdquo; usually means your file is uploaded to someone
            &rsquo;s server, processed there, and kept for an unknown length of time. This site is
            built the other way round: the processing is the part that happens on your machine.
          </p>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <feature.icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <span>
                  <strong className="block text-sm font-semibold text-slate-900">
                    {feature.title}
                  </strong>
                  <span className="mt-1 block text-sm text-slate-600">{feature.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* --------------------------------------------------------- Long copy */}
      <Container className="py-14">
        <div className="prose-toolnova max-w-3xl">
          <h2>How a file gets from your disk to a finished result</h2>
          <p>
            Open any tool and the page you receive is a static file: HTML, CSS and a small amount of
            JavaScript, served from a content delivery network. It contains no code that can receive
            a file. When you choose a file, the browser reads it from your disk into memory under the
            page&rsquo;s own permission. The conversion then runs in that tab, or in a Web Worker
            that the tab created.
          </p>
          <p>
            Depending on the tool, the actual work is done by one of four things: the canvas API for
            anything involving images; PDF-LIB and pdf.js for PDF documents; fflate for ZIP archives;
            or WebAssembly for OCR and background removal. All four are ordinary web technologies
            that execute locally. None of them is capable of sending your file anywhere, because
            sending data requires a network request, and there is no request to make.
          </p>
          <p>
            The one honest caveat is that two tools download a model the first time you use them. The
            background remover fetches roughly 40 MB of segmentation weights, and OCR fetches the
            language data for the language you select. Those downloads go to a public content
            network and are cached by your browser afterwards. What is downloaded is the model, not
            your file: your photo or screenshot is still read locally and never transmitted. If you
            would rather serve even those assets yourself, the README explains how to vendor them
            onto your own storage.
          </p>
          <p>
            Supporting the site is done with advertising rather than with your documents. Ad units
            appear on content pages and are always labelled, never styled to look like a button, and
            never shown while a job is running or on a screen where a mis-click would hit them.
            Analytics only loads if you accept it. Everything else about how the site handles data is
            set out in the{' '}
            <Link href="/privacy/">Privacy Policy</Link> and the{' '}
            <Link href="/cookies/">Cookie Policy</Link>.
          </p>
        </div>
      </Container>

      {/* --------------------------------------------------------------- FAQ */}
      <Container className="pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Questions people ask before using the tools
          </h2>
          <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {HOME_FAQS.map((faq, index) => (
              <details key={faq.question} className="group py-4" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold text-slate-900">
                  <span>{faq.question}</span>
                  <span aria-hidden="true" className="mt-1 shrink-0 text-slate-400 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[0.9375rem] leading-7 text-slate-700">{faq.answer}</p>
              </details>
            ))}
          </div>

          <p className="mt-8 text-sm text-slate-600">
            Still unsure about something?{' '}
            <Link href="/contact/" className="font-medium text-brand-700 underline">
              Ask us directly
            </Link>{' '}
            or read the <Link href="/blog/">in-depth guides</Link>, which explain the trade-offs
            behind each format.
          </p>
        </div>
      </Container>
    </>
  );
}
