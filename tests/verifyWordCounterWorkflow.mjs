import assert from 'node:assert';
import {
  calculateTextMetrics,
  calculateReadability,
  calculateKeywordDensity,
  calculateSocialLimits,
  transformCase,
  cleanText,
} from '../src/core/engine/wordCounterEngine.ts';

console.log('🚀 Running Word Counter Comprehensive Verification Suite...\n');

// 1. TEST: Empty string handling
console.log('Test 1: Empty text metrics...');
const emptyMetrics = calculateTextMetrics('');
assert.strictEqual(emptyMetrics.words, 0, 'Words should be 0 for empty text');
assert.strictEqual(emptyMetrics.charactersWithSpaces, 0, 'Characters should be 0');
assert.strictEqual(emptyMetrics.charactersWithoutSpaces, 0, 'Characters without spaces should be 0');
assert.strictEqual(emptyMetrics.sentences, 0, 'Sentences should be 0');
assert.strictEqual(emptyMetrics.paragraphs, 0, 'Paragraphs should be 0');
assert.strictEqual(emptyMetrics.lines, 0, 'Lines should be 0');
assert.strictEqual(emptyMetrics.readingTimeString, '0 sec', 'Reading time should be 0 sec');
assert.strictEqual(emptyMetrics.speakingTimeString, '0 sec', 'Speaking time should be 0 sec');
console.log('  ✓ Empty state verified correctly with all zero metrics.');

// 2. TEST: Basic phrase "Hello world."
console.log('\nTest 2: Basic sentence "Hello world."...');
const basicMetrics = calculateTextMetrics('Hello world.');
assert.strictEqual(basicMetrics.words, 2, 'Words should be 2');
assert.strictEqual(basicMetrics.charactersWithSpaces, 12, 'Characters with spaces should be 12');
assert.strictEqual(basicMetrics.charactersWithoutSpaces, 11, 'Characters without spaces should be 11');
assert.strictEqual(basicMetrics.sentences, 1, 'Sentences should be 1');
assert.strictEqual(basicMetrics.paragraphs, 1, 'Paragraphs should be 1');
console.log('  ✓ "Hello world." verified: 2 words, 12 chars, 1 sentence.');

// 3. TEST: Multiple whitespaces, tabs, and line breaks
console.log('\nTest 3: Whitespace resilience...');
const spacedMetrics = calculateTextMetrics('   Hello     world!    \n\n   This is    Toollino.   ');
assert.strictEqual(spacedMetrics.words, 5, 'Words should be 5 despite multi-spaces and newlines');
assert.strictEqual(spacedMetrics.sentences, 2, 'Sentences should be 2');
assert.strictEqual(spacedMetrics.paragraphs, 2, 'Paragraphs should be 2');
console.log('  ✓ Whitespace handled correctly without counting extra spaces as words.');

// 4. TEST: Case transforms
console.log('\nTest 4: Case transformations...');
assert.strictEqual(transformCase('hello world', 'upper'), 'HELLO WORLD');
assert.strictEqual(transformCase('HELLO WORLD', 'lower'), 'hello world');
assert.strictEqual(transformCase('hello world', 'title'), 'Hello World');
assert.strictEqual(transformCase('hello world', 'camel'), 'helloWorld');
console.log('  ✓ Case transformations verified.');

// 5. TEST: Text cleanup
console.log('\nTest 5: Text cleanup utilities...');
assert.strictEqual(cleanText('Hello   world   test', 'trim-spaces'), 'Hello world test');
assert.strictEqual(cleanText('Line 1\n\n\nLine 2', 'remove-empty-lines'), 'Line 1\nLine 2');
console.log('  ✓ Text clean-up utilities verified.');

// 6. TEST: Readability calculations
console.log('\nTest 6: Flesch readability calculation...');
const sampleText = 'In modern software engineering, privacy-first web applications represent a critical paradigm shift.';
const sampleMetrics = calculateTextMetrics(sampleText);
const readability = calculateReadability(sampleText, sampleMetrics);
assert(readability.fleschReadingEase >= 0 && readability.fleschReadingEase <= 100, 'Score should be between 0 and 100');
assert(readability.readingEaseLabel.length > 0, 'Reading ease label should be present');
console.log(`  ✓ Flesch Reading Ease: ${readability.fleschReadingEase} (${readability.readingEaseLabel})`);

// 7. TEST: Keyword density & n-grams
console.log('\nTest 7: Keyword density & top words...');
const keywordText = 'apple banana apple orange apple banana grape';
const top1 = calculateKeywordDensity(keywordText, 1, false, 5);
assert.strictEqual(top1[0].phrase, 'apple');
assert.strictEqual(top1[0].count, 3);
console.log(`  ✓ Top keyword: "${top1[0].phrase}" count: ${top1[0].count}, density: ${top1[0].density}%`);

// 8. TEST: Social media limits
console.log('\nTest 8: Social media character limits...');
const limits = calculateSocialLimits('Short post for Twitter/X');
const twitter = limits.find((l) => l.platform.includes('Twitter'));
assert(twitter, 'Twitter limit should exist');
assert.strictEqual(twitter.isOver, false, 'Short post should not be over Twitter limit');
console.log(`  ✓ Social limits verified: ${twitter.current}/${twitter.max} characters used.`);

// 9. TEST: Live HTTP endpoint verification
console.log('\nTest 9: Verifying HTTP response of /word-counter...');
const response = await fetch('http://localhost:3000/word-counter');
assert.strictEqual(response.status, 200, 'Route should return HTTP 200 OK');
const html = await response.text();

// Verify Header & Redesign
assert(html.includes('Word Counter'), 'HTML must include Word Counter');
assert(html.includes('v1.0.0'), 'HTML must include v1.0.0 badge');
assert(html.includes('Your text stays on your device'), 'HTML must include privacy badge');
assert(html.includes('Your Text'), 'HTML must include Your Text editor label');
assert(html.includes('Live Statistics'), 'HTML must include Live Statistics');

// Verify Footer is REMOVED
assert(!html.includes('© 2026 Toolino. All rights reserved.'), 'Footer copyright should NOT be present on word-counter page');
assert(!html.includes('Created by Sameer Rout &amp; Sampangi Sony'), 'Footer credits should NOT be present on word-counter page');

// Verify NO Sidebars
assert(!html.includes('sidebar-left') && !html.includes('sidebar-right'), 'No sidebar classes should be present');

console.log('  ✓ HTTP 200 verified. Header present, Footer removed, No sidebars, Layout confirmed.');

console.log('\n🎉 ALL WORD COUNTER TESTS PASSED SUCCESSFULLY!');
