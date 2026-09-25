import { NextRequest, NextResponse } from 'next/server';
import { jobManager } from '@/lib/jobs/jobManager';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const toolId = formData.get('toolId') as string | null;
    const optionsRaw = formData.get('options') as string | null;

    if (!file || !toolId) {
      return NextResponse.json(
        { error: 'Missing required file or toolId parameter.' },
        { status: 400 }
      );
    }

    // Security: Maximum file size limit (100MB for server processing)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          errorCode: 'FILE_TOO_LARGE',
          error: 'File exceeds maximum allowed upload size (100MB).',
        },
        { status: 413 }
      );
    }

    let options = {};
    if (optionsRaw) {
      try {
        options = JSON.parse(optionsRaw);
      } catch {}
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const jobMeta = await jobManager.createJob(toolId, file.name, buffer, options);

    return NextResponse.json(
      {
        jobId: jobMeta.jobId,
        status: jobMeta.status,
        progress: jobMeta.progress,
        stage: jobMeta.stage,
      },
      { status: 202 }
    );
  } catch (err: any) {
    console.error('[API /api/jobs POST error]:', err);
    return NextResponse.json(
      {
        errorCode: 'PROCESSING_FAILED',
        error: 'Failed to initialize processing job.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    engine: 'Toolnova Unified API Gateway',
    timestamp: Date.now(),
  });
}
