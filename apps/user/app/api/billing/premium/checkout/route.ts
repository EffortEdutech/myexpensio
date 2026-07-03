// apps/user/app/api/billing/premium/checkout/route.ts
//
// DEPRECATED — kept for backward compatibility only.
// Forwards to the unified /api/billing/checkout endpoint.
// Remove this file once all callers are updated to POST /api/billing/checkout
// with body { tier: 'PREMIUM', entity_type: 'USER' }.
//
// ⚠️ CONFIRMED UNUSED 2026-07-02 (Sprint 25): repo-wide search found zero
// callers — the web billing page and the mobile app both call
// /api/billing/checkout directly with { tier, entity_type } already. Safe to
// delete this whole route directory. Kept only because file deletion in this
// session requires manual confirmation. See docs/SHIP_READINESS_ACTION_PLAN.md §1.2.

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))

  // Forward to unified checkout with PREMIUM USER defaults
  const res = await fetch(
    new URL('/api/billing/checkout', req.url).toString(),
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', cookie: req.headers.get('cookie') ?? '' },
      body:    JSON.stringify({
        tier:        'PREMIUM',
        entity_type: 'USER',
        success_url: body.success_url,
        cancel_url:  body.cancel_url,
      }),
    },
  )

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
