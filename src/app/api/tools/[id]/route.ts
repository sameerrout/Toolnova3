import { NextRequest, NextResponse } from 'next/server';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';
import { toolRegistry } from '@/core/registry/toolRegistry';
import '@/tools';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Check active tool implementation in registry
  const tool = toolRegistry.get(id);
  if (tool) {
    return NextResponse.json({
      success: true,
      manifest: tool.manifest,
      isAvailable: true,
    });
  }

  // 2. Check catalog metadata for upcoming tools
  const catalogItem = TOOLS_CATALOG.find((t) => t.id === id);
  if (catalogItem) {
    return NextResponse.json({
      success: true,
      item: catalogItem,
      isAvailable: false,
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: `Tool with id "${id}" not found.`,
    },
    { status: 404 }
  );
}

