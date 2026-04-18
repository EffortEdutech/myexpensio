/**
 * apps/admin/app/api/admin/billing/commission-plans/route.ts
 *
 * GET  /api/admin/billing/commission-plans      — list all plans
 * POST /api/admin/billing/commission-plans      — create new plan
 */
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'

export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()

  const { data: plans, error: plansError } = await db
    .from('commission_plans')
    .select('id, code, name, status, rules, created_at, updated_at')
    .order('code', { ascending: true })

  if (plansError) return err('SERVER_ERROR', plansError.message, 500)

  // Attach partner count per plan
  const { data: partnerCounts, error: countError } = await db
    .from('organizations')
    .select('commission_plan_id')
    .eq('is_partner', true)
    .not('commission_plan_id', 'is', null)

  if (countError) return err('SERVER_ERROR', countError.message, 500)

  // Count partners with DEFAULT plan (commission_plan_id is null → uses default)
  const { count: defaultCount } = await db
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('is_partner', true)
    .is('commission_plan_id', null)

  const countMap: Record<string, number> = {}
  for (const row of partnerCounts ?? []) {
    if (row.commission_plan_id) {
      countMap[row.commission_plan_id] = (countMap[row.commission_plan_id] ?? 0) + 1
    }
  }

  // Determine which plan is the platform default (code = DEFAULT_DIRECT_15)
  const items = (plans ?? []).map((plan) => {
    const isDefault = plan.code === 'DEFAULT_DIRECT_15'
    const partnerCount = isDefault
      ? (countMap[plan.id] ?? 0) + (defaultCount ?? 0) // default + explicit
      : (countMap[plan.id] ?? 0)

    const rules = (plan.rules as Record<string, unknown> | null) ?? {}
    return {
      ...plan,
      is_platform_default: isDefault,
      partner_count:        partnerCount,
      // Flatten key rule fields for easy display
      direct_rate_pct:    Number(rules.direct_rate_pct ?? 15),
      basis:              String(rules.basis  ?? 'NET_PAID'),
      trigger:            String(rules.trigger ?? 'INVOICE_PAID'),
      eligible_months:    Number(rules.eligible_months ?? 12),
    }
  })

  return ok({ items })
}

export async function POST(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const body = (await request.json().catch(() => null)) as {
    code?:            string
    name?:            string
    direct_rate_pct?: number
    basis?:           string
    trigger?:         string
    eligible_months?: number
  } | null

  const code = body?.code?.trim().toUpperCase()
  const name = body?.name?.trim()

  if (!code || !name) {
    return err('VALIDATION_ERROR', 'code and name are required.', 400)
  }

  const ratePct = Number(body?.direct_rate_pct ?? 15)
  if (ratePct <= 0 || ratePct > 100) {
    return err('VALIDATION_ERROR', 'direct_rate_pct must be between 0 and 100.', 400)
  }

  const rules = {
    basis:           body?.basis           ?? 'NET_PAID',
    trigger:         body?.trigger         ?? 'INVOICE_PAID',
    direct_rate_pct: ratePct,
    parent_rate_pct: 0,
    max_depth:       1,
    eligible_months: Number(body?.eligible_months ?? 12),
  }

  const { data, error } = await db
    .from('commission_plans')
    .insert({ code, name, rules, status: 'ACTIVE' })
    .select('id, code, name, status, rules, created_at')
    .single()

  if (error) {
    return err('SERVER_ERROR', error.message, error.code === '23505' ? 409 : 500)
  }

  return ok({ plan: data }, 201)
}
