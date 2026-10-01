/**
 * Verification of Real Visitor Analytics Pipeline
 * Tests the entire real data pipeline without fake or mock data.
 */

const assert = require('assert');
const { analyticsDb } = require('../src/lib/db/analyticsDb.ts');

async function run() {
  console.log('🧪 Verifying Clean Real-Time Analytics Pipeline...\n');

  // Step 1: Verify Clean 0 State
  console.log('Step 1: Checking Empty Database State...');
  analyticsDb.clearAllData();
  let overview = analyticsDb.getOverview('today');
  
  assert.strictEqual(overview.cards.totalVisitors, 0, 'Total visitors must be 0');
  assert.strictEqual(overview.cards.todayVisitors, 0, 'Today visitors must be 0');
  assert.strictEqual(overview.cards.thisMonthVisitors, 0, 'Month visitors must be 0');
  assert.strictEqual(overview.cards.thisYearVisitors, 0, 'Year visitors must be 0');
  assert.strictEqual(overview.cards.totalToolUses, 0, 'Total tool uses must be 0');
  assert.strictEqual(overview.cards.mostUsedTool.name, 'No data yet', 'Most used tool must be "No data yet"');
  assert.strictEqual(overview.cards.mostUsedTool.count, 0, 'Most used tool count must be 0');
  console.log('  ✓ Empty state verified: All metrics are strictly 0 and Most Used Tool is "No data yet"');

  // Step 2: First Real Visitor Arrives
  console.log('\nStep 2: Simulating First Real Visitor (Visits Home & Compresses an Image)...');
  const visitor1_anonId = 'anon_real_user_alpha';
  const visitor1_sessionId = 'sess_real_alpha_1';

  // Real visitor views homepage
  await analyticsDb.trackPageView({
    anonymousId: visitor1_anonId,
    sessionId: visitor1_sessionId,
    path: '/',
  });

  // Real visitor views Image Compressor page
  await analyticsDb.trackPageView({
    anonymousId: visitor1_anonId,
    sessionId: visitor1_sessionId,
    path: '/image-compressor',
  });

  // Real visitor completes an image compression
  await analyticsDb.trackToolEvent({
    anonymousId: visitor1_anonId,
    sessionId: visitor1_sessionId,
    toolSlug: 'image-compressor',
    eventType: 'tool_completed',
  });

  overview = analyticsDb.getOverview('today');
  assert.strictEqual(overview.cards.totalVisitors, 1, 'Total visitors must increment exactly to 1');
  assert.strictEqual(overview.cards.todayVisitors, 1, 'Today visitors must increment exactly to 1');
  assert.strictEqual(overview.cards.totalToolUses, 1, 'Total tool uses must increment exactly to 1');
  assert.strictEqual(overview.cards.mostUsedTool.slug, 'image-compressor');
  assert.strictEqual(overview.cards.mostUsedTool.name, 'Image Compressor');
  assert.strictEqual(overview.cards.mostUsedTool.count, 1);
  console.log('  ✓ 1st Real Visitor verified: Exactly 1 visitor, 1 tool use (Image Compressor)');

  // Step 3: Second Real Visitor Arrives
  console.log('\nStep 3: Simulating Second Real Visitor (Visits EMI Calculator & Calculates EMI)...');
  const visitor2_anonId = 'anon_real_user_beta';
  const visitor2_sessionId = 'sess_real_beta_1';

  await analyticsDb.trackPageView({
    anonymousId: visitor2_anonId,
    sessionId: visitor2_sessionId,
    path: '/emi-calculator',
  });

  await analyticsDb.trackToolEvent({
    anonymousId: visitor2_anonId,
    sessionId: visitor2_sessionId,
    toolSlug: 'emi-calculator',
    eventType: 'tool_completed',
  });

  overview = analyticsDb.getOverview('today');
  assert.strictEqual(overview.cards.totalVisitors, 2, 'Total visitors must increment exactly to 2');
  assert.strictEqual(overview.cards.todayVisitors, 2, 'Today visitors must increment exactly to 2');
  assert.strictEqual(overview.cards.totalToolUses, 2, 'Total tool uses must increment exactly to 2');
  console.log('  ✓ 2nd Real Visitor verified: Exactly 2 visitors, 2 tool uses total');

  // Step 4: Page Views & Tool Rankings Accuracy
  console.log('\nStep 4: Checking Page Views and Tool Rankings...');
  const pages = analyticsDb.getPageVisits('today');
  assert.strictEqual(pages.totalViews, 3, 'Total page views must be 3 (1 home, 1 image-compressor, 1 emi-calculator)');
  
  const tools = analyticsDb.getToolUsage('today');
  assert.strictEqual(tools.totalUses, 2, 'Total tool uses must be 2');
  assert.strictEqual(tools.tools.length, 2, 'Exactly 2 tools used');
  console.log('  ✓ Page views (3) and Tool rankings (2) match stored database events with 100% precision');

  // Step 5: Resetting Production Analytics to 0 as required
  console.log('\nStep 5: Final Reset to Pristine 0 State for Production...');
  analyticsDb.clearAllData();
  const finalOverview = analyticsDb.getOverview('today');
  assert.strictEqual(finalOverview.cards.totalVisitors, 0);
  assert.strictEqual(finalOverview.cards.totalToolUses, 0);
  assert.strictEqual(finalOverview.cards.mostUsedTool.name, 'No data yet');
  console.log('  ✓ Database reset to 0: Zero visitors, zero tool uses, clean production state');

  console.log('\n🎉 ALL REAL-TIME ANALYTICS TESTS PASSED WITH 100% SUCCESS!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
