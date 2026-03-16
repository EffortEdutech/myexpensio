// apps/user/lib/tng-highlighter.ts
//
// Highlights claimed TNG transaction rows in an original TNG statement PDF.
//
// Delegates entirely to the Python scan service POST /highlight-tng endpoint.
// Python uses PyMuPDF (fitz) which:
//   1. search_for(trans_no) — finds exact bounding box of the Trans No. text
//   2. search_for(amount)   — finds all bounding boxes for that amount string
//   3. Same-row Y check     — only highlights the amount on the matching row
//      (prevents false highlights when the same amount appears on other rows)
//   4. add_highlight_annot() — standard yellow PDF highlight annotation
//
// Why Python instead of pdfjs-dist in Node.js:
//   - pdfjs-dist v5 requires a worker file path that varies between Vercel
//     deployments, causing silent failures in production
//   - scan_service is already deployed on Render.com and parses TNG PDFs
//   - PyMuPDF is purpose-built for PDF annotation — reliable and fast
//
// Safety: on ANY error (network, timeout, parse) the original PDF buffer
// is returned unchanged. The export never fails because of the highlighter.

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Types matching the Python endpoint ───────────────────────────────────────

type HighlightItem = {
  trans_no: string   // e.g. "62313"
  amount:   string   // e.g. "11.64" — string so Python searches exact text
}

type HighlightResponse = {
  pdf:              string    // base64 annotated PDF
  highlights_added: number
  matched_items:    string[]
}

// ── Public entry ──────────────────────────────────────────────────────────────

/**
 * Given a TNG statement PDF buffer and a list of {trans_no, amount} pairs,
 * returns a new PDF buffer with those transactions highlighted in yellow.
 *
 * If the scan service is unreachable or fails, the original buffer is returned.
 */
export async function highlightTransNos(
  pdfBytes: Buffer,
  transNos: string[],
  supabase?: SupabaseClient,  // unused — kept for call-site compatibility
): Promise<Buffer> {
  if (transNos.length === 0) return pdfBytes

  const SCAN_API_URL    = process.env.SCAN_API_URL    ?? ''
  const SCAN_API_SECRET = process.env.SCAN_API_SECRET ?? ''

  if (!SCAN_API_URL) {
    console.warn('[tng-highlighter] SCAN_API_URL not set — skipping highlight')
    return pdfBytes
  }

  // Build items list — trans_nos array contains only the trans_no strings.
  // The amount will be found by the Python service via same-row Y matching
  // after it locates the trans_no. We pass amount as empty string to trigger
  // the trans_no-only search path, OR we can pass the amounts if available.
  // Current architecture: trans_nos only → Python finds amount from same row.
  // We pass amount: "" to tell Python to highlight trans_no only (still useful).
  // 
  // NOTE: pdf-builder.ts passes TngStatement.trans_nos which are just the
  // trans_no strings. The amount is found automatically by Python via same-row
  // matching — it searches for the Trans Amount column value on that same Y.
  const items: HighlightItem[] = transNos
    .map(t => t.trim())
    .filter(Boolean)
    .map(trans_no => ({ trans_no, amount: '' }))

  try {
    const pdfBase64 = pdfBytes.toString('base64')

    const response = await fetch(`${SCAN_API_URL}/highlight-tng`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'X-Scan-Secret': SCAN_API_SECRET,
      },
      body:   JSON.stringify({ pdf: pdfBase64, items }),
      signal: AbortSignal.timeout(60_000),  // 60s — allows for cold start
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
      `of requested: [${transNos.join(', ')}]`,
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
