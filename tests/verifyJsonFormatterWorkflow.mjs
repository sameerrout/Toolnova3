import assert from 'node:assert';
import {
  validateJson,
  formatJson,
  repairJson,
  sortJsonKeys,
  jsonToCsv,
  jsonToXml,
  jsonToYaml,
} from '../src/core/engine/jsonFormatterEngine.ts';

console.log('🚀 Running JSON Formatter Comprehensive Verification Suite...\n');

// 1. TEST: Valid JSON evaluation
console.log('Test 1: Valid JSON evaluation...');
const validJson = JSON.stringify({ name: 'Alice', age: 30, skills: ['JS', 'TS'], active: true, balance: null });
const val1 = validateJson(validJson);
assert.strictEqual(val1.isValid, true, 'JSON should be marked valid');
assert.strictEqual(val1.keysCount, 7, 'Recursive keys count should be 7');
assert(val1.depth >= 2, 'Nesting depth should be calculated');
console.log('  ✓ Valid JSON recognized correctly.');

// 2. TEST: Invalid JSON evaluation with line and column
console.log('\nTest 2: Invalid JSON error detection...');
const invalidJson = '{\n  "name": "Bob",\n  "age": 25,\n}'; // trailing comma
const val2 = validateJson(invalidJson);
assert.strictEqual(val2.isValid, false, 'Invalid JSON should be marked invalid');
assert(val2.line >= 1, 'Error line must be >= 1');
assert(val2.column >= 1, 'Error column must be >= 1');
assert(val2.message.length > 0, 'Error message must be present');
console.log(`  ✓ Invalid JSON caught: Line ${val2.line}, Col ${val2.column} - ${val2.message}`);

// 3. TEST: Pretty Print with 2-spaces, 4-spaces, tab
console.log('\nTest 3: Indentation options (2 spaces, 4 spaces, tab)...');
const sampleObj = { a: 1, b: { c: 2 } };
const rawStr = JSON.stringify(sampleObj);

const twoSpaces = formatJson(rawStr, '2-spaces');
assert(twoSpaces.includes('  "a": 1'), 'Should contain 2-space indentation');

const fourSpaces = formatJson(rawStr, '4-spaces');
assert(fourSpaces.includes('    "a": 1'), 'Should contain 4-space indentation');

const tabIndent = formatJson(rawStr, 'tab');
assert(tabIndent.includes('\t"a": 1'), 'Should contain tab indentation');
console.log('  ✓ Indentation options verified (2-spaces, 4-spaces, tab).');

// 4. TEST: Minification
console.log('\nTest 4: JSON Minification...');
const minified = formatJson(twoSpaces, 'minify');
assert.strictEqual(minified, '{"a":1,"b":{"c":2}}', 'Minified output should be compact with no whitespace');
console.log('  ✓ Minified output verified.');

// 5. TEST: Key sorting
console.log('\nTest 5: Recursive key sorting...');
const unsorted = '{"z": 1, "a": 2, "m": {"b": 3, "a": 4}}';
const sorted = sortJsonKeys(unsorted, 'minify');
assert.strictEqual(sorted, '{"a":2,"m":{"a":4,"b":3},"z":1}', 'Keys should be sorted alphabetically');
console.log('  ✓ Keys sorted alphabetically verified.');

// 6. TEST: Auto-repair (trailing commas, single quotes, unquoted keys)
console.log('\nTest 6: Repairing common JSON syntax errors...');
const broken = "{ name: 'Charlie', age: 35, active: True, }";
const repaired = repairJson(broken);
const repairedVal = validateJson(repaired);
assert.strictEqual(repairedVal.isValid, true, 'Repaired JSON should be valid');
console.log('  ✓ Common syntax errors automatically repaired.');

// 7. TEST: Conversions (CSV, XML, YAML)
console.log('\nTest 7: Export converters (CSV, XML, YAML)...');
const arrayJson = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
const csv = jsonToCsv(arrayJson);
assert(csv.includes('id,name'), 'CSV must include header row');
assert(csv.includes('1,Item 1'), 'CSV must include row data');

const xml = jsonToXml(sampleObj);
assert(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'XML must include declaration');
assert(xml.includes('<a>1</a>'), 'XML must include tags');

const yaml = jsonToYaml(sampleObj);
assert(yaml.includes('a: 1'), 'YAML must include key-value mapping');
console.log('  ✓ CSV, XML, and YAML converters verified.');

// 8. TEST: Live HTTP endpoint verification
console.log('\nTest 8: Verifying HTTP response of /json-formatter...');
const response = await fetch('http://localhost:3000/json-formatter');
assert.strictEqual(response.status, 200, 'Route should return HTTP 200 OK');
const html = await response.text();

// Verify Header & Redesign
assert(html.includes('JSON Formatter'), 'HTML must include JSON Formatter');
assert(html.includes('v1.0.0'), 'HTML must include v1.0.0 badge');
assert(html.includes('Your JSON stays on your device'), 'HTML must include privacy badge');
assert(html.includes('JSON Input'), 'HTML must include JSON Input editor label');
assert(html.includes('Format JSON'), 'HTML must include Format JSON button');

// Verify Footer is REMOVED
assert(!html.includes('© 2026 Toolino. All rights reserved.'), 'Footer copyright should NOT be present on json-formatter page');
assert(!html.includes('Created by Sameer Rout &amp; Sampangi Sony'), 'Footer credits should NOT be present on json-formatter page');

// Verify NO Sidebars
assert(!html.includes('sidebar-left') && !html.includes('sidebar-right'), 'No sidebar classes should be present');

console.log('  ✓ HTTP 200 verified. Header present, Footer removed, No sidebars, Layout confirmed.');

console.log('\n🎉 ALL JSON FORMATTER TESTS PASSED SUCCESSFULLY!');
