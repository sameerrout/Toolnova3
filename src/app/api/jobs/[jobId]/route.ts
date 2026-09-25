import { NextRequest, NextResponse } from 'next/server';
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

  if (!job) {
    return NextResponse.json(
      {
        errorCode: 'JOB_NOT_FOUND',
        error: 'The requested job was not found or has expired.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    jobId: job.jobId,
    toolId: job.toolId,
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    output: job.outputFileName
      ? {
          fileName: job.outputFileName,
          sizeBytes: job.outputFileSize,
          mimeType: job.outputMimeType,
          downloadUrl: `/api/jobs/${job.jobId}/download`,
        }
      : null,
    error: job.errorCode
      ? {
          code: job.errorCode,
          message: job.errorMessage,
        }
      : null,
  });
}
