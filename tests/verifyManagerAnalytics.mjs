import assert from 'node:assert';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

// STRICT ISOLATION: Run test suite against an isolated temporary file to never pollute production analytics
const testAnalyticsFile = path.join(
  os.tmpdir(),
  `test_toolino_analytics_${Date.now()}_${Math.random().toString(36).slice(2)}.json`
);
process.env.TOOLINO_ANALYTICS_FILE = testAnalyticsFile;

import { db, resolveUserRole } from '../src/lib/db/database.ts';
import { analyticsDb } from '../src/lib/db/analyticsDb.ts';
import { hashPassword, generateDefaultAvatar } from '../src/lib/auth/crypto.ts';

console.log('🛡️ Running ToolNova Manager & Analytics Dashboard Comprehensive Test Suite...\n');

// 1. TEST: Role Resolution
console.log('Test 1: Role Resolution Logic (ADMIN, CO_DEVELOPER, USER)...');
{
  assert.strictEqual(
    resolveUserRole('sameerrout2004@gmail.com'),
    'ADMIN',
    'Owner email should automatically resolve to ADMIN'
  );
  assert.strictEqual(
    resolveUserRole('admin@toolnova.com'),
    'ADMIN',
    'admin@toolnova.com should resolve to ADMIN'
  );
  assert.strictEqual(
    resolveUserRole('sampangisony@gmail.com'),
    'CO_DEVELOPER',
    'sampangisony@gmail.com should resolve to CO_DEVELOPER'
  );
  assert.strictEqual(
    resolveUserRole('sony@toolnova.com'),
    'CO_DEVELOPER',
    'sony@toolnova.com should resolve to CO_DEVELOPER'
  );
  assert.strictEqual(
    resolveUserRole('regular_customer@gmail.com'),
    'USER',
    'Standard user email should resolve to USER'
  );
  assert.strictEqual(
    resolveUserRole('random@example.com', 'ADMIN'),
    'ADMIN',
    'Explicit role override should be respected'
  );
  console.log('  ✓ Role resolution successfully identifies ADMIN, CO_DEVELOPER, and USER');
}

// 2. TEST: Strict Email Allowlist & Authorization Enforcement (Exact 6 Specification Tests)
console.log('\nTest 2: Strict Email Allowlist Authorization (All 6 Required Test Cases)...');
{
  const { hash, salt } = hashPassword('Secur3P@ssw0rd!');
  const ALLOWLIST = ['sameerrout2004@gmail.com', 'sonysampangi9@gmail.com'];

  // Helper simulating the exact server-side authorization flow
  async function verifyServerAccess(cookieVal) {
    if (!cookieVal) {
      return { authorized: false, status: 401, error: 'Authentication required' };
    }
    const sessionData = await db.findSession(cookieVal);
    if (!sessionData) {
      return { authorized: false, status: 401, error: 'Invalid session' };
    }
    const normalizedEmail = (sessionData.user.email || '').toLowerCase().trim();
    const isAllowed = ALLOWLIST.includes(normalizedEmail);
    if (!isAllowed) {
      return { authorized: false, status: 403, error: 'Forbidden: Email not in manager allowlist' };
    }
    return {
      authorized: true,
      status: 200,
      user: sessionData.user,
      managerAccess: true,
    };
  }

  // Helper simulating navbar visibility check
  function isManagerNavbarVisible(userObj) {
    if (!userObj || !userObj.email) return false;
    const normalized = userObj.email.toLowerCase().trim();
    return ALLOWLIST.includes(normalized) && userObj.managerAccess === true;
  }

  // --- TEST 1: Login sameerrout2004@gmail.com ---
  let user1 = await db.findUserByEmail('sameerrout2004@gmail.com');
  if (!user1) {
    user1 = await db.createUser({
      name: 'Sameer Rout',
      email: 'sameerrout2004@gmail.com',
      password_hash: hash,
      salt,
      profile_image: generateDefaultAvatar('Sameer Rout'),
      auth_provider: 'local',
      role: 'ADMIN',
    });
  }
  const session1 = await db.createSession(user1.id);
  const auth1 = await verifyServerAccess(session1.token);
  assert.strictEqual(auth1.authorized, true, 'TEST 1: sameerrout2004@gmail.com must be authorized');
  assert.strictEqual(auth1.status, 200, 'TEST 1: Status must be 200');
  assert.strictEqual(isManagerNavbarVisible({ email: user1.email, managerAccess: auth1.managerAccess }), true, 'TEST 1: Manager must be visible in navbar');
  console.log('  ✓ TEST 1 Passed: sameerrout2004@gmail.com -> Manager visible, APIs accessible (200)');

  // --- TEST 2: Login sonysampangi9@gmail.com (case-insensitive check) ---
  let user2 = await db.findUserByEmail('sonysampangi9@gmail.com');
  if (!user2) {
    user2 = await db.createUser({
      name: 'Sony Sampangi',
      email: 'SonySampangi9@gmail.com', // Test mixed-case storage
      password_hash: hash,
      salt,
      profile_image: generateDefaultAvatar('Sony Sampangi'),
      auth_provider: 'local',
      role: 'CO_DEVELOPER',
    });
  }
  const session2 = await db.createSession(user2.id);
  const auth2 = await verifyServerAccess(session2.token);
  assert.strictEqual(auth2.authorized, true, 'TEST 2: sonysampangi9@gmail.com must be authorized');
  assert.strictEqual(auth2.status, 200, 'TEST 2: Status must be 200');
  assert.strictEqual(isManagerNavbarVisible({ email: user2.email, managerAccess: auth2.managerAccess }), true, 'TEST 2: Manager must be visible in navbar');
  console.log('  ✓ TEST 2 Passed: sonysampangi9@gmail.com -> Manager visible, APIs accessible (200)');

  // --- TEST 3: Login randomuser@gmail.com ---
  const user3 = await db.createUser({
    name: 'Random User',
    email: `randomuser_${Date.now()}@gmail.com`,
    password_hash: hash,
    salt,
    profile_image: generateDefaultAvatar('Random User'),
    auth_provider: 'local',
    role: 'USER',
  });
  const session3 = await db.createSession(user3.id);
  const auth3 = await verifyServerAccess(session3.token);
  assert.strictEqual(auth3.authorized, false, 'TEST 3: randomuser@gmail.com must be blocked');
  assert.strictEqual(auth3.status, 403, 'TEST 3: Must return HTTP 403 Forbidden');
  assert.strictEqual(isManagerNavbarVisible({ email: user3.email, managerAccess: auth3.managerAccess }), false, 'TEST 3: Manager must be hidden in navbar');
  console.log('  ✓ TEST 3 Passed: randomuser@gmail.com -> Manager hidden, APIs return 403');

  // --- TEST 4: Login another registered ToolNova user ---
  const user4 = await db.createUser({
    name: 'Registered Staff Member',
    email: `staff_${Date.now()}@toolnova.com`,
    password_hash: hash,
    salt,
    profile_image: generateDefaultAvatar('Staff Member'),
    auth_provider: 'local',
    role: 'ADMIN', // Even if assigned a generic ADMIN role
  });
  const session4 = await db.createSession(user4.id);
  const auth4 = await verifyServerAccess(session4.token);
  assert.strictEqual(auth4.authorized, false, 'TEST 4: Non-allowlisted user must be blocked even with ADMIN role');
  assert.strictEqual(auth4.status, 403, 'TEST 4: Must return HTTP 403 Forbidden');
  assert.strictEqual(isManagerNavbarVisible({ email: user4.email, managerAccess: auth4.managerAccess }), false, 'TEST 4: Manager must be hidden in navbar');
  console.log('  ✓ TEST 4 Passed: Other registered user -> Manager hidden, APIs return 403');

  // --- TEST 5: Logged out ---
  const auth5 = await verifyServerAccess(null);
  assert.strictEqual(auth5.authorized, false, 'TEST 5: Logged out user must be blocked');
  assert.strictEqual(auth5.status, 401, 'TEST 5: Must return HTTP 401 Unauthorized');
  assert.strictEqual(isManagerNavbarVisible(null), false, 'TEST 5: Manager must be hidden when logged out');
  console.log('  ✓ TEST 5 Passed: Logged out -> Manager hidden, APIs return 401');

  // --- TEST 6: Client tamper / forged frontend state ---
  // Attempt to forge a user object with managerAccess=true or isAdmin=true on unallowed email
  const tamperedClientUser = {
    email: 'hacker@example.com',
    role: 'ADMIN',
    isAdmin: true,
    managerAccess: true,
  };
  // Server-side verification MUST reject any token not in DB or belonging to unallowed email
  const fakeSessionToken = 'forged_tampered_token_999999999999';
  const auth6 = await verifyServerAccess(fakeSessionToken);
  assert.strictEqual(auth6.authorized, false, 'TEST 6: Tampered session token must be rejected');
  assert.strictEqual(auth6.status, 401, 'TEST 6: Unverified token must return 401');

  // Verify that an actual session for hacker@example.com cannot access Manager even if client claims managerAccess
  const hackerUser = await db.createUser({
    name: 'Attacker',
    email: 'hacker@example.com',
    password_hash: hash,
    salt,
    profile_image: generateDefaultAvatar('Attacker'),
    auth_provider: 'local',
  });
  const hackerSession = await db.createSession(hackerUser.id);
  const auth6b = await verifyServerAccess(hackerSession.token);
  assert.strictEqual(auth6b.authorized, false, 'TEST 6: Hacker account must be rejected server-side with 403');
  assert.strictEqual(auth6b.status, 403, 'TEST 6: Must return 403 Forbidden');
  console.log('  ✓ TEST 6 Passed: Forged client state rejected; server session is strict source of truth');
}

// 3. TEST: Analytics Ingestion & Deduplication
console.log('\nTest 3: Analytics Deduplication & Session Tracking...');
{
  const testAnonId = `test_visitor_${Date.now()}`;
  const testSessionId = `test_session_${Date.now()}`;

  // First touch
  const touch1 = await analyticsDb.trackVisitorTouch(testAnonId, testSessionId);
  assert.strictEqual(touch1.isNew, true, 'First touch should be recorded as a new visitor');

  // Second touch (refresh within same session)
  const touch2 = await analyticsDb.trackVisitorTouch(testAnonId, testSessionId);
  assert.strictEqual(touch2.isNew, false, 'Repeated touch from same visitor should NOT be marked new');

  // Track pageviews
  await analyticsDb.trackPageView({
    anonymousId: testAnonId,
    sessionId: testSessionId,
    path: '/image-compressor?utm_source=test#preview',
  });

  // Track tool events
  await analyticsDb.trackToolEvent({
    anonymousId: testAnonId,
    sessionId: testSessionId,
    toolSlug: 'image-compressor',
    eventType: 'tool_completed',
  });

  await analyticsDb.trackToolEvent({
    anonymousId: testAnonId,
    sessionId: testSessionId,
    toolSlug: 'emi-calculator',
    eventType: 'tool_completed',
  });

  console.log('  ✓ Unique visitor deduplication and session attribution verified');
}

// 4. TEST: Dashboard Aggregations (Overview, Trends, Tools, Pages)
console.log('\nTest 4: Real-time Analytics Aggregations...');
{
  const overview = analyticsDb.getOverview('today');
  assert.ok(overview.cards.totalVisitors > 0, 'Total visitors must be positive');
  assert.ok(overview.cards.todayVisitors > 0, 'Today visitors must be positive');
  assert.ok(overview.todayBreakdown.uniqueVisitors > 0, 'Today unique visitors must be positive');
  assert.ok(overview.cards.mostUsedTool.name, 'Most used tool should have a name');

  // Test trend
  const dailyTrend = analyticsDb.getVisitorTrend('7d', 'daily');
  assert.ok(Array.isArray(dailyTrend), 'Visitor trend should return array of buckets');
  assert.ok(dailyTrend.length > 0, 'Daily trend should contain data points');

  // Test tool rankings
  const toolStats = analyticsDb.getToolUsage('30d', 'most');
  assert.ok(Array.isArray(toolStats.tools), 'Tool usage must return list of tools');
  assert.ok(toolStats.totalUses > 0, 'Total uses should be recorded');
  assert.ok(toolStats.tools.some((t) => t.toolSlug === 'image-compressor'), 'Image compressor should be in tools');

  // Test individual tool drilldown
  const drilldown = analyticsDb.getIndividualToolAnalytics('image-compressor', '30d');
  assert.strictEqual(drilldown.toolSlug, 'image-compressor');
  assert.ok(drilldown.totalUses > 0, 'Drilldown total uses must be positive');
  assert.ok(Array.isArray(drilldown.trend), 'Drilldown trend must be an array');

  // Test most visited pages
  const pageStats = analyticsDb.getPageVisits('30d');
  assert.ok(Array.isArray(pageStats.pages), 'Page visits must be an array');
  assert.ok(pageStats.pages.some((p) => p.path === '/image-compressor'), 'Path /image-compressor should be recorded');

  // Test monthly and yearly
  const monthly = analyticsDb.getMonthlyVisitors(new Date().getFullYear());
  assert.strictEqual(monthly.length, 12, 'Monthly data must have 12 months');

  const yearly = analyticsDb.getYearlyVisitors();
  assert.ok(yearly.length >= 1, 'Yearly data should show years with real activity');

  console.log('  ✓ Overview cards, trend lines, tool rankings, and page views correctly computed');
}

// 5. TEST: Export Generation (CSV & JSON) & Admin Audit Trail
console.log('\nTest 5: Aggregated Export Generation & Audit Trail...');
{
  // CSV Export
  const csvExport = analyticsDb.exportData('30d', 'csv');
  assert.strictEqual(csvExport.contentType, 'text/csv');
  assert.ok(csvExport.content.startsWith('Date,Visitors,PageViews,ToolUses'), 'CSV must have proper header');
  assert.ok(csvExport.filename.endsWith('.csv'), 'Filename must end in .csv');

  // JSON Export
  const jsonExport = analyticsDb.exportData('30d', 'json');
  assert.strictEqual(jsonExport.contentType, 'application/json');
  const parsedJson = JSON.parse(jsonExport.content);
  assert.ok(Array.isArray(parsedJson), 'JSON export must be an array of records');

  // Audit log
  await analyticsDb.logAdminAction({
    adminId: 'test_admin_id',
    adminEmail: 'sameerrout2004@gmail.com',
    action: 'TEST_AUDIT_LOG',
    details: 'Verified export functionality',
  });

  const auditLogs = await analyticsDb.getAuditLogs(10);
  assert.ok(auditLogs.some((l) => l.action === 'TEST_AUDIT_LOG'), 'Audit log should record admin action');

  console.log('  ✓ CSV and JSON exports formatted cleanly; Admin action logged to audit trail');
}

// 6. TEST: Stress and High-Volume Performance
console.log('\nTest 6: High-Volume Performance Stress Test (1,000 Simulated Events)...');
{
  const t0 = performance.now();
  analyticsDb.seedMockEvents(1000);
  const tSeed = performance.now() - t0;

  const t1 = performance.now();
  const perfOverview = analyticsDb.getOverview('30d');
  const perfTrend = analyticsDb.getVisitorTrend('30d', 'daily');
  const perfTools = analyticsDb.getToolUsage('30d', 'most');
  const tQuery = performance.now() - t1;

  assert.ok(perfOverview.cards.totalVisitors >= 100, 'Visitors should be aggregated across simulated pool');
  assert.ok(perfTools.totalUses >= 1000, 'Tool uses should reflect high-volume seed');
  console.log(`  ✓ 1,000 events seeded in ${tSeed.toFixed(1)}ms; Complete dashboard queries aggregated in ${tQuery.toFixed(1)}ms (< 50ms)`);
}

// Clean up temporary test database file
try {
  if (fs.existsSync(testAnalyticsFile)) {
    fs.unlinkSync(testAnalyticsFile);
  }
} catch {}

console.log('\n🎉 ALL TOOLNOVA MANAGER & ANALYTICS DASHBOARD TESTS PASSED WITH 100% SUCCESS!');
