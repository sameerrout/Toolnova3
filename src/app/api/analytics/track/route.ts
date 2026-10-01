import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb, ToolEventType } from '@/lib/db/analyticsDb';

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Malformed request' }, { status: 400 });
    }

    const { type, anonymousId, sessionId, path, toolSlug, eventType } = body;

    // Strict validation
    if (!anonymousId || typeof anonymousId !== 'string' || anonymousId.length > 100) {
      return NextResponse.json({ success: false, error: 'Invalid anonymousId' }, { status: 400 });
    }

    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
      return NextResponse.json({ success: false, error: 'Invalid sessionId' }, { status: 400 });
    }

    // Rate-limiting / payload safety: Reject any unexpected giant objects or file payloads
    const payloadStr = JSON.stringify(body);
    if (payloadStr.length > 2000) {
      return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 413 });
    }

    if (type === 'pageview') {
      if (!path || typeof path !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing path for pageview' }, { status: 400 });
      }
      await analyticsDb.trackPageView({
        anonymousId,
        sessionId,
        path: path.slice(0, 250),
      });
      return NextResponse.json({ success: true });
    }

    if (type === 'toolevent') {
      if (!toolSlug || typeof toolSlug !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing toolSlug' }, { status: 400 });
      }

      const validEvents: ToolEventType[] = [
        'tool_opened',
        'tool_started',
        'tool_completed',
        'tool_failed',
      ];
      const validEventType: ToolEventType = validEvents.includes(eventType)
        ? eventType
        : 'tool_completed';

      await analyticsDb.trackToolEvent({
        anonymousId,
        sessionId,
        toolSlug: toolSlug.slice(0, 80),
        eventType: validEventType,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown event type' }, { status: 400 });
  } catch (err: any) {
    console.error('[Analytics Ingestion API] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
