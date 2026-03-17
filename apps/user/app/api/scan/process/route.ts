// apps/user/app/api/scan/process/route.ts
// POST /api/scan/process
//
// Next.js proxy — forwards image to Python scan microservice.
// Keeps SCAN_API_URL and SCAN_API_SECRET server-side only.
//
// Fix: upstream.json() is now wrapped in try-catch.
// If Render.com / nginx returns a plain-text error (e.g. 413 Request Entity
// Too Large), the old code crashed the handler and Next.js returned the raw
// exception text to the browser — ScanPreviewModal then failed with
// "unexpected token 'R', 'Request En...' is not valid JSON".
// Now we catch non-JSON responses and return a proper error to the client.

import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // ── Parse body ───────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({})) as {
    image?:   string
    mode?:    string
    corners?: number[][]
  }

  const { image, mode = 'RECEIPT', corners } = body

  if (!image) return err('VALIDATION_ERROR', 'image is required.', 400)
  if (!['RECEIPT', 'ODOMETER'].includes(mode)) {
    return err('VALIDATION_ERROR', 'mode must be RECEIPT or ODOMETER.', 400)
  }

  // ── Forward to Python service ────────────────────────────────────────────
  const SCAN_API_URL    = process.env.SCAN_API_URL    ?? ''
  const SCAN_API_SECRET = process.env.SCAN_API_SECRET ?? ''

  if (!SCAN_API_URL) {
    console.error('[POST /api/scan/process] SCAN_API_URL not set')
    return err('SERVER_ERROR', 'Scan service not configured.', 500)
  }

  try {
    const upstream = await fetch(`${SCAN_API_URL}/process`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'X-Scan-Secret': SCAN_API_SECRET,
      },
      body:   JSON.stringify({ image, mode, corners: corners ?? null }),
      signal: AbortSignal.timeout(30_000),
    })

    // ── Safe JSON parse ──────────────────────────────────────────────────
    // upstream.json() throws if the response is not valid JSON.
    // This happens when Render.com / nginx returns a plain-text error page
    // (e.g. "Request Entity Too Large", "502 Bad Gateway", etc.).
    // We always read as text first so we can surface a useful message.
    const rawText = await upstream.text()

    let json: Record<string, unknown>
    try {
      json = JSON.parse(rawText) as Record<string, unknown>
    } catch {
      // Non-JSON response from upstream — surface it clearly
      console.error('[POST /api/scan/process] upstream returned non-JSON:',
        upstream.status, rawText.slice(0, 200))

      // Friendly messages for known plain-text status codes
      if (upstream.status === 413) {
        return err('PAYLOAD_TOO_LARGE',
          'Image is too large for the scan service. Try a smaller photo.', 413)
      }
      if (upstream.status === 502 || upstream.status === 503) {
        return err('SERVICE_UNAVAILABLE',
          'Scan service is starting up. Please wait a moment and try again.', 503)
      }
      return err('UPSTREAM_ERROR',
        `Scan service returned an unexpected response (HTTP ${upstream.status}). Please try again.`, 502)
    }

    // ── Upstream returned JSON but indicated an error ────────────────────
    if (!upstream.ok) {
      console.error('[POST /api/scan/process] upstream error:', upstream.status, json)
      const detail = (json?.detail as string) ?? (json?.message as string) ?? 'Scan service error.'
      return err('UPSTREAM_ERROR', detail, 502)
    }

    return NextResponse.json(json)

  } catch (e: unknown) {
    const msg = (e as Error).message ?? ''
    console.error('[POST /api/scan/process] fetch error:', msg)
    if (msg.includes('timed out') || msg.includes('abort') || msg.includes('TimeoutError')) {
      return err('TIMEOUT',
        'Scan service timed out. The service may be warming up — please try again in a moment.', 504)
    }
    return err('SERVER_ERROR', 'Could not reach scan service.', 502)
  }
}
