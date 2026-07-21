// apps/user/lib/tng-parser.ts
//
// Node/TypeScript replacement for scan_service's POST /parse-tng (Python,
// pdfplumber). Part of the Render retirement plan — see
// docs/01-architecture/04_SCAN_SERVICE_RETIREMENT_PLAN.md (step 2 of 6).
//
// Ports scan_service/main.py's _parse_tng_table(), _extract_tng_meta(),
// _pick_retail_label(), and _parse_tng_datetime() to TypeScript as faithfully
// as possible (see the "known Python quirk" note below — one behavior is
// preserved deliberately, not fixed, to keep output parity with production
// during the parallel-run validation step).
//
// TABLE RECONSTRUCTION — history worth knowing before touching this file:
// pdfplumber's extract_tables() detects table structure from the PDF's own
// drawn ruling lines (actual vector rects/lines forming the grid), not from
// text position heuristics. Three text-position-only approaches were tried
// here first and each failed against the real sample
// (docs/99-Sample-reference/TNG-Statement.pdf) once diffed against a true
// ground-truth run (the actual Python logic, run directly via pdfplumber in
// a scratch environment — not guessed):
//   1. Split rows at the midpoint between consecutive Trans No. anchors —
//      failed because a wrapped cell's tail can extend past the midpoint
//      into the next row's territory.
//   2. Per-column Y-gap clustering — failed the opposite way: this specific
//      document's line spacing means a genuine next-row gap (as small as
//      8.7pt) can be SMALLER than an intra-cell wrap gap (~9.6pt). No gap
//      threshold reliably separates the two cases.
//   3. Nearest-anchor assignment + "sticky" neighbor propagation — same
//      failure mode as #2, just deferred.
// The fix: stop guessing from text position and read the PDF's actual grid.
// `pdf.js-extract` (originally chosen for this file) only extracts text, no
// vector graphics — so it was dropped. This file now uses `pdfjs-dist`
// directly (already a project dependency) for BOTH text content
// (`page.getTextContent()`) and the real ruling-line positions, read from
// the raw drawing operator list (`page.getOperatorList()`), replicating
// what pdfplumber does natively. Verified 35/35 transactions, all fields,
// exact match against ground truth — see the retirement plan doc §3a.
//
// NOT YET WIRED IN. This file is additive only — apps/user/app/api/tng/parse/route.ts
// still calls the Python scan service. Do not swap the call site until the
// parallel-run validation in the retirement plan doc (§4) passes against a
// broader set of real sample statements (only one has been tested so far).

// ── Types (mirrors scan_service's Pydantic models) ──────────────────────────

export type TngSector = 'TOLL' | 'PARKING' | 'RETAIL'

export interface TngParsedRow {
  trans_no: string
  entry_datetime: string | null
  exit_datetime: string | null
  entry_location: string | null
  exit_location: string | null
  amount: number
  sector: TngSector
  tran_type: string | null
  retail_label: string | null
}

export interface TngStatementMeta {
  account_name: string | null
  ewallet_id: string | null
  period: string | null
}

export interface TngParseResult {
  meta: TngStatementMeta
  transactions: TngParsedRow[]
  toll_count: number
  parking_count: number
  retail_count: number
  skipped_retail: number
}

/** Mirrors the Python endpoint's "PARSE_ERROR: ..." HTTPException(422) convention. */
export class TngParseError extends Error {}

// ── Column layout (see scan_service/main.py:830-847 for the source-of-truth doc) ──
//
//   0  Trans No.              7  Exit Location
//   1  Entry Date and Time    8  Exit SP
//   2  Exit Date & Time       9  Reload Location
//   3  Posted Date            10 Trans Amount (RM)
//   4  Tran Type              11 Card Balance (RM)
//   5  Entry Location         12 Sector
//   6  Entry SP

export const TNG_COLUMN_COUNT = 13

// ── String cleaning (port of scan_service/main.py:784-788 `_clean`) ────────

function clean(s: string | null | undefined): string | null {
  if (s == null) return null
  // Python: " ".join(s.replace('\n', ' ').split()).strip()
  // — collapses all runs of whitespace (incl. newlines) to single spaces, trims.
  const result = s.replace(/\n/g, ' ').trim().split(/\s+/).join(' ')
  return result ? result : null
}

// ── Date parsing (port of scan_service/main.py:790-810 `_parse_tng_datetime`) ──
//
// KNOWN PYTHON QUIRK, preserved faithfully — not fixed:
// The Python function strips ALL spaces from `cleaned` (`cleaned.replace(' ', '')`)
// before checking `len(parts) == 2` on `cleaned.split()`. Since all spaces were
// already removed, `cleaned.split()` can never yield 2 parts — the "date + time
// in one field, no separate time_raw" branch is dead code. Every call site in
// `_parse_tng_table` passes only `date_raw` (no `time_raw`), so any column
// containing "DD/MM/YYYY HH:MM:SS" (date and time together, e.g. Entry/Exit
// Date and Time) falls through to `datetime.strptime(cleaned, "%d/%m/%Y")`,
// which raises ValueError on the mangled "DD/MM/YYYYHH:MM:SS" string and
// returns None. In production this is silently absorbed by the fallback logic
// in `_parse_tng_table` (`exit_datetime or posted_datetime`, and the RETAIL
// backfill from `posted_datetime`) — Posted Date is typically date-only and
// parses fine, so entry/exit datetimes are effectively always None today and
// the Posted Date fills in instead.
//
// This is ported EXACTLY as observed so parallel-run output diffs against
// the live Python endpoint match. Fixing it is a real, separate improvement
// (Entry/Exit Date and Time would start populating instead of always being
// null) — flagged to Eff as a discovered issue, not silently changed here.
function parseTngDatetime(dateRaw: string | null): string | null {
  if (!dateRaw) return null
  let cleaned = clean(dateRaw)
  if (!cleaned) return null
  cleaned = cleaned.replace(/ /g, '') // faithful port of the space-stripping quirk above

  // Only the date-only path is ever actually reachable (see quirk note).
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(cleaned)
  if (!m) return null // mirrors the `except ValueError: return None` fallback

  const [, dd, mm, yyyy] = m
  const day = Number(dd)
  const month = Number(mm)
  const year = Number(yyyy)
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(month, year)) return null

  // MYT = UTC+8, fixed offset, no DST — matches Python's `MYT` tzinfo.
  return `${yyyy}-${mm}-${dd}T00:00:00+08:00`
}

// Calendar validation matching Python's strptime behavior (rejects e.g. day=31
// in a 30-day month). A round-trip through `new Date(...)` + getUTCFullYear/
// getUTCMonth was tried first and had a real bug: for any 1st-of-month date at
// 00:00:00+08:00, converting to UTC subtracts 8 hours and crosses back into
// the previous day/month, making a genuinely valid date look invalid (caught
// via the ground-truth diff on trans_no 62344's Posted Date, "01/02/2026").
// Direct calendar arithmetic avoids the timezone conversion entirely.
function daysInMonth(month: number, year: number): number {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  return [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
}

// ── Retail label picker (port of `_pick_retail_label`) ──────────────────────

function pickRetailLabel(
  tranType: string | null,
  entryLoc: string | null,
  exitLoc: string | null,
  reloadLoc: string | null,
): string | null {
  for (const value of [entryLoc, exitLoc, reloadLoc, tranType]) {
    const cleaned = clean(value)
    if (cleaned) return cleaned
  }
  return null
}

// ── Statement meta (port of `_extract_tng_meta`) ─────────────────────────────

export function extractTngMeta(fullText: string): TngStatementMeta {
  let accountName: string | null = null
  let ewalletId: string | null = null
  let period: string | null = null

  const splitAfterFirstColon = (line: string): string => {
    const idx = line.indexOf(':')
    return idx === -1 ? '' : line.slice(idx + 1).trim()
  }

  for (const line of fullText.split('\n')) {
    if (line.includes('Account Name') && line.includes(':')) {
      accountName = splitAfterFirstColon(line) || null
    } else if (line.includes('eWallet ID') && line.includes(':')) {
      ewalletId = splitAfterFirstColon(line) || null
    } else if (line.includes('Transaction Period') && line.includes(':')) {
      period = splitAfterFirstColon(line) || null
    }
  }

  return { account_name: accountName, ewallet_id: ewalletId, period }
}

// ── Row parsing (port of `_parse_tng_table`, applied to one already-reconstructed row) ──

const SECTOR_VALID = new Set(['TOLL', 'PARKING', 'RETAIL'])

function parseTngTableRow(rawRow: Array<string | null>): TngParsedRow | null {
  if (!rawRow || rawRow.length < 12) return null

  const transNoRaw = clean(rawRow[0])
  if (!transNoRaw || !/^\d+$/.test(transNoRaw)) return null
  const transNo = transNoRaw

  const entryDateRaw = clean(rawRow[1])
  const exitDateRaw = clean(rawRow[2])
  const postedRaw = clean(rawRow[3])
  const tranType = clean(rawRow[4])
  const entryLoc = clean(rawRow[5])
  const exitLoc = clean(rawRow[7])
  const reloadLoc = clean(rawRow[9])
  const amountRaw = clean(rawRow[10])
  const sectorRaw = rawRow.length > 12 ? clean(rawRow[12]) : null

  if (!amountRaw) return null
  const amountCleaned = amountRaw.replace(/,/g, '')
  // Python's `float(amount_raw.replace(",", ""))` is all-or-nothing — it raises
  // ValueError (row rejected via `continue`) on anything that isn't a clean
  // number. JS's `parseFloat` does NOT have this property — it silently parses
  // a leading numeric prefix and ignores the rest (`parseFloat("11.64 xyz")
  // === 11.64`), which risks producing plausible-but-wrong output on truly
  // garbled input instead of correctly rejecting the row. Found via independent
  // code review during step 5 (2026-07-21), before cutover.
  //
  // First attempt at a fix (requiring the WHOLE cleaned string to be one plain
  // decimal) was too strict and caused a real regression on sample 1 (35→30
  // transactions): this row-bucketing code sometimes merges two adjacent table
  // cells into one text item joined by a literal space — the exact same
  // Trans-Amount/Card-Balance merge documented in tng-highlighter.ts (e.g.
  // `amountRaw` arrives as "0.65 105.96", both legitimately correct numbers,
  // not garbage). Rejecting that shape outright silently DROPPED 5 genuinely
  // valid transactions. Ground truth confirms the intended value is always the
  // FIRST number in that case (Trans Amount comes before Card Balance in
  // column order). So the validation accepts either one plain decimal, or
  // several whitespace-separated decimals (the verified merged-cell shape),
  // and always takes the first token — this still rejects anything with
  // actual non-numeric garbage (e.g. "11.64 abc"), which is what the original
  // fix was trying to guard against; it does not reintroduce parseFloat's
  // "silently truncate garbage" behavior.
  if (!/^-?\d+(\.\d+)?(\s+-?\d+(\.\d+)?)*$/.test(amountCleaned)) return null
  const firstAmountToken = amountCleaned.trim().split(/\s+/)[0]
  const amount = Math.round(parseFloat(firstAmountToken) * 100) / 100
  if (!Number.isFinite(amount) || amount <= 0) return null

  const sector = (sectorRaw ?? '').toUpperCase()
  if (!SECTOR_VALID.has(sector)) return null

  let entryDatetime = parseTngDatetime(entryDateRaw)
  let exitDatetime = parseTngDatetime(exitDateRaw)
  const postedDatetime = parseTngDatetime(postedRaw)
  const retailLabel = pickRetailLabel(tranType, entryLoc, exitLoc, reloadLoc)

  let effectiveEntryLoc = entryLoc
  let effectiveExitLoc = exitLoc

  if (sector === 'RETAIL') {
    if (!effectiveEntryLoc) effectiveEntryLoc = retailLabel
    if (!effectiveExitLoc && reloadLoc && reloadLoc !== effectiveEntryLoc) effectiveExitLoc = reloadLoc
    if (!exitDatetime && postedDatetime) exitDatetime = postedDatetime
    if (!entryDatetime && postedDatetime) entryDatetime = postedDatetime
  }

  return {
    trans_no: transNo,
    entry_datetime: entryDatetime,
    exit_datetime: exitDatetime ?? postedDatetime,
    entry_location: effectiveEntryLoc,
    exit_location: effectiveExitLoc,
    amount,
    sector: sector as TngSector,
    tran_type: tranType,
    retail_label: retailLabel,
  }
}

// ── pdfjs-dist loading + text extraction ─────────────────────────────────
//
// `loadPdfjs()` and `getPageTextItems()` moved to lib/pdfjs-text.ts once
// tng-highlighter.ts (step 3) needed the exact same logic — see that file
// for the DOMMatrix-polyfill and coordinate-convention notes.
import { loadPdfjs, getPageTextItems, type ExtractedTextItem } from './pdfjs-text'

// ── Vector grid-line extraction ──────────────────────────────────────────────
//
// Walks the page's raw drawing operator list, tracking the CTM through
// save/restore/transform, decoding constructPath's packed sub-op/coordinate
// array (0=moveTo, 1=lineTo, 2/3=curveTo variants — endpoint only, 4=closePath,
// 5=rectangle — all empirically confirmed against this pdfjs-dist version,
// not from public docs, since this encoding isn't part of pdfjs-dist's public
// API surface). Collects horizontal and vertical straight segments, clusters
// them by rounding to the nearest 0.5pt, and returns the resulting unique
// line positions — these are the table's real row/column boundaries, the
// same data pdfplumber's ruling-line table detection reads.

type Matrix = [number, number, number, number, number, number]

function multiplyMatrix(a: number[], b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
    a[4] * b[0] + a[5] * b[2] + b[4],
    a[4] * b[1] + a[5] * b[3] + b[5],
  ]
}

function applyMatrix(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
}

// A raw vertical segment, native (bottom-left) space, x rounded to 0.5pt,
// y0/y1 the segment's extent (y0 < y1). Kept un-deduped and with its extent
// intact — unlike horizontalYs, verticals can't be safely collapsed into one
// global page-wide set (see the "multiple table regions per page" note
// below), so callers derive column boundaries per row band instead.
type VerticalSegment = { x: number; y0: number; y1: number }

async function extractGridLines(
  page: { getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[] }> },
  OPS: Record<string, number>,
): Promise<{ horizontalYs: number[]; vSegs: VerticalSegment[] }> {
  const opList = await page.getOperatorList()

  let ctmStack: Matrix[] = [[1, 0, 0, 1, 0, 0]]
  let ctm: Matrix = ctmStack[0]
  const horizontalYs = new Set<number>()
  const vSegs: VerticalSegment[] = []

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i]
    const args = opList.argsArray[i] as number[] | null

    if (fn === OPS.save) {
      ctmStack.push(ctm)
    } else if (fn === OPS.restore) {
      ctm = ctmStack.pop() ?? [1, 0, 0, 1, 0, 0]
    } else if (fn === OPS.transform && args) {
      ctm = multiplyMatrix(args, ctm)
    } else if (fn === OPS.constructPath && args) {
      const subOps = (args[1] as unknown as [Float32Array])[0]
      let idx = 0
      let startX = 0
      let startY = 0
      const points: Array<[number, number]> = []

      while (idx < subOps.length) {
        const op = subOps[idx++]
        if (op === 0) {
          // moveTo — starts a new subpath; flush points collected so far isn't
          // needed here since we process segments incrementally below via the
          // full `points` array per constructPath call (subpaths within one
          // constructPath are rare for this document's simple rects/lines).
          const x = subOps[idx++]
          const y = subOps[idx++]
          const [px, py] = applyMatrix(ctm, x, y)
          startX = px
          startY = py
          points.length = 0
          points.push([px, py])
        } else if (op === 1) {
          const x = subOps[idx++]
          const y = subOps[idx++]
          points.push(applyMatrix(ctm, x, y))
        } else if (op === 2) {
          idx += 4 // skip bezier control points
          const x = subOps[idx++]
          const y = subOps[idx++]
          points.push(applyMatrix(ctm, x, y))
        } else if (op === 3) {
          idx += 2 // skip single control point
          const x = subOps[idx++]
          const y = subOps[idx++]
          points.push(applyMatrix(ctm, x, y))
        } else if (op === 4) {
          if (points.length > 0) points.push([startX, startY])
        } else if (op === 5) {
          const x = subOps[idx++]
          const y = subOps[idx++]
          const w = subOps[idx++]
          const h = subOps[idx++]
          const corners: Array<[number, number]> = [
            applyMatrix(ctm, x, y),
            applyMatrix(ctm, x + w, y),
            applyMatrix(ctm, x + w, y + h),
            applyMatrix(ctm, x, y + h),
          ]
          points.push(...corners, corners[0])
        } else {
          break // unknown sub-op — stop parsing this subpath defensively
        }
      }

      for (let k = 0; k < points.length - 1; k++) {
        const [x0, y0] = points[k]
        const [x1, y1] = points[k + 1]
        if (Math.abs(y0 - y1) < 0.5 && Math.abs(x0 - x1) > 2) {
          horizontalYs.add(Math.round(((y0 + y1) / 2) * 2) / 2)
        } else if (Math.abs(x0 - x1) < 0.5 && Math.abs(y0 - y1) > 2) {
          vSegs.push({ x: Math.round(((x0 + x1) / 2) * 2) / 2, y0: Math.min(y0, y1), y1: Math.max(y0, y1) })
        }
      }
    }
  }

  return {
    horizontalYs: [...horizontalYs].sort((a, b) => a - b),
    vSegs,
  }
}

/**
 * Column boundaries for ONE row band, not the whole page. Found the hard
 * way (2026-07-21, second real sample: docs/99-Sample-reference — a
 * statement with an "Online Card Transactions" section stacked below the
 * usual "Offline Card Transactions" table on the same page). That second
 * table has fewer, narrower columns; collecting every vertical segment on
 * the page into one shared column-boundary set (the original approach)
 * meant its column dividers leaked into the Offline table's grid, splitting
 * several of its real columns and silently dropping every Offline row on
 * that page (0 of 8 parsed, caught via a second-sample ground-truth diff).
 * pdfplumber avoids this because it detects separate connected table
 * regions rather than one page-wide grid; this is the equivalent fix for
 * our simpler geometry-only approach — scope column detection to the rows
 * it actually applies to. A vertical segment counts as a boundary for a row
 * band if it covers at least half that band's height (each real column
 * divider is drawn once per row, at the row's own height, in this
 * document's per-cell-rect-bordered table style — see the header note on
 * `extractGridLines`).
 */
function columnBoundariesForBand(vSegs: VerticalSegment[], pageHeight: number, bandTop: number, bandBottom: number): number[] {
  const bandHeight = bandBottom - bandTop
  const xs = new Set<number>()
  for (const seg of vSegs) {
    // native (bottom-left) -> extract (top-left): flipping reverses order, so
    // the segment's native y1 (higher) maps to the smaller extract-space Y.
    const extractTop = pageHeight - seg.y1
    const extractBottom = pageHeight - seg.y0
    const overlap = Math.min(extractBottom, bandBottom) - Math.max(extractTop, bandTop)
    if (overlap > 0 && overlap >= bandHeight * 0.5) {
      xs.add(seg.x)
    }
  }
  return [...xs].sort((a, b) => a - b)
}

/** Finds i such that boundaries[i] <= value < boundaries[i+1]. Returns -1 if out of range or fewer than 2 boundaries. */
function findInterval(value: number, boundaries: number[]): number {
  if (boundaries.length < 2) return -1
  if (value < boundaries[0] || value >= boundaries[boundaries.length - 1]) return -1
  // Linear scan is fine — boundary counts here are ~15-25 per page, called per text item.
  for (let i = 0; i < boundaries.length - 1; i++) {
    if (value >= boundaries[i] && value < boundaries[i + 1]) return i
  }
  return -1
}

/**
 * Groups text items into visual lines by Y-proximity (tolerance in points),
 * for statement-meta text reconstruction only (independent of the table
 * grid). Local reimplementation — small enough not to warrant pulling in a
 * separate library now that pdfjs-dist is used directly for everything else.
 */
function groupIntoLines(items: ExtractedTextItem[], tolerance: number): ExtractedTextItem[][] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
  const lines: ExtractedTextItem[][] = []
  for (const item of sorted) {
    const last = lines[lines.length - 1]
    if (last && Math.abs(item.y - last[0].y) <= tolerance) {
      last.push(item)
    } else {
      lines.push([item])
    }
  }
  return lines
}

/**
 * Node/TypeScript replacement for POST /parse-tng.
 * Throws TngParseError with the same "PARSE_ERROR: ..." message convention
 * the Python endpoint used, so callers can keep existing error-code mapping
 * (see apps/user/app/api/tng/parse/route.ts's `detail.startsWith('PARSE_ERROR')` check).
 */
export async function parseTngStatement(pdfBytes: Buffer): Promise<TngParseResult> {
  const pdfjs = await loadPdfjs()
  const OPS = pdfjs.OPS as unknown as Record<string, number>

  let doc
  try {
    // No `disableWorker` option needed: pdfjs-dist has no worker-thread support
    // in Node at all and automatically runs on the main thread (verified during
    // the tng-highlighter.ts research — the historical "pdfjs-dist rejected due
    // to worker path issues" comment was a browser/Vercel-bundling problem, not
    // a Node limitation).
    doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBytes) }).promise
  } catch (e) {
    throw new TngParseError(
      `PARSE_ERROR: Could not extract data from PDF. Is this a text-based TNG statement? (${(e as Error).message})`,
    )
  }

  if (!doc.numPages || doc.numPages === 0) {
    throw new TngParseError('PARSE_ERROR: PDF has no pages.')
  }

  let fullText = ''
  const allTransactions: TngParsedRow[] = []

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1 })
    const pageHeight = viewport.height

    const items: ExtractedTextItem[] = await getPageTextItems(page, pageHeight)

    // Meta text: reconstruct line-by-line text, independent of the table grid.
    const lines = groupIntoLines(items, 3)
    const pageText = lines.map((line) => line.map((it) => it.str.trim()).join(' ')).join('\n')
    fullText += pageText + '\n'

    // Table rows: bucket every item into its real grid cell via the PDF's
    // actual ruling lines (see extractGridLines above), not text-position
    // heuristics. Column boundaries are computed PER ROW BAND, not once for
    // the whole page — see columnBoundariesForBand's doc comment for why.
    const { horizontalYs, vSegs } = await extractGridLines(page, OPS)
    // horizontalYs are in native (bottom-left) space — convert to extract space and re-sort ascending.
    const rowBoundaries = horizontalYs.map((y) => pageHeight - y).sort((a, b) => a - b)

    if (rowBoundaries.length >= 2) {
      const numRows = rowBoundaries.length - 1
      const rows: Array<Array<string | null>> = new Array(numRows).fill(null).map(() => new Array(TNG_COLUMN_COUNT).fill(null))
      const itemsByRow: ExtractedTextItem[][] = new Array(numRows).fill(null).map(() => [])

      for (const it of items) {
        const rowIdx = findInterval(it.y, rowBoundaries)
        if (rowIdx === -1) continue
        itemsByRow[rowIdx].push(it)
      }

      for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
        const rowItems = itemsByRow[rowIdx]
        if (rowItems.length === 0) continue

        const columnBoundaries = columnBoundariesForBand(vSegs, pageHeight, rowBoundaries[rowIdx], rowBoundaries[rowIdx + 1])
        if (columnBoundaries.length < 2) continue

        for (const it of rowItems) {
          const colIdx = findInterval(it.x, columnBoundaries)
          if (colIdx === -1 || colIdx >= TNG_COLUMN_COUNT) continue
          const val = it.str.trim()
          if (!val) continue
          rows[rowIdx][colIdx] = rows[rowIdx][colIdx] ? `${rows[rowIdx][colIdx]} ${val}` : val
        }
      }

      for (const row of rows) {
        const parsed = parseTngTableRow(row)
        if (parsed) allTransactions.push(parsed)
      }
    }
  }

  if (allTransactions.length === 0) {
    throw new TngParseError(
      'PARSE_ERROR: No transactions found. Please check this is a TNG Customer Transactions Statement PDF.',
    )
  }

  const meta = extractTngMeta(fullText)
  const tollCount = allTransactions.filter((t) => t.sector === 'TOLL').length
  const parkingCount = allTransactions.filter((t) => t.sector === 'PARKING').length
  const retailCount = allTransactions.filter((t) => t.sector === 'RETAIL').length

  return {
    meta,
    transactions: allTransactions,
    toll_count: tollCount,
    parking_count: parkingCount,
    retail_count: retailCount,
    skipped_retail: 0,
  }
}
