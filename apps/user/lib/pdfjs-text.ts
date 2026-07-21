// apps/user/lib/pdfjs-text.ts
//
// Shared pdfjs-dist loading + text-item extraction, used by both
// tng-parser.ts (POST /parse-tng replacement) and tng-highlighter.ts
// (POST /highlight-tng replacement) — see
// docs/01-architecture/04_SCAN_SERVICE_RETIREMENT_PLAN.md.
//
// Pulled out into its own file once tng-highlighter.ts needed the exact same
// "load pdfjs-dist, polyfill DOMMatrix, extract per-page text items in the
// coordinate convention confirmed by the step-1 coordinate spike" logic that
// tng-parser.ts already had — no reason to duplicate it.

// pdfjs-dist's "main" entry is build/pdf.mjs — an .mjs file, forced ESM
// regardless of package.json "type". Must be dynamic-imported, never
// require()'d (see next.config.ts's serverExternalPackages comment). The
// "legacy" build is required for Node (the modern build assumes
// browser-only APIs).
//
// getTextContent() needs a DOMMatrix constructor for internal text-matrix
// math, which doesn't exist in Node by default. pdfjs-dist tries to load one
// from the optional `@napi-rs/canvas` native package and just warns + leaves
// it undefined if that's not installed — which then throws
// "ReferenceError: DOMMatrix is not defined" the first time it's needed
// (confirmed by hitting this directly during tng-parser.ts's build). Rather
// than add a native-binary dependency for one small matrix class, polyfill
// with the lightweight pure-JS `dommatrix` package instead.
export async function loadPdfjs() {
  if (!('DOMMatrix' in globalThis)) {
    const { default: DOMMatrixPolyfill } = await import('dommatrix')
    ;(globalThis as unknown as { DOMMatrix: unknown }).DOMMatrix = DOMMatrixPolyfill
  }
  return import('pdfjs-dist/legacy/build/pdf.mjs')
}

type PdfjsTextItem = {
  str: string
  width: number
  height: number
  transform: number[] // [a, b, c, d, e, f] — e,f are the text origin in native PDF space (bottom-left origin)
  hasEOL: boolean
}

export type ExtractedTextItem = { str: string; x: number; y: number; width: number; height: number }

/**
 * Extracts a page's text items in "extract space" (top-left origin, Y
 * increases downward) — the convention confirmed empirically in the step-1
 * coordinate spike: `extractY = pageHeight - transform[5]`. `pdf-lib` draws
 * in the opposite convention (native PDF space, bottom-left origin); convert
 * back via `pdfLibY = pageHeight - extractY` when drawing.
 */
export async function getPageTextItems(
  page: { getTextContent: () => Promise<{ items: unknown[] }> },
  pageHeight: number,
): Promise<ExtractedTextItem[]> {
  const textContent = await page.getTextContent()
  return (textContent.items as PdfjsTextItem[])
    .filter((it) => it.str.trim() !== '')
    .map((it) => ({
      str: it.str,
      x: it.transform[4],
      y: pageHeight - it.transform[5],
      width: it.width,
      height: it.height,
    }))
}
