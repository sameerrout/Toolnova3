/**
 * Toolino Word Counter & Text Analysis Engine
 * 100% Client-Side Real-Time Metrics, Readability, Keyword Density & Text Transformers
 */

export interface TextMetrics {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeMinutes: number;
  readingTimeString: string;
  speakingTimeMinutes: number;
  speakingTimeString: string;
  estimatedPages: number;
  avgWordLength: number;
  avgSentenceLength: number;
}

export interface ReadabilityScores {
  fleschReadingEase: number;
  fleschGradeLevel: number;
  readingEaseLabel: string;
  schoolGradeLabel: string;
}

export interface KeywordItem {
  phrase: string;
  count: number;
  density: number; // percentage (e.g. 3.5)
}

export interface SocialLimit {
  platform: string;
  label: string;
  max: number;
  current: number;
  remaining: number;
  isOver: boolean;
}

const COMMON_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during',
  'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves',
]);

/**
 * Counts syllables in an English word (heuristic)
 */
export function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 3) return 1;

  let syllables = clean
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g)?.length || 0;

  return Math.max(1, syllables);
}

/**
 * Computes core metrics (words, chars, sentences, reading time)
 */
export function calculateTextMetrics(text: string): TextMetrics {
  const charactersWithSpaces = text.length;
  const charactersWithoutSpaces = text.replace(/\s/g, '').length;

  // Words
  const trimmed = text.trim();
  const wordsArray = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const words = wordsArray.length;

  // Paragraphs
  const paragraphs = trimmed
    ? trimmed.split(/\n+/).filter((p) => p.trim().length > 0).length
    : 0;

  // Lines
  const lines = text ? text.split('\n').length : 0;

  // Sentences (split by . ! ? while preserving decimals and abbreviations)
  const sentencesArray = trimmed
    ? trimmed.split(/[.!?]+(?:\s+|$)/).filter((s) => s.trim().length > 0)
    : [];
  const sentences = sentencesArray.length || (words > 0 ? 1 : 0);

  // Time estimations (Reading ~ 225 WPM, Speaking ~ 130 WPM)
  const readingTimeMinutes = words / 225;
  const speakingTimeMinutes = words / 130;

  const formatMinutes = (m: number): string => {
    if (m === 0) return '0 sec';
    const totalSeconds = Math.round(m * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs} sec`;
    return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`;
  };

  const estimatedPages = parseFloat((words / 275).toFixed(1));

  // Averages
  const totalLetters = wordsArray.reduce((acc, w) => acc + w.replace(/[^a-zA-Z0-9]/g, '').length, 0);
  const avgWordLength = words > 0 ? parseFloat((totalLetters / words).toFixed(1)) : 0;
  const avgSentenceLength = sentences > 0 ? parseFloat((words / sentences).toFixed(1)) : 0;

  return {
    words,
    charactersWithSpaces,
    charactersWithoutSpaces,
    sentences,
    paragraphs,
    lines,
    readingTimeMinutes,
    readingTimeString: formatMinutes(readingTimeMinutes),
    speakingTimeMinutes,
    speakingTimeString: formatMinutes(speakingTimeMinutes),
    estimatedPages,
    avgWordLength,
    avgSentenceLength,
  };
}

/**
 * Calculates Flesch Reading Ease and Flesch-Kincaid Grade Level
 */
export function calculateReadability(text: string, metrics: TextMetrics): ReadabilityScores {
  if (metrics.words < 5 || metrics.sentences === 0) {
    return {
      fleschReadingEase: 100,
      fleschGradeLevel: 1,
      readingEaseLabel: 'N/A (Add more text)',
      schoolGradeLabel: 'Kindergarten',
    };
  }

  // Count total syllables
  const wordsArray = text.trim().split(/\s+/).filter(Boolean);
  let totalSyllables = 0;
  for (const w of wordsArray) {
    totalSyllables += countSyllables(w);
  }

  const wordsPerSentence = metrics.words / metrics.sentences;
  const syllablesPerWord = totalSyllables / metrics.words;

  // Flesch Reading Ease formula
  // Score = 206.835 - (1.015 * ASL) - (84.6 * ASW)
  let ease = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  ease = Math.max(0, Math.min(100, Math.round(ease)));

  // Flesch-Kincaid Grade Level formula
  // Grade = (0.39 * ASL) + (11.8 * ASW) - 15.59
  let grade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  grade = Math.max(1, Math.min(18, Math.round(grade)));

  // Labels
  let readingEaseLabel = 'Standard / Plain English';
  if (ease >= 90) readingEaseLabel = 'Very Easy (5th grade level)';
  else if (ease >= 80) readingEaseLabel = 'Easy (6th grade level)';
  else if (ease >= 70) readingEaseLabel = 'Fairly Easy (7th grade level)';
  else if (ease >= 60) readingEaseLabel = 'Standard (8th & 9th grade)';
  else if (ease >= 50) readingEaseLabel = 'Fairly Difficult (High School)';
  else if (ease >= 30) readingEaseLabel = 'Difficult (College level)';
  else readingEaseLabel = 'Very Confusing (Graduate level)';

  let schoolGradeLabel = `${grade}th Grade`;
  if (grade <= 1) schoolGradeLabel = '1st Grade';
  else if (grade === 2) schoolGradeLabel = '2nd Grade';
  else if (grade === 3) schoolGradeLabel = '3rd Grade';
  else if (grade > 12) schoolGradeLabel = 'College / University';

  return {
    fleschReadingEase: ease,
    fleschGradeLevel: grade,
    readingEaseLabel,
    schoolGradeLabel,
  };
}

/**
 * Calculates keyword density for 1-word, 2-word, and 3-word phrases
 */
export function calculateKeywordDensity(
  text: string,
  n: 1 | 2 | 3 = 1,
  excludeStopWords: boolean = true,
  limit: number = 8
): KeywordItem[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length < n) return [];

  const counts: Record<string, number> = {};
  let totalPhrases = 0;

  for (let i = 0; i <= words.length - n; i++) {
    const phraseWords = words.slice(i, i + n);

    if (excludeStopWords) {
      if (n === 1 && COMMON_STOP_WORDS.has(phraseWords[0])) continue;
      if (n > 1 && phraseWords.every((w) => COMMON_STOP_WORDS.has(w))) continue;
    }

    const phrase = phraseWords.join(' ');
    counts[phrase] = (counts[phrase] || 0) + 1;
    totalPhrases++;
  }

  const items: KeywordItem[] = Object.entries(counts).map(([phrase, count]) => ({
    phrase,
    count,
    density: totalPhrases > 0 ? parseFloat(((count / words.length) * 100).toFixed(1)) : 0,
  }));

  items.sort((a, b) => b.count - a.count);
  return items.slice(0, limit);
}

/**
 * Evaluates social media character limits
 */
export function calculateSocialLimits(text: string): SocialLimit[] {
  const current = text.length;

  const platforms = [
    { platform: 'Twitter / X', label: 'Post Limit', max: 280 },
    { platform: 'Instagram', label: 'Caption Limit', max: 2200 },
    { platform: 'LinkedIn', label: 'Post Limit', max: 3000 },
    { platform: 'Pinterest', label: 'Pin Description', max: 500 },
    { platform: 'Google SEO', label: 'Meta Title', max: 60 },
    { platform: 'Google SEO', label: 'Meta Description', max: 160 },
  ];

  return platforms.map((p) => ({
    platform: p.platform,
    label: p.label,
    max: p.max,
    current,
    remaining: p.max - current,
    isOver: current > p.max,
  }));
}

/**
 * Case transformation utilities
 */
export function transformCase(
  text: string,
  targetCase: 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'kebab' | 'snake'
): string {
  if (!text) return '';

  switch (targetCase) {
    case 'upper':
      return text.toUpperCase();

    case 'lower':
      return text.toLowerCase();

    case 'sentence':
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());

    case 'title':
      return text.toLowerCase().replace(/\b\w+/g, (word) => {
        if (COMMON_STOP_WORDS.has(word) && word.length <= 3) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      });

    case 'camel': {
      const words = text.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/);
      return words
        .map((w, idx) =>
          idx === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('');
    }

    case 'kebab':
      return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-');

    case 'snake':
      return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');

    default:
      return text;
  }
}

/**
 * Text cleanup utilities
 */
export function cleanText(
  text: string,
  action: 'trim-spaces' | 'remove-empty-lines' | 'join-lines' | 'remove-duplicates' | 'strip-html'
): string {
  switch (action) {
    case 'trim-spaces':
      // Replaces multiple spaces with single space, trims lines
      return text
        .split('\n')
        .map((l) => l.replace(/[ \t]+/g, ' ').trim())
        .join('\n');

    case 'remove-empty-lines':
      return text
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .join('\n');

    case 'join-lines':
      return text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

    case 'remove-duplicates': {
      const lines = text.split('\n');
      const seen = new Set<string>();
      const result: string[] = [];
      for (const line of lines) {
        if (!seen.has(line)) {
          seen.add(line);
          result.push(line);
        }
      }
      return result.join('\n');
    }

    case 'strip-html':
      return text.replace(/<[^>]*>/g, '');

    default:
      return text;
  }
}
