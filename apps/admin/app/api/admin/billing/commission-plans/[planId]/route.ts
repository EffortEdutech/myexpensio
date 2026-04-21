/**
 * apps/admin/app/api/admin/billing/commission-plans/[planId]/route.ts
 *
 * GET   /api/admin/billing/commission-plans/:planId
 *       Returns plan detail + partners explicitly on this plan
 *       + partners using it as the default (code = DEFAULT_DIRECT_15 only)
 *
 * PATCH /api/admin/billing/commission-plans/:planId
 *       Update name, rate, basis, trigger, eligible_months, status
 *
 * DELETE /api/admin/billing/commission-plans/:planId
 *       Soft-delete: sets status = INACTIVE
 *       Blocked if any partner orgs are explicitly assigned to this plan.
 *       Blocked if plan is the platform default (DEFAULT_DIRECT_15).
 */
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'

type Params = { params: Promise<{ planId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const { planId } = await params
  const db = createServiceRoleClient()

  const { data: plan, error: planError } = await db
    .from('commission_plans')
    .select('id, code, name, status, rules, created_at, updated_at')
    .eq('id', planId)
    .maybeSingle()

  if (planError) return err('SERVER_ERROR', planError.message, 500)
  if (!plan) return err('NOT_FOUND', 'Commission plan not found.', 404)

  const { data: explicitPartners } = await db
    .from('organizations')
    .select('id, name, partner_code, partner_status')
    .eq('is_partner', true)
    .eq('commission_plan_id', planId)
    .order('name', { ascending: true })

  let defaultPartners: {
    id: string
    name: string
    partner_code: string | null
    partner_status: string | null
  }[] = []

  if (plan.code === 'DEFAULT_DIRECT_15') {
    const { data } = await db
      .from('organizations')
      .select('id, name, partner_code, partner_status')
      .eq('is_partner', true)
      .is('commission_plan_id', null)
      .order('name', { ascending: true })
    defaultPartners = data ?? []
  }

  const rules = (plan.rules as Record<string, unknown> | null) ?? {}

  return ok({
    plan: {
      ...plan,
      direct_rate_pct: Number(rules.direct_rate_pct ?? 15),
      basis: String(rules.basis ?? 'NET_PAID'),
      trigger: String(rules.trigger ?? 'INVOICE_PAID'),
      eligible_months: Number(rules.eligible_months ?? 12),
      is_platform_default: plan.code === 'DEFAULT_DIRECT_15',
    },
    partners: explicitPartners ?? [],
    default_partners: defaultPartners,
  })
}

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const { planId } = await params
  const db = createServiceRoleClient()

  const body = (await req.json().catch(() => null)) as {
    name?: string
    direct_rate_pct?: number
    basis?: string
    trigger?: string
    eligible_months?: number
    status?: 'ACTIVE' | 'INACTIVE'
  } | null

  if (!body) return err('VALIDATION_ERROR', 'JSON body required.', 400)

  const { data: existing, error: fetchErr } = await db
    .from('commission_plans')
    .select('id, code, rules')
    .eq('id', planId)
    .maybeSingle()

  if (fetchErr) return err('SERVER_ERROR', fetchErr.message, 500)
  if (!existing) return err('NOT_FOUND', 'Commission plan not found.', 404)

  if (body.status === 'INACTIVE' && existing.code === 'DEFAULT_DIRECT_15') {
    return err('VALIDATION_ERROR', 'The platform default plan cannot be deactivated.', 400)
  }

  const currentRules = (existing.rules as Record<string, unknown> | null) ?? {}
  const newRules: Record<string, unknown> = { ...currentRules }

  if (body.direct_rate_pct !== undefined) {
    const rp = Number(body.direct_rate_pct)
    if (rp <= 0 || rp > 100) {
      return err('VALIDATION_ERROR', 'direct_rate_pct must be between 0 and 100.', 400)
    }
    newRules.direct_rate_pct = rp
  }
  if (body.basis !== undefined) newRules.basis = body.basis
  if (body.trigger !== undefined) newRules.trigger = body.trigger
  if (body.eligible_months !== undefined) newRules.eligible_months = Number(body.eligible_months)

  const patch: Record<string, unknown> = { rules: newRules }
  if (body.name !== undefined) patch.name = body.name.trim()
  if (body.status !== undefined) patch.status = body.status

  const { data: updated, error: updateErr } = await db
    .from('commission_plans')
    .update(patch)
    .eq('id', planId)
    .select('id, code, name, status, rules, updated_at')
    .single()

  if (updateErr) return err('SERVER_ERROR', updateErr.message, 500)
  return ok({ plan: updated })
}

export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const { planId } = await params
  const db = createServiceRoleClient()

  const { data: existing } = await db
    .from('commission_plans')
    .select('id, code')
    .eq('id', planId)
    .maybeSingle()

  if (!existing) return err('NOT_FOUND', 'Commission plan not found.', 404)

  if (existing.code === 'DEFAULT_DIRECT_15') {
    return err('VALIDATION_ERROR', 'The platform default plan cannot be deleted.', 400)
  }

  const { count } = await db
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('is_partner', true)
    .eq('commission_plan_id', planId)

  if ((count ?? 0) > 0) {
    return err(
      'CONFLICT',
      `Cannot delete: ${count} partner org(s) use this plan. Reassign them first.`,
      409
    )
  }

  const { error } = await db
    .from('commission_plans')
    .update({ status: 'INACTIVE' })
    .eq('id', planId)

  if (error) return err('SERVER_ERROR', error.message, 500)
  return ok({ deleted: true, planId })
}