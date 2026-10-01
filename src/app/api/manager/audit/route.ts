import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrCoDev } from '@/lib/auth/serverAuth';
import { analyticsDb } from '@/lib/db/analyticsDb';

export async function GET(request: NextRequest) {
  const auth = await requireAdminOrCoDev(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const logs = await analyticsDb.getAuditLogs(50);
    return NextResponse.json({ success: true, data: logs });
  } catch (err: any) {
    console.error('[Manager API] Audit logs error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve audit logs' }, { status: 500 });
  }
}
