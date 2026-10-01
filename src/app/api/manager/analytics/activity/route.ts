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
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const data = analyticsDb.getRecentActivity(isNaN(limit) ? 20 : limit);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Manager API] Recent activity error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve recent activity' }, { status: 500 });
  }
}
