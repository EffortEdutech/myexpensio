# scan_service (Render/Python) Retirement Plan

**Status:** Steps 1-4 done. Step 5 (parallel-run validation) concluded by Eff's explicit decision on 2026-07-21 to move toward cutover with 2/2 perfect in-scope real samples (short of the originally-planned 5-10, a deliberate accepted risk — recorded here, not glossed over) plus 1 out-of-scope sample confirming consistent reject behavior. Before acting on that decision, ran an independent code review (fresh-eyes, no shared context with the build) which found one real "silently wrong data" risk — see §3a's amount-parsing note — fixed and re-verified against all 3 samples with zero regressions. Step 6 (cutover) is now prepared: see §6 for the exact runbook. **Render has NOT been touched and the production default is still Python** — flipping `TNG_NODE_ENGINE` in the live environment is a manual action for Eff to take (I have no tool access to Vercel env vars).
**Date:** 2026-07-19 (plan), updated 2026-07-21 (step 5 concluded, 1 more real bug fixed via code review, step 6 runbook written)
**Decision requested:** proceed with build, per Eff's direction ("build both replacements and fully retire Render with no feature loss ... plan this carefully ... make sure we do not get stuck").
**Related:** `docs/02-product-specs/03_AI_EXPORT_PDF_PRELIM_STUDY.md` (corrected the "Python generates the PDF report" misconception), `docs/03-sprint-plans/ai-capture/01_SPRINT_PLAN_AI_CAPTURE.md` (S7 already flagged this as an open decision).

---

## 0. What's actually being retired

Recap from the prelim study: `scan_service` has three endpoints. `/process` (receipt image enhancement) is optional/skippable and independent of the Gemini AI extraction path — dropping it is a non-event, no replacement needed. The two that actually matter:

1. **`POST /parse-tng`** — parses a TNG e-wallet statement PDF into structured transactions. No fallback today; if Render is down, statement import hard-fails.
2. **`POST /highlight-tng`** — draws yellow highlights on matched transaction rows in the statement PDF before it's appended to the export. Already fails soft today (returns the un-highlighted PDF on any error) — but that "soft failure" is a silent feature loss, not something to design toward.

Both need a Node.js replacement to retire Render with genuinely zero feature loss.

---

## 1. Reading the actual Python implementation (not assuming)

### `/parse-tng` (scan_service/main.py:919-982)

Pipeline: `pdfplumber.open()` → for each page, `page.extract_tables()` → each table is a `list[list[str]]` (rows × 13 columns) → `_parse_tng_table()` maps fixed column indices (0=Trans No, 1=Entry Date/Time, 2=Exit Date/Time, 3=Posted Date, 4=Tran Type, 5=Entry Location, 6=Entry SP, 7=Exit Location, 8=Exit SP, 9=Reload Location, 10=Trans Amount, 11=Card Balance, 12=Sector) into `TngParsedRow` objects. Filtering: trans_no must be digits, amount must parse as positive float, sector must be one of TOLL/PARKING/RETAIL. Also `_extract_tng_meta()` scans raw text lines for `Account Name:`, `eWallet ID:`, `Transaction Period:` labels.

**The hard part is `extract_tables()`** — pdfplumber's table-structure detection (turning a visually-tabular PDF page into a 2D array of cells). Everything downstream of that (column parsing, date parsing, sector filtering) is plain string/date logic with no PDF-specific complexity — trivially portable to TypeScript once the 2D array exists.

### `/highlight-tng` (scan_service/main.py:1026-1138)

Pipeline: `fitz.open()` (PyMuPDF) → for each `{trans_no, amount}` item, `page.search_for(trans_no)` returns bounding rects of every occurrence of that exact text on the page → take the first hit's rect → `page.search_for(amount)` similarly → keep only the amount hit whose `y0` is within `Y_TOLERANCE = 3.0pt` of the trans_no hit's `y0` ("same row" heuristic, since the same amount can legitimately appear on multiple rows) → `add_highlight_annot()` on both rects, yellow.

**The hard part is `search_for()`** — finding the exact pixel/point position of a text string on a rendered PDF page. This requires positional text extraction, not just a flat text dump.

---

## 2. What de-risked this (the research that mattered)

Two things had to be verified before committing to this plan, because getting either wrong is exactly how a migration like this stalls out mid-build:

**a) Is `pdfjs-dist` actually usable in Node?** The existing code (`apps/user/lib/tng-highlighter.ts`) has a comment explicitly rejecting it: *"pdfjs-dist v5 requires a worker file path that varies between Vercel deployments, causing silent failures in production."* Verified via current docs: in Node.js, PDF.js has no worker support at all and automatically falls back to running on the main thread — the worker-path problem is specifically a browser/webpack-bundling issue, not a Node limitation. Worth noting: `next.config.ts` already has `pdfjs-dist` listed in `serverExternalPackages` (alongside `pdfkit`/`pdf-parse`) — the exact fix for bundler-path confusion on Vercel — but nothing in the codebase ever actually used pdfjs-dist to test it. The infrastructure to make it safe was already half-built and never finished.

**b) Does a mature Node library exist for PDF table/position extraction, or would this mean hand-rolling text-clustering logic?** Checked several candidates. `pdf-parse`'s own docs explicitly mark table extraction as **"(WIP)"** — not ready, ruled out. Found **`pdf.js-extract`** (npm, MIT, actively maintained — latest release April 2026, 256 GitHub stars): it wraps pdf.js internally (so the worker question is moot — it's handled inside the package) and exposes exactly what's needed for both problems:
- Per-text-item coordinates (`x`, `y`, `width`, `height`) on every page — equivalent to PyMuPDF's `search_for()` bounding rects.
- Built-in table-reconstruction utilities: `PDFExtract.utils.pageToLines(page, tolerance)` groups text items into lines by Y-proximity, `extractTextRows(lines)` converts to plain `string[][]` rows, `extractColumnRows(lines, columnXPositions, tolerance)` maps to columns by X-position — this is a direct equivalent of pdfplumber's `extract_tables()` output shape, which is exactly what `_parse_tng_table()` already expects as input.

One library covers both replacements. This is the single fact that turns this from "risky, might get stuck" into "buildable, bounded work."

---

## 3. The plan

### 3a. `/parse-tng` replacement

**Status: DONE and verified 2026-07-21 — perfect match against ground truth.** `apps/user/lib/tng-parser.ts` exists, type-checks clean, and reproduces all 35 transactions / all fields exactly against a ground-truth run of the actual Python logic (run directly via pdfplumber in a scratch environment against the real sample, not guessed) for `docs/99-Sample-reference/TNG-Statement.pdf`.

**The plan changed mid-build — worth recording why.** The original plan (above, kept for history) assumed `pdf.js-extract`'s text-position utilities (`pageToLines`/`extractColumnRows`) would be enough to reconstruct rows and columns, the same way pdfplumber does. That assumption was tested against the real sample and found false: TNG statement cells wrap across multiple visual lines per transaction, and this document's line spacing means a genuine next-row gap (as small as 8.7pt) can be *smaller* than an intra-cell wrap gap (~9.6pt) — no text-position heuristic (row-midpoint split, per-column gap clustering, nearest-anchor + sticky propagation — all three were tried) could reliably tell "still the same cell" from "next row's cell." Root cause: pdfplumber isn't using text position at all — it reads the PDF's actual drawn ruling lines (this sample has 546 vector lines, 273 rects), which `pdf.js-extract` has no access to (text-only library).

**The actual, working approach:** `pdf.js-extract` was dropped entirely. `apps/user/lib/tng-parser.ts` now uses `pdfjs-dist` directly (already a project dependency) for two things in one pass:
1. `page.getTextContent()` for text items (`str`, `x`, `y` — same coordinate convention as the step-1 spike: `extractY = pageHeight - transform[5]`).
2. `page.getOperatorList()`, walked manually (tracking the CTM through save/restore/transform, decoding `constructPath`'s packed sub-op/coordinate array) to find the real horizontal and vertical ruling-line positions — the exact row and column boundaries, not estimated ones.

Every text item is bucketed into its real grid cell by boundary containment (`boundaries[i] <= value < boundaries[i+1]`), multi-line cells naturally reassemble because all their lines fall in the same cell, and header/footer text is excluded for free — it just doesn't fall inside any data-row interval. `_extract_tng_meta`, `_pick_retail_label`, `_parse_tng_datetime`, and `_parse_tng_table`'s row rules ported to TypeScript with no further changes needed.

**Dependency note:** `getTextContent()` needs a `DOMMatrix` global that doesn't exist in Node by default; pdfjs-dist tries to polyfill it from the optional native `@napi-rs/canvas` package and just warns if that's missing, then throws `ReferenceError: DOMMatrix is not defined` the first time it's actually needed. Rather than pull in a native-binary dependency for one matrix class, added the lightweight pure-JS `dommatrix` package and polyfill `globalThis.DOMMatrix` before importing pdfjs-dist (see `loadPdfjs()` in the file).

**Discovered and fixed a real bug in my own port** (not a Python parity issue): the initial date-validation step round-tripped through `new Date(iso)` + `getUTCFullYear()`/`getUTCMonth()` to catch invalid calendar dates (e.g. day=31 in a 30-day month) — but for any 1st-of-month date at `00:00:00+08:00`, converting to UTC subtracts 8 hours and crosses back into the previous day/month, making a genuinely valid date look invalid. Caught via the ground-truth diff (trans_no 62344's Posted Date, `01/02/2026`, was coming out `null`). Fixed with direct calendar arithmetic (a `daysInMonth()` table) instead of a timezone-sensitive round-trip — no Date/UTC conversion involved at all now.

**Discovered Python quirk, ported faithfully, not fixed:** `_parse_tng_datetime` strips all spaces from the date string before checking for a two-part "date time" split — since the split already ran, that branch is unreachable, so any column with combined date+time (Entry/Exit Date and Time) always fails to parse and returns `None` in production today. `_parse_tng_table`'s fallback logic (`exit_datetime or posted_datetime`, RETAIL backfill from `posted_datetime`) silently absorbs this — Posted Date is date-only and parses fine, so it fills in instead. The Node port replicates this exactly (see the comment above `parseTngDatetime` in `tng-parser.ts`) so parallel-run diffs against live Python match. Worth a decision from Eff: fix it in the Node version (Entry/Exit Date and Time would start actually populating — a real improvement) or keep parity with current production behavior for now and fix later as a separate, disclosed change.

**Sample 2 (2026-07-21, `Statement-KL-Mar-Jun.pdf`, Eff-supplied): found and fixed a real architectural gap, not a data quirk.** This statement's page 2 has an "Online Card Transactions" section stacked below the usual "Offline Card Transactions" table — a second, differently-formatted table on the SAME page, with fewer/narrower columns (11 vs the Offline table's 13, no Reload Location or Card Balance columns). The original column-boundary detection collected every vertical ruling line on the page into ONE shared set, page-wide — so the Online table's narrower column dividers leaked into and split several of the Offline table's real columns, silently dropping all 8 Offline rows on that page (11/19 transactions extracted instead of 19/19). Root-caused by clustering raw vertical segments by X and comparing their Y-extent/frequency against the row bands they actually apply to (found the Online table's dividers only covered rows in Y-range [363,467], not the full table) — confirmed via ground truth that pdfplumber naturally avoids this because it detects separate connected table regions rather than one page-wide grid.

**Fix:** `columnBoundariesForBand()` now derives column boundaries PER ROW BAND — a vertical segment only counts as a boundary for a given row if it covers at least half that row's height — instead of one global per-page set. Re-verified sample 1 afterward to confirm no regression (still 35/35, zero mismatches). Sample 2 now matches ground truth exactly: **19/19 transactions, zero field mismatches.**

**Independent code review (2026-07-21), before cutover — found and fixed a real "silently wrong data" risk.** With a fresh-eyes review (no shared context with the build work) of `tng-parser.ts`, `tng-highlighter.ts`, `pdfjs-text.ts`, and the route wiring: the amount-parsing step used JS's `parseFloat()`, which silently parses a leading numeric prefix and ignores trailing garbage (`parseFloat("11.64 xyz") === 11.64`) — unlike Python's `float()`, which raises on anything not a clean number and rejects the whole row. Since this row-bucketing code can legitimately merge two adjacent table cells into one string (see the highlighter's identical finding above), a mis-scoped cell was exactly the shape of input that could silently produce a plausible-but-wrong amount instead of correctly rejecting the row — worse than a silently missing row, since this feeds a reimbursement/audit trail.

First fix attempt (require the whole string to be one plain decimal) was too strict and caused a real regression: sample 1 dropped from 35 to 30 transactions, because it rejected exactly the 5 known merged-cell rows (`"0.65 105.96"` etc.) that are legitimately correct — Trans Amount always comes first in that merge, confirmed against ground truth. Fixed properly: accept either one plain decimal, or several whitespace-separated decimals (the verified merged-cell shape), always take the first token — this still rejects genuine non-numeric garbage (e.g. `"11.64 abc"`), closing the review's actual concern without reintroducing the regression. Re-verified against all 3 samples afterward: sample 1 back to 35/35 zero mismatches, sample 2 still 19/19 zero mismatches, sample 3 still cleanly rejected. Highlighter re-checked too (untouched by this fix, confirmed still 70/70 + 38/38).

**Sample 3 (2026-07-21, `TngKL_unlocked.pdf`, Eff-supplied): out of scope, not a bug — confirmed both engines agree.** This file is a different TNG export entirely — "TNG Wallet Transaction History" (DuitNow transfers, e-wallet Payments, Card Reloads; 47 pages), not the "Customer Transactions Statement" (Trans No./Sector/toll-parking-retail) format `/parse-tng` is built for. Neither the Python ground truth nor the Node port finds any transactions in it — both correctly return zero and the Node port throws the same `PARSE_ERROR: No transactions found` the route already maps to a 422. This is expected, consistent behavior, not a gap to close under this migration; supporting the Wallet Transaction History format would be new scope, not a parity requirement. Also confirms error-path parity, not just happy-path: ran in under 1s despite 47 pages, no performance concern from the per-row-band column-boundary work in the sample-2 fix.

**Caveat: 3 real samples tried (2 in-scope and matching, 1 confirmed out-of-scope with consistent behavior).** Different in-scope statement layouts beyond the two matching samples (different account types, older/newer TNG template versions, more Online-transaction edge cases) still haven't been tested — §4's multi-sample parallel-run validation continues to apply before cutover. `apps/user/app/api/tng/parse/route.ts` calls this Node path only when `TNG_NODE_ENGINE=true`; default is still Python.

### 3b. `/highlight-tng` replacement

**Status: DONE and verified 2026-07-21.** `apps/user/lib/tng-highlighter.ts` rebuilt (replacing the Python-delegating version), reusing `tng-parser.ts`'s `pdfjs-dist` extraction pattern — pulled the shared parts (`loadPdfjs()`, `getPageTextItems()`) into `apps/user/lib/pdfjs-text.ts` so both files import from one place instead of duplicating the `DOMMatrix`-polyfill/coordinate-conversion logic. `tng-parser.ts` was updated to import from the shared module too (behavior unchanged — same 35/35 ground-truth match re-confirmed after the refactor).

Algorithm (port of Python's `highlight_tng()`, `Y_TOLERANCE = 3.0`): per `{trans_no, amount}` item, search every page in order for an exact text match on `trans_no`; take the first hit, highlight it, stop searching further pages for this item. If `amount` given, search the same page for a match within `Y_TOLERANCE` of the trans_no hit's Y, highlight it too. `pdf-lib`'s `drawRectangle()` (multiply blend mode, so text stays legible) bakes the highlight into the page content stream — see §3c, a deliberate choice, not a downgrade from PyMuPDF's native annotation.

**A real gap found and fixed during validation, not by guessing:** exact whole-text-item matching missed 5 of 35 amounts (`0.65`, `4.00`, `100.00` ×2, `19.93`) because pdfjs-dist sometimes emits two adjacent table cells as one text item joined by a literal space (e.g. `"0.65 105.96"` for Trans Amount + Card Balance together) — PyMuPDF's `search_for()` does substring-level matching internally and doesn't have this problem. Fixed by adding a token-level fallback search (`findTextMatch()`) that splits merged items on whitespace and computes an approximate sub-rectangle by character-count proportion of the item's width. After the fix: **70/70 highlights** (35 trans_no + 35 amount) and **35/35 items matched**, verified against a ground-truth run of the actual Python algorithm executed directly via PyMuPDF (`pip install pymupdf`) against the real sample — not guessed. Also visually confirmed by rendering the highlighted output PDF to PNG and inspecting placement by eye; annotation count confirmed at 0 (highlights are baked into content, not native annotations, as intended).

**Sample 2 found a second real bug: an infinite loop, not a mismatch.** The amount-search retry logic (search every occurrence of `amount` on a page, skip ones not on the trans_no's row, try the next) tracked only the MOST RECENTLY rejected candidate as "excluded." Sample 2 has several repeated toll fares (`1.75` appears 3+ times) — with only one exclusion slot, two non-matching candidates for the same amount string could toggle forever (exclude A → finds B → exclude B, A no longer excluded → finds A again → ...), hanging the process. Caught as a timeout during this step's validation, not a silent failure. Fixed by accumulating a `Set` of every already-tried item instead of replacing a single exclusion — `findTextMatch()`'s `exclude` param is now `ReadonlySet<ExtractedTextItem>`. Re-verified sample 1 afterward (still 70/70, no regression). Sample 2 now completes cleanly: **38/38 highlights, 19/19 items matched**, exact match against a PyMuPDF ground-truth run on this sample. Visually confirmed by rendering to PNG.

**Coordinate system gotcha — verified empirically, 2026-07-20.** Spike: built a PDF with `pdf-lib` at three known Y positions (top/mid/bottom of an A4-ish 595x842pt page) plus a fourth marker near y=10, then re-extracted with `pdf.js-extract` and compared. (The spike used `pdf.js-extract`, since it predates the switch to raw `pdfjs-dist` — the confirmed transform below is unaffected, since `tng-parser.ts`'s `pdfjs-dist`-based extraction was verified to produce the identical `extractY = pageHeight - transform[5]` convention.)

Confirmed transform: **`pdfLibY = pageHeight - extractY`** — a pure flip, no height/baseline adjustment. Exact match at all four test points (800↔42, 421↔421, 40↔802, 10↔832; `pageHeight - extractY` reproduces the known `pdf-lib` y exactly every time). The `flip-minus-height` variant tested alongside it did not match at any point, ruling it out.

Practical implication for the highlighter: `pdf.js-extract`'s `{x, y, width, height}` for a matched item converts to a `pdf-lib` rectangle as:
```
rectX = item.x
rectY = pageHeight - item.y   // bottom edge of the highlight box
rectWidth = item.width
rectHeight = item.height      // extends upward from rectY
```
`pageHeight` must be read per-page dynamically, not hardcoded — it's at `data.pages[i].info.height` (not `pageInfo`, which doesn't exist on the returned object; confirmed by inspecting the actual shape, not the docs example).

This was the single biggest risk in the plan (§0 framing: "getting this backwards produces a highlight box floating in empty space or off the page, not a crash"). It's now closed — step 1 of §5 Sequencing is done.

### 3c. Native highlight annotation vs. drawn rectangle — a deliberate, disclosed difference

PyMuPDF's `add_highlight_annot()` creates a real PDF annotation object (a distinct, technically-toggleable layer in viewers like Acrobat's Comments panel). `pdf-lib`'s `drawRectangle()` bakes the highlight permanently into the page content stream instead — visually identical in every PDF viewer, browser preview, and print, but not a removable "comment" layer. For an audit-trail export document (the whole point is an immutable record), a baked-in highlight is arguably the *more* correct choice, not a downgrade — worth stating plainly rather than treating as a silent compromise.

---

## 4. Testing & rollout strategy (this is the part that prevents getting stuck)

1. **Build both replacements behind a local flag/branch, Render stays running untouched throughout.** Nothing in production changes until parallel-run validation passes.
2. **Collect 5-10 real TNG statement PDFs** (redact/anonymize account details if needed) covering different transaction mixes (TOLL/PARKING/RETAIL) and, ideally, more than one statement layout if Eff has seen format variations over time.
3. **Parallel-run comparison**: for each sample PDF, run both the Python endpoint and the new Node function, diff the outputs field-by-field (`transactions[]` count, amounts, dates, sectors for parsing; `highlights_added`/`matched_items` for highlighting). Any mismatch gets root-caused before moving on — no "close enough."
4. **Visual QA on highlighting** specifically: open several Node-highlighted output PDFs and confirm boxes land on the correct text, not just that the byte count changed.
5. **Only after parallel-run passes cleanly**, swap the call sites (`tng/parse/route.ts`, `tng-highlighter.ts`) to the Node path, keep Render deployed but idle for one release cycle as a rollback option, then decommission the Render service.

## 5. Sequencing

1. ~~Build the coordinate-system verification spike (§3b gotcha) first~~ — **DONE 2026-07-20**, transform confirmed (`pdfLibY = pageHeight - extractY`), see §3b.
2. ~~Build `/parse-tng` replacement~~ — **DONE 2026-07-21** (`apps/user/lib/tng-parser.ts`), verified with a perfect 35/35-transaction, all-fields match against ground truth from the real sample Eff supplied (`docs/99-Sample-reference/TNG-Statement.pdf`). Approach changed mid-build from text-position heuristics (pdf.js-extract) to real ruling-line detection (raw pdfjs-dist operator parsing) — see §3a for why. `pdf.js-extract` is no longer a dependency.
3. ~~Build `/highlight-tng` replacement~~ — **DONE 2026-07-21** (`apps/user/lib/tng-highlighter.ts`), verified with a perfect 70/70-highlight, 35/35-item match against a PyMuPDF ground-truth run against the real sample. Found and fixed a genuine gap (merged-cell text runs) during validation — see §3b.
4. ~~Wire both into the existing route files~~ — **DONE 2026-07-21**, gated by `TNG_NODE_ENGINE === 'true'` (unset = Python/Render, current production behavior unchanged):
   - `apps/user/app/api/tng/parse/route.ts` — Node branch calls `parseTngStatement()` directly, normalizes to the same response shape as the Python branch. Confirmed via an end-to-end sandbox run against the real sample: 35 rows, 26 TOLL, 7 PARKING, correct `meta`/`statement_label` derivation.
   - `apps/user/lib/tng-highlighter.ts` — exported `highlightTransNos()` now picks between `highlightTransNosNode` (new) and `highlightTransNosPython` (restored from the pre-step-3 version) via the flag. **Correction, not just an addition:** step 3's rewrite had replaced this file's body outright, which — because `exports/route.ts` already calls this exact function — would have silently cut highlighting over to the unvalidated Node path in production with no flag and no parallel-run check, contradicting §4's own rollout rule. Caught and fixed as part of this step, before it shipped.
5. ~~Parallel-run validation (§4)~~ — **CONCLUDED by Eff's decision, 2026-07-21.** 3 real samples tried: 2 in-scope (perfect match after fixes), 1 out-of-scope (both engines agree it doesn't apply). Two real bugs found via sample 2 (§3a column-boundary bug, §3b infinite loop) and one more found via an independent code review before cutover (§3a, amount-parsing "silently wrong data" risk) — all three fixed and re-verified against every sample with zero regressions. This is short of the originally-planned 5-10 samples; Eff explicitly chose to proceed with what's validated rather than wait for more. Recorded here as a deliberate, informed risk acceptance, not a silent lowering of the bar.
6. **Cutover — see §6 for the exact runbook.** Prepared but not yet executed; requires a manual env var change in Vercel (outside my tool access) plus a monitoring window before Render decommission.

Steps 1-5 done. Both engines are live in the codebase and route-wired, but the Node path only runs when `TNG_NODE_ENGINE=true` is explicitly set — production default is still 100% Python/Render until Eff flips it.

## 6. Cutover runbook

**Precondition (met):** steps 1-5 above — both engines built, wired behind `TNG_NODE_ENGINE`, validated against 2/2 perfect real in-scope samples plus a reviewed, re-verified bug fix. Render (`scan_service`) has not been touched and keeps running throughout everything below — this is additive until the moment the flag flips, and reversible after.

1. **Flip the flag in Vercel** (I have no tool access to set Vercel environment variables — this step is Eff's to do): in the `apps/user` Vercel project → Settings → Environment Variables, add `TNG_NODE_ENGINE` = `true` for the Production environment. Redeploy (or trigger a new deployment) so the running functions pick up the new value — Vercel serverless functions read env vars at build/deploy time, so just saving the variable isn't enough on its own.
2. **Watch the first real imports after the flip.** Both `apps/user/app/api/tng/parse/route.ts` and `tng-highlighter.ts` log clearly on the Node path (`console.error('[POST /api/tng/parse] Node parse ...')`, `[tng-highlighter] N highlights added, matched: [...]`) — check Vercel's function logs for the first few statement imports and PDF exports after cutover, confirming transaction counts and highlight counts look sane (non-zero where expected, no `PARSE_ERROR`/`SERVER_ERROR` spikes).
3. **Rollback path, if anything looks wrong:** set `TNG_NODE_ENGINE` back to `false` (or delete the variable) in Vercel, redeploy. Render/Python is still live and untouched, so this restores the exact prior behavior with no data loss — the whole point of keeping Render running through this step.
4. **Render decommission — only after a full rollback window with the flag on and no issues** (the plan's original guidance: "keep Render deployed but idle for one release cycle"). Do not touch `scan_service/main.py` or shut down the Render service before this window has passed cleanly.
