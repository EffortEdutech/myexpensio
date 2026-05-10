// apps/user/app/api/billing/catalog/route.ts
//
// GET /api/billing/catalog?plan_code=PRO_MONTHLY&provider=STRIPE
//
// Returns a plan + price object for the given plan_code and provider.
// Price IDs are stored in env vars. Amount is in the display currency (MYR).
// This keeps the billing page decoupled from hardcoded plan details.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Plan catalogue (edit amounts to match your Stripe dashboard prices) ────────

const CATALOGUE: Record<
  string,
  {
    plan: { id: string; code: string; name: string; tier: string; interval: string | null; description: string | null }
    price: (provider: string) => {
      id: string; provider: string; provider_price_id: string | null
      currency: string; amount: number; interval: string | null
    } | null
  }
> = {
  PRO_MONTHLY: {
    plan: {
      id:          'pro-monthly',
      code:        'PRO_MONTHLY',
      name:        'Pro — Monthly',
      tier:        'PRO',
      interval:    'month',
      description: 'Unlimited route calculations, all features included.',
    },
    price: (provider) => {
      if (provider !== 'STRIPE') return null
      const priceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID
      if (!priceId) return null
      return {
        id:                'pro-monthly-stripe',
        provider:          'STRIPE',
        provider_price_id: priceId,
        currency:          'MYR',
        amount:            Number(process.env.STRIPE_PRO_MONTHLY_AMOUNT ?? 29),
        interval:          'month',
      }
    },
  },

  PRO_YEARLY: {
    plan: {
      id:          'pro-yearly',
      code:        'PRO_YEARLY',
      name:        'Pro — Yearly',
      tier:        'PRO',
      interval:    'year',
      description: 'Save 2 months — billed annually.',
    },
    price: (provider) => {
      if (provider !== 'STRIPE') return null
      const priceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID
      if (!priceId) return null
      return {
        id:                'pro-yearly-stripe',
        provider:          'STRIPE',
        provider_price_id: priceId,
        currency:          'MYR',
        amount:            Number(process.env.STRIPE_PRO_YEARLY_AMOUNT ?? 290),
        interval:          'year',
      }
    },
  },
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  // Auth check — user must be logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const planCode = searchParams.get('plan_code')?.trim().toUpperCase() || ''
  const provider = searchParams.get('provider')?.trim().toUpperCase() || 'STRIPE'

  const entry = CATALOGUE[planCode]
  if (!entry) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: `Plan ${planCode} not found` } }, { status: 404 })
  }

  const price = entry.price(provider)

  return NextResponse.json({ plan: entry.plan, price })
}
