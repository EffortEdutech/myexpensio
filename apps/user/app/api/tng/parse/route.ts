// apps/user/app/api/tng/parse/route.ts
// POST /api/tng/parse
//
// Accepts a TNG eWallet PDF statement, forwards it to the Python scan service
// for table extraction, and returns structured TOLL + PARKING rows.
//
// WHY Python service (not pdf-parse npm)?
//   TNG statement uses complex multi-column merged-cell tables.
//   pdf-parse dumps raw linear text which loses column alignment.
//   pdfplumber (Python) uses geometric table detection — reliable 95%+ accuracy.
//
// Request body (multipart/form-data OR JSON):
//   Multipart: field "file" = PDF file (browser file input)
//   JSON:      { "pdf": "<base64>" }   (for programmatic use)
//
// Response (success):
//   {
//     meta: { account_name, ewallet_id, period },
//     transactions: TngParsedRow[],
//     toll_count: number,
//     parking_count: number,
//     skipped_retail: number,
//   }
//
// Error codes:
//   400 VALIDATION_ERROR — not a PDF / file too large
//   422 PARSE_ERROR      — PDF is scanned/corrupted / no transactions found
//   502 UPSTREAM_ERROR   — Python service returned an error
//   504 TIMEOUT          — Python service timed out
//
// Env vars:
//   SCAN_API_URL    = https://myexpensio-scan.onrender.com
//   SCAN_API_SECRET = <value from Render>

import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

const MAX_PDF_BYTES = 10 * 1024 * 1024 // 10 MB

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // ── Parse request — support both multipart and JSON ──────────────────────
  let pdfBase64: string | null = null
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData().catch(() => null)
    if (!formData) return err('VALIDATION_ERROR', 'Invalid multipart body.', 400)

    const file = formData.get('file') as File | null
    if (!file) return err('VALIDATION_ERROR', 'Field "file" is required.', 400)

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return err('VALIDATION_ERROR', 'Only PDF files are accepted.', 400)
    }
    if (file.size > MAX_PDF_BYTES) {
      return err('VALIDATION_ERROR', `File too large. Maximum size is ${MAX_PDF_BYTES / 1024 / 1024} MB.`, 400)
    }

    const arrayBuffer = await file.arrayBuffer()
    pdfBase64 = Buffer.from(arrayBuffer).toString('base64')

  } else if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({})) as { pdf?: string }
    if (!body.pdf) return err('VALIDATION_ERROR', '"pdf" (base64) is required in JSON body.', 400)
    pdfBase64 = body.pdf

  } else {
    return err('VALIDATION_ERROR', 'Content-Type must be multipart/form-data or application/json.', 400)
  }

  if (!pdfBase64) {
    return err('VALIDATION_ERROR', 'No PDF data received.', 400)
  }

  // ── Forward to Python scan service ────────────────────────────────────────
  const SCAN_API_URL    = process.env.SCAN_API_URL    ?? ''
  const SCAN_API_SECRET = process.env.SCAN_API_SECRET ?? ''

  if (!SCAN_API_URL) {
    console.error('[POST /api/tng/parse] SCAN_API_URL not configured')
    return err('SERVER_ERROR', 'PDF parsing service not configured.', 500)
  }

  try {
    const upstream = await fetch(`${SCAN_API_URL}/parse-tng`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'X-Scan-Secret': SCAN_API_SECRET,
      },
      body: JSON.stringify({ pdf: pdfBase64 }),
      signal: AbortSignal.timeout(60_000), // 60s — allow for cold start on Render free tier
    })

    const json = await upstream.json()

    if (!upstream.ok) {
      const detail: string = json?.detail ?? 'PDF parsing failed.'
      console.error('[POST /api/tng/parse] upstream error:', upstream.status, detail)

      if (detail.startsWith('PARSE_ERROR')) {
        return err('PARSE_ERROR', detail.replace('PARSE_ERROR: ', ''), 422)
      }
      return err('UPSTREAM_ERROR', detail, 502)
    }

    // Success — return parsed rows directly to client
    return NextResponse.json(json)

  } catch (e: unknown) {
    const msg = (e as Error).message ?? ''
    console.error('[POST /api/tng/parse] fetch error:', msg)
    if (msg.includes('timed out') || msg.includes('abort')) {
      return err(
        'TIMEOUT',
        'PDF parser timed out. The service may be waking up — please try again in 30 seconds.',
        504,
      )
    }
    return err('SERVER_ERROR', 'Could not reach PDF parsing service.', 502)
  }
}
