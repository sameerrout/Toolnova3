import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Maximize2,
  Sliders,
  Layers,
} from 'lucide-react';
import { ImageResizer } from '@/components/tools/ImageResizer';
import { Container } from '@/components/common/Container';

export const metadata: Metadata = {
  title: 'Free Image Resizer Online - Resize Photos in Pixels & Ratio | Toolino',
  description:
    'Resize JPG, PNG, WEBP, and AVIF images online for free. Adjust dimensions in pixels or percentage with aspect ratio lock and social media presets. 100% private.',
  alternates: {
    canonical: 'https://toolnova.com/image-resizer',
  },
  openGraph: {
    title: 'Free Image Resizer Online - Toolino',
    description:
      'Resize images in pixels, percentage, or social media presets with aspect ratio lock directly in your browser.',
    url: 'https://toolnova.com/image-resizer',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function ImageResizerPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/image-resizer`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Image Resizer - Toolino',
    url: pageUrl,
    description:
      'Resize JPG, PNG, WEBP, and AVIF images by pixels, percentage, and presets with aspect ratio locking.',
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
        name: 'Image Resizer',
        item: pageUrl,
      },
    ],
  };

  const faqs = [
    {
      q: 'How do I lock or unlock the aspect ratio?',
      a: 'Click the padlock icon between the width and height inputs. When locked, changing the width automatically updates the height proportionally to prevent image stretching or distortion.',
    },
    {
      q: 'What presets are available?',
      a: 'We provide presets for Instagram (Square 1080×1080, Story 1080×1920, Portrait 1080×1350), YouTube (Thumbnail 1280×720, Banner 2560×1440), LinkedIn, WhatsApp, Full HD (1920×1080), and standard square icons (100×100 to 500×500).',
    },
    {
      q: 'Will resizing my image reduce its quality?',
      a: 'Downscaling an image to smaller dimensions preserves crisp details and reduces file size. If you upscale an image larger than its original resolution, Toolino will display an "Upscaled" warning so you are aware of potential softening.',
    },
    {
      q: 'Can I resize multiple images at once?',
      a: 'Yes. You can upload multiple images simultaneously, apply common dimensions or percentage scaling across all photos, and download them individually or as a single ZIP file.',
    },
    {
      q: 'Are my images uploaded to any server?',
      a: 'No. Resizing is performed 100% client-side inside your browser sandbox using hardware-accelerated Canvas. Your files remain completely private on your local device.',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <>
      {/* Schema.org Injections */}
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

      {/* Main Interactive Tool Component */}
      <ImageResizer />
    </>
  );
}
