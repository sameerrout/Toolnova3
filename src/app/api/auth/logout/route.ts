import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('toolnova_session');
    if (sessionCookie?.value) {
      await db.deleteSession(sessionCookie.value);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'toolnova_session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Immediately expire
    });

    return response;
  } catch (err: unknown) {
    console.error('Logout error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

