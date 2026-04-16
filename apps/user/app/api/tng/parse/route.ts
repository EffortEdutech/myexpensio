// apps/user/app/api/tng/parse/route.ts
//
// POST /api/tng/parse
//
// Accepts a TNG statement PDF (multipart/form-data, field: "file").
// Forwards to Python scan service (base64). Saves original PDF to Supabase Storage.
// Returns parsed rows + statement_label for the frontend to pass to POST /api/tng/transactions.
//
// statement_label derivation (priority order):
//   1. meta.period returned by the scanner  (e.g. "01/02/2025 - 28/02/2025")
//   2. Fallback: "Imported DD MMM YYYY"     (import date in MYT)
//
// DOES NOT save to DB — saving is done via POST /api/tng/transactions.
// This separation allows user to preview rows before committing.

import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // ── Parse multipart ───────────────────────────────────────────────────────
  let file: File | null = null
  try {
    const form = await request.formData()
    file = form.get('file') as File | null
  } catch {
    return err('VALIDATION_ERROR', 'Invalid multipart request.', 400)
  }

  if (!file) return err('VALIDATION_ERROR', 'No file uploaded. Field name must be "file".', 400)

  // Size guard: 10 MB
  if (file.size > 10 * 1024 * 1024) {
    return err('VALIDATION_ERROR', 'File exceeds maximum size of 10 MB.', 400)
  }

  // Content-type guard
  const ct = file.type
  if (ct && !ct.includes('pdf')) {
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
      const detail: string = (pythonJson as { detail?: string })?.detail ?? 'PDF parsing failed.'
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
  // Returned to frontend → forwarded to POST /api/tng/transactions → persisted as
  // source_file_url on each row. Used by PDF export to embed original TNG statements.

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
      // Non-fatal: log and continue — rows will save without a statement path.
      console.warn('[POST /api/tng/parse] storage upload failed:', uploadError.message)
    } else {
      source_file_path = storagePath
    }
  } catch (storageEx: unknown) {
    console.warn('[POST /api/tng/parse] storage exception:', (storageEx as Error).message)
  }

  // ── Derive statement_label ────────────────────────────────────────────────
  // Priority: meta.period from parser → "Imported DD MMM YYYY" fallback.
  // meta.period format from parser is e.g. "01/02/2025 - 28/02/2025".
  // Both formats are stored as-is — the UI displays them verbatim.
  const metaPeriod = (pythonJson.meta as { period?: string } | undefined)?.period ?? null
  const importDate = new Date().toLocaleDateString('en-MY', {
    day:      '2-digit',
    month:    'short',
    year:     'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  })
  const statement_label: string = metaPeriod ?? `Imported ${importDate}`

  // ── Normalise + return ────────────────────────────────────────────────────
  const rows            = Array.isArray(pythonJson.transactions) ? pythonJson.transactions : []
  const toll_count      = pythonJson.toll_count    ?? 0
  const parking_count   = pythonJson.parking_count ?? 0
  const total_extracted = toll_count + parking_count

  return NextResponse.json({
    rows,
    toll_count,
    parking_count,
    total_extracted,
    source_file_path,   // ← frontend must forward to /api/tng/transactions
    statement_label,    // ← frontend must forward to /api/tng/transactions
    meta: pythonJson.meta ?? null,
  }, { status: 200 })
}
