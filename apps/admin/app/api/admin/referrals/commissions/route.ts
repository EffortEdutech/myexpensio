/**
 * apps/admin/app/api/admin/referrals/commissions/route.ts
 *
 * FIXED: filters now use partner_org_id instead of agent_id.
 * PATCH: bulk status transitions (approve / hold / void / mark_paid / reverse).
 */
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok, parsePaging } from '@/lib/billing/http'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db  = createServiceRoleClient()
  const url = new URL(request.url)
  const { page, pageSize, from, to } = parsePaging(url)

  const status       = url.searchParams.get('status')?.trim()
  const partnerOrgId = url.searchParams.get('partner_org_id')?.trim()
  const orgId        = url.searchParams.get('org_id')?.trim()

  let query = db
    .from('commission_ledger')
    .select(
      `id, org_id, partner_org_id, referral_attribution_id,
       billing_invoice_id, billing_subscription_id,
       commission_plan_id, entry_type, level,
       basis_amount, rate_pct, commission_amount, currency,
       status, eligible_at, approved_at, paid_at, notes, metadata, created_at`,
      { count: 'exact' }
    )
    .range(from, to)
    .order('created_at', { ascending: false })

  if (status)       query = query.eq('status', status)
  if (partnerOrgId) query = query.eq('partner_org_id', partnerOrgId)
  if (orgId)        query = query.eq('org_id', orgId)

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  return ok({ items: data ?? [], page, page_size: pageSize, total: count ?? 0 })
}

export async function PATCH(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const body = (await request.json().catch(() => null)) as {
    ids?:              string[]
    id?:               string   // single-row convenience
    action?:           'approve' | 'hold' | 'void' | 'mark_paid' | 'reverse'
    status?:           string   // direct status set
    notes?:            string | null
    payout_reference?: string | null
  } | null

  // Support both bulk (ids[]) and single (id) patterns
  const ids = body?.ids ?? (body?.id ? [body.id] : [])
  const action = body?.action

  if (!ids.length) return err('VALIDATION_ERROR', 'ids or id required.', 400)
  if (!action && !body?.status) return err('VALIDATION_ERROR', 'action or status required.', 400)

  const now = new Date().toISOString()

  let patch: Record<string, unknown> = {
    notes:      body?.notes ?? null,
    updated_at: now,
  }

  if (action) {
    switch (action) {
      case 'approve':
        patch = { ...patch, status: 'APPROVED', approved_by_user_id: ctx.userId, approved_at: now }
        break
      case 'hold':
        patch = { ...patch, status: 'HELD' }
        break
      case 'void':
        patch = { ...patch, status: 'VOID' }
        break
      case 'mark_paid':
        patch = { ...patch, status: 'PAID', paid_at: now, metadata: { payout_reference: body?.payout_reference ?? null } }
        break
      case 'reverse':
        patch = { ...patch, status: 'REVERSED', reversed_at: now }
        break
      default:
        return err('VALIDATION_ERROR', 'Unsupported action.', 400)
    }
  } else if (body?.status) {
    patch.status = body.status
  }

  const { data, error } = await db
    .from('commission_ledger')
    .update(patch)
    .in('id', ids)
    .select('id, status, approved_at, paid_at')

  if (error) return err('SERVER_ERROR', error.message, 500)
  return ok({ items: data ?? [] })
}
