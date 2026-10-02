import React from 'react';
import { Metadata } from 'next';
import { PassportPhotoMaker } from '@/components/tools/PassportPhotoMaker';

export const metadata: Metadata = {
  title: 'Free Passport Photo Maker Online - US, UK, Schengen, India, Canada | Toolino',
  description:
    'Create compliant biometric passport and visa photos online for free. Official US 2x2 inch, UK/EU 35x45mm, India, Canada, and Australia standards. Biometric alignment guide and printable 4x6" photo sheet.',
  alternates: {
    canonical: 'https://toolnova.com/passport-photo-maker',
  },
  openGraph: {
    title: 'Free Online Passport Photo Maker - Toolino',
    description:
      'Create official passport and visa photos directly in your browser with biometric alignment guides and printable 4x6" photo sheets.',
    url: 'https://toolnova.com/passport-photo-maker',
    siteName: 'Toolino',
    type: 'website',
  },
};

export default function PassportPhotoMakerPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolnova.com';
  const pageUrl = `${baseUrl}/passport-photo-maker`;

  // Structured Data (JSON-LD)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Passport Photo Maker - Toolino',
    url: pageUrl,
    description:
      'Create compliant biometric passport and visa photos online for free. Official standards for US, UK, Schengen, India, Canada, and Australia with 4x6" print sheet.',
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
        name: 'Passport Photo Maker',
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
        name: 'What are the dimensions for US Passport and Visa photos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'US Passport and Visa photos must measure exactly 2×2 inches (51×51 mm) at 300 DPI (600×600 pixels). The head must be between 1 inch and 1 3/8 inches (50% to 69% of the image height).',
        },
      },
      {
        '@type': 'Question',
        name: 'What are the dimensions for UK, European Schengen, and India passport photos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The standard biometric specification for UK HMPO, European Schengen Visas, and Indian Passport Seva is 35×45 mm (width × height). The face height must occupy between 70% and 80% of the photograph.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I print passport photos on a home printer or pharmacy kiosk?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Download the 4×6 inch (10×15 cm) Print Sheet option. It tiles 6 to 8 compliant passport photos with cutting guide lines onto standard 4R photo paper. Print it at standard 100% scale (no fit-to-page) at CVS, Walgreens, Walmart, or any photo printer for pennies.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are my personal portrait photos stored or uploaded to any server?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Toolino operates 100% locally in your web browser. Your photo is rendered in your device memory and never transmitted over the internet.',
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
      <PassportPhotoMaker />
    </>
  );
}
