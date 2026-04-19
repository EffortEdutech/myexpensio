/**
 * apps/user/app/api/usage/current/route.ts
 *
 * Returns usage counters for the current org's active billing period.
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
 *     period_start:    string   // ISO date e.g. "2026-04-01"
 *   } | null,
 *   entitlements: {
 *     routeCalculationsPerMonth: number | null   // null = unlimited
 *     tripsPerMonth:             number | null
 *     exportsPerMonth:           number | null
 *   }
 * }
 *
 * `counters` is null when no usage row exists yet for the current period
 * (org was created this period but has not performed any tracked action).
 *
 * `entitlements` is derived from subscription_status.plan_code →
 * billing_plans.entitlements so the UI can show the correct limit
 * for the user's current tier without a separate API call.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getActiveOrg } from '@/lib/org'
import { err } from '@/lib/billing/http'

// ── Explicit type so TypeScript knows null fields are number | null ─────────
// Without this, TypeScript infers the literal type `null` for null fields,
// which causes "Type 'number' is not assignable to type 'null'" when the
// billing_plans catalog value is later assigned to the entitlements object.
type EntitlementsShape = {
  routeCalculationsPerMonth: number | null
  tripsPerMonth:             number | null
  exportsPerMonth:           number | null
}

// Default entitlements when no plan record is found.
// Matches the seeded FREE plan: 2 route calculations / month.
const FREE_ENTITLEMENTS: EntitlementsShape = {
  routeCalculationsPerMonth: 2,
  tripsPerMonth:             null,
  exportsPerMonth:           null,
}

const PRO_ENTITLEMENTS: EntitlementsShape = {
  routeCalculationsPerMonth: null,   // unlimited
  tripsPerMonth:             null,
  exportsPerMonth:           null,
}

export async function GET() {
  const supabase = await createClient()
  const db       = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // Current period start = first day of current month in YYYY-MM-DD
  const now = new Date()
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Fetch usage counters and subscription status in parallel
  const [usageRes, subscriptionRes] = await Promise.all([
    db
      .from('usage_counters')
      .select('routes_calls, trips_created, exports_created, period_start')
      .eq('org_id', org.org_id)
      .eq('period_start', periodStart)
      .maybeSingle(),

    db
      .from('subscription_status')
      .select('tier, plan_code')
      .eq('org_id', org.org_id)
      .maybeSingle(),
  ])

  if (usageRes.error) {
    return err('SERVER_ERROR', usageRes.error.message, 500)
  }
  if (subscriptionRes.error) {
    return err('SERVER_ERROR', subscriptionRes.error.message, 500)
  }

  const tier     = subscriptionRes.data?.tier     ?? 'FREE'
  const planCode = subscriptionRes.data?.plan_code ?? null

  // Resolve entitlements from the billing_plans catalog if plan_code known
  let entitlements: EntitlementsShape = tier === 'PRO' ? PRO_ENTITLEMENTS : FREE_ENTITLEMENTS

  if (planCode) {
    const { data: plan } = await db
      .from('billing_plans')
      .select('entitlements')
      .eq('code', planCode)
      .eq('is_active', true)
      .maybeSingle()

    if (plan?.entitlements) {
      const e = plan.entitlements as Record<string, unknown>
      entitlements = {
        routeCalculationsPerMonth: e.routeCalculationsPerMonth === undefined
          ? entitlements.routeCalculationsPerMonth
          : (e.routeCalculationsPerMonth as number | null),
        tripsPerMonth: e.tripsPerMonth === undefined
          ? entitlements.tripsPerMonth
          : (e.tripsPerMonth as number | null),
        exportsPerMonth: e.exportsPerMonth === undefined
          ? entitlements.exportsPerMonth
          : (e.exportsPerMonth as number | null),
      }
    }
  }

  return NextResponse.json({
    counters: usageRes.data
      ? {
          routes_calls:    usageRes.data.routes_calls    ?? 0,
          trips_created:   usageRes.data.trips_created   ?? 0,
          exports_created: usageRes.data.exports_created ?? 0,
          period_start:    usageRes.data.period_start,
        }
      : {
          // Return zeroed counters when no row exists yet — org hasn't
          // used any tracked features this period
          routes_calls:    0,
          trips_created:   0,
          exports_created: 0,
          period_start:    periodStart,
        },
    entitlements,
  })
}
