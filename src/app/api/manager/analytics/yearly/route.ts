import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrCoDev } from '@/lib/auth/serverAuth';
import { analyticsDb } from '@/lib/db/analyticsDb';

export async function GET(request: NextRequest) {
  const auth = await requireAdminOrCoDev(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const data = analyticsDb.getYearlyVisitors();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Manager API] Yearly analytics error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve yearly analytics' }, { status: 500 });
  }
}
