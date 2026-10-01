import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrCoDev } from '@/lib/auth/serverAuth';
import { analyticsDb } from '@/lib/db/analyticsDb';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ toolSlug: string }> }
) {
  const auth = await requireAdminOrCoDev(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { toolSlug } = await context.params;
    if (!toolSlug) {
      return NextResponse.json({ success: false, error: 'Missing toolSlug' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const customStart = searchParams.get('start') || undefined;
    const customEnd = searchParams.get('end') || undefined;

    const data = analyticsDb.getIndividualToolAnalytics(toolSlug, range, customStart, customEnd);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Manager API] Individual tool error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve tool analytics' }, { status: 500 });
  }
}
