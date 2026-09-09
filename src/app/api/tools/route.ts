import { NextRequest, NextResponse } from 'next/server';
import { TOOLS_CATALOG } from '@/data/toolsCatalog';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const mode = searchParams.get('mode');
  const query = searchParams.get('q')?.toLowerCase().trim();

  let tools = [...TOOLS_CATALOG];

  if (category) {
    tools = tools.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  }

  if (mode) {
    tools = tools.filter((t) => t.executionMode.toLowerCase() === mode.toLowerCase());
  }

  if (query) {
    tools = tools.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.inputFormats.some((f) => f.toLowerCase().includes(query)) ||
        t.outputFormats.some((f) => f.toLowerCase().includes(query))
    );
  }

  return NextResponse.json({
    success: true,
    count: tools.length,
    tools,
  });
}

