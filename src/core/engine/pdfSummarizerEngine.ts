/**
 * Toolino PDF Summarizer Engine
 * 100% Client-Side In-Browser PDF Text Extraction, Scanned Detection, Chunking, and Extractive Summarization
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type SummaryLength = 'short' | 'detailed' | 'bullet' | 'sections';

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
  wordCount: number;
  isScanned: boolean;
  headings: string[];
}

export interface ExtractedPdfDocument {
  fileName: string;
  fileSizeBytes: number;
  totalPages: number;
  totalWords: number;
  totalCharacters: number;
  pages: ExtractedPageText[];
  hasScannedPages: boolean;
  scannedPageCount: number;
}

export interface GeneratedSummary {
  title: string;
  lengthMode: SummaryLength;
  summaryText: string;
  keyPoints: string[];
  sections: { title: string; content: string }[];
  originalWordCount: number;
  summaryWordCount: number;
  reductionPercentage: number;
  readingTimeMinutes: number;
}

// Common English stopwords for extractive scoring
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t',
  'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having',
  'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its',
  'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
  'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d',
  'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
  'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Extracts text and detects structure from an uploaded PDF array buffer using pdfjs-dist.
 */
export async function extractPdfDocument(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<ExtractedPdfDocument> {
  const buffer = await file.arrayBuffer();

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
      pdfjs.version || '3.11.174'
    }/pdf.worker.min.js`;
  }

  onProgress?.(15, 'Loading PDF structure...');

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const pages: ExtractedPageText[] = [];
  let totalWords = 0;
  let totalCharacters = 0;
  let scannedCount = 0;

  for (let p = 1; p <= totalPages; p++) {
    const progressPercent = Math.round(20 + (p / totalPages) * 70);
    onProgress?.(progressPercent, `Extracting page ${p} of ${totalPages}...`);

    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();

    const items = textContent.items as Array<{ str: string; hasEOL?: boolean }>;
    const rawStrings: string[] = [];
    const headings: string[] = [];

    items.forEach((item) => {
      const trimmed = (item.str || '').trim();
      if (!trimmed) return;

      rawStrings.push(item.str);

      // Simple heuristic for headings: uppercase or short lines ending without period
      if (
        (trimmed.length > 3 && trimmed.length < 60 && !trimmed.endsWith('.') && /^[A-Z0-9\s:—–-]+$/.test(trimmed)) ||
        (trimmed.startsWith('Chapter') || trimmed.startsWith('Section') || trimmed.startsWith('Introduction'))
      ) {
        headings.push(trimmed);
      }
    });

    const pageText = rawStrings.join(' ').replace(/\s+/g, ' ').trim();
    const words = pageText.length > 0 ? pageText.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;

    // Scanned page detection: fewer than 5 extractable words indicates an image/scanned page
    const isScanned = wordCount < 5;
    if (isScanned) {
      scannedCount++;
    }

    totalWords += wordCount;
    totalCharacters += pageText.length;

    pages.push({
      pageNumber: p,
      text: pageText,
      wordCount,
      isScanned,
      headings: Array.from(new Set(headings)),
    });
  }

  onProgress?.(100, 'Text extraction complete!');

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    totalPages,
    totalWords,
    totalCharacters,
    pages,
    hasScannedPages: scannedCount > 0,
    scannedPageCount: scannedCount,
  };
}

/**
 * Splits text into individual clean sentences
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  return text
    .replace(/([.?!])\s*(?=[A-Z0-9])/g, '$1|')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.split(' ').length >= 4);
}

/**
 * Scores and extracts the most salient sentences using TF-IDF term frequency and position weighting.
 */
function extractSalientSentences(sentences: string[], targetCount: number): string[] {
  if (sentences.length <= targetCount) return sentences;

  // 1. Build word frequencies
  const wordFreq: Record<string, number> = {};
  sentences.forEach((sentence) => {
    const tokens = sentence.toLowerCase().match(/[a-z0-9]+/g) || [];
    tokens.forEach((token) => {
      if (!STOPWORDS.has(token) && token.length > 2) {
        wordFreq[token] = (wordFreq[token] || 0) + 1;
      }
    });
  });

  // 2. Score sentences
  const scored = sentences.map((sentence, idx) => {
    const tokens = sentence.toLowerCase().match(/[a-z0-9]+/g) || [];
    let score = 0;

    tokens.forEach((token) => {
      if (wordFreq[token]) {
        score += wordFreq[token];
      }
    });

    // Normalize by sentence length to prevent unfairly favoring overly long sentences
    score = score / Math.sqrt(tokens.length + 1);

    // Position weighting: sentences at the start or end of paragraphs carry higher summary weight
    if (idx === 0) score *= 1.4;
    else if (idx === 1) score *= 1.2;
    else if (idx === sentences.length - 1) score *= 1.25;

    // Numerical / statistical cues boost importance
    if (/\d+%|\$\d+|₹\d+|\b(increase|decrease|result|conclude|found|significant|essential)\b/i.test(sentence)) {
      score *= 1.2;
    }

    return { sentence, score, originalIndex: idx };
  });

  // 3. Pick top scored sentences, then restore chronological document order
  const topPicked = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, targetCount)
    .sort((a, b) => a.originalIndex - b.originalIndex)
    .map((item) => item.sentence);

  return topPicked;
}

/**
 * Summarizes the extracted PDF document according to the chosen length mode.
 */
export function summarizePdfDocument(
  doc: ExtractedPdfDocument,
  mode: SummaryLength = 'detailed'
): GeneratedSummary {
  const fullText = doc.pages.map((p) => p.text).join('\n\n');
  const allSentences = splitIntoSentences(fullText);

  let targetSentenceCount = 5;
  if (mode === 'short') {
    targetSentenceCount = Math.max(3, Math.min(6, Math.round(allSentences.length * 0.1)));
  } else if (mode === 'detailed') {
    targetSentenceCount = Math.max(6, Math.min(18, Math.round(allSentences.length * 0.25)));
  } else if (mode === 'bullet') {
    targetSentenceCount = Math.max(4, Math.min(10, Math.round(allSentences.length * 0.15)));
  } else if (mode === 'sections') {
    targetSentenceCount = Math.max(8, Math.min(24, Math.round(allSentences.length * 0.3)));
  }

  const salientSentences = extractSalientSentences(allSentences, targetSentenceCount);

  // Key points (bullet points)
  const keyPoints = extractSalientSentences(allSentences, Math.min(6, Math.max(3, Math.round(allSentences.length * 0.08))))
    .map((s) => s.replace(/^[•\s*-]+/, '').trim());

  // Section-by-section breakdown (chunking by headings or groups of pages)
  const sections: { title: string; content: string }[] = [];

  doc.pages.forEach((page) => {
    if (!page.text || page.isScanned) return;
    const pageSentences = splitIntoSentences(page.text);
    if (pageSentences.length === 0) return;

    const pageSummarySentences = extractSalientSentences(
      pageSentences,
      Math.max(1, Math.min(3, Math.round(pageSentences.length * 0.3)))
    );

    const sectionTitle =
      page.headings.length > 0
        ? page.headings[0]
        : `Page ${page.pageNumber}`;

    sections.push({
      title: sectionTitle,
      content: pageSummarySentences.join(' '),
    });
  });

  const summaryText = salientSentences.join(' ');
  const summaryWords = summaryText.split(/\s+/).filter(Boolean).length;
  const originalWords = Math.max(1, doc.totalWords);
  const reductionPercentage = Math.max(
    0,
    Math.round(((originalWords - summaryWords) / originalWords) * 100)
  );

  // Average reading speed: 200 words per minute
  const readingTimeMinutes = Math.max(1, Math.ceil(summaryWords / 200));

  return {
    title: doc.fileName.replace(/\.pdf$/i, ''),
    lengthMode: mode,
    summaryText,
    keyPoints,
    sections,
    originalWordCount: originalWords,
    summaryWordCount: summaryWords,
    reductionPercentage,
    readingTimeMinutes,
  };
}

/**
 * Export summary as plain text file (.txt)
 */
export function exportSummaryAsTxt(summary: GeneratedSummary): Blob {
  const content = `TOOLINO PDF SUMMARY
========================================
Document: ${summary.title}
Original Words: ${summary.originalWordCount}
Summary Words: ${summary.summaryWordCount} (Reduced by ${summary.reductionPercentage}%)
Estimated Reading Time: ${summary.readingTimeMinutes} min
========================================

EXECUTIVE SUMMARY:
${summary.summaryText}

KEY TAKEAWAYS & HIGHLIGHTS:
${summary.keyPoints.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}

${
  summary.sections.length > 0
    ? `SECTION-BY-SECTION BREAKDOWN:\n` +
      summary.sections.map((sec) => `[${sec.title}]\n${sec.content}\n`).join('\n')
    : ''
}
----------------------------------------
Generated 100% locally by Toolino (www.toolnova.com)
`;

  return new Blob([content], { type: 'text/plain;charset=utf-8' });
}

/**
 * Export summary as Markdown (.md)
 */
export function exportSummaryAsMarkdown(summary: GeneratedSummary): Blob {
  const md = `# Summary: ${summary.title}

> **Document Stats**: Reduced ${summary.originalWordCount} words to ${summary.summaryWordCount} words (**${summary.reductionPercentage}% reduction**). ~${summary.readingTimeMinutes} min read.

---

## 📌 Executive Summary
${summary.summaryText}

## 🎯 Key Points & Takeaways
${summary.keyPoints.map((pt) => `- ${pt}`).join('\n')}

${
  summary.sections.length > 0
    ? `## 📑 Section Breakdown\n` +
      summary.sections.map((sec) => `### ${sec.title}\n${sec.content}\n`).join('\n')
    : ''
}

---
*Generated privately with Toolino PDF Summarizer.*
`;

  return new Blob([md], { type: 'text/markdown;charset=utf-8' });
}

/**
 * Export summary as PDF document using pdf-lib
 */
export async function exportSummaryAsPdf(summary: GeneratedSummary): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  let currentY = height - 50;

  // Title
  page.drawText('Toolino Document Summary', {
    x: 50,
    y: currentY,
    size: 20,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  currentY -= 25;

  page.drawText(`File: ${summary.title} | ${summary.reductionPercentage}% word count reduction`, {
    x: 50,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });
  currentY -= 35;

  // Executive summary heading
  page.drawText('Executive Summary', {
    x: 50,
    y: currentY,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  currentY -= 20;

  // Wrap summary lines
  const words = summary.summaryText.split(' ');
  let line = '';
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const testWidth = fontRegular.widthOfTextAtSize(testLine, 10);
    if (testWidth > width - 100) {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: fontRegular, color: rgb(0.2, 0.25, 0.35) });
      line = word;
      currentY -= 15;
      if (currentY < 60) break;
    } else {
      line = testLine;
    }
  }
  if (line && currentY >= 60) {
    page.drawText(line, { x: 50, y: currentY, size: 10, font: fontRegular, color: rgb(0.2, 0.25, 0.35) });
    currentY -= 30;
  }

  // Key Points
  if (currentY >= 100) {
    page.drawText('Key Takeaways', {
      x: 50,
      y: currentY,
      size: 13,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25),
    });
    currentY -= 20;

    for (const kp of summary.keyPoints.slice(0, 4)) {
      if (currentY < 60) break;
      const bulletText = `• ${kp.length > 90 ? kp.substring(0, 90) + '...' : kp}`;
      page.drawText(bulletText, { x: 50, y: currentY, size: 9, font: fontRegular, color: rgb(0.2, 0.25, 0.35) });
      currentY -= 16;
    }
  }

  return await pdfDoc.save();
}
