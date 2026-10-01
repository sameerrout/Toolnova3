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
    const format = searchParams.get('format') === 'json' ? 'json' : 'csv';
    const customStart = searchParams.get('start') || undefined;
    const customEnd = searchParams.get('end') || undefined;

    const { contentType, filename, content } = analyticsDb.exportData(
      range,
      format,
      customStart,
      customEnd
    );

    // Audit log
    await analyticsDb.logAdminAction({
      adminId: auth.user.id,
      adminEmail: auth.user.email,
      action: 'EXPORT_ANALYTICS',
      details: `Exported ${format.toUpperCase()} report for range: ${range}`,
    });

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('[Manager API] Export error:', err);
    return NextResponse.json({ success: false, error: 'Failed to export analytics' }, { status: 500 });
  }
}
