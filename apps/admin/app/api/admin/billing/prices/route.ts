/**
 * apps/admin/app/api/admin/billing/prices/route.ts
 *
 * GET  /api/admin/billing/prices   — list all price mappings with plan info
 * POST /api/admin/billing/prices   — create a new price mapping
 *
 * A price mapping links an internal billing_plan to a specific provider
 * price ID (Stripe: price_xxx) plus an MYR amount. The checkout route
 * reads this table to know what to charge and what to send to Stripe.
 */
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db  = createServiceRoleClient()
  const url = new URL(request.url)

  const provider = url.searchParams.get('provider')?.trim()
  const planId   = url.searchParams.get('plan_id')?.trim()
  const active   = url.searchParams.get('active')

  let query = db
    .from('billing_prices')
    .select(
      `id, plan_id, provider, provider_product_id, provider_price_id,
       currency, amount, interval, is_active, is_default,
       created_at, updated_at,
       billing_plans ( id, code, name, tier )`,
      { count: 'exact' }
    )
    .order('is_default', { ascending: false })
    .order('amount', { ascending: true })

  if (provider) query = query.eq('provider', provider)
  if (planId)   query = query.eq('plan_id', planId)
  if (active === 'true')  query = query.eq('is_active', true)
  if (active === 'false') query = query.eq('is_active', false)

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  const items = (data ?? []).map((row) => {
    const plan = Array.isArray(row.billing_plans)
      ? (row.billing_plans[0] ?? null)
      : (row.billing_plans ?? null)

    return {
      ...row,
      plan_code: (plan as { code?: string } | null)?.code ?? null,
      plan_name: (plan as { name?: string } | null)?.name ?? null,
      plan_tier: (plan as { tier?: string } | null)?.tier ?? null,
      billing_plans: undefined,
    }
  })

  return ok({ items, total: count ?? 0 })
}

export async function POST(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const body = (await request.json().catch(() => null)) as {
    plan_id?:              string
    provider?:             string
    provider_product_id?:  string | null
    provider_price_id?:    string | null   // Stripe: price_xxx
    currency?:             string
    amount?:               number          // MYR amount e.g. 29.00
    interval?:             string | null
    is_default?:           boolean
    is_active?:            boolean
  } | null

  if (!body?.plan_id)   return err('VALIDATION_ERROR', 'plan_id is required.', 400)
  if (!body?.provider)  return err('VALIDATION_ERROR', 'provider is required.', 400)

  const allowed = ['STRIPE', 'TOYYIBPAY', 'MANUAL']
  if (!allowed.includes(body.provider.toUpperCase())) {
    return err('VALIDATION_ERROR', `provider must be one of: ${allowed.join(', ')}`, 400)
  }

  if (body.amount === undefined || body.amount < 0) {
    return err('VALIDATION_ERROR', 'amount must be >= 0.', 400)
  }

  // Verify the plan exists
  const { data: plan } = await db
    .from('billing_plans')
    .select('id, code')
    .eq('id', body.plan_id)
    .maybeSingle()

  if (!plan) return err('NOT_FOUND', 'Billing plan not found.', 404)

  // If this will be the default, unset any existing default for same plan+provider
  if (body.is_default) {
    await db
      .from('billing_prices')
      .update({ is_default: false })
      .eq('plan_id', body.plan_id)
      .eq('provider', body.provider.toUpperCase())
  }

  const { data, error } = await db
    .from('billing_prices')
    .insert({
      plan_id:             body.plan_id,
      provider:            body.provider.toUpperCase(),
      provider_product_id: body.provider_product_id?.trim() ?? null,
      provider_price_id:   body.provider_price_id?.trim()   ?? null,
      currency:            body.currency?.toUpperCase() ?? 'MYR',
      amount:              Number(body.amount ?? 0),
      interval:            body.interval ?? null,
      is_default:          body.is_default ?? false,
      is_active:           body.is_active  ?? true,
    })
    .select('id, plan_id, provider, provider_price_id, currency, amount, interval, is_active, is_default')
    .single()

  if (error) {
    return err('SERVER_ERROR', error.message, error.code === '23505' ? 409 : 500)
  }

  return ok({ price: data }, 201)
}
