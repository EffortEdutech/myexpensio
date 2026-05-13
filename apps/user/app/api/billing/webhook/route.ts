// apps/user/app/api/billing/webhook/route.ts
//
// POST /api/billing/webhook
// Stripe webhook handler — updates subscription_status in Supabase
// based on real-time Stripe events.
//
// Configure in Stripe Dashboard:
//   Endpoint URL: https://<your-user-app>/api/billing/webhook
//   Events to send:
//     - checkout.session.completed
//     - customer.subscription.updated
//     - customer.subscription.deleted
//     - invoice.paid
//     - invoice.payment_failed
//
// Required env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET   (from Stripe Dashboard → Webhooks → Signing secret)

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase/admin'

// Next.js must read the raw body for Stripe signature verification
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const stripeKey    = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    console.error('[billing/webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })

  // Read raw body for signature verification
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[billing/webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[billing/webhook] Received event: ${event.type}`)

  const db = createServiceRoleClient()

  try {
    switch (event.type) {

      // ── Checkout completed → activate subscription ────────────────────────
      case 'checkout.session.completed': {
        const session        = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const orgId          = session.metadata?.org_id
        const userId         = session.metadata?.user_id
        const planType       = session.metadata?.plan_type
        const subscriptionId = session.subscription as string | null
        const customerId     = session.customer as string | null

        // ── Branch A: Individual Premium activation (no org) ──────────────
        if (userId && planType === 'PREMIUM_INDIVIDUAL') {
          await activatePremiumIndividual(db, userId, customerId, subscriptionId)
          break
        }

        // ── Branch B: Org-level PRO subscription (existing path) ──────────
        if (!orgId) {
          console.error('[billing/webhook] checkout.session.completed missing org_id and user_id metadata')
          break
        }

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          await upsertSubscription(db, orgId, sub, customerId)
        }
        break
      }

      // ── Subscription updated (plan change, renewal, cancel scheduled) ─────
      case 'customer.subscription.updated': {
        const sub        = event.data.object as Stripe.Subscription
        const orgId      = sub.metadata?.org_id
        const customerId = sub.customer as string

        if (!orgId) {
          // Fallback: look up org by Stripe customer ID
          const resolved = await resolveOrgByCustomer(db, customerId)
          if (resolved) {
            await upsertSubscription(db, resolved, sub, customerId)
          } else {
            console.warn('[billing/webhook] Could not resolve org for customer:', customerId)
          }
          break
        }

        await upsertSubscription(db, orgId, sub, customerId)
        break
      }

      // ── Subscription cancelled / expired ──────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub        = event.data.object as Stripe.Subscription
        const orgId      = sub.metadata?.org_id
        const customerId = sub.customer as string

        const resolvedOrg = orgId ?? await resolveOrgByCustomer(db, customerId)
        if (!resolvedOrg) {
          console.warn('[billing/webhook] Could not resolve org for deleted subscription')
          break
        }

        await db.from('subscription_status').upsert(
          {
            org_id:              resolvedOrg,
            tier:                'FREE',
            billing_status:      'INACTIVE',
            provider:            'STRIPE',
            stripe_customer_id:  customerId,
            stripe_subscription_id: sub.id,
            period_start:        null,
            period_end:          null,
            cancel_at_period_end: false,
            grace_until:         null,
            last_synced_at:      new Date().toISOString(),
          },
          { onConflict: 'org_id', ignoreDuplicates: false },
        )

        await db.from('audit_logs').insert({
          org_id:        resolvedOrg,
          actor_user_id: null,
          entity_type:   'subscription',
          entity_id:     sub.id,
          action:        'SUBSCRIPTION_CANCELLED',
          metadata:      { stripe_event: event.type, reason: sub.cancellation_details?.reason },
        })
        break
      }

      // ── Invoice paid → record payment + update last_invoice_at ───────────
      case 'invoice.paid': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const orgId      = await resolveOrgByCustomer(db, customerId)

        if (!orgId) {
          console.warn('[billing/webhook] Could not resolve org for paid invoice:', invoice.id)
          break
        }

        const now = new Date().toISOString()
        await db.from('subscription_status')
          .update({ last_invoice_at: now, billing_status: 'ACTIVE', last_synced_at: now })
          .eq('org_id', orgId)

        // Record in invoices table if it exists
        await db.from('invoices').upsert(
          {
            org_id:          orgId,
            stripe_invoice_id: invoice.id,
            status:          'paid',
            amount_paid:     invoice.amount_paid / 100,
            currency:        invoice.currency.toUpperCase(),
            invoice_url:     invoice.hosted_invoice_url ?? null,
            invoice_pdf_url: invoice.invoice_pdf ?? null,
            paid_at:         now,
          },
          { onConflict: 'stripe_invoice_id', ignoreDuplicates: false },
        )
        break
      }

      // ── Invoice payment failed → set billing_status = PAST_DUE ───────────
      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const orgId      = await resolveOrgByCustomer(db, customerId)

        if (!orgId) break

        await db.from('subscription_status')
          .update({ billing_status: 'PAST_DUE', last_synced_at: new Date().toISOString() })
          .eq('org_id', orgId)

        await db.from('audit_logs').insert({
          org_id:        orgId,
          actor_user_id: null,
          entity_type:   'subscription',
          entity_id:     invoice.id,
          action:        'INVOICE_PAYMENT_FAILED',
          metadata:      { stripe_event: event.type, invoice_id: invoice.id },
        })
        break
      }

      default:
        // Unhandled event — acknowledge it so Stripe doesn't retry
        console.log(`[billing/webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error('[billing/webhook] Handler error:', err)
    // Return 200 to prevent Stripe from retrying — log the error instead
    return NextResponse.json({ received: true, warning: 'Handler error — check logs' })
  }

  return NextResponse.json({ received: true })
}

// ── Helpers ────────────────────────────────────────────────────────────────────

type DbClient = ReturnType<typeof createServiceRoleClient>

async function upsertSubscription(
  db: DbClient,
  orgId: string,
  sub: Stripe.Subscription,
  customerId: string | null,
) {
  const item       = sub.items.data[0]
  const isActive   = ['active', 'trialing'].includes(sub.status)
  const tier       = isActive ? 'PRO' : 'FREE'
  const periodEnd  = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start * 1000).toISOString()
    : null

  // Infer plan_code from price nickname or interval
  const interval   = item?.price?.recurring?.interval
  const planCode   = interval === 'year' ? 'PRO_YEARLY' : 'PRO_MONTHLY'

  const billingStatus =
    sub.status === 'active'   ? 'ACTIVE'   :
    sub.status === 'trialing' ? 'ACTIVE'   :
    sub.status === 'past_due' ? 'PAST_DUE' :
    sub.status === 'canceled' ? 'INACTIVE' : 'INACTIVE'

  await db.from('subscription_status').upsert(
    {
      org_id:                 orgId,
      tier,
      billing_status:         billingStatus,
      provider:               'STRIPE',
      plan_code:              planCode,
      stripe_customer_id:     customerId ?? undefined,
      stripe_subscription_id: sub.id,
      period_start:           periodStart,
      period_end:             periodEnd,
      cancel_at_period_end:   sub.cancel_at_period_end ?? false,
      grace_until:            null,
      last_synced_at:         new Date().toISOString(),
    },
    { onConflict: 'org_id', ignoreDuplicates: false },
  )

  await db.from('audit_logs').insert({
    org_id:        orgId,
    actor_user_id: null,
    entity_type:   'subscription',
    entity_id:     sub.id,
    action:        tier === 'PRO' ? 'SUBSCRIPTION_ACTIVATED' : 'SUBSCRIPTION_DEACTIVATED',
    metadata:      {
      stripe_status: sub.status,
      plan_code:     planCode,
      period_end:    periodEnd,
    },
  })
}

async function resolveOrgByCustomer(db: DbClient, customerId: string): Promise<string | null> {
  const { data } = await db
    .from('subscription_status')
    .select('org_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.org_id ?? null
}

// ── Individual Premium activation ─────────────────────────────────────────────
// Called when checkout.session.completed carries user_id + plan_type=PREMIUM_INDIVIDUAL
// instead of org_id. Updates profiles.subscription_plan and auto-creates BUSINESS space.

async function activatePremiumIndividual(
  db: DbClient,
  userId: string,
  customerId: string | null,
  subscriptionId: string | null,
) {
  // 1. Mark the user as Premium in their profile
  //    Only subscription_plan is guaranteed by our migration.
  //    stripe_customer_id / stripe_subscription_id are stored in audit_logs.
  const { error: profileErr } = await db
    .from('profiles')
    .update({ subscription_plan: 'PREMIUM' })
    .eq('id', userId)

  if (profileErr) {
    console.error('[billing/webhook] Failed to update profile for Premium:', profileErr.message)
    // Don't throw — still try to create the space
  }

  // 2. Auto-create BUSINESS space (idempotent — ignoreDuplicates: true)
  const { error: spaceErr } = await db
    .from('spaces')
    .upsert(
      { user_id: userId, type: 'BUSINESS', name: 'My Business', is_default: false },
      { onConflict: 'user_id,type', ignoreDuplicates: true },
    )

  if (spaceErr) {
    console.error('[billing/webhook] Failed to create BUSINESS space:', spaceErr.message)
  }

  // 3. Audit log (best-effort — table may not have a user-scoped entry yet)
  await db.from('audit_logs').insert({
    org_id:        null,
    actor_user_id: userId,
    entity_type:   'subscription',
    entity_id:     subscriptionId ?? userId,
    action:        'PREMIUM_INDIVIDUAL_ACTIVATED',
    metadata:      {
      stripe_customer_id:     customerId,
      stripe_subscription_id: subscriptionId,
    },
  }).then(() => {}).catch(() => {}) // non-fatal

  console.log(`[billing/webhook] Premium activated for user ${userId}`)
}
