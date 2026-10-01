import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  UserCheck,
  Printer,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { PassportPhotoMaker } from '@/components/tools/PassportPhotoMaker';
import { Container } from '@/components/common/Container';

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

      {/* Educational & SEO Content Section */}
      <section className="bg-white border-t border-slate-200/80 py-16">
        <Container>
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Step-by-Step Workflow Guide */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Simple 3-Step Process
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                How to Create Official Passport Photos at Home
              </h2>
              <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
                Take a selfie against a wall and turn it into a certified biometric passport photo in under 60 seconds.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    1
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Upload Portrait</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Upload a front-facing portrait photo with neutral expression, even room lighting, and both ears or shoulders visible.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    2
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Align with Biometric Guides</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Select your country standard (US 2×2", UK/EU 35×45mm, etc.). Drag and zoom your face to fit the eye-level and chin guidelines.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    3
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Download Single or Print Sheet</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Download an individual 300 DPI JPEG for online visa applications, or download a 4×6" photo sheet with cutting borders for cheap printing.
                  </p>
                </div>
              </div>
            </div>

            {/* Country Standards Specifications Table */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">
                Official Biometric Passport Photo Requirements by Country
              </h2>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Country / Region</th>
                      <th className="p-3.5">Dimensions (mm)</th>
                      <th className="p-3.5">Dimensions (in / px)</th>
                      <th className="p-3.5">Head Size Requirement</th>
                      <th className="p-3.5">Background</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-600">
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">United States (US)</td>
                      <td className="p-3.5">51 × 51 mm</td>
                      <td className="p-3.5">2 × 2 inches (600×600 px)</td>
                      <td className="p-3.5">50% – 69% (1" to 1 3/8")</td>
                      <td className="p-3.5">Pure White</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">United Kingdom (UK)</td>
                      <td className="p-3.5">35 × 45 mm</td>
                      <td className="p-3.5">1.38 × 1.77 in (413×531 px)</td>
                      <td className="p-3.5">70% – 80% (29 – 34 mm)</td>
                      <td className="p-3.5">Plain Cream or Light Gray</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">Schengen / Europe (EU)</td>
                      <td className="p-3.5">35 × 45 mm</td>
                      <td className="p-3.5">1.38 × 1.77 in (413×531 px)</td>
                      <td className="p-3.5">70% – 80% (32 – 36 mm)</td>
                      <td className="p-3.5">Light Gray / White</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">India (Passport)</td>
                      <td className="p-3.5">35 × 45 mm</td>
                      <td className="p-3.5">1.38 × 1.77 in (413×531 px)</td>
                      <td className="p-3.5">70% – 75% (25 – 35 mm)</td>
                      <td className="p-3.5">White or Off-White</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">Canada</td>
                      <td className="p-3.5">50 × 70 mm</td>
                      <td className="p-3.5">1.97 × 2.76 in (591×827 px)</td>
                      <td className="p-3.5">44% – 51% (31 – 36 mm)</td>
                      <td className="p-3.5">Plain White or Light</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">Australia & New Zealand</td>
                      <td className="p-3.5">35 × 45 mm</td>
                      <td className="p-3.5">1.38 × 1.77 in (413×531 px)</td>
                      <td className="p-3.5">71% – 80% (32 – 36 mm)</td>
                      <td className="p-3.5">Plain White or Light Gray</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">
                Why Thousands Use Toolino for Passport & Visa Photos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">100% Private & In-Browser</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Your identity and face portraits are never transmitted to third-party servers. All biometric cropping and rendering execute securely in your device memory.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Print 6–8 Photos on 4×6" for Cents</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Skip expensive $18 pharmacy passport photo packages. Download our 4×6" photo sheet and print it as a standard 4R photo at any kiosk for less than $0.35.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Biometric Guidelines Overlay</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Visual crown, eye-level, and chin alignment markers ensure your head occupies the exact required percentage of the photo to guarantee acceptance.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Interactive Pan, Zoom & Rotation</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Easily straighten tilted selfies and adjust face scale with fine zoom and sub-degree rotation sliders.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions (FAQ) */}
            <div className="pt-6 border-t border-slate-200/80">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    What are the dimensions for US Passport and Visa photos?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    US Passport and Visa photos must measure exactly 2×2 inches (51×51 mm) at 300 DPI (600×600 pixels). The head must be between 1 inch and 1 3/8 inches (50% to 69% of the image height).
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    What are the dimensions for UK, European Schengen, and India passport photos?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    The standard biometric specification for UK HMPO, European Schengen Visas, and Indian Passport Seva is 35×45 mm (width × height). The face height must occupy between 70% and 80% of the photograph.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    How do I print passport photos on a home printer or pharmacy kiosk?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Download the 4×6 inch (10×15 cm) Print Sheet option. It tiles 6 to 8 compliant passport photos with cutting guide lines onto standard 4R photo paper. Print it at standard 100% scale (no fit-to-page) at CVS, Walgreens, Walmart, or any photo printer for pennies.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Are my personal portrait photos stored or uploaded to any server?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    No. Toolino operates 100% locally in your web browser. Your photo is rendered in your device memory and never transmitted over the internet.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Tools Internal Links */}
            <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-3xl p-8 border border-blue-100">
              <h3 className="text-base font-bold text-slate-900">Explore More Free Image Tools</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Boost your productivity with Toolino's suite of free privacy-first web tools.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/background-remover"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Background Remover</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/image-compressor"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Image Compressor</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/image-resizer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>Image Resizer</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/image-tools"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-blue-600 hover:shadow-xs border border-slate-200 transition-all"
                >
                  <span>All Image Tools</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
