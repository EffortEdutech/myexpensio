// apps/admin/app/api/workspace/commission/route.ts
//
// GET  /api/workspace/commission         — commissions list + summary
// GET  /api/workspace/commission?view=payout — agent_payout_settings
// PATCH /api/workspace/commission?view=payout — update payout settings (OWNER only)
//
// AGENT workspace only.

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

  if (!ctx.isInternalStaff && !ctx.isAgentWorkspace) {
    return err('FORBIDDEN', 'Commission data is only available for Agent workspaces', 403)
  }

  const agentOrgId = ctx.isInternalStaff
    ? new URL(req.url).searchParams.get('org_id')?.trim() || null
    : ctx.orgId

  if (!agentOrgId) return err('VALIDATION_ERROR', 'org_id required', 400)

  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view')

  const db = createServiceRoleClient()

  // Payout settings view
  if (view === 'payout') {
    const { data } = await db
      .from('agent_payout_settings')
      .select('org_id, bank_name, bank_account_name, bank_account_number, payout_method, updated_at')
      .eq('org_id', agentOrgId)
      .maybeSingle()

    return NextResponse.json({
      payout_settings: data ?? {
        org_id:              agentOrgId,
        bank_name:           null,
        bank_account_name:   null,
        bank_account_number: null,
        payout_method:       'BANK_TRANSFER',
        updated_at:          null,
      },
    })
  }

  // Commission list
  const status = searchParams.get('status')?.trim() || null
  const period = searchParams.get('period')?.trim() || null  // 'YYYY-MM'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 25)))
  const from = (page - 1) * pageSize

  let query = db
    .from('commissions')
    .select(
      `
      id,
      agent_org_id,
      referral_id,
      subscription_period,
      gross_amount,
      commission_rate,
      commission_amount,
      currency,
      status,
      created_at,
      paid_at,
      referrals (
        id,
        customer_email,
        customer_name
      )
    `,
      { count: 'exact' },
    )
    .eq('agent_org_id', agentOrgId)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (status) query = query.eq('status', status)
  if (period) query = query.eq('subscription_period', period)

  const { data: commissions, error, count } = await query

  if (error) {
    console.error('[workspace/commission] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch commissions', 500)
  }

  // Summary aggregates — all-time
  const { data: summary } = await db
    .from('commissions')
    .select('commission_amount, status')
    .eq('agent_org_id', agentOrgId)

  const allCommissions = summary ?? []
  const thisMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  const { data: monthData } = await db
    .from('commissions')
    .select('commission_amount')
    .eq('agent_org_id', agentOrgId)
    .eq('subscription_period', thisMonth)

  const commissionSummary = {
    this_month_amount:     (monthData ?? []).reduce((s, r) => s + Number(r.commission_amount), 0),
    pending_payout_amount: allCommissions.filter(r => r.status === 'APPROVED').reduce((s, r) => s + Number(r.commission_amount), 0),
    paid_to_date_amount:   allCommissions.filter(r => r.status === 'PAID').reduce((s, r) => s + Number(r.commission_amount), 0),
    lifetime_amount:       allCommissions.reduce((s, r) => s + Number(r.commission_amount), 0),
    currency:              'MYR',
  }

  const normalizedCommissions = (commissions ?? []).map((row) => ({
    ...row,
    referrals: Array.isArray(row.referrals) ? row.referrals[0] ?? null : row.referrals,
  }))

  return NextResponse.json({
    commissions: normalizedCommissions,
    total: count ?? 0,
    page,
    pageSize,
    summary: commissionSummary,
  })
}

// ── PATCH — update payout settings ────────────────────────────────────────────

export async function PATCH(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  if (!ctx.isAgentWorkspace) {
    return err('FORBIDDEN', 'Only Agent workspace members can update payout settings', 403)
  }
  if (ctx.orgRole !== 'OWNER') {
    return err('FORBIDDEN', 'Only the workspace OWNER can update payout settings', 403)
  }

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { bank_name, bank_account_name, bank_account_number, payout_method } = body

  const VALID_METHODS = ['BANK_TRANSFER', 'TOYYIBPAY', 'MANUAL']
  if (payout_method && !VALID_METHODS.includes(payout_method)) {
    return err('VALIDATION_ERROR', 'Invalid payout_method', 400)
  }

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('agent_payout_settings')
    .upsert({
      org_id:              ctx.orgId!,
      bank_name:           bank_name?.trim() || null,
      bank_account_name:   bank_account_name?.trim() || null,
      bank_account_number: bank_account_number?.trim() || null,
      payout_method:       payout_method ?? 'BANK_TRANSFER',
      updated_by:          ctx.userId,
      updated_at:          new Date().toISOString(),
    })
    .select('org_id, bank_name, bank_account_name, bank_account_number, payout_method, updated_at')
    .single()

  if (error) {
    console.error('[workspace/commission] PATCH payout error:', error)
    return err('SERVER_ERROR', 'Failed to update payout settings', 500)
  }

  await db.from('audit_logs').insert({
    org_id:        ctx.orgId,
    actor_user_id: ctx.userId,
    entity_type:   'agent_payout_settings',
    entity_id:     ctx.orgId,
    action:        'PAYOUT_SETTINGS_UPDATED',
    metadata:      { payout_method },
  })

  return NextResponse.json({ payout_settings: data })
}
