// apps/user/app/api/usage/route.ts
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/org'
import { NextResponse } from 'next/server'
import { loadTierAndEntitlements, getCurrentUsagePeriod, readUsageCounters } from '@/lib/usage-limits'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const is_admin = profile?.role === 'ADMIN'

  const { data: sub } = await supabase
    .from('subscription_status')
    .select('tier, period_start, period_end')
    .eq('org_id', org.org_id)
    .maybeSingle()

  const tier = (sub?.tier ?? 'FREE') as 'FREE' | 'PRO'
  const currentPeriod = getCurrentUsagePeriod()

  const period_start = sub?.period_start ?? currentPeriod.period_start
  const period_end = sub?.period_end ?? currentPeriod.period_end

  const counters = await readUsageCounters(supabase, org.org_id, currentPeriod.period_key)
  const entitlements = await loadTierAndEntitlements(supabase, org.org_id, is_admin)

  return NextResponse.json({
    tier,
    is_admin,
    period_start,
    period_end,
    routes_used: counters.routes_calls,
    trips_used: counters.trips_created,
    exports_used: counters.exports_created,
    routes_limit: entitlements.entitlements.routes_limit,
    trips_limit: entitlements.entitlements.trips_limit,
    exports_limit: entitlements.entitlements.exports_limit,
    limit_label: entitlements.entitlements.limit_label,
    limit_preset: entitlements.entitlements.limit_preset,
    limit_source: entitlements.entitlements.limit_source,
    override_expires_at: entitlements.entitlements.override_expires_at,
    override_notes: entitlements.entitlements.override_notes,
  })
}
