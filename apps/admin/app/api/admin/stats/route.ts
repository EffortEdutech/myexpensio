// apps/admin/app/api/admin/stats/route.ts
//
// GET /api/admin/stats
//
// Returns dashboard stat counts for the authenticated admin's org.
// Platform SUPERADMINs can pass ?org_id=... to query any org.
// Uses service role client for cross-table counts — RLS bypassed intentionally.

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { DashboardStats } from '@/lib/types'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Access denied' } }, { status: 403 })
  }

  // Platform admins can query any org via ?org_id=...
  const url = new URL(request.url)
  const queryOrgId = url.searchParams.get('org_id')

  const orgId = ctx.isPlatformAdmin
    ? (queryOrgId ?? null)
    : ctx.orgId

  if (!orgId) {
    return NextResponse.json(
      { error: { code: 'MISSING_ORG', message: 'org_id is required for platform admins' } },
      { status: 400 }
    )
  }

  const db = createServiceRoleClient()

  // Run all counts in parallel
  const [
    membersResult,
    claimsResult,
    exportsResult,
    subscriptionResult,
    usageResult,
  ] = await Promise.all([
    // Active members
    db
      .from('org_members')
      .select('status', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'ACTIVE'),

    // Claims by status
    db
      .from('claims')
      .select('status', { count: 'exact' })
      .eq('org_id', orgId),

    // Exports this calendar month
    db
      .from('export_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

    // Subscription tier
    db
      .from('subscription_status')
      .select('tier')
      .eq('org_id', orgId)
      .single(),

    // Route usage this month
    db
      .from('usage_counters')
      .select('routes_calls')
      .eq('org_id', orgId)
      .eq('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().slice(0, 10))
      .single(),
  ])

  // Count claims by status from the returned rows
  const claimsData = claimsResult.data ?? []
  const draftClaims = claimsData.filter((c) => c.status === 'DRAFT').length
  const submittedClaims = claimsData.filter((c) => c.status === 'SUBMITTED').length

  const tier = subscriptionResult.data?.tier ?? 'FREE'
  const routeCallsUsed = usageResult.data?.routes_calls ?? 0
  const routeCallsLimit = tier === 'FREE' ? 2 : null  // FREE = 2/month, PRO = unlimited

  const stats: DashboardStats = {
    totalMembers: membersResult.count ?? 0,
    activeMembers: membersResult.count ?? 0,
    draftClaims,
    submittedClaims,
    exportsThisMonth: exportsResult.count ?? 0,
    routeCallsUsed,
    routeCallsLimit,
    subscriptionTier: tier as 'FREE' | 'PRO',
  }

  return NextResponse.json(stats)
}
