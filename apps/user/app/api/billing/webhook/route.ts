// apps/user/app/api/billing/webhook/route.ts
//
// POST /api/billing/webhook
// Single Stripe webhook handler for ALL subscription events.
// Writes to the unified `subscriptions` table — one row per entity (USER or ORG).
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
//   STRIPE_WEBHOOK_SECRET       ← single secret for this endpoint
//   STRIPE_PRICE_PRO            ← RM18/month price ID
//   STRIPE_PRICE_PREMIUM        ← RM29/month price ID
//
// Metadata convention (set on Stripe Checkout Sessions):
//   entity_type: 'USER' | 'ORG'
//   entity_id:   <uuid>   (profiles.id  OR  organizations.id)

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { tierFromPriceId } from '@/lib/subscription'

export const runtime = 'nodejs'

// ── Stripe helpers ─────────────────────────────────────────────────────────────

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' })
}

type Db = ReturnType<typeof createServiceRoleClient>

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    console.error('[webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe    = getStripe()
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[webhook] ${event.type}`)
  const db = createServiceRoleClient()

  try {
    switch (event.type) {

      // ── Checkout completed → activate subscription ──────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const entityType   = session.metadata?.entity_type as 'USER' | 'ORG' | undefined
        const entityId     = session.metadata?.entity_id
        const customerId   = session.customer as string | null
        const subId        = session.subscription as string | null

        if (!entityType || !entityId) {
          // Legacy fallback: try old metadata keys
          const legacyUserId = session.metadata?.user_id
          const legacyOrgId  = session.metadata?.org_id
          const planType     = session.metadata?.plan_type

          if (legacyUserId && planType === 'PREMIUM_INDIVIDUAL') {
            await activateSubscription(db, stripe, 'USER', legacyUserId, customerId, subId)
          } else if (legacyOrgId && subId) {
            await activateSubscription(db, stripe, 'ORG', legacyOrgId, customerId, subId)
          } else {
            console.error('[webhook] checkout.session.completed: missing entity metadata')
          }
          break
        }

        await activateSubscription(db, stripe, entityType, entityId, customerId, subId)
        break
      }

      // ── Subscription updated (renewal, plan change, trial end) ─────────────
      case 'customer.subscription.updated': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const entityType = sub.metadata?.entity_type as 'USER' | 'ORG' | undefined
        const entityId   = sub.metadata?.entity_id
          ?? await resolveEntityByCustomer(db, customerId)

        if (!entityId) {
          console.warn('[webhook] subscription.updated: cannot resolve entity for customer', customerId)
          break
        }

        await upsertSubscription(db, entityType ?? 'ORG', entityId, sub, customerId)
        break
      }

      // ── Subscription cancelled / deleted ────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const entityType = sub.metadata?.entity_type as 'USER' | 'ORG' | undefined
        const entityId   = sub.metadata?.entity_id
          ?? await resolveEntityByCustomer(db, customerId)

        if (!entityId) {
          console.warn('[webhook] subscription.deleted: cannot resolve entity for customer', customerId)
          break
        }

        await db.from('subscriptions').upsert(
          {
            entity_type:            entityType ?? 'ORG',
            entity_id:              entityId,
            tier:                   'FREE',
            status:                 'CANCELLED',
            stripe_customer_id:     customerId,
            stripe_subscription_id: sub.id,
            cancelled_at:           new Date().toISOString(),
          },
          { onConflict: 'entity_type,entity_id', ignoreDuplicates: false },
        )

        console.log(`[webhook] Subscription cancelled for ${entityType}:${entityId}`)
        break
      }

      // ── Invoice paid → keep status ACTIVE, record invoice ──────────────────
      case 'invoice.paid': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const entityId   = await resolveEntityByCustomer(db, customerId)

        if (!entityId) {
          console.warn('[webhook] invoice.paid: cannot resolve entity for customer', customerId)
          break
        }

        // Update subscription period_end
        const periodEnd = invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString()
          : null

        await db.from('subscriptions')
          .update({ status: 'ACTIVE', current_period_end: periodEnd })
          .eq('stripe_customer_id', customerId)

        // Record in invoices table (best-effort)
        const orgId = await resolveOrgByCustomer(db, customerId)
        if (orgId) {
          await db.from('invoices').upsert(
            {
              org_id:           orgId,
              stripe_invoice_id: invoice.id,
              status:           'paid',
              amount_paid:      invoice.amount_paid / 100,
              currency:         invoice.currency.toUpperCase(),
              invoice_url:      invoice.hosted_invoice_url ?? null,
              invoice_pdf_url:  invoice.invoice_pdf        ?? null,
              paid_at:          new Date().toISOString(),
            },
            { onConflict: 'stripe_invoice_id', ignoreDuplicates: false },
          )
        }
        break
      }

      // ── Invoice payment failed → PAST_DUE ──────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await db.from('subscriptions')
          .update({ status: 'PAST_DUE' })
          .eq('stripe_customer_id', customerId)

        console.warn('[webhook] Payment failed for customer', customerId)
        break
      }

      default:
        console.log(`[webhook] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error('[webhook] Handler error:', err)
    // Return 200 so Stripe does not retry — the error is logged above
    return NextResponse.json({ received: true, warning: 'Handler error — check logs' })
  }

  return NextResponse.json({ received: true })
}

// ── Activation helper ──────────────────────────────────────────────────────────

async function activateSubscription(
  db:         Db,
  stripe:     Stripe,
  entityType: 'USER' | 'ORG',
  entityId:   string,
  customerId: string | null,
  subId:      string | null,
) {
  if (!subId) {
    console.error('[webhook] activateSubscription: missing subscription ID')
    return
  }

  const sub  = await stripe.subscriptions.retrieve(subId)
  await upsertSubscription(db, entityType, entityId, sub, customerId)

  // For PREMIUM USER activations: auto-create BUSINESS space
  if (entityType === 'USER') {
    const priceId = sub.items.data[0]?.price?.id
    const tier    = tierFromPriceId(priceId)
    if (tier === 'PREMIUM') {
      await db.from('spaces').upsert(
        { user_id: entityId, type: 'BUSINESS', name: 'My Business', is_default: false },
        { onConflict: 'user_id,type', ignoreDuplicates: true },
      )
      console.log(`[webhook] BUSINESS space created for user ${entityId}`)
    }
  }
}

// ── Upsert helper ──────────────────────────────────────────────────────────────

async function upsertSubscription(
  db:         Db,
  entityType: 'USER' | 'ORG',
  entityId:   string,
  sub:        Stripe.Subscription,
  customerId: string | null,
) {
  const item       = sub.items.data[0]
  const priceId    = item?.price?.id ?? null
  const tier       = tierFromPriceId(priceId)
  const seatCount  = item?.quantity ?? 1
  const periodEnd  = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null

  const status =
    sub.status === 'active'     ? 'ACTIVE'    :
    sub.status === 'trialing'   ? 'TRIALING'  :
    sub.status === 'past_due'   ? 'PAST_DUE'  :
    sub.status === 'canceled'   ? 'CANCELLED' : 'CANCELLED'

  await db.from('subscriptions').upsert(
    {
      entity_type:            entityType,
      entity_id:              entityId,
      tier,
      status,
      seat_count:             seatCount,
      stripe_customer_id:     customerId ?? undefined,
      stripe_subscription_id: sub.id,
      stripe_price_id:        priceId ?? undefined,
      current_period_end:     periodEnd,
      cancelled_at:           sub.status === 'canceled' ? new Date().toISOString() : null,
    },
    { onConflict: 'entity_type,entity_id', ignoreDuplicates: false },
  )

  console.log(`[webhook] Upserted ${entityType}:${entityId} → ${tier}/${status}`)
}

// ── Lookup helpers ─────────────────────────────────────────────────────────────

/** Find the entity_id (any type) by Stripe customer ID */
async function resolveEntityByCustomer(db: Db, customerId: string): Promise<string | null> {
  const { data } = await db
    .from('subscriptions')
    .select('entity_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.entity_id ?? null
}

/** Find an org_id specifically (for invoice recording in the invoices table) */
async function resolveOrgByCustomer(db: Db, customerId: string): Promise<string | null> {
  const { data } = await db
    .from('subscriptions')
    .select('entity_id')
    .eq('stripe_customer_id', customerId)
    .eq('entity_type', 'ORG')
    .maybeSingle()
  return data?.entity_id ?? null
}
