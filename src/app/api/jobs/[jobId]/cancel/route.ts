import { NextRequest, NextResponse } from 'next/server';
import { jobManager } from '@/lib/jobs/jobManager';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  const cancelled = await jobManager.cancelJob(jobId);

  if (!cancelled) {
    return NextResponse.json(
      { error: 'Job could not be cancelled or was not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    jobId,
    status: 'cancelled',
    message: 'Job was successfully cancelled and temporary storage purged.',
  });
}
