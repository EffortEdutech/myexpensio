// apps/user/app/api/billing/summary/route.ts
//
// GET /api/billing/summary
// Returns the current user's org subscription status + usage + limits.
// Used by the Settings page billing section and the billing/page.
// Never throws — always returns a valid JSON response.
//
// NOTE: apps/user uses different Supabase client exports than apps/admin:
//   Session client:      createClient()             from '@/lib/supabase/server'
//   Service role client: createServiceRoleClient()  from '@/lib/supabase/admin'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Get the current user via session cookie
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const db = createServiceRoleClient()

    // Get the user's active org membership
    const { data: membership } = await db
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .limit(1)
      .maybeSingle()

    const orgId = membership?.org_id ?? null

    // ── Subscription status ──────────────────────────────────────────────────

    let subscription = {
      tier:                 'FREE' as 'FREE' | 'PRO',
      billing_status:       'INACTIVE',
      provider:             'MANUAL',
      period_start:         null as string | null,
      period_end:           null as string | null,
      cancel_at_period_end: false,
      grace_until:          null as string | null,
      last_invoice_at:      null as string | null,
    }

    if (orgId) {
      const { data: sub } = await db
        .from('subscription_status')
        .select('tier, billing_status, provider, period_start, period_end, cancel_at_period_end, grace_until, last_invoice_at')
        .eq('org_id', orgId)
        .maybeSingle()

      if (sub) {
        subscription = {
          tier:                 (sub.tier as 'FREE' | 'PRO') ?? 'FREE',
          billing_status:       sub.billing_status ?? 'INACTIVE',
          provider:             sub.provider ?? 'MANUAL',
          period_start:         sub.period_start ?? null,
          period_end:           sub.period_end ?? null,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          grace_until:          sub.grace_until ?? null,
          last_invoice_at:      sub.last_invoice_at ?? null,
        }
      }
    }

    // ── Platform config limits ────────────────────────────────────────────────

    const { data: config } = await db
      .from('platform_config')
      .select('free_routes_per_month, free_trips_per_month, free_exports_per_month')
      .limit(1)
      .maybeSingle()

    const limits = {
      routes_per_month:  subscription.tier === 'PRO' ? null : (config?.free_routes_per_month ?? 2),
      trips_per_month:   subscription.tier === 'PRO' ? null : (config?.free_trips_per_month ?? null),
      exports_per_month: subscription.tier === 'PRO' ? null : (config?.free_exports_per_month ?? null),
    }

    // ── Usage this month ──────────────────────────────────────────────────────

    const now         = new Date()
    const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    let usage = {
      period_start:    periodStart,
      routes_calls:    0,
      trips_created:   0,
      exports_created: 0,
    }

    if (orgId) {
      const { data: usageRow } = await db
        .from('usage_counters')
        .select('routes_calls, trips_created, exports_created, period_start')
        .eq('org_id', orgId)
        .gte('period_start', periodStart)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (usageRow) {
        usage = {
          period_start:    usageRow.period_start ?? periodStart,
          routes_calls:    usageRow.routes_calls ?? 0,
          trips_created:   usageRow.trips_created ?? 0,
          exports_created: usageRow.exports_created ?? 0,
        }
      }
    }

    return NextResponse.json({ subscription, usage, limits })

  } catch (e) {
    console.error('[api/billing/summary] error:', e)
    // Always return valid JSON — never let the settings page crash
    return NextResponse.json({
      subscription: {
        tier: 'FREE', billing_status: 'INACTIVE', provider: 'MANUAL',
        period_start: null, period_end: null, cancel_at_period_end: false,
        grace_until: null, last_invoice_at: null,
      },
      usage: { period_start: '', routes_calls: 0, trips_created: 0, exports_created: 0 },
      limits: { routes_per_month: 2, trips_per_month: null, exports_per_month: null },
    })
  }
}
