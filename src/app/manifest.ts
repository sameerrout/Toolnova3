import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Toolino',
    short_name: 'Toolino',
    description:
      'Free, fast, and privacy-conscious online tools. Convert, edit, and optimize PDFs, images, and documents directly inside your browser without uploading files to servers.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/logo1.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo1.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
