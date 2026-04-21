// apps/admin/app/api/admin/stats/route.ts
//
// GET /api/admin/stats
// Platform-wide dashboard stats for admin app.
// Optional ?org_id=... filter for org-specific view.

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { DashboardStats } from '@/lib/types'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Access denied' } },
      { status: 403 },
    )
  }

  const db = createServiceRoleClient()
  const url = new URL(request.url)
  const orgId = url.searchParams.get('org_id')?.trim() || null

  const monthStartIso = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString()

  const monthStartDate = monthStartIso.slice(0, 10)

  let totalMembersQ = db
    .from('org_members')
    .select('user_id', { count: 'exact', head: true })

  let activeMembersQ = db
    .from('org_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('status', 'ACTIVE')

  let draftClaimsQ = db
    .from('claims')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'DRAFT')

  let submittedClaimsQ = db
    .from('claims')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'SUBMITTED')

  let exportsThisMonthQ = db
    .from('export_jobs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', monthStartIso)

  if (orgId) {
    totalMembersQ = totalMembersQ.eq('org_id', orgId)
    activeMembersQ = activeMembersQ.eq('org_id', orgId)
    draftClaimsQ = draftClaimsQ.eq('org_id', orgId)
    submittedClaimsQ = submittedClaimsQ.eq('org_id', orgId)
    exportsThisMonthQ = exportsThisMonthQ.eq('org_id', orgId)
  }

  const [
    totalMembersResult,
    activeMembersResult,
    draftClaimsResult,
    submittedClaimsResult,
    exportsThisMonthResult,
    subscriptionResult,
    usageResult,
  ] = await Promise.all([
    totalMembersQ,
    activeMembersQ,
    draftClaimsQ,
    submittedClaimsQ,
    exportsThisMonthQ,
    orgId
      ? db
          .from('subscription_status')
          .select('tier')
          .eq('org_id', orgId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    orgId
      ? db
          .from('usage_counters')
          .select('routes_calls')
          .eq('org_id', orgId)
          .eq('period_start', monthStartDate)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const subscriptionTier = orgId
    ? ((subscriptionResult.data?.tier ?? 'FREE') as 'FREE' | 'PRO')
    : 'PRO'

  const routeCallsUsed = orgId ? (usageResult.data?.routes_calls ?? 0) : 0
  const routeCallsLimit = orgId
    ? (subscriptionTier === 'FREE' ? 2 : null)
    : null

  const stats: DashboardStats = {
    totalMembers: totalMembersResult.count ?? 0,
    activeMembers: activeMembersResult.count ?? 0,
    draftClaims: draftClaimsResult.count ?? 0,
    submittedClaims: submittedClaimsResult.count ?? 0,
    exportsThisMonth: exportsThisMonthResult.count ?? 0,
    routeCallsUsed,
    routeCallsLimit,
    subscriptionTier,
  }

  return NextResponse.json(stats)
}