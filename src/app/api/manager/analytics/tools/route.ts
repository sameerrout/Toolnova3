import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrCoDev } from '@/lib/auth/serverAuth';
import { analyticsDb } from '@/lib/db/analyticsDb';

export async function GET(request: NextRequest) {
  const auth = await requireAdminOrCoDev(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const sortParam = searchParams.get('sort') || 'most';
    const customStart = searchParams.get('start') || undefined;
    const customEnd = searchParams.get('end') || undefined;

    const sort = ['most', 'least', 'alpha'].includes(sortParam)
      ? (sortParam as 'most' | 'least' | 'alpha')
      : 'most';

    const data = analyticsDb.getToolUsage(range, sort, customStart, customEnd);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Manager API] Tool usage error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve tool usage analytics' }, { status: 500 });
  }
}
