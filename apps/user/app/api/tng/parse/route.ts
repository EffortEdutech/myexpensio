// apps/user/app/api/tng/parse/route.ts
//
// POST /api/tng/parse
//
// Accepts a TNG eWallet statement PDF (multipart/form-data, field: "file").
// Extracts TOLL and PARKING transaction rows using pdf-parse (server-side).
// Returns structured JSON for UI preview and checkbox selection.
//
// Does NOT save to DB — saving is done via POST /api/tng/transactions.
// This separation lets the user preview before committing rows.
//
// INSTALL (run once in apps/user):
//   npm install pdf-parse
//   npm install --save-dev @types/pdf-parse
//
// next.config.ts — add to serverExternalPackages:
//   serverExternalPackages: ['pdfkit', 'pdf-parse']
//
// Tested against: TNG Customer Transactions Statement (Feb 2026 format)
// Expected columns: Trans No | Entry Date+Time | Exit Date+Time |
//   Posted Date | Tran Type | Entry Location | Entry SP |
//   Exit Location | Exit SP | Reload Location | Trans Amount | Card Balance | Sector

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import pdfParse from 'pdf-parse'

export const runtime = 'nodejs'

const MAX_BYTES = 10 * 1024 * 1024  // 10 MB

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type TngParsedRow = {
  trans_no:        string | null
  entry_datetime:  string | null   // ISO 8601 with +08:00
  exit_datetime:   string | null
  entry_location:  string | null
  exit_location:   string | null
  amount:          number           // MYR, 2 decimal places
  sector:          'TOLL' | 'PARKING'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse TNG date-time string: "26/02/2026 22:45:22" → "2026-02-26T22:45:22+08:00"
 * Also handles date-only: "26/02/2026" → "2026-02-26T00:00:00+08:00"
 */
function parseTngDateTime(raw: string | undefined): string | null {
  if (!raw) return null
  const t = raw.trim()
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?$/)
  if (!m) return null
  const [, dd, mm, yyyy, time] = m
  return `${yyyy}-${mm}-${dd}T${time ?? '00:00:00'}+08:00`
}

/**
 * Parse amount string like "11.64" or " 11.64 " → 11.64
 */
function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null
  const n = parseFloat(raw.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? null : Math.round(n * 100) / 100
}

/**
 * Strip TNG SP codes like "04_PLUS", "12_LITRAK", "03_PROJEK LEBUHRAYA USAHASAMA BERHAD (954700-A)"
 */
function cleanLocation(loc: string): string {
  return loc
    .replace(/\d{2}_[A-Z0-9_]+/g, '')     // strip SP codes
    .replace(/\(\d{6}-[A-Z]\)/g, '')       // strip company reg numbers
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ── Core parser ───────────────────────────────────────────────────────────────
//
// TNG statement text (after pdf-parse extraction) looks like:
//
// 62313 26/02/2026 22:45:22 27/02 /2026 Fare Usage - Toll/Bus
//   PLUS - AYER KEROH 03_PROJEK LEBUHRAYA ... ELITE - BANDAR SERENIA 03_... 11.64 16.77 TOLL
//
// Strategy:
//   1. Find lines starting with a 5-digit trans_no
//   2. Accumulate the "block" for that transaction (up to next trans_no or 20 lines)
//   3. Extract: sector, dates, amounts, locations from the block

function parseTngText(text: string): TngParsedRow[] {
  const rows: TngParsedRow[] = []

  // Normalise whitespace but preserve newlines as separators
  const lines = text.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean)

  // Find indices of lines that start a transaction (5-digit number at start)
  const transLineIndices: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (/^\d{5}\b/.test(lines[i])) {
      transLineIndices.push(i)
    }
  }

  for (let ti = 0; ti < transLineIndices.length; ti++) {
    const startIdx = transLineIndices[ti]
    // Collect lines until the next transaction starts (or max 20 lines)
    const endIdx   = transLineIndices[ti + 1] ?? Math.min(startIdx + 20, lines.length)
    const block    = lines.slice(startIdx, endIdx).join(' ')

    // ── Sector ───────────────────────────────────────────────────────────────
    const sectorMatch = block.match(/\b(TOLL|PARKING|RETAIL)\b/)
    if (!sectorMatch) continue
    const sector = sectorMatch[1]
    if (sector === 'RETAIL') continue   // skip reloads
    if (sector !== 'TOLL' && sector !== 'PARKING') continue

    // ── Trans No ─────────────────────────────────────────────────────────────
    const transMatch = block.match(/^(\d{5})\b/)
    const trans_no   = transMatch ? transMatch[1] : null

    // ── Dates ─────────────────────────────────────────────────────────────────
    // TNG format: "DD/MM/YYYY HH:MM:SS" or "DD/MM/YYYY"
    // Posted date is also a date — we want the FIRST (entry) and SECOND (exit)
    const datePattern = /(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}:\d{2})?)/g
    const dateMatches = [...block.matchAll(datePattern)].map(m => m[1])
    const entry_datetime = parseTngDateTime(dateMatches[0])
    const exit_datetime  = parseTngDateTime(dateMatches[1])

    // ── Amount ────────────────────────────────────────────────────────────────
    // Pattern in block: "<Trans Amount> <Card Balance> TOLL|PARKING"
    // Both are two-decimal numbers. We want the first (Trans Amount).
    const amountPattern = /(\d+\.\d{2})\s+\d+\.\d{2}\s+(?:TOLL|PARKING|RETAIL)/
    const amountMatch   = block.match(amountPattern)
    const amount        = amountMatch ? parseAmount(amountMatch[1]) : null
    if (!amount || amount <= 0) continue

    // ── Locations ─────────────────────────────────────────────────────────────
    // Known Malaysian expressway / location keywords used to identify location strings
    const LOCATION_KEYWORDS = [
      'PLUS', 'ELITE', 'LDP', 'MEX', 'SILK', 'GRANDSAGA', 'LINKEDUA',
      'PANTAI DALAM', 'NPE', 'MYDIN', 'IOI', 'AEON', 'COLUMBIA',
      'ALAMANDA', 'WW_DEFAULT', 'SEREMBAN', 'TAPAH', 'SUBANG',
      'GOPENG', 'SENAI', 'SEDENAK', 'PUTRAJAYA', 'SERI KEMBANGAN',
      'JALAN DUTA', 'PUCHONG', 'PETALING JAYA', 'SUNGAI BESI',
      'SUNGAI RAMAL', 'KAJANG', 'SIMPANG', 'BANDAR', 'AYER KEROH',
      'IPOH', 'JOHOR',
    ]

    // Build a regex that matches any block starting with a keyword
    const kwPattern = new RegExp(
      `((?:${LOCATION_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})[^0-9TOLL PARKING RETAIL]*?)`,
      'gi'
    )

    const locationMatches = [...block.matchAll(kwPattern)]
      .map(m => cleanLocation(m[1]))
      .filter(l => l.length > 3)
      .slice(0, 2)   // entry = [0], exit = [1]

    const entry_location = locationMatches[0] ?? null
    const exit_location  = sector === 'PARKING'
      ? (locationMatches[0] ?? null)   // parking: entry = exit (same location)
      : (locationMatches[1] ?? null)

    rows.push({
      trans_no,
      entry_datetime,
      exit_datetime,
      entry_location,
      exit_location,
      amount,
      sector: sector as 'TOLL' | 'PARKING',
    })
  }

  return rows
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // Parse multipart form data
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

  // Size check
  if (file.size > MAX_BYTES) {
    return err('VALIDATION_ERROR', `File too large (${Math.round(file.size / 1024)} KB). Maximum is 10 MB.`, 400)
  }

  // Content-type check
  const ct = (file as File).type ?? ''
  if (ct && !ct.includes('pdf') && !ct.includes('octet-stream')) {
    return err('VALIDATION_ERROR', 'File must be a PDF. Only TNG digital statements are supported.', 400)
  }

  // Convert to Node Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  // Parse PDF
  let rawText: string
  try {
    const parsed = await pdfParse(buffer)
    rawText = parsed.text
  } catch (e) {
    console.error('[POST /api/tng/parse] pdf-parse error:', e)
    return err(
      'PARSE_ERROR',
      'Failed to read PDF. Please ensure it is a digital TNG statement (not a scanned image).',
      422
    )
  }

  // Guard: check it looks like a TNG statement
  if (!rawText.includes('Touch') && !rawText.includes('TNG') && !rawText.includes('Fare Usage')) {
    return err(
      'PARSE_ERROR',
      'This does not appear to be a TNG Customer Transactions Statement.',
      422
    )
  }

  // Parse rows
  const rows = parseTngText(rawText)

  const toll_rows    = rows.filter(r => r.sector === 'TOLL')
  const parking_rows = rows.filter(r => r.sector === 'PARKING')

  return NextResponse.json({
    total_extracted: rows.length,
    toll_count:      toll_rows.length,
    parking_count:   parking_rows.length,
    rows,
    // Convenience: rows split by type for UI rendering
    toll_rows,
    parking_rows,
  }, { status: 200 })
}
