import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/database';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('toolnova_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, user: null });
    }

    const sessionData = await db.findSession(sessionCookie.value);
    if (!sessionData) {
      // Clear invalid cookie
      const response = NextResponse.json({ success: false, user: null });
      response.cookies.delete('toolnova_session');
      return response;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: sessionData.user.id,
        name: sessionData.user.name,
        email: sessionData.user.email,
        profile_image: sessionData.user.profile_image,
        auth_provider: sessionData.user.auth_provider,
      },
    });
  } catch (err: unknown) {
    console.error('Session verification error:', err);
    return NextResponse.json({ success: false, user: null });
  }
}

