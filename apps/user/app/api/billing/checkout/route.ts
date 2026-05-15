// apps/user/app/api/billing/checkout/route.ts
//
// POST /api/billing/checkout
// Creates a Stripe Checkout Session for PRO or PREMIUM subscriptions.
//
// Supports two entity types:
//   USER — individual user subscribing (Agent Subscriber upgrading themselves)
//   ORG  — workspace subscription (Console-initiated for Team / Agent workspace)
//
// Body:
//   {
//     tier:         'PRO' | 'PREMIUM'           required
//     entity_type:  'USER' | 'ORG'              optional, defaults to 'USER'
//     entity_id:    uuid                         optional, defaults to current user id
//     quantity:     number                       optional, default 1 (ORG = seat count)
//     success_url:  string                       optional, defaults to /upgrade/success
//     cancel_url:   string                       optional, defaults to /upgrade
//   }
//
// Returns: { checkout_url }
//
// Required env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_PRICE_PRO         ← RM18/month price ID
//   STRIPE_PRICE_PREMIUM     ← RM29/month price ID

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' })
}

const ORIGIN = process.env.NEXT_PUBLIC_USER_APP_URL ?? 'https://myexpensio-jade.vercel.app'

export async function POST(req: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required.', 400)

  const {
    tier        = 'PRO',
    entity_type = 'USER',
    entity_id   = user.id,
    quantity    = 1,
    cancel_url  = `${ORIGIN}/upgrade`,
  } = body

  // Include tier in success URL so the success page can tailor messaging
  const success_url: string = body.success_url ?? `${ORIGIN}/upgrade/success?tier=${tier}`

  if (!['PRO', 'PREMIUM'].includes(tier)) {
    return err('VALIDATION_ERROR', 'tier must be PRO or PREMIUM.', 400)
  }
  if (!['USER', 'ORG'].includes(entity_type)) {
    return err('VALIDATION_ERROR', 'entity_type must be USER or ORG.', 400)
  }

  // ── Resolve Stripe price ID ─────────────────────────────────────────────────
  const priceId =
    tier === 'PREMIUM'
      ? process.env.STRIPE_PRICE_PREMIUM
      : process.env.STRIPE_PRICE_PRO

  if (!priceId) {
    return err('CONFIG_ERROR', `STRIPE_PRICE_${tier} env var not set.`, 500)
  }

  // ── Guard: already subscribed? ──────────────────────────────────────────────
  const db = createServiceRoleClient()
  const { data: existing } = await db
    .from('subscriptions')
    .select('tier, status')
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id)
    .maybeSingle()

  if (existing?.status === 'ACTIVE' && existing.tier === tier) {
    return err('CONFLICT', `This ${entity_type === 'USER' ? 'account' : 'workspace'} already has an active ${tier} subscription. Use the billing portal to manage it.`, 409)
  }

  // ── Resolve or create Stripe customer ──────────────────────────────────────
  let stripe: Stripe
  try { stripe = getStripe() } catch {
    return err('CONFIG_ERROR', 'Stripe is not configured on this server.', 500)
  }

  // Look up existing customer ID from subscriptions table
  const { data: sub } = await db
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id)
    .maybeSingle()

  let customerId: string | null = sub?.stripe_customer_id ?? null

  if (!customerId) {
    // Determine customer email and name for Stripe
    let customerEmail = user.email ?? undefined
    let customerName: string | undefined

    if (entity_type === 'ORG') {
      const { data: org } = await db
        .from('organizations')
        .select('name')
        .eq('id', entity_id)
        .maybeSingle()
      customerName  = org?.name ?? undefined
    } else {
      const { data: profile } = await db
        .from('profiles')
        .select('display_name, email')
        .eq('id', entity_id)
        .maybeSingle()
      customerName  = profile?.display_name ?? undefined
      customerEmail = profile?.email ?? customerEmail
    }

    const customer = await stripe.customers.create({
      email:    customerEmail,
      name:     customerName,
      metadata: { entity_type, entity_id, created_by: user.id },
    })
    customerId = customer.id

    // Persist customer ID immediately (so it's available before webhook fires)
    await db.from('subscriptions').upsert(
      {
        entity_type,
        entity_id,
        tier:              'FREE',
        status:            'TRIALING',
        stripe_customer_id: customerId,
      },
      { onConflict: 'entity_type,entity_id', ignoreDuplicates: false },
    )
  }

  // ── Create Checkout Session ─────────────────────────────────────────────────
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      customer:            customerId,
      mode:                'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: Math.max(1, quantity) }],
      success_url,
      cancel_url,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { entity_type, entity_id },
      },
      metadata: { entity_type, entity_id, tier },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Stripe checkout creation failed'
    console.error('[billing/checkout] Stripe error:', msg)
    return err('STRIPE_ERROR', msg, 502)
  }

  if (!session.url) {
    return err('INTERNAL_ERROR', 'Stripe did not return a checkout URL.', 500)
  }

  return NextResponse.json({ checkout_url: session.url })
}
