// apps/user/app/api/scan/process/route.ts
// POST /api/scan/process
//
// Next.js proxy route — forwards image to Python scan microservice.
// Keeps SCAN_API_URL and SCAN_API_SECRET server-side (never in browser).
//
// Request body (from browser):
//   { image: string, mode: "RECEIPT" | "ODOMETER" }
//
// Response to browser:
//   { result: string, applied: string[], width: number, height: number }
//
// Env vars required (Vercel dashboard + .env.local for dev):
//   SCAN_API_URL    = https://myexpensio-scan.onrender.com
//   SCAN_API_SECRET = <value from Render env var SCAN_API_SECRET>

import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(req: NextRequest) {
  // ── Auth — must be logged in ─────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // ── Parse body ───────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({})) as {
    image?: string
    mode?:  string
  }

  const { image, mode = 'RECEIPT' } = body

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
      body: JSON.stringify({ image, mode }),
      signal: AbortSignal.timeout(30_000),
    })

    const json = await upstream.json()

    if (!upstream.ok) {
      console.error('[POST /api/scan/process] upstream error:', upstream.status, json)
      return err('UPSTREAM_ERROR', json?.detail ?? 'Scan service error.', 502)
    }

    return NextResponse.json(json)
  } catch (e: unknown) {
    const msg = (e as Error).message ?? ''
    console.error('[POST /api/scan/process] fetch error:', msg)
    if (msg.includes('timed out') || msg.includes('abort')) {
      return err('TIMEOUT', 'Scan service timed out. Please try again.', 504)
    }
    return err('SERVER_ERROR', 'Could not reach scan service.', 502)
  }
}
