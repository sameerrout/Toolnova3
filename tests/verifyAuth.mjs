import assert from 'node:assert';
import { db } from '../src/lib/db/database.ts';
import { hashPassword, verifyPassword, generateDefaultAvatar } from '../src/lib/auth/crypto.ts';

console.log('🔒 Running Toolnova Authentication & Database Test Suite...\n');

// 1. TEST: Password Hashing & Verification
console.log('Test 1: Password Hashing and Timing-Safe Verification...');
const password = 'SuperSecretPassword123!';
const { hash, salt } = hashPassword(password);
assert(hash && hash.length === 128, 'Hash should be 128 hex chars');
assert(salt && salt.length === 32, 'Salt should be 32 hex chars');

const isValid = verifyPassword(password, salt, hash);
assert.strictEqual(isValid, true, 'Password verification should succeed for valid password');

const isInvalid = verifyPassword('WrongPassword!', salt, hash);
assert.strictEqual(isInvalid, false, 'Password verification should fail for invalid password');
console.log('  ✓ Password hashing and verification passed');

// 2. TEST: Avatar Generation
console.log('\nTest 2: Default Avatar SVG Generation...');
const avatar = generateDefaultAvatar('Sameer Rout');
assert(avatar.startsWith('data:image/svg+xml'), 'Avatar should be an SVG data URI');
assert(avatar.includes('S'), 'Avatar should include initial S');
console.log('  ✓ Generated default avatar successfully');

// 3. TEST: Database User Creation & Retrieval
console.log('\nTest 3: Database User Creation & Unique Email Lookup...');
const testEmail = `testuser_${Date.now()}@example.com`;
const user = await db.createUser({
    name: 'Test User',
    email: testEmail,
    password_hash: hash,
    salt,
    profile_image: avatar,
    auth_provider: 'local',
});

assert(user.id, 'User should receive a generated UUID');
assert.strictEqual(user.email, testEmail);

const retrieved = await db.findUserByEmail(testEmail);
assert(retrieved !== null, 'User should be found by email');
assert.strictEqual(retrieved.id, user.id);
console.log('  ✓ Created and retrieved user record from database');

// 4. TEST: Session Creation, Retrieval & Invalidation
console.log('\nTest 4: Session Creation, Validation, and Invalidation...');
const session = await db.createSession(user.id);
assert(session.token && session.token.length === 64, 'Session token should be 64 hex chars');

const sessionLookup = await db.findSession(session.token);
assert(sessionLookup !== null, 'Session should be valid and found');
assert.strictEqual(sessionLookup.user.id, user.id);
console.log('  ✓ Session created and verified successfully');

await db.deleteSession(session.token);
const sessionAfterDelete = await db.findSession(session.token);
assert.strictEqual(sessionAfterDelete, null, 'Session should be invalidated after deletion');
console.log('  ✓ Session deleted/invalidated successfully');

console.log('\n🎉 ALL TOOLNOVA AUTHENTICATION & DATABASE TESTS PASSED WITH 100% SUCCESS!\n');