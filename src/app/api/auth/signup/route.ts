import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { hashPassword, generateDefaultAvatar } from '@/lib/auth/crypto';
import { isManagerEmail } from '@/lib/auth/serverAuth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid name (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match. Please re-enter.' },
        { status: 400 }
      );
    }

    // 2. Prevent duplicate email
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    // 3. Hash password and generate avatar
    const { hash, salt } = hashPassword(password);
    const profileImage = generateDefaultAvatar(name);

    // 4. Save to DB
    const user = await db.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hash,
      salt,
      profile_image: profileImage,
      auth_provider: 'local',
    });

    // 5. Create Session
    const session = await db.createSession(user.id);

    // 6. Return response with HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_image: user.profile_image,
        auth_provider: user.auth_provider,
        role: user.role || 'USER',
        managerAccess: isManagerEmail(user.email),
      },
    });

    response.cookies.set({
      name: 'toolino_session',
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
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
    console.error('Signup error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during signup. Please try again.' },
      { status: 500 }
    );
  }
}

