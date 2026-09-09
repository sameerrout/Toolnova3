import React from 'react';
import { notFound } from 'next/navigation';
import { ToolRunner } from '@/components/tools/ToolRunner';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';

interface ToolPageProps {
  params: Promise<{
    toolId: string;
  }>;
}

// Generate static params for available catalog tools
export async function generateStaticParams() {
  return TOOLS_CATALOG.filter((t) => t.isAvailable).map((tool) => ({
    toolId: tool.id,
  }));
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolId } = await params;

  // Basic check from catalog
  const catalogItem = TOOLS_CATALOG.find((t) => t.id === toolId);
  if (!catalogItem || !catalogItem.isAvailable) {
    notFound();
  }

  return <ToolRunner toolId={toolId} />;
}

