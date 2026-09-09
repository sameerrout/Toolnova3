import crypto from 'node:crypto';

const KEY_LEN = 64;
const ITERATIONS = 100000;
const DIGEST = 'sha512';

/**
 * Hashes a plain-text password using PBKDF2 with a randomly generated salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

/**
 * Verifies a password against the stored salt and hash using timing-safe comparison.
 */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    if (derivedKey.length !== expectedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedKey, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generates an SVG data URI avatar based on the user's name and initial.
 */
export function generateDefaultAvatar(name: string): string {
  const initial = (name.trim().charAt(0) || 'U').toUpperCase();
  const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="50" fill="${color}"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="bold">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

