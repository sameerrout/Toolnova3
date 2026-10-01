import React from 'react';
import { Metadata } from 'next';
import { ImageToPdfConverter } from '@/components/tools/ImageToPdfConverter';

export const metadata: Metadata = {
  title: 'Image to PDF Converter - Toolino',
  description: 'Convert JPG, PNG, and WEBP images to PDF with page reordering, delete options, and instant download.',
};

export default function ImageToPdfPage() {
  return <ImageToPdfConverter />;
}
