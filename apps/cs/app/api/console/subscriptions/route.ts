// apps/cs/app/api/console/subscriptions/route.ts
//
// GET   /api/console/subscriptions — all ORG subscriptions
// PATCH /api/console/subscriptions — manual override (SUPER_ADMIN only)
//
// 2026-05-15: Rewritten for unified `subscriptions` table (S14-CLEANUP).
//             subscription_status table dropped.

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
  const status   = searchParams.get('status')?.trim() || null

  const db = createServiceRoleClient()

  let query = db
    .from('subscriptions')
    .select(
      `
      entity_id, entity_type, tier, status,
      current_period_end, stripe_customer_id, seat_count,
      created_at, updated_at
      `,
      { count: 'exact' },
    )
    .eq('entity_type', 'ORG')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .range(from, from + pageSize - 1)

  if (tier)   query = query.eq('tier', tier)
  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) {
    console.error('[console/subscriptions] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch subscriptions', 500)
  }

  // Batch-fetch org names
  const orgIds = (data ?? []).map(s => s.entity_id)
  let orgMap: Record<string, { id: string; name: string; workspace_type: string | null; status: string }> = {}
  if (orgIds.length > 0) {
    const { data: orgs } = await db
      .from('organizations')
      .select('id, name, workspace_type, status')
      .in('id', orgIds)
    orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o]))
  }

  const subscriptions = (data ?? []).map(row => ({
    org_id:             row.entity_id,
    tier:               row.tier,
    status:             row.status,
    current_period_end: row.current_period_end,
    stripe_customer_id: row.stripe_customer_id,
    seat_count:         row.seat_count,
    updated_at:         row.updated_at,
    organization:       orgMap[row.entity_id] ?? null,
  }))

  return NextResponse.json({ subscriptions, total: count ?? 0, page, pageSize })
}

export async function PATCH(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (ctx.role !== 'SUPER_ADMIN') return err('FORBIDDEN', 'SUPER_ADMIN only', 403)

  const body = await req.json().catch(() => null)
  if (!body?.org_id) return err('VALIDATION_ERROR', 'org_id required', 400)

  const VALID_TIERS    = ['FREE', 'PRO', 'PREMIUM']
  const VALID_STATUSES = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED']

  if (body.tier && !VALID_TIERS.includes(body.tier)) {
    return err('VALIDATION_ERROR', `tier must be one of: ${VALID_TIERS.join(', ')}`, 400)
  }
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return err('VALIDATION_ERROR', `status must be one of: ${VALID_STATUSES.join(', ')}`, 400)
  }

  const db = createServiceRoleClient()

  const upsertPayload: Record<string, unknown> = {
    entity_type: 'ORG',
    entity_id:   body.org_id,
    updated_at:  new Date().toISOString(),
  }
  if (body.tier)                        upsertPayload.tier               = body.tier
  if (body.status)                      upsertPayload.status             = body.status
  if (body.current_period_end)          upsertPayload.current_period_end = body.current_period_end
  if ('seat_count' in body)             upsertPayload.seat_count         = body.seat_count
  if ('stripe_customer_id' in body)     upsertPayload.stripe_customer_id = body.stripe_customer_id

  const { error } = await db
    .from('subscriptions')
    .upsert(upsertPayload, { onConflict: 'entity_type,entity_id', ignoreDuplicates: false })

  if (error) return err('SERVER_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id:        body.org_id,
    actor_user_id: ctx.userId,
    entity_type:   'subscription',
    entity_id:     body.org_id,
    action:        'SUBSCRIPTION_CHANGED',
    metadata:      { changes: upsertPayload, note: body.note ?? 'Manual override via Console' },
  })

  return NextResponse.json({ success: true })
}
