// apps/user/lib/tng-highlighter.ts
//
// Node/TypeScript replacement for scan_service's POST /highlight-tng
// (Python, PyMuPDF). Part of the Render retirement plan — see
// docs/01-architecture/04_SCAN_SERVICE_RETIREMENT_PLAN.md (step 3 of 6).
//
// ENGINE SWITCH (step 4, 2026-07-21): this file is the actual call site
// apps/user/app/api/exports/route.ts already imports — unlike tng-parser.ts,
// which is a net-new module the parse route doesn't call yet, rewriting this
// file's body in step 3 would have silently cut export highlighting over to
// the untested Node path in production, with no flag and no parallel-run
// validation, contradicting this plan's own §4 rollout rule ("nothing in
// production changes until parallel-run validation passes"). Caught before
// merging: the Node implementation (verified 70/70 against ground truth on
// the one real sample tested) is kept as `highlightTransNosNode`, the
// original Python-delegating implementation is restored as
// `highlightTransNosPython`, and the exported `highlightTransNos` picks
// between them via `TNG_NODE_ENGINE === 'true'` (unset/false = Python,
// matching current production behavior exactly). Flip the env var to 'true'
// to run the Node path — for local parallel-run testing (§4) now, and as
// the production default once multi-sample validation passes (§5 step 5).
//
// Ports scan_service/main.py's highlight_tng() (lines ~1011-1139) as
// faithfully as the underlying libraries allow:
//   1. For each {trans_no, amount} item, search every page (in order) for
//      an exact text match on trans_no. Take the first hit found; stop
//      searching further pages for this item once found (matches Python's
//      `break` out of the page loop).
//   2. If amount is given, search the SAME page for an exact match on
//      amount whose Y is within Y_TOLERANCE of the trans_no hit's Y — this
//      is what prevents highlighting the wrong row when the same amount
//      string appears elsewhere on the page.
//   3. Highlight both matches.
//
// Text search: PyMuPDF's `page.search_for()` does substring/exact-string
// bbox search. Here, matches are exact string-equality against pdfjs-dist's
// text items (reusing lib/pdfjs-text.ts, the same extraction pattern
// tng-parser.ts uses — see that file's shared-module note). This is the
// same convention the Python endpoint itself relies on (it searches for
// exactly the trans_no / amount strings the parser already extracted), so
// parity is expected. Y-coordinate convention was verified against a
// PyMuPDF ground-truth check on the real sample (docs/99-Sample-reference/
// TNG-Statement.pdf) during this step's build: absolute Y values differ
// slightly between PyMuPDF's and pdfjs-dist's conventions, but the
// same-row tolerance check only ever compares two values from THIS
// extraction, so that difference doesn't matter — and same-row items were
// directly observed sharing exactly identical Y values in this extraction,
// which if anything makes the tolerance check more reliable here than in
// the Python original.
//
// Deliberate architecture decision (kept from the original plan, not a
// downgrade): instead of PyMuPDF's `add_highlight_annot()` — a native,
// user-toggleable/removable PDF annotation object — this draws the
// highlight rectangle directly into the page content stream via pdf-lib's
// `drawRectangle()` (multiply blend mode, so the underlying text stays
// legible under the yellow fill). That bakes the highlight in permanently,
// which is arguably more correct for an immutable audit/export document
// than leaving it as a removable annotation.
//
// Safety: on ANY error (PDF parse failure, no matches found, etc.) the
// original PDF buffer is returned unchanged, same contract as the
// Python-delegating version this replaces. The export must never fail
// because of the highlighter.

import { PDFDocument, rgb, BlendMode } from 'pdf-lib'
import type { SupabaseClient } from '@supabase/supabase-js'
import { loadPdfjs, getPageTextItems, type ExtractedTextItem } from './pdfjs-text'

// Matches Python's `Y_TOLERANCE = 3.0` in scan_service/main.py.
const Y_TOLERANCE = 3.0

type MatchRect = { x: number; y: number; width: number; height: number }
type TextMatch = { item: ExtractedTextItem; rect: MatchRect }

/**
 * Finds `target` among a page's text items. Tries a whole-item exact match
 * first (the common case — most cells are their own text item). Falls back
 * to a token-level search within merged multi-column text runs: pdfjs-dist
 * sometimes emits two adjacent table cells (e.g. Trans Amount and Card
 * Balance) as one text item with a literal space between them, e.g.
 * `"0.65 105.96"` — a real case hit against the sample PDF while validating
 * this file (5 of 35 amounts landed this way). PyMuPDF's `search_for()`
 * does the equivalent substring-level search internally, so this fallback
 * is what keeps behavior at parity rather than silently dropping matches.
 * The fallback's rectangle is approximated by character-count proportion
 * of the item's width — good enough for a highlight overlay, not claiming
 * per-glyph precision.
 *
 * `exclude` takes a Set, not a single item — found the hard way (second
 * real sample, 2026-07-21): the amount-search retry loop in
 * highlightTransNosNode tries candidates one at a time when the first
 * match isn't on the right row, excluding only the MOST RECENT reject. With
 * a single excluded item, two non-matching candidates for a repeated amount
 * (e.g. this sample's several "1.75" toll fares) can toggle forever —
 * candidate A excluded finds B, B excluded (A no longer excluded) finds A
 * again, infinite loop, caught as a hang during validation. Accumulating a
 * Set of every already-tried item closes it.
 */
function findTextMatch(items: ExtractedTextItem[], target: string, exclude?: ReadonlySet<ExtractedTextItem>): TextMatch | null {
  for (const it of items) {
    if (exclude?.has(it)) continue
    if (it.str.trim() === target) {
      return { item: it, rect: { x: it.x, y: it.y, width: it.width, height: it.height } }
    }
  }

  for (const it of items) {
    if (exclude?.has(it)) continue
    const totalChars = it.str.length
    if (totalChars === 0) continue
    const tokens = it.str.split(/(\s+)/) // keep separators so char offsets stay accurate
    let charOffset = 0
    for (const tok of tokens) {
      const trimmedTok = tok.trim()
      if (trimmedTok && trimmedTok === target) {
        const fracStart = charOffset / totalChars
        const fracEnd = (charOffset + tok.length) / totalChars
        return {
          item: it,
          rect: {
            x: it.x + fracStart * it.width,
            y: it.y,
            width: (fracEnd - fracStart) * it.width,
            height: it.height,
          },
        }
      }
      charOffset += tok.length
    }
  }

  return null
}

// ── Public entry ──────────────────────────────────────────────────────────

/**
 * Given a TNG statement PDF buffer and a list of {trans_no, amount} items,
 * returns a new PDF buffer with those transactions highlighted in yellow.
 * Both the Trans No. and Trans Amount (RM) columns are highlighted.
 *
 * Engine selection: `TNG_NODE_ENGINE === 'true'` runs the Node/pdfjs-dist
 * path (`highlightTransNosNode`); anything else (including unset) runs the
 * original Python/Render path (`highlightTransNosPython`) — this is the
 * current production default, unchanged since before this migration. See
 * the file header for why this flag exists.
 */
export async function highlightTransNos(
  pdfBytes: Buffer,
  items: Array<{ trans_no: string; amount: string }>,
  supabase?: SupabaseClient, // unused — kept for call-site compatibility
): Promise<Buffer> {
  if (process.env.TNG_NODE_ENGINE === 'true') {
    return highlightTransNosNode(pdfBytes, items)
  }
  return highlightTransNosPython(pdfBytes, items, supabase)
}

/**
 * Node/pdfjs-dist implementation — see file header. Verified 70/70 highlights,
 * 35/35 items matched against a PyMuPDF ground-truth run on the one real
 * sample tested so far (docs/99-Sample-reference/TNG-Statement.pdf).
 *
 * If no matches are found, or anything goes wrong, the original buffer is
 * returned unchanged — the export must never fail because of this step.
 */
export async function highlightTransNosNode(
  pdfBytes: Buffer,
  items: Array<{ trans_no: string; amount: string }>,
): Promise<Buffer> {
  const validItems = items
    .map((i) => ({ trans_no: i.trans_no.trim(), amount: i.amount.trim() }))
    .filter((i) => i.trans_no)

  if (validItems.length === 0) return pdfBytes

  try {
    const pdfjs = await loadPdfjs()
    const srcDoc = await pdfjs.getDocument({ data: new Uint8Array(pdfBytes) }).promise

    if (!srcDoc.numPages || srcDoc.numPages === 0) {
      console.warn('[tng-highlighter] PDF has no pages — returning original PDF')
      return pdfBytes
    }

    // Extract every page's text items once up front (sorted into reading
    // order), reused across all items below — cheaper than re-extracting
    // per item like a naive per-item search_for() call would.
    const pages: Array<{ items: ExtractedTextItem[]; height: number }> = []
    for (let pageNum = 1; pageNum <= srcDoc.numPages; pageNum++) {
      const page = await srcDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1 })
      const height = viewport.height
      const pageItems = (await getPageTextItems(page, height)).sort((a, b) => a.y - b.y || a.x - b.x)
      pages.push({ items: pageItems, height })
    }

    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pdfLibPages = pdfDoc.getPages()

    const matchedItems: string[] = []
    let highlightsAdded = 0

    const drawHighlight = (pageIdx: number, rect: MatchRect, pageHeight: number) => {
      const pdfLibPage = pdfLibPages[pageIdx]
      if (!pdfLibPage) return
      // pdfLibY = pageHeight - extractY — the pure-flip conversion confirmed
      // in the step-1 coordinate spike (docs/01-architecture/
      // 04_SCAN_SERVICE_RETIREMENT_PLAN.md §3a); no baseline/height adjustment.
      const nativeY = pageHeight - rect.y
      pdfLibPage.drawRectangle({
        x: rect.x,
        y: nativeY,
        width: rect.width,
        height: rect.height,
        color: rgb(1, 1, 0),
        opacity: 1,
        blendMode: BlendMode.Multiply, // keeps underlying text legible under the fill
      })
      highlightsAdded++
    }

    for (const { trans_no, amount } of validItems) {
      let found = false

      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const { items: pageItems, height } = pages[pageIdx]
        const transMatch = findTextMatch(pageItems, trans_no)
        if (!transMatch) continue

        drawHighlight(pageIdx, transMatch.rect, height)
        found = true

        if (amount) {
          // Search every occurrence of `amount` on this page (not just the
          // first), keep the first one on the same row (within Y_TOLERANCE
          // of the trans_no match) — mirrors Python's loop-and-break over
          // search_for(amount)'s hit list.
          let amountMatch: TextMatch | null = null
          const excluded = new Set<ExtractedTextItem>([transMatch.item])
          for (;;) {
            const candidate = findTextMatch(pageItems, amount, excluded)
            if (!candidate) break
            if (Math.abs(candidate.item.y - transMatch.item.y) <= Y_TOLERANCE) {
              amountMatch = candidate
              break
            }
            excluded.add(candidate.item) // accumulate — see findTextMatch's doc comment for why this must grow, not replace
          }
          if (amountMatch) drawHighlight(pageIdx, amountMatch.rect, height)
        }

        break // matches Python: stop searching further pages once trans_no is found anywhere
      }

      if (found) matchedItems.push(trans_no)
    }

    if (highlightsAdded === 0) {
      console.warn('[tng-highlighter] no matches found — returning original PDF')
      return pdfBytes
    }

    console.log(
      `[tng-highlighter] ${highlightsAdded} highlights added,`,
      `matched: [${matchedItems.join(', ')}]`,
    )

    const outBytes = await pdfDoc.save()
    return Buffer.from(outBytes)
  } catch (e) {
    console.warn('[tng-highlighter] error highlighting PDF:', (e as Error).message ?? e)
    return pdfBytes
  }
}

// ── Python/Render implementation (current production default) ──────────────
//
// Delegates to the scan_service POST /highlight-tng endpoint. Restored
// verbatim (2026-07-21) as the flagged-off default — see the file header.
// Kept only for the engine switch above; do not extend this path, extend
// highlightTransNosNode instead.
type HighlightResponse = {
  pdf:              string    // base64 annotated PDF
  highlights_added: number
  matched_items:    string[]
}

async function highlightTransNosPython(
  pdfBytes: Buffer,
  items:    Array<{ trans_no: string; amount: string }>,
  supabase?: SupabaseClient,  // unused — kept for call-site compatibility
): Promise<Buffer> {
  const validItems = items
    .map(i => ({ trans_no: i.trans_no.trim(), amount: i.amount.trim() }))
    .filter(i => i.trans_no)

  if (validItems.length === 0) return pdfBytes

  const SCAN_API_URL    = process.env.SCAN_API_URL    ?? ''
  const SCAN_API_SECRET = process.env.SCAN_API_SECRET ?? ''

  if (!SCAN_API_URL) {
    console.warn('[tng-highlighter] SCAN_API_URL not set — skipping highlight')
    return pdfBytes
  }

  try {
    const pdfBase64 = pdfBytes.toString('base64')

    const response = await fetch(`${SCAN_API_URL}/highlight-tng`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'X-Scan-Secret': SCAN_API_SECRET,
      },
      body:   JSON.stringify({ pdf: pdfBase64, items: validItems }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.warn(`[tng-highlighter] scan service returned ${response.status}:`, text.slice(0, 200))
      return pdfBytes
    }

    const result: HighlightResponse = await response.json()

    console.log(
      `[tng-highlighter] ${result.highlights_added} highlights added,`,
      `matched: [${result.matched_items.join(', ')}]`,
    )

    if (result.highlights_added === 0) {
      console.warn('[tng-highlighter] scan service found no matches — returning original PDF')
      return pdfBytes
    }

    return Buffer.from(result.pdf, 'base64')

  } catch (e) {
    const msg = (e as Error).message ?? ''
    if (msg.includes('timed out') || msg.includes('abort')) {
      console.warn('[tng-highlighter] scan service timed out — returning original PDF')
    } else {
      console.warn('[tng-highlighter] error calling scan service:', msg)
    }
    return pdfBytes
  }
}
