// apps/user/app/api/tng/parse/route.ts
// POST /api/tng/parse
//
// Accepts a TNG eWallet PDF statement.
// 1. Forwards to Python scan service (/parse-tng) for pdfplumber extraction.
// 2. Saves the original PDF to Supabase Storage (bucket: tng-statements).
// 3. Returns parsed rows + source_file_path for the frontend to pass to /api/tng/transactions.
//
// Storage path: tng-statements/{user_id}/{upload_id}.pdf
// source_file_path is returned in response and must be forwarded to POST /api/tng/transactions
// so every saved row knows which statement file it came from (needed for PDF export appendix).
//
// Storage upload is best-effort: if it fails, rows are still returned (no data loss).
//
// Response shape:
//   {
//     rows:             TngParsedRow[]
//     toll_count:       number
//     parking_count:    number
//     total_extracted:  number
//     source_file_path: string | null   ← NEW: pass this to /api/tng/transactions
//     meta: { account_name, ewallet_id, period }
//   }
//
// Error codes:
//   400 VALIDATION_ERROR  — not a PDF / missing file
//   422 PARSE_ERROR       — scanned/corrupt PDF / no transactions found
//   502 UPSTREAM_ERROR    — Python service error
//   504 TIMEOUT           — Python service timed out (cold start)

import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_PDF_BYTES = 10 * 1024 * 1024 // 10 MB

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // ── Parse multipart form ─────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return err('VALIDATION_ERROR', 'Request must be multipart/form-data.', 400)
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return err('VALIDATION_ERROR', 'Field "file" (PDF) is required.', 400)
  }
  if (file.size > MAX_PDF_BYTES) {
    return err('VALIDATION_ERROR', 'File too large. Maximum 10 MB.', 400)
  }
  if (file.type && !file.type.includes('pdf')) {
    return err('VALIDATION_ERROR', 'Only PDF files are accepted.', 400)
  }

  // ── Read PDF bytes (used by both Storage upload and base64 encode) ────────
  const arrayBuffer = await file.arrayBuffer()
  const pdfBytes    = new Uint8Array(arrayBuffer)
  const pdfBase64   = Buffer.from(arrayBuffer).toString('base64')

  // ── Forward to Python scan service ────────────────────────────────────────
  const SCAN_API_URL    = process.env.SCAN_API_URL    ?? ''
  const SCAN_API_SECRET = process.env.SCAN_API_SECRET ?? ''

  if (!SCAN_API_URL) {
    console.error('[POST /api/tng/parse] SCAN_API_URL not configured')
    return err('SERVER_ERROR', 'PDF parsing service not configured.', 500)
  }

  let pythonJson: {
    transactions?:   unknown[]
    meta?:           { account_name?: string; ewallet_id?: string; period?: string }
    toll_count?:     number
    parking_count?:  number
    skipped_retail?: number
    detail?:         string
  }

  try {
    const upstream = await fetch(`${SCAN_API_URL}/parse-tng`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'X-Scan-Secret': SCAN_API_SECRET,
      },
      body:   JSON.stringify({ pdf: pdfBase64 }),
      signal: AbortSignal.timeout(60_000),
    })

    pythonJson = await upstream.json()

    if (!upstream.ok) {
      const detail: string = pythonJson?.detail ?? 'PDF parsing failed.'
      console.error('[POST /api/tng/parse] upstream error:', upstream.status, detail)
      if (detail.startsWith('PARSE_ERROR')) {
        return err('PARSE_ERROR', detail.replace('PARSE_ERROR: ', ''), 422)
      }
      return err('UPSTREAM_ERROR', detail, 502)
    }

  } catch (e: unknown) {
    const msg = (e as Error).message ?? ''
    console.error('[POST /api/tng/parse] fetch error:', msg)
    if (msg.includes('timed out') || msg.includes('abort')) {
      return err('TIMEOUT', 'PDF parser is waking up — please try again in 30 seconds.', 504)
    }
    return err('SERVER_ERROR', 'Could not reach PDF parsing service.', 502)
  }

  // ── Save original PDF to Supabase Storage (best-effort) ──────────────────
  // Path: tng-statements/{user_id}/{upload_id}.pdf
  // This path is returned to the frontend so it can be forwarded to
  // POST /api/tng/transactions → persisted as source_file_url on each row.
  // Used later by the PDF export to embed original TNG statements as Appendix B.

  let source_file_path: string | null = null

  try {
    const upload_id   = crypto.randomUUID()
    const storagePath = `${user.id}/${upload_id}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('tng-statements')
      .upload(storagePath, pdfBytes, {
        contentType:  'application/pdf',
        cacheControl: '3600',
        upsert:       false,
      })

    if (uploadError) {
      // Non-fatal: log and continue. Rows will save without a statement path.
      console.warn('[POST /api/tng/parse] storage upload failed:', uploadError.message)
    } else {
      source_file_path = storagePath
    }
  } catch (storageEx: unknown) {
    console.warn('[POST /api/tng/parse] storage exception:', (storageEx as Error).message)
  }

  // ── Normalise + return ────────────────────────────────────────────────────
  const rows            = Array.isArray(pythonJson.transactions) ? pythonJson.transactions : []
  const toll_count      = pythonJson.toll_count     ?? 0
  const parking_count   = pythonJson.parking_count  ?? 0
  const total_extracted = toll_count + parking_count

  return NextResponse.json({
    rows,
    toll_count,
    parking_count,
    total_extracted,
    source_file_path,        // ← frontend must forward this to /api/tng/transactions
    meta: pythonJson.meta ?? null,
  }, { status: 200 })
}
