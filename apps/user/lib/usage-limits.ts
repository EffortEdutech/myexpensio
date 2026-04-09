import { createClient } from '@/lib/supabase/server'
import { loadOrgEntitlements, type ResolvedEntitlements } from '@/lib/entitlements'

export type UsageCounterName = 'routes_calls' | 'trips_created' | 'exports_created'

export function getCurrentUsagePeriod() {
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    period_start: periodStart.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
    period_key: periodStart.toISOString().slice(0, 10),
  }
}

export async function readUsageCounters(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  periodStart: string,
) {
  const { data, error } = await supabase
    .from('usage_counters')
    .select('routes_calls, trips_created, exports_created')
    .eq('org_id', orgId)
    .eq('period_start', periodStart)
    .maybeSingle()

  if (error) throw error

  return {
    routes_calls: data?.routes_calls ?? 0,
    trips_created: data?.trips_created ?? 0,
    exports_created: data?.exports_created ?? 0,
  }
}

export async function incrementUsageCounter(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  counter: UsageCounterName,
  periodStart: string,
) {
  const { data, error } = await supabase.rpc('increment_usage_counter', {
    p_org_id: orgId,
    p_counter: counter,
    p_increment: 1,
    p_period_start: periodStart,
  })

  if (error) throw error
  return Number(data ?? 0)
}

export async function loadTierAndEntitlements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  isAdmin: boolean,
) {
  const { data: sub } = await supabase
    .from('subscription_status')
    .select('tier')
    .eq('org_id', orgId)
    .maybeSingle()

  const tier = (sub?.tier ?? 'FREE') as 'FREE' | 'PRO'
  const entitlements = await loadOrgEntitlements({
    supabase,
    orgId,
    tier,
    isAdmin,
  })

  return { tier, entitlements }
}

export function limitForCounter(
  entitlements: ResolvedEntitlements,
  counter: UsageCounterName,
): number | null {
  if (counter === 'routes_calls') return entitlements.routes_limit
  if (counter === 'trips_created') return entitlements.trips_limit
  return entitlements.exports_limit
}

export function periodKeyForCurrentMonth() {
  return getCurrentUsagePeriod().period_key
}
