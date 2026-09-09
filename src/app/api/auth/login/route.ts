import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { verifyPassword } from '@/lib/auth/crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide both email and password.' },
        { status: 400 }
      );
    }

    // 1. Look up user
    const user = await db.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password. Please try again.' },
        { status: 401 }
      );
    }

    // 2. Verify password
    const isValid = verifyPassword(password, user.salt, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password. Please try again.' },
        { status: 401 }
      );
    }

    // 3. Create Session
    const session = await db.createSession(user.id);

    // 4. Return response with HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_image: user.profile_image,
        auth_provider: user.auth_provider,
      },
    });

    response.cookies.set({
      name: 'toolnova_session',
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: unknown) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}

