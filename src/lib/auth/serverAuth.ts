import type { NextRequest } from 'next/server';
import { db, type UserRecord, type SessionRecord, type UserRole } from '@/lib/db/database';

export const MANAGER_ALLOWED_EMAILS: readonly string[] = [
  'sameerrout2004@gmail.com',
  'sonysampangi9@gmail.com',
];

/**
 * Validates whether an email belongs to the strictly authorized Manager allowlist.
 * Case-insensitive, trimmed, and normalized.
 */
export function isManagerEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.toLowerCase().trim();

  const envEmails = (process.env.MANAGER_ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  return (
    MANAGER_ALLOWED_EMAILS.includes(normalized) ||
    envEmails.includes(normalized)
  );
}

export interface AuthSuccess {
  authorized: true;
  user: UserRecord;
  session: SessionRecord;
}

export interface AuthFailure {
  authorized: false;
  status: 401 | 403;
  error: string;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Extracts and verifies the session from incoming NextRequest cookies
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ user: UserRecord; session: SessionRecord } | null> {
  try {
    const sessionCookie = request.cookies.get('toolino_session') || request.cookies.get('toolnova_session');
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const sessionData = await db.findSession(sessionCookie.value);
    if (!sessionData) {
      return null;
    }

    return sessionData;
  } catch (err) {
    console.error('[serverAuth] Error verifying session:', err);
    return null;
  }
}

/**
 * Enforces strict server-side authorization:
 * 1. User must be authenticated with a valid session.
 * 2. User's verified email must be in MANAGER_ALLOWED_EMAILS.
 * Returns 401 if unauthenticated, 403 if unauthorized.
 */
export async function requireAdminOrCoDev(request: NextRequest): Promise<AuthResult> {
  const auth = await getAuthenticatedUser(request);

  if (!auth) {
    return {
      authorized: false,
      status: 401,
      error: 'Authentication required. Please log in with an authorized manager account.',
    };
  }

  // Strict email allowlist check on the server
  if (!isManagerEmail(auth.user.email)) {
    return {
      authorized: false,
      status: 403,
      error: 'Forbidden: Access restricted strictly to authorized Toolino managers.',
    };
  }

  return {
    authorized: true,
    user: auth.user,
    session: auth.session,
  };
}
