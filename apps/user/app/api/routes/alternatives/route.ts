// apps/user/app/api/routes/alternatives/route.ts
// POST /api/routes/alternatives
//
// Returns route alternatives for origin → destination.
// Uses deterministic mock — replace MOCK SECTION with real
// Google Routes API v2 call when key is available.
//
// NOTE: increment_routes_usage is SECURITY DEFINER — it runs with
// elevated DB privileges regardless of caller. No admin client needed.

import { createClient }                  from '@/lib/supabase/server'
import { getActiveOrg }                  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'
import { createHash }                    from 'crypto'

// ── Helpers ────────────────────────────────────────────────────────────────

function err(code: string, message: string, status: number, details?: object) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  )
}

function hashText(t: string): string {
  return createHash('sha256').update(t.toLowerCase().trim()).digest('hex').slice(0, 16)
}

// ── MOCK SECTION ──────────────────────────────────────────────────────────
// Replace with real Google Routes API v2 call when key is available:
//   POST https://routes.googleapis.com/directions/v2:computeRoutes
//   Headers: { 'X-Goog-Api-Key': process.env.GOOGLE_ROUTES_API_KEY }
//   Body: { origin: { address: origin_text },
//           destination: { address: destination_text },
//           travelMode: 'DRIVING', computeAlternativeRoutes: true }
function mockAlternatives(origin: string, destination: string) {
  const seed = (origin.length * 31 + destination.length * 17) % 40
  const base = 15_000 + seed * 1_000
  return [
    { route_id: 'mock_a', distance_m: base,                    duration_s: Math.round(base / 10), summary: 'Via Federal Highway',       polyline: null },
    { route_id: 'mock_b', distance_m: Math.round(base * 1.15), duration_s: Math.round(base / 13), summary: 'Via ELITE Highway (Faster)', polyline: null },
    { route_id: 'mock_c', distance_m: Math.round(base * 0.92), duration_s: Math.round(base / 8),  summary: 'Via Old Road (Shorter)',     polyline: null },
  ]
}
// ── END MOCK SECTION ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {

  // ── Auth ────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // ── Parse body ──────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({})) as {
    origin_text?:      string
    destination_text?: string
    travel_mode?:      string
  }

  const origin_text      = body.origin_text?.trim()
  const destination_text = body.destination_text?.trim()
  const travel_mode      = body.travel_mode ?? 'DRIVING'

  if (!origin_text || !destination_text) {
    return err('VALIDATION_ERROR', 'origin_text and destination_text are required.', 400)
  }

  const origin_hash = hashText(origin_text)
  const dest_hash   = hashText(destination_text)

  // ── ADMIN bypass ────────────────────────────────────────────────────────
  // Users with profiles.role = ADMIN are never subject to route limits.
  // This lets the developer/ops team test without consuming Free quota.
  // The check happens here (before cache + limit) so ADMIN calls don't
  // even increment the counter — they skip the whole gate entirely.
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = callerProfile?.role === 'ADMIN'

  // ── Cache check (no quota consumed on hit) ──────────────────────────────
  const { data: cached } = await supabase
    .from('routes_cache')
    .select('response_payload')
    .eq('origin_hash',      origin_hash)
    .eq('destination_hash', dest_hash)
    .eq('travel_mode',      travel_mode)
    .gt('expires_at',       new Date().toISOString())
    .order('created_at',    { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cached?.response_payload) {
    const usage = await getUsage(supabase, org.org_id, isAdmin)
    return NextResponse.json({ cached: true, alternatives: cached.response_payload, usage })
  }

  // ── Free tier limit gate ─────────────────────────────────────────────────
  // ADMIN users bypass the limit entirely (for dev/ops testing).
  // PRO orgs bypass inside the DB function itself.
  // FREE orgs are enforced atomically via SECURITY DEFINER function.
  if (!isAdmin) {
    const { data: allowed, error: limitErr } = await supabase
      .rpc('increment_routes_usage', { p_org_id: org.org_id })

    if (limitErr) {
      console.error('[POST /api/routes/alternatives] increment_routes_usage:', limitErr.message)
      return err('SERVER_ERROR', 'Failed to check usage limits. ' + limitErr.message, 500)
    }

    if (allowed === false) {
      const periodEnd = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      ).toISOString().slice(0, 10)

      return err(
        'LIMIT_REACHED',
        "You've used your 2 free route calculations for this month. Upgrade to Pro for unlimited routes.",
        429,
        { limit: 2, used: 2, period_end: periodEnd }
      )
    }
  }

  // ── Generate alternatives ───────────────────────────────────────────────
  const alternatives = mockAlternatives(origin_text, destination_text)

  // ── Store in cache (24h TTL) ────────────────────────────────────────────
  const { error: cacheErr } = await supabase.from('routes_cache').insert({
    origin_hash,
    destination_hash: dest_hash,
    travel_mode,
    request_payload:  { origin_text, destination_text },
    response_payload: alternatives,
    expires_at:       new Date(Date.now() + 86_400_000).toISOString(),
  })

  if (cacheErr) {
    // Non-fatal — log but don't block the response
    console.warn('[POST /api/routes/alternatives] cache insert failed:', cacheErr.message)
  }

  const usage = await getUsage(supabase, org.org_id, isAdmin)
  return NextResponse.json({ cached: false, alternatives, usage })
}

// ── Usage helper ────────────────────────────────────────────────────────────

async function getUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  org_id:   string,
  isAdmin:  boolean,
) {
  const periodStart = new Date()
  periodStart.setDate(1)
  const key = periodStart.toISOString().slice(0, 10)

  const { data } = await supabase
    .from('usage_counters')
    .select('routes_calls')
    .eq('org_id',       org_id)
    .eq('period_start', key)
    .maybeSingle()

  return {
    routes_used:  data?.routes_calls ?? 0,
    routes_limit: isAdmin ? null : 2,   // null = unlimited
  }
}
