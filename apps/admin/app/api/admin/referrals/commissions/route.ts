import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok, parsePaging } from '@/lib/billing/http'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const url = new URL(request.url)
  const { page, pageSize, from, to } = parsePaging(url)

  const status = url.searchParams.get('status')?.trim()
  const agentId = url.searchParams.get('agent_id')?.trim()
  const orgId = url.searchParams.get('org_id')?.trim()

  let query = db
    .from('commission_ledger')
    .select('id, org_id, agent_id, referral_attribution_id, billing_invoice_id, billing_subscription_id, commission_plan_id, entry_type, level, basis_amount, rate_pct, commission_amount, currency, status, eligible_at, approved_at, paid_at, notes, metadata, created_at', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (agentId) query = query.eq('agent_id', agentId)
  if (orgId) query = query.eq('org_id', orgId)

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  return ok({
    items: data ?? [],
    page,
    page_size: pageSize,
    total: count ?? 0,
  })
}

export async function PATCH(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const body = (await request.json().catch(() => null)) as {
    ids?: string[]
    action?: 'approve' | 'hold' | 'void' | 'mark_paid' | 'reverse'
    notes?: string | null
    payout_reference?: string | null
  } | null

  if (!body?.ids?.length || !body.action) {
    return err('VALIDATION_ERROR', 'ids and action are required.', 400)
  }

  let patch: Record<string, unknown> = {
    notes: body.notes ?? null,
    metadata: {
      admin_action_by: ctx.userId,
      payout_reference: body.payout_reference ?? null,
    },
  }

  switch (body.action) {
    case 'approve':
      patch = { ...patch, status: 'APPROVED', approved_by_user_id: ctx.userId, approved_at: new Date().toISOString() }
      break
    case 'hold':
      patch = { ...patch, status: 'HELD' }
      break
    case 'void':
      patch = { ...patch, status: 'VOID' }
      break
    case 'mark_paid':
      patch = { ...patch, status: 'PAID', paid_at: new Date().toISOString() }
      break
    case 'reverse':
      patch = { ...patch, status: 'REVERSED', reversed_at: new Date().toISOString() }
      break
    default:
      return err('VALIDATION_ERROR', 'Unsupported action.', 400)
  }

  const { data, error } = await db
    .from('commission_ledger')
    .update(patch)
    .in('id', body.ids)
    .select('id, status, approved_at, paid_at')

  if (error) return err('SERVER_ERROR', error.message, 500)

  return ok({ items: data ?? [] })
}
