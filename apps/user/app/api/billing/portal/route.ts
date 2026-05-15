// apps/user/app/api/billing/portal/route.ts
//
// POST /api/billing/portal
// Creates a Stripe Customer Portal session so the user can manage
// their subscription (cancel, update card, download invoices, etc.)
//
// Looks up Stripe customer ID from the unified subscriptions table:
//   1. Check USER subscription (individual plan)
//   2. Fall back to ORG subscription (team workspace plan)
//
// Body: { return_url }

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHORIZED', 'Not authenticated', 401)

  const body = await req.json().catch(() => null)
  const return_url = body?.return_url
  if (!return_url) return err('VALIDATION_ERROR', 'return_url required', 400)

  const db = createServiceRoleClient()

  // Try USER subscription first (individual Stripe customer)
  const { data: userSub } = await db
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('entity_type', 'USER')
    .eq('entity_id', user.id)
    .maybeSingle()

  let customerId = userSub?.stripe_customer_id ?? null

  // Fall back to ORG subscription (team workspace)
  if (!customerId) {
    const { data: membership } = await db
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .limit(1)
      .maybeSingle()

    if (membership?.org_id) {
      const { data: orgSub } = await db
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('entity_type', 'ORG')
        .eq('entity_id', membership.org_id)
        .maybeSingle()

      customerId = orgSub?.stripe_customer_id ?? null
    }
  }

  if (!customerId) {
    return err('NOT_FOUND', 'No billing account found. Please upgrade first.', 404)
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return err('CONFIGURATION_ERROR', 'Stripe is not configured', 500)

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })

  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url,
  })

  return NextResponse.json({ portal_url: portalSession.url })
}
