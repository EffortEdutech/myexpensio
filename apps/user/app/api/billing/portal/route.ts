/**
 * apps/user/app/api/billing/portal/route.ts
 *
 * Creates a Stripe Customer Portal session and returns the URL.
 * The browser redirects to this URL so users can:
 *   - Update payment method
 *   - Cancel subscription
 *   - Download invoices
 *   - View billing history
 *
 * POST /api/billing/portal
 * Body: { return_url?: string }
 * Response: { url: string }
 *
 * Requires:
 *   - STRIPE_SECRET_KEY in user app env
 *   - Stripe Customer Portal enabled in Stripe Dashboard
 *     → Settings → Customer Portal → Activate
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getActiveOrg } from '@/lib/org'
import { err } from '@/lib/billing/http'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db       = createServiceRoleClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    return err('CONFIGURATION_ERROR', 'Stripe is not configured.', 500)
  }

  // Get the body for return_url
  const body = await request.json().catch(() => ({})) as { return_url?: string }
  const returnUrl = body.return_url?.trim() || `${new URL(request.url).origin}/settings/billing`

  // Look up the Stripe customer ID for this org
  const { data: customer, error: customerError } = await db
    .from('billing_customers')
    .select('provider_customer_id')
    .eq('org_id', org.org_id)
    .eq('provider', 'STRIPE')
    .maybeSingle()

  if (customerError) {
    return err('SERVER_ERROR', customerError.message, 500)
  }

  if (!customer?.provider_customer_id) {
    return err(
      'NO_CUSTOMER',
      'No Stripe customer record found for this organisation. Complete a subscription first.',
      404
    )
  }

  // Create portal session via Stripe API (no SDK needed)
  const stripeBody = new URLSearchParams()
  stripeBody.set('customer', customer.provider_customer_id)
  stripeBody.set('return_url', returnUrl)

  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: stripeBody,
  })

  const raw = await response.json().catch(() => ({})) as Record<string, unknown>

  if (!response.ok) {
    const stripeErr = (raw.error as Record<string, unknown> | undefined)?.message
    if (typeof stripeErr === 'string' && stripeErr.includes('portal')) {
      return err(
        'PORTAL_NOT_ACTIVATED',
        'The Stripe Customer Portal is not yet activated. ' +
          'Go to Stripe Dashboard → Settings → Customer Portal → Activate.',
        503
      )
    }
    return err('STRIPE_ERROR', String(stripeErr ?? 'Portal session creation failed.'), 502)
  }

  const url = typeof raw.url === 'string' ? raw.url : null
  if (!url) {
    return err('STRIPE_ERROR', 'No portal URL returned from Stripe.', 502)
  }

  return NextResponse.json({ url })
}
