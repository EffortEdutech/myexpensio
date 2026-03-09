// apps/user/app/api/cron/warmup/route.ts
// GET /api/cron/warmup
//
// Called by Vercel cron every 14 minutes.
// Pings Render.com Python service /health to prevent cold start sleep.
//
// Vercel cron config is in vercel.json (project root of apps/user).
// This endpoint is protected — only Vercel cron can call it via
// the Authorization header Vercel injects automatically.

import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Vercel injects this header on cron calls — reject anything else
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const SCAN_API_URL = process.env.SCAN_API_URL ?? ''

  if (!SCAN_API_URL) {
    console.warn('[warmup] SCAN_API_URL not set — skipping')
    return NextResponse.json({ status: 'skipped', reason: 'SCAN_API_URL not set' })
  }

  const start = Date.now()

  try {
    const res = await fetch(`${SCAN_API_URL}/health`, {
      signal: AbortSignal.timeout(25_000),   // 25s — allow for cold start wake
    })
    const json = await res.json().catch(() => ({}))
    const ms   = Date.now() - start

    console.log(`[warmup] Render /health → ${res.status} in ${ms}ms`, json)

    return NextResponse.json({
      status:       res.ok ? 'ok' : 'error',
      upstream:     json,
      response_ms:  ms,
      timestamp:    new Date().toISOString(),
    })
  } catch (e: unknown) {
    const ms  = Date.now() - start
    const msg = (e as Error).message ?? 'unknown'
    console.error(`[warmup] Render /health failed after ${ms}ms:`, msg)

    return NextResponse.json({
      status:      'failed',
      error:       msg,
      response_ms: ms,
      timestamp:   new Date().toISOString(),
    }, { status: 502 })
  }
}
