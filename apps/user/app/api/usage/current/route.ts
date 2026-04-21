/**
 * apps/user/app/api/usage/current/route.ts
 *
 * Returns usage counters + entitlements for the current org.
 * Used by the settings/billing page to display usage meters.
 *
 * GET /api/usage/current
 *
 * Response:
 * {
 *   counters: {
 *     routes_calls:    number
 *     trips_created:   number
 *     exports_created: number
 *     period_start:    string
 *   },
 *   entitlements: {
 *     routeCalculationsPerMonth: number | null   // null = unlimited
 *     tripsPerMonth:             number | null
 *     exportsPerMonth:           number | null
 *   }
 * }
 *
 * 2026-04-21: Removed billing_plans dependency (table dropped in R1 migration).
 *             Entitlements now read from platform_config (admin-editable Free limits)
 *             and subscription_status.tier.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/org'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

type EntitlementsShape = {
  routeCalculationsPerMonth: number | null
  tripsPerMonth: number | null
  exportsPerMonth: number | null
}

const PRO_ENTITLEMENTS: EntitlementsShape = {
  routeCalculationsPerMonth: null,
  tripsPerMonth: null,
  exportsPerMonth: null,
}

const FALLBACK_FREE_ENTITLEMENTS: EntitlementsShape = {
  routeCalculationsPerMonth: 2,
  tripsPerMonth: null,
  exportsPerMonth: null,
}

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // Current period start = first day of current month
  const now = new Date()
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Fetch everything in parallel
  const [usageRes, subscriptionRes, platformRes] = await Promise.all([
    supabase
      .from('usage_counters')
      .select('routes_calls, trips_created, exports_created, period_start')
      .eq('org_id', org.org_id)
      .eq('period_start', periodStart)
      .maybeSingle(),

    supabase
      .from('subscription_status')
      .select('tier')
      .eq('org_id', org.org_id)
      .maybeSingle(),

    // platform_config: admin-editable Free tier baseline limits
    supabase
      .from('platform_config')
      .select('free_routes_per_month, free_trips_per_month, free_exports_per_month')
      .eq('id', true)
      .maybeSingle(),
  ])

  if (usageRes.error) return err('SERVER_ERROR', usageRes.error.message, 500)
  if (subscriptionRes.error) return err('SERVER_ERROR', subscriptionRes.error.message, 500)

  const tier = subscriptionRes.data?.tier ?? 'FREE'

  // Resolve entitlements from tier + platform_config
  let entitlements: EntitlementsShape

  if (tier === 'PRO') {
    entitlements = PRO_ENTITLEMENTS
  } else {
    // FREE tier: use platform_config limits (admin-editable), fall back to hardcoded
    const pc = platformRes.data
    entitlements = {
      routeCalculationsPerMonth: pc?.free_routes_per_month !== undefined
        ? pc.free_routes_per_month
        : FALLBACK_FREE_ENTITLEMENTS.routeCalculationsPerMonth,
      tripsPerMonth: pc?.free_trips_per_month !== undefined
        ? pc.free_trips_per_month
        : FALLBACK_FREE_ENTITLEMENTS.tripsPerMonth,
      exportsPerMonth: pc?.free_exports_per_month !== undefined
        ? pc.free_exports_per_month
        : FALLBACK_FREE_ENTITLEMENTS.exportsPerMonth,
    }
  }

  return NextResponse.json({
    counters: {
      routes_calls: usageRes.data?.routes_calls ?? 0,
      trips_created: usageRes.data?.trips_created ?? 0,
      exports_created: usageRes.data?.exports_created ?? 0,
      period_start: usageRes.data?.period_start ?? periodStart,
    },
    entitlements,
    tier,
  })
}
