// apps/user/app/api/billing/portal/route.ts
//
// POST /api/billing/portal
// Creates a Stripe Customer Portal session so the user can manage
// their subscription (cancel, update card, download invoices, etc.)
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
  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHORIZED', 'Not authenticated', 401)

  const body = await req.json().catch(() => null)
  const return_url = body?.return_url

  if (!return_url) return err('VALIDATION_ERROR', 'return_url required', 400)

  // Get org_id
  const db = createServiceRoleClient()
  const { data: membership } = await db
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .limit(1)
    .maybeSingle()

  if (!membership?.org_id) return err('NOT_FOUND', 'No active workspace found', 404)

  // Get Stripe customer ID
  const { data: subStatus } = await db
    .from('subscription_status')
    .select('stripe_customer_id')
    .eq('org_id', membership.org_id)
    .maybeSingle()

  const customerId = subStatus?.stripe_customer_id
  if (!customerId) {
    return err('NOT_FOUND', 'No billing account found. Please upgrade first.', 404)
  }

  // Create portal session
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return err('CONFIGURATION_ERROR', 'Stripe is not configured', 500)

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-05-28.basil' })

  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url,
  })

  return NextResponse.json({ url: portalSession.url })
}
