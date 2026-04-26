// apps/console/app/api/console/subscriptions/route.ts
// GET   /api/console/subscriptions — all subscription_status rows
// PATCH /api/console/subscriptions — manual override (SUPER_ADMIN only)

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const page     = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 25)))
  const from     = (page - 1) * pageSize
  const tier     = searchParams.get('tier')?.trim() || null
  const status   = searchParams.get('billing_status')?.trim() || null

  const db = createServiceRoleClient()

  let query = db
    .from('subscription_status')
    .select(
      `
      org_id, tier, billing_status, provider, plan_code,
      period_start, period_end, cancel_at_period_end,
      grace_until, last_invoice_at, last_synced_at,
      organizations:org_id (
        id, name, workspace_type, status
      )
    `,
      { count: 'exact' },
    )
    .order('last_synced_at', { ascending: false, nullsFirst: false })
    .range(from, from + pageSize - 1)

  if (tier)   query = query.eq('tier', tier)
  if (status) query = query.eq('billing_status', status)

  const { data, error, count } = await query

  if (error) {
    console.error('[console/subscriptions] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch subscriptions', 500)
  }

  const subscriptions = (data ?? []).map((row) => ({
    ...row,
    organizations: Array.isArray(row.organizations)
      ? row.organizations[0] ?? null
      : row.organizations,
  }))

  return NextResponse.json({ subscriptions, total: count ?? 0, page, pageSize })
}

export async function PATCH(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (ctx.role !== 'SUPER_ADMIN') return err('FORBIDDEN', 'SUPER_ADMIN only', 403)

  const body = await req.json().catch(() => null)
  if (!body?.org_id) return err('VALIDATION_ERROR', 'org_id required', 400)

  const VALID_TIERS   = ['FREE', 'PRO']
  const VALID_STATUSES = ['INACTIVE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'UNPAID', 'CANCELED', 'EXPIRED']

  if (body.tier && !VALID_TIERS.includes(body.tier)) {
    return err('VALIDATION_ERROR', `tier must be one of: ${VALID_TIERS.join(', ')}`, 400)
  }
  if (body.billing_status && !VALID_STATUSES.includes(body.billing_status)) {
    return err('VALIDATION_ERROR', `billing_status must be one of: ${VALID_STATUSES.join(', ')}`, 400)
  }

  const db = createServiceRoleClient()

  const updatePayload: Record<string, unknown> = {
    last_synced_at: new Date().toISOString(),
  }
  if (body.tier)           updatePayload.tier           = body.tier
  if (body.billing_status) updatePayload.billing_status = body.billing_status
  if (body.period_end)     updatePayload.period_end     = body.period_end
  if (body.plan_code)      updatePayload.plan_code      = body.plan_code
  if ('cancel_at_period_end' in body) updatePayload.cancel_at_period_end = body.cancel_at_period_end

  const { error } = await db
    .from('subscription_status')
    .upsert({ org_id: body.org_id, provider: 'MANUAL', ...updatePayload })

  if (error) return err('SERVER_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id:        body.org_id,
    actor_user_id: ctx.userId,
    entity_type:   'subscription_status',
    entity_id:     body.org_id,
    action:        'SUBSCRIPTION_CHANGED',
    metadata:      { changes: updatePayload, note: body.note ?? 'Manual override via Console' },
  })

  return NextResponse.json({ success: true })
}
