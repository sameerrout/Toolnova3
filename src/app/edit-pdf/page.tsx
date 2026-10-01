import React from 'react';
import { Metadata } from 'next';
import { PdfEditor } from '@/components/tools/pdf-editor/PdfEditor';

export const metadata: Metadata = {
  title: 'Edit PDF Online Free - Toolino',
  description:
    'Edit PDF files online for free. Add text, images, signatures, links, watermark, draw, rotate, and export all inside your browser.',
};

export default function EditPdfPage() {
  return <PdfEditor />;
}
