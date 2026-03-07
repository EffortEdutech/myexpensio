// apps/user/lib/queries/home.ts
// Server-side data fetching for the Home dashboard.
// All queries are scoped to org_id — RLS enforces this at DB level too.

import { createClient } from '@/lib/supabase/server'

export type HomeStats = {
  tripsThisMonth:    number
  draftClaims:       number
  submittedClaims:   number
  routesUsed:        number   // Free tier: out of 2
  tier:              'FREE' | 'PRO' | string
  recentTrips:       RecentTrip[]
  recentClaims:      RecentClaim[]
}

export type RecentTrip = {
  id:                string
  started_at:        string
  ended_at:          string | null
  final_distance_m:  number | null
  distance_source:   string | null
  status:            string
  origin_text:       string | null
  destination_text:  string | null
}

export type RecentClaim = {
  id:           string
  title:        string | null
  status:       string
  total_amount: number
  currency:     string
  period_start: string | null
  period_end:   string | null
  created_at:   string
}

const now         = new Date()
const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

export async function getHomeStats(org_id: string): Promise<HomeStats> {
  const supabase = await createClient()

  // Run all queries in parallel
  const [
    tripsResult,
    draftsResult,
    submittedResult,
    usageResult,
    recentTripsResult,
    recentClaimsResult,
  ] = await Promise.all([
    // Trips created this month
    supabase
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org_id)
      .gte('created_at', monthStart),

    // Draft claims count
    supabase
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org_id)
      .eq('status', 'DRAFT'),

    // Submitted claims count
    supabase
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org_id)
      .eq('status', 'SUBMITTED'),

    // Route calls used this month
    supabase
      .from('usage_counters')
      .select('routes_calls')
      .eq('org_id', org_id)
      .eq('period_start', monthStart.slice(0, 10).replace(/\d{2}$/, '01'))
      .single(),

    // 3 most recent trips
    supabase
      .from('trips')
      .select(
        'id, started_at, ended_at, final_distance_m, distance_source, status, origin_text, destination_text'
      )
      .eq('org_id', org_id)
      .order('started_at', { ascending: false })
      .limit(3),

    // 3 most recent claims
    supabase
      .from('claims')
      .select('id, title, status, total_amount, currency, period_start, period_end, created_at')
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  return {
    tripsThisMonth:  tripsResult.count     ?? 0,
    draftClaims:     draftsResult.count    ?? 0,
    submittedClaims: submittedResult.count ?? 0,
    routesUsed:      usageResult.data?.routes_calls ?? 0,
    tier:            'FREE',   // overridden by layout which already has it
    recentTrips:     (recentTripsResult.data  ?? []) as RecentTrip[],
    recentClaims:    (recentClaimsResult.data ?? []) as RecentClaim[],
  }
}
