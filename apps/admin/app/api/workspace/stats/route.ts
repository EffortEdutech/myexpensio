// apps/admin/app/api/workspace/stats/route.ts
//
// GET /api/workspace/stats
// Returns dashboard stats scoped to the caller's workspace context.
//
// INTERNAL staff  → platform-wide aggregates
// TEAM workspace  → org-scoped member + claim + usage stats
// AGENT workspace → referral + commission stats

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth, resolveOrgScope } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const requestedOrgId = searchParams.get('org_id')?.trim() || null
  const orgId = resolveOrgScope(ctx, requestedOrgId)

  const db = createServiceRoleClient()

  const now = new Date()
  const monthStartIso = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthStartDate = monthStartIso.slice(0, 10) // 'YYYY-MM-01'
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // ── INTERNAL staff (no org scope) ──────────────────────────────────────────
  if (ctx.isInternalStaff && !orgId) {
    const [orgsRes, usersRes, claimsRes, exportsRes, newUsersRes] = await Promise.all([
      db.from('organizations').select('id, status, workspace_type'),
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('claims').select('status'),
      db.from('export_jobs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStartIso),
      db.from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStartIso),
    ])

    const orgs   = orgsRes.data ?? []
    const claims = claimsRes.data ?? []

    return NextResponse.json({
      workspace_type:   null,
      is_internal_staff: true,
      stats: {
        total_orgs:             orgs.length,
        active_orgs:            orgs.filter(o => o.status === 'ACTIVE').length,
        team_workspaces:        orgs.filter(o => o.workspace_type === 'TEAM').length,
        agent_workspaces:       orgs.filter(o => o.workspace_type === 'AGENT').length,
        total_users:            usersRes.count ?? 0,
        new_users_month:        newUsersRes.count ?? 0,
        claims_submitted_month: claims.filter(c => c.status === 'SUBMITTED').length,
        claims_draft:           claims.filter(c => c.status === 'DRAFT').length,
        exports_month:          exportsRes.count ?? 0,
      },
    })
  }

  // orgId is required beyond this point
  if (!orgId) return err('VALIDATION_ERROR', 'org_id required', 400)

  // ── TEAM workspace ──────────────────────────────────────────────────────────
  if (ctx.isTeamWorkspace || (ctx.isInternalStaff && requestedOrgId)) {
    const [membersRes, claimsRes, exportsRes, usageRes, subscriptionRes] = await Promise.all([
      db.from('org_members')
        .select('user_id, status')
        .eq('org_id', orgId),
      db.from('claims')
        .select('status, submitted_at')
        .eq('org_id', orgId),
      db.from('export_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', monthStartIso),
      db.from('usage_counters')
        .select('routes_calls')
        .eq('org_id', orgId)
        .eq('period_start', monthStartDate)
        .maybeSingle(),
      db.from('subscription_status')
        .select('tier')
        .eq('org_id', orgId)
        .maybeSingle(),
    ])

    const members = membersRes.data ?? []
    const claims  = claimsRes.data ?? []
    const tier    = subscriptionRes.data?.tier ?? 'FREE'

    const claimsThisMonth = claims.filter(c =>
      c.submitted_at && c.submitted_at >= monthStartIso,
    )

    return NextResponse.json({
      workspace_type:   'TEAM',
      is_internal_staff: ctx.isInternalStaff,
      stats: {
        total_members:          members.length,
        active_members:         members.filter(m => m.status === 'ACTIVE').length,
        claims_submitted_month: claimsThisMonth.length,
        claims_draft:           claims.filter(c => c.status === 'DRAFT').length,
        claims_submitted_total: claims.filter(c => c.status === 'SUBMITTED').length,
        exports_month:          exportsRes.count ?? 0,
        routes_used:            usageRes.data?.routes_calls ?? 0,
        routes_limit:           tier === 'FREE' ? 2 : null, // null = unlimited
        subscription_tier:      tier,
      },
    })
  }

  // ── AGENT workspace ─────────────────────────────────────────────────────────
  if (ctx.isAgentWorkspace) {
    const [referralsRes, commissionRes] = await Promise.all([
      db.from('referrals')
        .select('status, created_at')
        .eq('agent_org_id', orgId),
      db.from('commissions')
        .select('commission_amount, status, subscription_period')
        .eq('agent_org_id', orgId),
    ])

    const referrals   = referralsRes.data ?? []
    const commissions = commissionRes.data ?? []

    const monthCommissions = commissions.filter(c => c.subscription_period === thisMonth)
    const pendingCommissions = commissions.filter(c => c.status === 'APPROVED')

    return NextResponse.json({
      workspace_type:   'AGENT',
      is_internal_staff: false,
      stats: {
        total_referrals:        referrals.length,
        invited:                referrals.filter(r => r.status === 'INVITED').length,
        signed_up:              referrals.filter(r => r.status === 'SIGNED_UP').length,
        subscribed:             referrals.filter(r => r.status === 'SUBSCRIBED').length,
        churned:                referrals.filter(r => r.status === 'CHURNED').length,
        commission_month:       monthCommissions.reduce((s, c) => s + Number(c.commission_amount), 0),
        pending_payout:         pendingCommissions.reduce((s, c) => s + Number(c.commission_amount), 0),
        commission_lifetime:    commissions.reduce((s, c) => s + Number(c.commission_amount), 0),
      },
    })
  }

  return err('FORBIDDEN', 'Unknown workspace context', 403)
}
