import { describe, it, expect } from 'vitest';
import { analyseText } from '@/tools/word-counter/engine';

describe('Text Tools & String Analysis', () => {
  it('counts words, characters, sentences, and paragraphs accurately', () => {
    const text = 'Hello world! This is a test paragraph.\n\nHere is paragraph two.';
    const stats = analyseText(text);

    expect(stats.words).toBe(11);
    expect(stats.paragraphs).toBe(2);
    expect(stats.sentences).toBe(3);
    expect(stats.characters).toBe(text.length);
    expect(stats.charactersNoSpaces).toBeLessThan(text.length);
    expect(stats.readingTimeMinutes).toBeGreaterThan(0);
    expect(stats.speakingTimeMinutes).toBeGreaterThan(0);
  });

  it('handles empty strings and whitespace-only text gracefully', () => {
    const stats = analyseText('   \n\t  ');
    expect(stats.words).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.paragraphs).toBe(0);
  });

  it('validates and minifies JSON format', () => {
    const raw = '{\n  "name": "Toolnova",\n  "tools": 27\n}';
    const parsed = JSON.parse(raw);
    const minified = JSON.stringify(parsed);

    expect(minified).toBe('{"name":"Toolnova","tools":27}');
    expect(JSON.stringify(parsed, null, 2)).toContain('  "name": "Toolnova"');
  });

  it('validates India PIN Code hierarchy dataset and lookups', async () => {
    const { INDIA_PINCODE_DATA } = await import('@/tools/pin-code-lookup/pincodeData');
    expect(INDIA_PINCODE_DATA.length).toBeGreaterThan(5);

    const mh = INDIA_PINCODE_DATA.find((s) => s.name === 'Maharashtra');
    expect(mh).toBeDefined();

    const mumbai = mh?.districts.find((d) => d.name.includes('Mumbai'));
    expect(mumbai).toBeDefined();

    const southMumbai = mumbai?.subDistricts.find((sd) => sd.name === 'Mumbai South');
    expect(southMumbai).toBeDefined();

    const fort = southMumbai?.villages.find((v) => v.name.includes('Fort'));
    expect(fort).toBeDefined();
    expect(fort?.pincode).toBe('400001');
    expect(fort?.pincode).toMatch(/^\d{6}$/);
  });
});
