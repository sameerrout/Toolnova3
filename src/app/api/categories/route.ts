import { NextResponse } from 'next/server';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';

export async function GET() {
  const categories = [
    {
      id: 'pdf',
      name: 'PDF & Document Tools',
      description: 'Privacy-first document conversion, merging, splitting, and organizing.',
      totalTools: TOOLS_CATALOG.filter((t) => t.category === 'pdf').length,
      availableTools: TOOLS_CATALOG.filter((t) => t.category === 'pdf' && t.isAvailable).length,
      href: '/pdf-tools',
    },
    {
      id: 'image',
      name: 'Image & Media Tools',
      description: 'Resize, crop, convert, and optimize images directly in the browser.',
      totalTools: 0,
      availableTools: 0,
      status: 'planned',
    },
    {
      id: 'developer',
      name: 'Developer & Data Tools',
      description: 'Formatters, parsers, regex tools, and hash utilities.',
      totalTools: 0,
      availableTools: 0,
      status: 'planned',
    },
  ];

  return NextResponse.json({
    success: true,
    categories,
  });
}

