// apps/admin/app/api/workspace/referrals/route.ts
//
// GET  /api/workspace/referrals  — list referrals for an Agent workspace
// POST /api/workspace/referrals  — create a new referral invite
//
// AGENT workspace only. Returns 403 for TEAM or INTERNAL contexts.

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  // Only Agent workspaces can access referrals
  if (!ctx.isInternalStaff && !ctx.isAgentWorkspace) {
    return err('FORBIDDEN', 'Referrals are only available for Agent workspaces', 403)
  }

  const { searchParams } = new URL(req.url)
  // Internal staff can pass an explicit org_id; customers are always their own org
  const agentOrgId = ctx.isInternalStaff
    ? searchParams.get('org_id')?.trim() || null
    : ctx.orgId

  if (!agentOrgId) return err('VALIDATION_ERROR', 'org_id required', 400)

  const status = searchParams.get('status')?.trim() || null
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 25)))
  const from = (page - 1) * pageSize

  const db = createServiceRoleClient()

  let query = db
    .from('referrals')
    .select(
      `
      id,
      agent_org_id,
      referred_by_user_id,
      customer_email,
      customer_name,
      referral_code,
      status,
      signed_up_at,
      subscribed_at,
      created_at,
      updated_at,
      profiles:referred_by_user_id (
        id,
        display_name,
        email
      )
    `,
      { count: 'exact' },
    )
    .eq('agent_org_id', agentOrgId)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) {
    console.error('[workspace/referrals] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch referrals', 500)
  }

  const referrals = (data ?? []).map((row) => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles,
  }))

  return NextResponse.json({ referrals, total: count ?? 0, page, pageSize })
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  if (!ctx.isAgentWorkspace) {
    return err('FORBIDDEN', 'Only Agent workspace members can create referrals', 403)
  }

  // Only OWNER and SALES roles can invite
  if (!['OWNER', 'SALES'].includes(ctx.orgRole ?? '')) {
    return err('FORBIDDEN', 'Only OWNER or SALES roles can invite customers', 403)
  }

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { customer_email, customer_name } = body

  if (!customer_email?.trim()) return err('VALIDATION_ERROR', 'customer_email is required', 400)

  const email = customer_email.toLowerCase().trim()

  const db = createServiceRoleClient()

  // Check for active duplicate
  const { data: existing } = await db
    .from('referrals')
    .select('id, status')
    .eq('agent_org_id', ctx.orgId!)
    .eq('customer_email', email)
    .not('status', 'eq', 'CHURNED')
    .maybeSingle()

  if (existing) {
    return err('CONFLICT', 'An active referral already exists for this email', 409)
  }

  const { data: created, error: insertError } = await db
    .from('referrals')
    .insert({
      agent_org_id:         ctx.orgId!,
      referred_by_user_id:  ctx.userId,
      customer_email:       email,
      customer_name:        customer_name?.trim() || null,
      status:               'INVITED',
    })
    .select('id, customer_email, customer_name, status, created_at')
    .single()

  if (insertError || !created) {
    console.error('[workspace/referrals] POST error:', insertError)
    return err('SERVER_ERROR', 'Failed to create referral', 500)
  }

  await db.from('audit_logs').insert({
    org_id:        ctx.orgId,
    actor_user_id: ctx.userId,
    entity_type:   'referral',
    entity_id:     created.id,
    action:        'REFERRAL_INVITED',
    metadata:      { email: created.customer_email, name: created.customer_name },
  })

  return NextResponse.json({ referral: created }, { status: 201 })
}
