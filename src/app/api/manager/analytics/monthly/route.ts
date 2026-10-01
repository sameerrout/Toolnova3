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
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    const data = analyticsDb.getMonthlyVisitors(isNaN(year) ? new Date().getFullYear() : year);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Manager API] Monthly analytics error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve monthly analytics' }, { status: 500 });
  }
}
