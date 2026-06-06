// apps/user/app/api/billing/summary/route.ts
//
// GET /api/billing/summary
// Returns the current user's subscription status + usage + limits.
// Used by the Settings billing section.
// Never throws — always returns a valid JSON response.
//
// Source of truth: unified `subscriptions` table
//   USER subscription → entity_type='USER', entity_id=user.id
//   ORG  subscription → entity_type='ORG',  entity_id=org_id  (team workspace)
//
// Routes/trips are available on all tiers. Exports are unlimited if:
//   • Org is PRO or PREMIUM (team workspace pays)
//   • Individual user is PRO or PREMIUM (self-pays)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const db = createServiceRoleClient()

    // Get the user's active org membership (may be null for solo users)
    const { data: membership } = await db
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .limit(1)
      .maybeSingle()

    const orgId = membership?.org_id ?? null

    // Fetch USER and ORG subscriptions in parallel
    const [userSubRes, orgSubRes] = await Promise.all([
      db.from('subscriptions')
        .select('tier, status, current_period_end, stripe_customer_id')
        .eq('entity_type', 'USER')
        .eq('entity_id', user.id)
        .maybeSingle(),

      orgId
        ? db.from('subscriptions')
            .select('tier, status, current_period_end, stripe_customer_id, seat_count')
            .eq('entity_type', 'ORG')
            .eq('entity_id', orgId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const userSub = userSubRes.data
    const orgSub  = orgSubRes.data

    // Build subscription shape for response (prefer ORG if present, else USER)
    const activeSub = orgSub ?? userSub

    const subscription = {
      tier:            activeSub?.tier           ?? 'FREE',
      status:          activeSub?.status         ?? 'TRIALING',
      period_end:      activeSub?.current_period_end ?? null,
      // legacy compat fields (settings page reads these)
      billing_status:  activeSub?.status         ?? 'TRIALING',
      period_start:    null as string | null,
      cancel_at_period_end: false,
      grace_until:     null as string | null,
      last_invoice_at: null as string | null,
    }

    // Platform config limits
    const { data: config } = await db
      .from('platform_config')
      .select('free_routes_per_month, free_trips_per_month, free_exports_per_month')
      .limit(1)
      .maybeSingle()

    const orgTier  = orgSub?.tier  ?? 'FREE'
    const userTier = userSub?.tier ?? 'FREE'
    const isPaid   = (t: string) => t === 'PRO' || t === 'PREMIUM'
    const isUnlimited = isPaid(orgTier) || isPaid(userTier)

    const limits = {
      routes_per_month:  null,
      trips_per_month:   null,
      exports_per_month: isUnlimited ? null : (config?.free_exports_per_month ?? 0),
    }

    // Usage this month
    const now         = new Date()
    const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    let usage = { period_start: periodStart, routes_calls: 0, trips_created: 0, exports_created: 0 }

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

    return NextResponse.json({
      subscription,
      usage,
      limits,
      // Individual user tier (for feature-gating checks)
      tier:         userTier,
      is_unlimited: isUnlimited,
    })

  } catch (e) {
    console.error('[api/billing/summary] error:', e)
    return NextResponse.json({
      subscription: {
        tier: 'FREE', status: 'TRIALING', billing_status: 'TRIALING',
        period_end: null, period_start: null,
        cancel_at_period_end: false, grace_until: null, last_invoice_at: null,
      },
      usage: { period_start: '', routes_calls: 0, trips_created: 0, exports_created: 0 },
      limits: { routes_per_month: null, trips_per_month: null, exports_per_month: 0 },
      tier: 'FREE', is_unlimited: false,
    })
  }
}
