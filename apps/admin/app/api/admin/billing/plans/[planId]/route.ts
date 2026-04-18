/**
 * apps/admin/app/api/admin/billing/plans/[planId]/route.ts
 *
 * GET   /api/admin/billing/plans/:planId  — full plan detail + prices
 * PATCH /api/admin/billing/plans/:planId  — edit name, description,
 *                                           sort_order, entitlements
 */
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'

type Params = { params: { planId: string } }

export async function GET(_req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()

  const { data: plan, error: planErr } = await db
    .from('billing_plans')
    .select('*')
    .eq('id', params.planId)
    .maybeSingle()

  if (planErr) return err('SERVER_ERROR', planErr.message, 500)
  if (!plan)   return err('NOT_FOUND', 'Plan not found.', 404)

  const { data: prices, error: pricesErr } = await db
    .from('billing_prices')
    .select('id, provider, provider_product_id, provider_price_id, currency, amount, interval, is_active, is_default, updated_at')
    .eq('plan_id', params.planId)
    .order('provider', { ascending: true })
    .order('is_default', { ascending: false })

  if (pricesErr) return err('SERVER_ERROR', pricesErr.message, 500)

  return ok({ plan, prices: prices ?? [] })
}

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()

  const body = (await req.json().catch(() => null)) as {
    name?:        string
    description?: string | null
    sort_order?:  number
    is_active?:   boolean
    entitlements?: {
      routeCalculationsPerMonth?: number | null
      tripsPerMonth?:             number | null
      exportsPerMonth?:           number | null
    }
  } | null

  if (!body) return err('VALIDATION_ERROR', 'JSON body required.', 400)

  // Fetch current plan to safely merge entitlements
  const { data: existing, error: fetchErr } = await db
    .from('billing_plans')
    .select('code, entitlements')
    .eq('id', params.planId)
    .maybeSingle()

  if (fetchErr) return err('SERVER_ERROR', fetchErr.message, 500)
  if (!existing) return err('NOT_FOUND', 'Plan not found.', 404)

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.name        !== undefined) patch.name        = body.name.trim()
  if (body.description !== undefined) patch.description = body.description ?? null
  if (body.sort_order  !== undefined) patch.sort_order  = Number(body.sort_order)
  if (body.is_active   !== undefined) patch.is_active   = body.is_active

  if (body.entitlements !== undefined) {
    const current = (existing.entitlements as Record<string, unknown> | null) ?? {}
    const merged: Record<string, unknown> = { ...current }

    // null = unlimited (stored as JSON null), number = capped limit
    if ('routeCalculationsPerMonth' in body.entitlements) {
      const v = body.entitlements.routeCalculationsPerMonth
      merged.routeCalculationsPerMonth = v === null ? null : Number(v)
    }
    if ('tripsPerMonth' in body.entitlements) {
      const v = body.entitlements.tripsPerMonth
      merged.tripsPerMonth = v === null ? null : Number(v)
    }
    if ('exportsPerMonth' in body.entitlements) {
      const v = body.entitlements.exportsPerMonth
      merged.exportsPerMonth = v === null ? null : Number(v)
    }
    patch.entitlements = merged
  }

  const { data: updated, error: updateErr } = await db
    .from('billing_plans')
    .update(patch)
    .eq('id', params.planId)
    .select('id, code, name, tier, interval, description, sort_order, is_active, entitlements, updated_at')
    .single()

  if (updateErr) return err('SERVER_ERROR', updateErr.message, 500)
  return ok({ plan: updated })
}
