// apps/user/app/api/billing/premium/checkout/route.ts
//
// POST /api/billing/premium/checkout
// Creates a Stripe Checkout Session for the individual Premium plan.
// Stores user_id in session metadata so the webhook can activate the plan.
//
// Required env var:
//   STRIPE_PREMIUM_MONTHLY_PRICE_ID  (create in Stripe Dashboard)

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId   = process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID

  if (!stripeKey) return err('CONFIG_ERROR', 'Stripe not configured.', 500)
  if (!priceId)   return err('CONFIG_ERROR', 'Premium price not configured. Set STRIPE_PREMIUM_MONTHLY_PRICE_ID.', 500)

  const body = await req.json().catch(() => ({}))
  const origin = process.env.NEXT_PUBLIC_USER_APP_URL ?? 'https://myexpensio-jade.vercel.app'
  const successUrl = body.success_url ?? `${origin}/upgrade/success`
  const cancelUrl  = body.cancel_url  ?? `${origin}/upgrade`

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email ?? undefined,
      metadata: {
        user_id:    user.id,
        plan_type:  'PREMIUM_INDIVIDUAL',
      },
      success_url: successUrl,
      cancel_url:  cancelUrl,
    })

    return NextResponse.json({ checkout_url: session.url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[billing/premium/checkout]', msg)
    return err('STRIPE_ERROR', msg, 500)
  }
}
