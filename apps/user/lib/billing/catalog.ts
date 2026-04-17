import type { SupabaseClient } from '@supabase/supabase-js'
import type { BillingProvider, ResolvedPlanPrice } from '@/lib/billing/types'

export function normalizeProvider(input: string | null | undefined): BillingProvider | null {
  const value = input?.trim().toUpperCase()
  if (value === 'STRIPE' || value === 'TOYYIBPAY' || value === 'MANUAL') return value
  return null
}

export function normalizePlanCode(input: string | null | undefined): string | null {
  const value = input?.trim().toUpperCase()
  return value && value.length > 0 ? value : null
}

export async function resolvePlanAndPrice(
  db: SupabaseClient,
  planCode: string,
  provider: BillingProvider,
): Promise<ResolvedPlanPrice> {
  const { data: plan, error: planError } = await db
    .from('billing_plans')
    .select('id, code, name, tier, interval, description, entitlements, is_active')
    .eq('code', planCode)
    .eq('is_active', true)
    .maybeSingle()

  if (planError) throw new Error(planError.message)
  if (!plan) throw new Error(`Billing plan ${planCode} not found or inactive.`)

  if (provider === 'MANUAL') {
    return {
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        tier: plan.tier,
        interval: plan.interval,
        description: plan.description ?? null,
        entitlements: (plan.entitlements as Record<string, unknown> | null) ?? null,
      },
      price: null,
    }
  }

  const { data: prices, error: priceError } = await db
    .from('billing_prices')
    .select('id, provider, provider_product_id, provider_price_id, currency, amount, interval, metadata, is_active, is_default')
    .eq('plan_id', plan.id)
    .eq('provider', provider)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('amount', { ascending: true })

  if (priceError) throw new Error(priceError.message)

  const price = (prices ?? [])[0]
  if (!price) throw new Error(`No active ${provider} price found for plan ${planCode}.`)

  return {
    plan: {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      tier: plan.tier,
      interval: plan.interval,
      description: plan.description ?? null,
      entitlements: (plan.entitlements as Record<string, unknown> | null) ?? null,
    },
    price: {
      id: price.id,
      provider,
      provider_product_id: price.provider_product_id ?? null,
      provider_price_id: price.provider_price_id ?? null,
      currency: price.currency,
      amount: Number(price.amount ?? 0),
      interval: price.interval,
      metadata: (price.metadata as Record<string, unknown> | null) ?? null,
    },
  }
}
