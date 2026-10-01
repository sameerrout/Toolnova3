import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { AnalyticsTracker } from '@/components/common/AnalyticsTracker';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Toolino - All-in-One Free Online Tools',
  description:
    'Free, fast, and privacy-conscious online tools. Convert, edit, and optimize PDFs, images, and documents easily inside your browser without uploading files to servers.',
  keywords: [
    'pdf tools',
    'image to pdf',
    'merge pdf',
    'split pdf',
    'rotate pdf',
    'privacy-first tools',
    'client-side pdf converter',
    'Toolino',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-slate-50 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          <AnalyticsTracker />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
