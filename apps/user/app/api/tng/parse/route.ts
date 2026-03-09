// apps/user/app/api/tng/parse/route.ts
// POST /api/tng/parse
//
// Accepts a TNG eStatement PDF (multipart/form-data, field: "file").
// Returns TOLL + PARKING rows only. RETAIL excluded. Preview only — no DB write.
//
// Strategy:
//   TNG eStatements come in two formats:
//   A) Machine-readable PDF (older TNG app versions) → pdf-parse extracts text
//   B) Image-rendered PDF (newer TNG app/website) → pdf-parse gets empty/garbage text
//
//   For (B), we cannot do server-side OCR in free tier (no Tesseract/cloud vision).
//   Instead we return a structured "manual_entry_required" flag so the UI can
//   gracefully fallback to a manual row-entry table where user keys in their
//   toll/parking transactions directly.
//
//   This keeps the importer useful for ALL TNG statement versions.
//
// require() — NOT import default. pdf-parse v2.x has no ESM default export.
// next.config.ts must have: serverExternalPackages: ['pdfkit', 'pdf-parse']

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  buffer: Buffer,
  options?: Record<string, unknown>,
) => Promise<{ text: string; numpages: number; info: Record<string, unknown> }>

export const runtime = 'nodejs'

// ── Types ─────────────────────────────────────────────────────────────────────

type TngSector = 'TOLL' | 'PARKING'

export type TngParsedRow = {
  trans_no:       string | null
  entry_datetime: string | null   // ISO 8601
  exit_datetime:  string | null   // ISO 8601
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  currency:       string
  sector:         TngSector
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function parseMalaysianDate(raw: string): string | null {
  if (!raw?.trim()) return null
  raw = raw.trim()

  // dd/MM/yyyy HH:mm  or  dd/MM/yyyy
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{2}:\d{2}))?$/)
  if (dmy) {
    const [, dd, mm, yyyy, hhmm] = dmy
    const time = hhmm ?? '00:00'
    return new Date(`${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}T${time}:00+08:00`).toISOString()
  }

  // yyyy-MM-dd HH:mm
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?$/)
  if (iso) return new Date(`${iso[1]}T${iso[2] ?? '00:00'}:00+08:00`).toISOString()

  // dd MMM yyyy HH:mm
  const textMonth = raw.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})(?:\s+(\d{2}:\d{2}))?$/i)
  if (textMonth) {
    const dt = new Date(`${textMonth[1]} ${textMonth[2]} ${textMonth[3]} ${textMonth[4] ?? '00:00'}:00 GMT+0800`)
    if (!isNaN(dt.getTime())) return dt.toISOString()
  }

  try { const d = new Date(raw); if (!isNaN(d.getTime())) return d.toISOString() } catch { /* ignore */ }
  return null
}

const TOLL_KEYWORDS    = ['PLUS', 'LEKAS', 'SPRINT', 'SMART', 'LDP', 'DUKE', 'ELITE', 'KESAS', 'NPE', 'MEX', 'BESRAYA', 'TOLL', 'HIGHWAY', 'LEBUH RAYA', 'LINKEDUA', 'SKVE', 'SILK', 'LKSA', 'GCE', 'NKVE', 'KLCC', 'AKLEH']
const PARKING_KEYWORDS = ['PARKING', 'PARK', 'CAR PARK', 'PARKIR', 'DBKL', 'SSPB', 'MPPJ', 'MBPJ', 'MPAJ', 'MPS', 'MPSJ', 'WILSON', 'SECURE', 'CARPARK']
const RETAIL_KEYWORDS  = ['7-ELEVEN', 'WATSONS', 'SPEEDMART', 'RELOAD', 'TOPUP', 'TOP-UP', 'TOP UP', 'PETRONAS', 'SHELL', 'CALTEX', 'PETRON', 'BHP', 'MYDIN', 'GIANT', 'TESCO', 'AEON', 'KFC', 'MCDONALD', 'STARBUCKS', 'GRAB', 'TOUCH N GO', "TOUCH 'N GO", 'E-WALLET', 'EWALLET']

const AMT_RE    = /\b(\d{1,4}\.\d{2})\b/
const TRANS_RE  = /\b([A-Z0-9]{8,20})\b/

/**
 * Detect whether extracted PDF text is usable.
 * TNG image PDFs produce either empty string or only whitespace/junk.
 */
function isTextUsable(text: string): boolean {
  if (!text || text.trim().length < 50) return false
  // Must contain at least one amount-like pattern
  if (!AMT_RE.test(text)) return false
  // Must contain at least one date-like pattern
  if (!/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(text)) return false
  return true
}

function parseTngText(text: string): TngParsedRow[] {
  const rows: TngParsedRow[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  for (let i = 0; i < lines.length; i++) {
    const line      = lines[i]
    const upperLine = line.toUpperCase()

    if (RETAIL_KEYWORDS.some(kw => upperLine.includes(kw))) continue

    const amtMatch = line.match(AMT_RE)
    if (!amtMatch) continue

    const amount = parseFloat(amtMatch[1])
    if (isNaN(amount) || amount <= 0 || amount > 9999) continue

    let sector: TngSector | null = null
    if (PARKING_KEYWORDS.some(kw => upperLine.includes(kw))) sector = 'PARKING'
    else if (TOLL_KEYWORDS.some(kw => upperLine.includes(kw))) sector = 'TOLL'
    if (!sector) continue

    const transMatch = line.match(TRANS_RE)
    const trans_no   = transMatch ? transMatch[1] : null

    // Date extraction — current + adjacent lines
    let entry_datetime: string | null = null
    let exit_datetime:  string | null = null
    const candidates = [lines[i - 1], line, lines[i + 1]].filter(Boolean)
    for (const c of candidates) {
      const dateStr = c.match(/\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{2}:\d{2})?|\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?/)?.[0]
      if (!dateStr) continue
      const dt = parseMalaysianDate(dateStr)
      if (dt && !entry_datetime)                    entry_datetime = dt
      else if (dt && dt !== entry_datetime)         exit_datetime  = dt
    }

    // Location
    const locationRaw = line
      .replace(AMT_RE, '')
      .replace(/MYR/gi, '')
      .replace(TRANS_RE, '')
      .replace(/\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{2}:\d{2})?/g, '')
      .replace(/\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?/g, '')
      .replace(/\s+/g, ' ').trim()

    let entry_location: string | null = null
    let exit_location:  string | null = null

    if (sector === 'TOLL') {
      const parts = locationRaw.split(/\s*(?:→|->|–|-)\s*/)
      entry_location = parts[0]?.trim() || null
      exit_location  = parts[1]?.trim() || null
    } else {
      entry_location = locationRaw || null
    }

    rows.push({ trans_no, entry_datetime, exit_datetime, entry_location, exit_location, amount, currency: 'MYR', sector })
  }

  return rows
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return err('VALIDATION_ERROR', 'Request must be multipart/form-data.', 400)
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) return err('VALIDATION_ERROR', 'Field "file" (PDF) is required.', 400)
  if (file.size > 10 * 1024 * 1024) return err('VALIDATION_ERROR', 'File exceeds 10 MB limit.', 400)

  // ── Extract text ───────────────────────────────────────────────────────────
  let rawText    = ''
  let pageCount  = 0
  let parseError = false

  try {
    const buffer  = Buffer.from(await file.arrayBuffer())
    const result  = await pdfParse(buffer)
    rawText       = result.text   ?? ''
    pageCount     = result.numpages ?? 0
  } catch (e: unknown) {
    console.error('[POST /api/tng/parse] pdf-parse error:', (e as Error).message)
    parseError = true
  }

  // ── Detect image-only PDF ──────────────────────────────────────────────────
  if (parseError || !isTextUsable(rawText)) {
    // Return structured response so the UI can show manual entry mode
    // instead of a hard error. The UI renders a manual input table.
    return NextResponse.json({
      total_extracted:       0,
      toll_count:            0,
      parking_count:         0,
      rows:                  [],
      toll_rows:             [],
      parking_rows:          [],
      manual_entry_required: true,
      manual_entry_reason:   parseError
        ? 'Could not read the PDF file. It may be corrupted or password-protected.'
        : 'This TNG eStatement appears to be an image-based PDF (not machine-readable). Please enter your transactions manually below.',
      page_count: pageCount,
    })
  }

  // ── Parse rows ─────────────────────────────────────────────────────────────
  const rows         = parseTngText(rawText)
  const toll_rows    = rows.filter(r => r.sector === 'TOLL')
  const parking_rows = rows.filter(r => r.sector === 'PARKING')

  // If we got usable text but no rows matched — still offer manual entry
  if (rows.length === 0) {
    return NextResponse.json({
      total_extracted:       0,
      toll_count:            0,
      parking_count:         0,
      rows:                  [],
      toll_rows:             [],
      parking_rows:          [],
      manual_entry_required: true,
      manual_entry_reason:   'No Toll or Parking transactions were detected in this statement. You can enter them manually below.',
      page_count: pageCount,
    })
  }

  return NextResponse.json({
    total_extracted:       rows.length,
    toll_count:            toll_rows.length,
    parking_count:         parking_rows.length,
    rows,
    toll_rows,
    parking_rows,
    manual_entry_required: false,
    page_count:            pageCount,
  })
}
