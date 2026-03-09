// apps/user/app/api/tng/parse/route.ts
// POST /api/tng/parse
//
// Accepts a TNG eStatement PDF (multipart/form-data, field: "file").
// Parses TOLL + PARKING rows only. RETAIL rows are excluded.
// Returns a preview — does NOT write to DB.
//
// FIX: pdf-parse v2.x has no ESM default export.
//      Use require() with serverExternalPackages: ['pdf-parse'] in next.config.ts.
//
// Response (200):
//   { total_extracted, toll_count, parking_count, rows, toll_rows, parking_rows }

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── pdf-parse: require() — NOT import default (breaks Turbopack ESM) ─────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  buffer: Buffer,
  options?: Record<string, unknown>,
) => Promise<{ text: string; numpages: number }>

export const runtime = 'nodejs'

// ── Types ─────────────────────────────────────────────────────────────────────

type TngSector = 'TOLL' | 'PARKING'

type TngParsedRow = {
  trans_no:       string | null
  entry_datetime: string | null   // ISO
  exit_datetime:  string | null   // ISO
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

/**
 * Attempt to parse a Malaysian date/time string from TNG statement.
 * Handles formats like:
 *   "01/03/2026 08:22"   → ISO
 *   "2026-03-01 08:22"   → ISO
 *   "01 Mar 2026 08:22"  → ISO
 */
function parseMalaysianDate(raw: string): string | null {
  if (!raw?.trim()) return null
  raw = raw.trim()

  // dd/MM/yyyy HH:mm
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}:\d{2})$/)
  if (dmy) {
    const [, dd, mm, yyyy, hhmm] = dmy
    return new Date(`${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}T${hhmm}:00+08:00`).toISOString()
  }

  // yyyy-MM-dd HH:mm
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/)
  if (iso) {
    return new Date(`${iso[1]}T${iso[2]}:00+08:00`).toISOString()
  }

  // dd MMM yyyy HH:mm
  const textMonth = raw.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+(\d{2}:\d{2})$/i)
  if (textMonth) {
    return new Date(`${textMonth[1]} ${textMonth[2]} ${textMonth[3]} ${textMonth[4]}:00 GMT+0800`).toISOString()
  }

  // Fallback: let JS try
  try {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) return d.toISOString()
  } catch { /* ignore */ }

  return null
}

/**
 * Parse raw text extracted from TNG eStatement PDF.
 *
 * TNG statement layout (typical):
 *   Trans No   Date/Time In   Date/Time Out   Location In   Location Out   Amount   Type
 *
 * We look for lines containing MYR amounts and classify them by sector keyword.
 * This is intentionally lenient — TNG PDF format can vary across app versions.
 */
function parseTngText(text: string): TngParsedRow[] {
  const rows: TngParsedRow[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Keywords used to classify sector
  const TOLL_KEYWORDS    = ['PLUS', 'LEKAS', 'SPRINT', 'SMART', 'LDP', 'DUKE', 'ELITE', 'KESAS', 'NPE', 'MEX', 'BESRAYA', 'TOLL', 'HIGHWAY', 'LEBUH RAYA']
  const PARKING_KEYWORDS = ['PARKING', 'PARK', 'CAR PARK', 'PARKIR', 'DBKL', 'SSPB', 'MPPJ', 'MBPJ', 'MPAJ', 'MPS', 'MPSJ']
  const RETAIL_KEYWORDS  = ['7-ELEVEN', 'WATSONS', 'SPEEDMART', 'RELOAD', 'TOPUP', 'TOP-UP', 'TOP UP', 'PETRONAS', 'SHELL', 'CALTEX', 'PETRON', 'BHP']

  // Pattern: a line with an MYR amount (e.g. 2.10, 14.50)
  const AMT_RE = /(\d+\.\d{2})/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const upperLine = line.toUpperCase()

    // Skip retail
    if (RETAIL_KEYWORDS.some(kw => upperLine.includes(kw))) continue

    const amtMatch = line.match(AMT_RE)
    if (!amtMatch) continue

    const amount = parseFloat(amtMatch[1])
    if (isNaN(amount) || amount <= 0 || amount > 9999) continue

    // Determine sector
    let sector: TngSector | null = null
    if (PARKING_KEYWORDS.some(kw => upperLine.includes(kw))) sector = 'PARKING'
    else if (TOLL_KEYWORDS.some(kw => upperLine.includes(kw))) sector = 'TOLL'

    if (!sector) continue

    // Try to extract transaction number (alphanumeric, 8–20 chars)
    const transMatch = line.match(/\b([A-Z0-9]{8,20})\b/)
    const trans_no = transMatch ? transMatch[1] : null

    // Try to extract datetime (look at surrounding lines too)
    let entry_datetime: string | null = null
    let exit_datetime:  string | null = null

    // Check current + adjacent lines for date patterns
    const candidates = [lines[i-1], line, lines[i+1]].filter(Boolean)
    for (const c of candidates) {
      const dt = parseMalaysianDate(
        c.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\s+\d{2}:\d{2}/)?.[0] ?? ''
      )
      if (dt && !entry_datetime) entry_datetime = dt
      else if (dt && !exit_datetime && dt !== entry_datetime) exit_datetime = dt
    }

    // Location: strip amount and known non-location tokens from line
    const locationRaw = line
      .replace(AMT_RE, '')
      .replace(/MYR/gi, '')
      .replace(/\b[A-Z0-9]{8,20}\b/, '')
      .replace(/\d{1,2}\/\d{1,2}\/\d{4}\s+\d{2}:\d{2}/g, '')
      .replace(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // For TOLL: try to split entry/exit by separator → or -
    let entry_location: string | null = null
    let exit_location:  string | null = null

    if (sector === 'TOLL') {
      const parts = locationRaw.split(/\s*(?:→|->|–|-)\s*/)
      if (parts.length >= 2) {
        entry_location = parts[0].trim() || null
        exit_location  = parts[1].trim() || null
      } else {
        entry_location = locationRaw || null
      }
    } else {
      entry_location = locationRaw || null
    }

    rows.push({
      trans_no,
      entry_datetime,
      exit_datetime,
      entry_location,
      exit_location,
      amount,
      currency: 'MYR',
      sector,
    })
  }

  return rows
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // ── Parse multipart ────────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return err('VALIDATION_ERROR', 'Request must be multipart/form-data.', 400)
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return err('VALIDATION_ERROR', 'Field "file" (PDF) is required.', 400)
  }
  if (file.type && !file.type.includes('pdf')) {
    return err('VALIDATION_ERROR', 'File must be a PDF.', 400)
  }

  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_SIZE) {
    return err('VALIDATION_ERROR', 'File exceeds 10 MB limit.', 400)
  }

  // ── Extract PDF text ───────────────────────────────────────────────────────
  let text: string
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer      = Buffer.from(arrayBuffer)
    const result      = await pdfParse(buffer)
    text              = result.text ?? ''
  } catch (e: unknown) {
    console.error('[POST /api/tng/parse] pdf-parse error:', (e as Error).message)
    return err('PARSE_ERROR', 'Could not read the PDF. Make sure it is a valid TNG eStatement.', 422)
  }

  if (!text.trim()) {
    return err('PARSE_ERROR', 'PDF appears to be empty or image-only (not machine-readable).', 422)
  }

  // ── Parse rows ─────────────────────────────────────────────────────────────
  const rows = parseTngText(text)

  const toll_rows    = rows.filter(r => r.sector === 'TOLL')
  const parking_rows = rows.filter(r => r.sector === 'PARKING')

  return NextResponse.json({
    total_extracted: rows.length,
    toll_count:      toll_rows.length,
    parking_count:   parking_rows.length,
    rows,
    toll_rows,
    parking_rows,
  })
}
