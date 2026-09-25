import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { jobManager } from '@/lib/jobs/jobManager';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  const job = jobManager.getJob(jobId);
  const filePath = jobManager.getJobOutputPath(jobId);

  if (!job || !filePath || !fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: 'Output file is not available or has expired.' },
      { status: 404 }
    );
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = job.outputFileName || 'converted_document';
  const mimeType = job.outputMimeType || 'application/octet-stream';

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
