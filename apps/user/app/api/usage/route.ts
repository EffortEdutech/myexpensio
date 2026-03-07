// apps/user/app/api/usage/route.ts
// GET /api/usage
//
// Returns the current user's org subscription tier + monthly usage counters.
// Used by the Plan Trip page (and any future screen) to show the usage pill
// before the user even tries to get routes.
//
// Response shape:
// {
//   tier:         'FREE' | 'PRO'
//   is_admin:     boolean          ← true if profiles.role = ADMIN
//   period_start: 'YYYY-MM-DD'
//   period_end:   'YYYY-MM-DD'
//   routes_used:  number
//   routes_limit: number | null    ← null = unlimited (PRO or ADMIN)
// }

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { NextResponse }  from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET() {
  const supabase = await createClient()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // ── Profile role (ADMIN bypass) ───────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const is_admin = profile?.role === 'ADMIN'

  // ── Subscription tier ─────────────────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscription_status')
    .select('tier, period_start, period_end')
    .eq('org_id', org.org_id)
    .maybeSingle()

  const tier         = (sub?.tier ?? 'FREE') as 'FREE' | 'PRO'
  const now          = new Date()
  const periodStart  = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd    = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const period_start = sub?.period_start ?? periodStart.toISOString().slice(0, 10)
  const period_end   = sub?.period_end   ?? periodEnd.toISOString().slice(0, 10)

  // ── Usage counter ─────────────────────────────────────────────────────────
  const periodKey = periodStart.toISOString().slice(0, 10)

  const { data: counter } = await supabase
    .from('usage_counters')
    .select('routes_calls')
    .eq('org_id',       org.org_id)
    .eq('period_start', periodKey)
    .maybeSingle()

  const routes_used  = counter?.routes_calls ?? 0
  // ADMIN or PRO → unlimited (null = no cap)
  const routes_limit = (is_admin || tier === 'PRO') ? null : 2

  return NextResponse.json({
    tier,
    is_admin,
    period_start,
    period_end,
    routes_used,
    routes_limit,
  })
}
