import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Palette,
  Sliders,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { BackgroundRemover } from '@/components/tools/BackgroundRemover';
import { Container } from '@/components/common/Container';

export const metadata: Metadata = {
  title: 'Free Background Remover Online - Remove BG in 1-Click | Toolino',
  description:
    'Remove image backgrounds instantly online for free. Transparent PNG cutouts, custom solid and gradient backgrounds, edge feathering, and 100% private client-side processing.',
  alternates: {
    canonical: 'https://toolnova.com/background-remover',
  },
  openGraph: {
    title: 'Free Online Background Remover - Toolino',
    description:
      'Remove image backgrounds instantly in your browser with zero data uploads. Clean cutouts, transparent PNGs, and custom studio backgrounds.',
    url: 'https://toolnova.com/background-remover',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function BackgroundRemoverPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/background-remover`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Background Remover - Toolino',
    url: pageUrl,
    description:
      'Remove image backgrounds instantly online for free. 100% private in-browser cutout generator with color replacement and edge feathering.',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Image Tools',
        item: `${baseUrl}/image-tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Background Remover',
        item: pageUrl,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Are my photos uploaded to any external server?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. All image segmentation and background removal processes occur 100% locally within your web browser using HTML5 Canvas and offscreen matting algorithms. Your photos never leave your device.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I replace the background with a custom color or gradient?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! You can choose between transparent PNG cutouts, solid colors (including passport blue, studio white, or custom hex codes), and modern studio gradients.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I remove halos or fringes around hair and clothing edges?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use the Halo Removal slider (edge shift) to contract the mask by 1 to 3 pixels, and adjust the Edge Feathering slider to smoothly blend borders without pixelation.',
        },
      },
      {
        '@type': 'Question',
        name: 'What if certain background areas are not removed automatically?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use the Eyedropper tool to click on the leftover color, adjust the Color Tolerance slider, or use the interactive Erase brush to manually touch up any region.',
        },
      },
    ],
  };

  return (
    <>
      {/* Structured Data Script Tags */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Main Tool Application */}
      <BackgroundRemover />
    </>
  );
}
