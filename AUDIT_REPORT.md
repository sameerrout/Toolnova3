# Toolnova — Project Audit Report

**Audit date:** this refactor
**Scope:** every file in `app/`, `components/`, `lib/`, `core/`, `tools/`, `backend/`, `tests/`, `scripts/`, plus `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `.env.example`, `.gitignore`, `README.md`.
**Method:** full read of the tree, scripted resolution of every import path and named binding, cross-referencing of `package.json` dependencies against real import sites, and route/redirect collision analysis. Read-only until the fix phase.

---

## 0. Executive summary

The codebase was **not** build-broken, but it was **architecturally split in two**. A complete, unused server pipeline (route handlers → job manager → Python worker → temp storage) existed alongside the client-side tools that were actually wired into the UI. The UI layer itself was in good shape: essentially zero broken imports and zero missing `'use client'` directives.

The real problems were:

1. **A dead server pipeline** — unreachable code that could never run but forced a Node runtime, environmental dependencies on Python, and an unreviewable amount of dead surface area.
2. **No AdSense readiness at all** — no ad slots, no `ads.txt`, no consent management, no legal pages, no analytics consent gating. All five prerequisites were absent.
3. **SEO gaps** — missing metadata on two of the most important pages, a footer deliberately hidden on 29 of 33 routes, three tools missing from the sitemap, duplicated URLs for 15 tools, and no `Organization`/`WebSite` structured data.
4. **Two genuine routing bugs** — rewrites shadowing real page files, and a canonical-URL function living inside a `sitemap.ts` route file.
5. **Memory and cancellation were not handled anywhere** — no object-URL revocation, no worker termination, no cancel support on any long-running tool. This was the single biggest risk for the stated 2 GB phone target.
6. **Brand split** — `Toolino` (209 occurrences) vs `toolnova.com` (90 occurrences), including the domain being printed *into* exported PDFs.

---

## 1. Build, type and import health

| Check | Result |
| --- | --- |
| Broken import paths | **0** — every `@/…` and relative import resolved to an existing file |
| Missing named exports | **0** — export sets were extracted per module and diffed against every import statement |
| `useSearchParams` without `<Suspense>` | **0** — correctly wrapped |
| `metadata` exported from a client component | **0** |
| Components missing `'use client'` while using hooks | **0** |
| `'use server'` / server actions | **0** |
| Build-blocking config | **None at the time of audit** — but see below |

Because `output: 'export'` was **not** set, the 25 API route handlers, the `force-dynamic` exports, `fs.readFileSync` and the cookie usage were all technically legal. The moment static export is enabled, **all of them become hard build failures**. That is the single most important structural finding for the AWS deployment goal.

### Latent issues found

- `src/components/common/ToolCard.tsx` and `src/app/tools/[toolId]/page.tsx` imported `CLEAN_TOOL_URLS` / `getToolCanonicalUrl` out of `src/app/sitemap.ts`, a **route file**. Next.js ignores extra exports there, so it built — but canonical-URL logic living inside a route handler is fragile and untestable. Moved to `src/lib/seo/urls.ts`.
- `tailwind.config.ts` declared `brand.850` and skipped `brand.800`, a typo waiting to bite.
- `tests/verifyRealAnalyticsFlow` style scripts read `TOOLNOVA_JOB_TIMEOUT_SECONDS` while the code read `TOOLNOVA_JOB_TIMEOUT_MS` — a documented-but-unused env var.
- `scripts/verify_real_analytics_flow.js` called `clearAllData()` with **no environment guard**, meaning running it against a production analytics file would have wiped it. Deleted.

---

## 2. Server dependencies (all now removed)

There was exactly **one** server mechanism, and it was **unreachable from the UI**:

```text
ToolLayout.tsx ──► executeTool() ──► fetch('/api/jobs')
                                        └─► jobManager.createJob()
                                              └─► spawn(TOOLNOVA_PYTHON_BIN,
                                                        backend/workers/pdf_to_pptx.py)
                                                    └─► backend/storage/jobs/<id>/
```

`ToolRunner.tsx` hard-coded one `if` per tool id and returned a dedicated client component for **all 26 tools before** `toolRegistry.get()` was ever reached. `ToolLayout` → `executeTool` → `/api/jobs` → `jobManager` therefore had **zero callers**.

### Findings that corrected the original assumptions

- **LibreOffice was never used.** `LIBREOFFICE_PATH` appeared in `.env.example` and `README.md` and was read by **zero lines of code**. No `soffice` invocation existed anywhere.
- **Server-side Tesseract was never used.** `TOOLNOVA_OCR_PATH` was likewise documentation only. OCR was already 100 % client-side.
- **PDF to PowerPoint was already 100 % browser-side** using `pptxgenjs` + `pdfjs-dist`. It had no `fetch` call at all. The Python worker was a parallel, unreachable reimplementation.
- **PDF Summarizer was already 100 % client-side.** It had no server dependency whatsoever.
- Only one npm package was a genuine orphan: **`mammoth`**, imported once in `tests/verifyTools.mjs` and never used again.

### Server-dependent tool matrix

| Tool | How it ran | After removal |
| --- | --- | --- |
| PDF to PowerPoint | Client-side (pptxgenjs), dead Python worker alongside | **Removed** — the `pptxgenjs` bundle is large and low-fidelity for text PDFs; see §6 |
| All 25 other tools | Pure client-side | **Kept**, rebuilt on the new shared foundation |

**Conclusion:** deleting the entire server path broke **no tool**. It removed `backend/`, `src/app/api/**`, `src/lib/jobs/`, `src/lib/server/`, `src/lib/db/`, `src/lib/auth/`, `src/core/execution/`, `src/components/tools/ToolLayout.tsx` and ~1,400 lines of never-executed `process()` bodies under `src/tools/*/index.ts`.

---

## 3. Unused files and dependencies

### Deleted as dead code

| Path | Why |
| --- | --- |
| `src/core/cache/toolCache.ts` | Zero importers |
| `src/core/engine/deviceCapabilities.ts` | Superseded; zero importers |
| `src/core/engine/fileValidator.ts` | Superseded by `src/lib/validation.ts` |
| `src/core/registry/toolRegistry.ts` | Only reachable through the unreachable `ToolLayout` |
| `src/core/execution/executeTool.ts` | Zero in-app callers |
| `src/components/tools/ToolLayout.tsx` | Zero in-app callers |
| `src/components/common/PrivacyNotice.tsx` | Never imported; held the last `'SERVER'` UI branch |
| `src/app/download/page.tsx` | Orphan route; its "Download" button linked to `/pdf-tools` |
| `src/tools/**` (19 directories) | Registry + option components with no reachable caller |
| `src/lib/analytics/tracker.ts` | First-party analytics hitting a server endpoint that no longer exists |
| `src/context/AuthContext.tsx` | Auth for a site that no longer has accounts; it also fired a request on **every page** |

### Dependencies removed from `package.json`

| Package | Reason |
| --- | --- |
| `jszip` | Replaced by `fflate` (≈ 8 KB vs ≈ 100 KB, and streamable) |
| `docx` | Only used by the deleted server-era OCR engine |
| `mammoth` | Genuine orphan; imported once in a test |
| `pptxgenjs` | Only used by the removed PDF to PowerPoint tool |
| `@pdfsmaller/pdf-encrypt` | Unmaintained; encryption now uses PDF-LIB's standard security handler |
| `@types/qrcode` | Moved to `devDependencies` (it is a type-only package) |

### Dependencies added

`fflate`, `tesseract.js`, `@imgly/background-removal`, `vitest`, `jsdom`, `eslint`, `eslint-config-next`.

---

## 4. Routes, redirects and canonical URLs

- **18 page routes, 2 redirects, 3 metadata routes, 25 API routes, 41 rewrites.**
- **15 tools were reachable at two URLs** (`/tool-name` and `/tools/tool-name`). Canonical tags were correct, so there was no duplicate-content penalty, but internal links pointed at the wrong one.
- **Two real routing bugs:** the `/image-to-pdf` and `/edit-pdf` rewrites **shadowed real page files** at `src/app/image-to-pdf/page.tsx` and `src/app/edit-pdf/page.tsx`, making those files dead routes because rewrites are evaluated first.
- **Three tools were missing from the sitemap:** `/emi-calculator`, `/discount-calculator` and `/gst-calculator` had real pages and footer links but were absent from the canonical-URL map.
- **No broken navigation links** were found.

### Resolution

Every tool now has exactly one canonical URL: `/tools/<tool-id>/`. All 41 rewrites were replaced by **real, folder-based routes** plus permanent redirects declared in `next.config.mjs` and emitted as static redirect stubs by `scripts/generate-redirects.mjs` for S3 + CloudFront.

---

## 5. SEO findings

| Finding | Severity |
| --- | --- |
| `/` and `/pdf-tools` were `'use client'`, so they had **no page metadata at all** — only the root layout title | High |
| `Footer.tsx` used ~40 `pathname.includes()` conditions that hid the footer on **29 of 33 routes, including every tool page** — so ~40 internal links never appeared where they mattered, leaving 13 canonical tool pages with a single inbound internal link | High |
| No `Organization` or `WebSite` structured data anywhere | High |
| Domain hard-coded in 13 files that never read `NEXT_PUBLIC_SITE_URL` | High |
| `toolnova.com` was printed **into exported PDFs** (`pdfExport.ts`) | Medium |
| `/login` was the only rendered page with no `<h1>` | Medium |
| `/qr-tools` and `/document-tools` each listed exactly one tool (thin hub pages) | Medium |
| `Footer.tsx` displayed "© 2026" | Low |

---

## 6. Decisions taken where the browser could not match the server

The instructions were explicit: if a tool cannot work well in the browser, either replace it with a clearly-labelled browser version or remove it — and never keep a server dependency.

| Tool | Decision | Reasoning |
| --- | --- | --- |
| **PDF Analyser / PDF Summarizer** | **Removed** (as instructed) | Client-side extractive summarising is not real summarising, and presenting it as such would be misleading content — an AdSense policy risk. Legacy URLs 301 to `/tools/pdf-tools/`. |
| **High-quality PDF to Word** | **Not offered** | Faithful DOCX conversion requires layout analysis that no browser library provides. Offering a text-dump `.docx` and calling it "PDF to Word" would mislead users. The honest alternative — extracting text — is served by `image-to-text` (OCR) and by PDF to Image. Stated plainly in `README.md`. |
| **PDF to PowerPoint** | **Removed** | It ran entirely client-side with `pptxgenjs`, so it *was* technically viable. It was removed deliberately because: (a) it added ≈ 350 KB gzipped to the client bundle for one tool, which conflicts with the sub-100 KB homepage target; (b) rasterising pages into slides produces a low-fidelity, un-editable deck, so it does not deliver what the name promises; (c) its legacy URLs redirect to `/tools/pdf-tools/`. Re-adding it is a documented three-step change (see README). |

**Everything else survived with zero loss of quality**, because it was already client-side: all PDF operations, all image operations, OCR, background removal, QR codes and every calculator.

---

## 7. Bugs found and fixed

| # | Bug | Fix |
| --- | --- | --- |
| B1 | Object URLs created by previews and downloads were **never revoked** | `UrlRegistry` in `src/lib/bytes.ts`, wired through `useObjectUrls()` |
| B2 | **No tool supported cancellation** | `JobReporter` with an `AbortSignal`, surfaced as a Cancel button in every tool |
| B3 | pdf.js `LoadingTask` was **never destroyed** (zero `.destroy()` calls repo-wide) | Central `destroyPdfDocument()` helper; every render path calls it in a `finally` |
| B4 | Tesseract worker **leaked** whenever `recognize()` threw (no `try/finally`) | Worker lifecycle owned by `src/lib/ocr.ts`, always terminated in `finally` |
| B5 | The whole server path **silently discarded every user option** | Path deleted |
| B6 | `resourceManager.canStartJob()` was never called, so there was **no concurrency limit** | Concurrency is now derived from `navigator.hardwareConcurrency` per tool |
| B7 | `TOOLNOVA_JOB_TIMEOUT_SECONDS` documented but the code read `TOOLNOVA_JOB_TIMEOUT_MS` | Both env vars deleted with the backend |
| B8 | `npm test` ran three `.mjs` files that import `.ts` **without** `--experimental-strip-types` | Replaced by Vitest, which handles TypeScript natively |
| B9 | `scripts/verify_real_analytics_flow.js` could **wipe production analytics** | Script deleted |
| B10 | `jobManager.cancelJob()` deleted a directory the child process might still be writing to | Path deleted |
| B11 | `/image-to-pdf` and `/edit-pdf` rewrites shadowed real page files | Rewrites replaced by real routes + permanent redirects |
| B12 | Three calculator tools were missing from the sitemap | Sitemap now derives from the tool registry |
| B13 | The footer hid itself on 29 of 33 routes | Footer is always rendered |
| B14 | Brand name and canonical domain were inconsistent across 299 lines | Single `BRAND`/`SITE_URL` source in `src/lib/site.ts` |
| B15 | Page metadata missing entirely on `/` and the PDF hub | Server Components with full `Metadata` exports |

---

## 8. Test-suite findings

The old suite contained 36 `.mjs` files. Two systemic problems made most of them non-verifying:

- **String-presence assertions.** Most `verify*Workflow.mjs` files read a `.tsx` file with `fs.readFileSync` and asserted that it `.includes('someString')`. That tests that text exists in a file, not that behaviour is correct; it passes even if the logic is broken, and fails on any reformat.
- **Re-implemented logic.** `verifyUnit.mjs`, `verifyTools.mjs` and `verifyPdfToPowerpointWorkflow.mjs` copied the logic under test into the test file instead of importing it, so they could never catch a regression in the real module.
- **Proven-fake test.** `verifyPdfSummarizer.mjs` test 6 asserted against a local literal and never called `extractPdfDocument`.
- **Python tests** (`test_core_converters.py`, `benchmark_converters.py`) drove the deleted worker directly.

**Replacement:** `vitest` suites under `tests/` that import and exercise the real modules — filename de-duplication, ZIP entry ordering and compression decisions, size maths, MIME sniffing, page-range parsing, image-fit maths, OCR normalisation, the calculator formulas, SEO metadata lengths, registry integrity and the redirect map.

---

## 9. AdSense readiness (all five prerequisites were absent)

| Requirement | Status before | Status now |
| --- | --- | --- |
| AdSense script + ad units | None | `AdSlot` component, consent-gated, fixed height, max 3 per page |
| `ads.txt` | Missing | `public/ads.txt` placeholder |
| Consent Management Platform | None | `ConsentProvider` (TCF 2.2 `__tcfapi` compatible) with Accept / Reject / Manage |
| Legal pages | **None at all** | About, Contact (with a working local form), Privacy, Terms, Cookie Policy, Disclaimer |
| Analytics consent gating | No consent; a first-party tracker posted on every navigation | GA4 loads only after consent; the first-party tracker was removed |

Two session cookies and two local-storage identifiers were being set with **zero disclosure**, which was not GDPR/ePrivacy-clean for EU traffic. The new build sets no cookies until the visitor consents.

---

## 10. Files changed, added and deleted

The complete list is in the "Final report" section of the refactor response and summarised in [`README.md`](README.md#project-structure).
