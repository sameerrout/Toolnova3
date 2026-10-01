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
    const intervalParam = searchParams.get('interval') || 'daily';
    const customStart = searchParams.get('start') || undefined;
    const customEnd = searchParams.get('end') || undefined;

    const interval = ['daily', 'weekly', 'monthly', 'yearly'].includes(intervalParam)
      ? (intervalParam as 'daily' | 'weekly' | 'monthly' | 'yearly')
      : 'daily';

    const series = analyticsDb.getVisitorTrend(range, interval, customStart, customEnd);
    return NextResponse.json({ success: true, data: series });
  } catch (err: any) {
    console.error('[Manager API] Visitors trend error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve visitor trend analytics' }, { status: 500 });
  }
}
