// apps/user/app/api/billing/checkout/route.ts
//
// POST /api/billing/checkout
// Creates a Stripe Checkout Session and returns the redirect URL.
//
// Body: { plan_code, provider, success_url, cancel_url }
//
// Flow:
//   1. Verify user session + get org_id
//   2. Look up / create Stripe customer for this org
//   3. Create Checkout Session with the right price_id
//   4. Return { checkout_url }

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' })
}

// Plan code → Stripe price ID mapping (via env vars)
const PRICE_ID_MAP: Record<string, string | undefined> = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  PRO_YEARLY:  process.env.STRIPE_PRO_YEARLY_PRICE_ID,
}

export async function POST(req: Request) {
  // 1. Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHORIZED', 'Not authenticated', 401)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { plan_code, provider = 'STRIPE', success_url, cancel_url } = body

  if (provider !== 'STRIPE') return err('VALIDATION_ERROR', 'Only STRIPE provider supported', 400)
  if (!plan_code)    return err('VALIDATION_ERROR', 'plan_code required', 400)
  if (!success_url)  return err('VALIDATION_ERROR', 'success_url required', 400)
  if (!cancel_url)   return err('VALIDATION_ERROR', 'cancel_url required', 400)

  const priceId = PRICE_ID_MAP[plan_code?.toUpperCase()]
  if (!priceId) {
    return err('VALIDATION_ERROR', `No Stripe price configured for plan: ${plan_code}`, 400)
  }

  // 2. Get org_id for this user
  const db = createServiceRoleClient()
  const { data: membership } = await db
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .limit(1)
    .maybeSingle()

  if (!membership?.org_id) {
    return err('NOT_FOUND', 'No active workspace found for this user', 404)
  }

  const orgId = membership.org_id

  // 3. Get or create Stripe customer_id for this org
  //    We store it in subscription_status.stripe_customer_id (or fall back to metadata lookup)
  const { data: subStatus } = await db
    .from('subscription_status')
    .select('stripe_customer_id, tier, billing_status')
    .eq('org_id', orgId)
    .maybeSingle()

  if (subStatus?.tier === 'PRO' && subStatus?.billing_status === 'ACTIVE') {
    return err('CONFLICT', 'This workspace already has an active Pro subscription. Use the billing portal to manage it.', 409)
  }

  let stripe: Stripe
  try {
    stripe = getStripe()
  } catch {
    return err('CONFIGURATION_ERROR', 'Stripe is not configured on this server', 500)
  }

  // Fetch org name for Stripe customer metadata
  const { data: org } = await db
    .from('organizations')
    .select('name, contact_email')
    .eq('id', orgId)
    .maybeSingle()

  let customerId: string | null = subStatus?.stripe_customer_id ?? null

  if (!customerId) {
    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      email:    org?.contact_email ?? user.email ?? undefined,
      name:     org?.name ?? undefined,
      metadata: { org_id: orgId, user_id: user.id },
    })
    customerId = customer.id

    // Persist the customer ID
    await db.from('subscription_status').upsert(
      { org_id: orgId, stripe_customer_id: customerId },
      { onConflict: 'org_id', ignoreDuplicates: false },
    )
  }

  // 4. Create Checkout Session
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>
  try {
    session = await stripe.checkout.sessions.create({
      customer:            customerId,
      mode:                'subscription',
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      success_url,
      cancel_url,
      subscription_data: {
        metadata: { org_id: orgId },
      },
      metadata: { org_id: orgId, plan_code: plan_code.toUpperCase() },
      allow_promotion_codes: true,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Stripe checkout session creation failed'
    console.error('[billing/checkout] Stripe error:', msg)
    return err('STRIPE_ERROR', msg, 502)
  }

  if (!session.url) {
    return err('INTERNAL_ERROR', 'Stripe did not return a checkout URL', 500)
  }

  return NextResponse.json({ checkout_url: session.url })
}
