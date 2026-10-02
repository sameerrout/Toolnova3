/**
 * Shared client logic for the PDF tools.
 *
 * Pure functions only - no React, no DOM beyond what PDF-LIB touches - so the
 * behaviour the PDF tools depend on is unit-testable without a browser. The
 * tool components in `src/tools/*` call into here rather than reimplementing
 * page maths each time.
 */

import { PDFDocument, degrees } from 'pdf-lib';
import { AppError } from '@/lib/errors';
import { loadPdf, savePdf } from '@/lib/pdf';
import { JobReporter } from '@/lib/progress';
import { formatBytes, formatDelta } from '@/lib/format';

export interface PdfFileResult {
  blob: Blob;
  fileName: string;
  pageCount: number;
  bytes: number;
}

/** Combines several PDFs into one, in the given order. */
export async function mergePdfs(
  files: File[],
  reporter: JobReporter,
  options: { title?: string } = {}
): Promise<PdfFileResult> {
  if (files.length < 2) {
    throw new AppError('NO_FILES', 'Add at least two PDF files to merge.');
  }

  reporter.beginStage('Reading documents', 0.4);
  const merged = await PDFDocument.create();

  for (let index = 0; index < files.length; index += 1) {
    reporter.throwIfCancelled();
    const file = files[index] as File;
    reporter.reportItems(index, files.length, `Reading ${file.name}`);

    const source = await loadPdf(await file.arrayBuffer(), file.name);
    const pages = await merged.copyPages(source, source.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }

  reporter.beginStage('Writing merged document', 0.6);
  const blob = await savePdf(merged, { title: options.title ?? 'Merged document' });

  return {
    blob,
    fileName: 'merged.pdf',
    pageCount: merged.getPageCount(),
    bytes: blob.size,
  };
}

/** Extracts one or more page ranges into a new document. */
export async function extractPages(
  file: File,
  ranges: { from: number; to: number; label: string }[],
  reporter: JobReporter
): Promise<PdfFileResult[]> {
  const source = await loadPdf(await file.arrayBuffer(), file.name);
  const pageCount = source.getPageCount();
  const results: PdfFileResult[] = [];

  reporter.beginStage('Splitting document', 0.85);

  for (let index = 0; index < ranges.length; index += 1) {
    reporter.throwIfCancelled();
    const range = ranges[index] as { from: number; to: number; label: string };

    const from = Math.max(0, Math.min(range.from, pageCount - 1));
    const to = Math.max(from, Math.min(range.to, pageCount - 1));
    const indices: number[] = [];
    for (let page = from; page <= to; page += 1) indices.push(page);

    if (indices.length === 0) continue;

    const output = await PDFDocument.create();
    const copied = await output.copyPages(source, indices);
    for (const page of copied) output.addPage(page);

    const blob = await savePdf(output, { title: `Pages ${range.label}` });
    results.push({
      blob,
      fileName: `pages-${range.label}.pdf`,
      pageCount: output.getPageCount(),
      bytes: blob.size,
    });

    reporter.reportItems(index + 1, ranges.length, `Extracted ${range.label}`);
  }

  if (results.length === 0) {
    throw new AppError('INVALID_INPUT', 'That range did not contain any pages.');
  }

  return results;
}

/** Splits a document into one file per page. */
export async function splitEveryPage(file: File, reporter: JobReporter): Promise<PdfFileResult[]> {
  const source = await loadPdf(await file.arrayBuffer(), file.name);
  const pageCount = source.getPageCount();
  const results: PdfFileResult[] = [];
  const pad = String(pageCount).length;

  reporter.beginStage('Splitting every page', 0.85);

  for (let index = 0; index < pageCount; index += 1) {
    reporter.throwIfCancelled();

    const output = await PDFDocument.create();
    const [page] = await output.copyPages(source, [index]);
    if (page) output.addPage(page);

    const label = String(index + 1).padStart(pad, '0');
    const blob = await savePdf(output, { title: `Page ${index + 1}` });
    results.push({
      blob,
      fileName: `page-${label}.pdf`,
      pageCount: 1,
      bytes: blob.size,
    });

    reporter.reportItems(index + 1, pageCount, `Page ${index + 1} of ${pageCount}`);
  }

  return results;
}

/** Rotates pages. `angles` is keyed by zero-based page index; missing = 0. */
export async function rotatePdf(
  file: File,
  angles: Map<number, number>,
  reporter: JobReporter
): Promise<PdfFileResult & { rotatedCount: number }> {
  const document = await loadPdf(await file.arrayBuffer(), file.name);
  const pages = document.getPages();

  reporter.beginStage('Rotating pages', 0.9);

  let rotated = 0;
  pages.forEach((page, index) => {
    const delta = angles.get(index);
    if (!delta) return;
    const next = (page.getRotation().angle + delta + 360) % 360;
    page.setRotation(degrees(next));
    rotated += 1;
    reporter.reportItems(index + 1, pages.length, `Page ${index + 1}`);
  });

  if (rotated === 0) {
    throw new AppError('INVALID_INPUT', 'No pages were selected to rotate.');
  }

  const blob = await savePdf(document);
  return {
    blob,
    fileName: file.name.replace(/\.pdf$/i, '') + '-rotated.pdf',
    pageCount: document.getPageCount(),
    bytes: blob.size,
    rotatedCount: rotated,
  };
}

/**
 * Rewrites a document in the chosen page order and drops removed pages.
 * Duplicated indices produce duplicated pages, which is how "duplicate page"
 * works without extra logic.
 */
export async function reorderPdfPages(
  file: File,
  order: number[],
  reporter: JobReporter
): Promise<PdfFileResult> {
  if (order.length === 0) {
    throw new AppError('INVALID_INPUT', 'The document would end up with no pages.');
  }

  const source = await loadPdf(await file.arrayBuffer(), file.name);
  const pageCount = source.getPageCount();

  reporter.beginStage('Rebuilding document', 0.9);

  const output = await PDFDocument.create();
  const copied = await output.copyPages(
    source,
    order.filter((index) => index >= 0 && index < pageCount)
  );
  for (const page of copied) output.addPage(page);
  reporter.report(1, `${output.getPageCount()} pages`);

  const blob = await savePdf(output);
  return {
    blob,
    fileName: file.name.replace(/\.pdf$/i, '') + '-organised.pdf',
    pageCount: output.getPageCount(),
    bytes: blob.size,
  };
}

/** Human summary of what a job produced, shown in the result panel. */
export function describePdfResult(inputBytes: number, result: PdfFileResult): string {
  return `${result.pageCount} ${result.pageCount === 1 ? 'page' : 'pages'} · ${formatBytes(
    result.bytes
  )}${inputBytes > 0 ? ` (${formatDelta(inputBytes, result.bytes)} vs input)` : ''}`;
}

/** Sums file sizes, used for the "total size" line in the file list. */
export function sumBytes(files: { size: number }[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}
