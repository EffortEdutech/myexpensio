/**
 * apps/admin/lib/billing/providers.ts
 *
 * Billing provider utilities for myexpensio.
 *
 * ─── Commission model (org-as-partner, final) ───────────────────────────────
 *
 * A "partner" is an organisation with is_partner = true.
 * Partners have members (users) who use myexpensio under the partner org.
 * The partner org pays the Pro subscription.
 * When a partner org's invoice is paid, myexpensio records a commission
 * entry — the platform owes a revenue share back to that partner org.
 *
 * commission_ledger semantics:
 *   org_id         = the partner org that paid (the subscription payer)
 *   partner_org_id = same org (the one that earns the commission)
 *
 * No agents table. No referral_attributions. Just:
 *   organizations (is_partner = true) → invoice paid → commission_ledger
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

// ---------------------------------------------------------------------------
// Stripe signature verification
// ---------------------------------------------------------------------------

/**
 * Verifies the Stripe webhook HMAC signature using Node crypto.
 * No Stripe SDK required.
 * When webhookSecret is undefined (local dev), verification is skipped.
 * Always set STRIPE_WEBHOOK_SECRET in production.
 */
export function verifyStripeSignature(
  payload: string,
  stripeSignature: string | null,
  webhookSecret?: string
): boolean {
  if (!webhookSecret) return true
  if (!stripeSignature) return false

  const parts = stripeSignature.split(',')
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2)
  const v1 = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3))

  if (!timestamp || v1.length === 0) return false

  const signed = `${timestamp}.${payload}`
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(signed, 'utf8')
    .digest('hex')

  return v1.some((c) => safeEqual(c, expected))
}

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

/** Converts a Unix timestamp (seconds) to ISO 8601. Returns null for invalid. */
export function unixToIso(input: number | null | undefined): string | null {
  if (!input) return null
  const ms = Number(input) * 1000
  const date = new Date(ms)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// ---------------------------------------------------------------------------
// Billing customer management
// ---------------------------------------------------------------------------

/** Upserts a billing_customers record. Idempotent — safe on every webhook. */
export async function ensureBillingCustomer(
  db: SupabaseClient,
  params: {
    orgId: string
    provider: 'STRIPE' | 'TOYYIBPAY' | 'MANUAL'
    providerCustomerId: string
    customerEmail?: string | null
    customerName?: string | null
  }
) {
  const { data: existing, error: existingError } = await db
    .from('billing_customers')
    .select('id, org_id, provider, provider_customer_id')
    .eq('org_id', params.orgId)
    .eq('provider', params.provider)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)
  if (existing) return existing

  const { data: inserted, error: insertError } = await db
    .from('billing_customers')
    .insert({
      org_id:               params.orgId,
      provider:             params.provider,
      provider_customer_id: params.providerCustomerId,
      customer_email:       params.customerEmail ?? null,
      customer_name:        params.customerName  ?? null,
      status:               'ACTIVE',
    })
    .select('id, org_id, provider, provider_customer_id')
    .single()

  if (insertError) throw new Error(insertError.message)
  return inserted
}

// ---------------------------------------------------------------------------
// Plan resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the internal plan + price for a provider price ID.
 * Returns { plan: null, price: null } when no mapping exists.
 */
export async function resolvePlanByProviderPrice(
  db: SupabaseClient,
  provider: 'STRIPE' | 'TOYYIBPAY' | 'MANUAL',
  providerPriceId: string | null | undefined
) {
  if (!providerPriceId) return { plan: null, price: null }

  const { data: price, error: priceError } = await db
    .from('billing_prices')
    .select('id, plan_id, provider_price_id, amount, currency, interval')
    .eq('provider', provider)
    .eq('provider_price_id', providerPriceId)
    .maybeSingle()

  if (priceError) throw new Error(priceError.message)
  if (!price) return { plan: null, price: null }

  const { data: plan, error: planError } = await db
    .from('billing_plans')
    .select('id, code, name, tier, interval')
    .eq('id', price.plan_id)
    .maybeSingle()

  if (planError) throw new Error(planError.message)
  return { plan: plan ?? null, price }
}

// ---------------------------------------------------------------------------
// Org resolution from provider webhook objects
// ---------------------------------------------------------------------------

/**
 * Resolves an org_id from a raw Stripe / ToyyibPay webhook object.
 * Tries: metadata.org_id → client_reference_id → checkout session lookups
 * → billing_customers → billing_subscriptions.
 */
export async function resolveOrgIdFromProviderObject(
  db: SupabaseClient,
  provider: 'STRIPE' | 'TOYYIBPAY',
  object: Record<string, unknown>
): Promise<string | null> {
  const metadata = (object.metadata ?? {}) as Record<string, unknown>

  const metadataOrgId = typeof metadata.org_id === 'string' ? metadata.org_id : null
  if (metadataOrgId) return metadataOrgId

  const clientReferenceId = typeof object.client_reference_id === 'string' ? object.client_reference_id : null
  if (clientReferenceId) return clientReferenceId

  const checkoutSessionId = typeof metadata.checkout_session_id === 'string' ? metadata.checkout_session_id : null
  if (checkoutSessionId) {
    const { data } = await db.from('billing_checkout_sessions').select('org_id').eq('id', checkoutSessionId).maybeSingle()
    if (data?.org_id) return data.org_id
  }

  const providerSessionId = typeof object.id === 'string' ? object.id : null
  if (providerSessionId) {
    const { data } = await db.from('billing_checkout_sessions').select('org_id').eq('provider', provider).eq('provider_session_id', providerSessionId).maybeSingle()
    if (data?.org_id) return data.org_id
  }

  const providerCustomerId = typeof object.customer === 'string' ? object.customer : null
  if (providerCustomerId) {
    const { data } = await db.from('billing_customers').select('org_id').eq('provider', provider).eq('provider_customer_id', providerCustomerId).maybeSingle()
    if (data?.org_id) return data.org_id
  }

  const providerSubscriptionId = typeof object.subscription === 'string'
    ? object.subscription
    : typeof object.id === 'string' && String(object.object ?? '').includes('subscription') ? object.id : null
  if (providerSubscriptionId) {
    const { data } = await db.from('billing_subscriptions').select('org_id').eq('provider', provider).eq('provider_subscription_id', providerSubscriptionId).maybeSingle()
    if (data?.org_id) return data.org_id
  }

  return null
}

// ---------------------------------------------------------------------------
// Checkout session status management
// ---------------------------------------------------------------------------

/** Marks a checkout session as COMPLETED/FAILED/CANCELED/EXPIRED. */
export async function markCheckoutSessionStatus(
  db: SupabaseClient,
  provider: 'STRIPE' | 'TOYYIBPAY' | 'MANUAL',
  providerSessionId: string,
  status: 'COMPLETED' | 'FAILED' | 'CANCELED' | 'EXPIRED',
  patchMetadata?: Record<string, unknown>
) {
  const { data: existing, error: existingError } = await db
    .from('billing_checkout_sessions')
    .select('id, metadata')
    .eq('provider', provider)
    .eq('provider_session_id', providerSessionId)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)
  if (!existing) return null

  const { data: updated, error: updateError } = await db
    .from('billing_checkout_sessions')
    .update({
      status,
      completed_at: status === 'COMPLETED' ? new Date().toISOString() : null,
      metadata: {
        ...((existing.metadata as Record<string, unknown> | null) ?? {}),
        ...(patchMetadata ?? {}),
      },
    })
    .eq('id', existing.id)
    .select('id, org_id, user_id, plan_id, price_id, provider, provider_session_id, status, metadata')
    .single()

  if (updateError) throw new Error(updateError.message)
  return updated
}

// ---------------------------------------------------------------------------
// Commission engine — final org-as-partner model
// ---------------------------------------------------------------------------

/**
 * Creates a REVENUE_SHARE commission ledger entry when a partner org's
 * invoice is paid.
 *
 * Call once per paid invoice from the Stripe / ToyyibPay webhook handler.
 * Fully idempotent: duplicate calls for the same invoice return the
 * existing ledger row without creating a duplicate.
 *
 * ── How it works ──────────────────────────────────────────────────────────
 *
 * 1. Load the paying org from `organizations`.
 * 2. If the org has is_partner = false → return null (no commission).
 * 3. If partner_status is SUSPENDED or TERMINATED → return null.
 * 4. Resolve commission plan: org.commission_plan_id → fallback DEFAULT_DIRECT_15.
 * 5. Calculate: commission_amount = amountPaid × (direct_rate_pct / 100).
 * 6. Insert commission_ledger row.
 *    org_id         = the partner org that paid
 *    partner_org_id = same (the org that earns the commission back)
 *
 * ── Status lifecycle ──────────────────────────────────────────────────────
 *
 * New entries are PENDING. Admin reviews via Commission Ledger screen.
 * Approved entries are batched into Payout Runs and paid out.
 */
export async function maybeCreateCommissionForPaidInvoice(
  db: SupabaseClient,
  params: {
    orgId:          string
    invoiceId:      string
    subscriptionId: string | null
    amountPaid:     number
    currency:       string
  }
): Promise<{ id: string; commission_amount: number; status: string } | null> {

  // 1. Load the paying org — check if it is a partner.
  const { data: org, error: orgError } = await db
    .from('organizations')
    .select('id, name, is_partner, partner_status, commission_plan_id')
    .eq('id', params.orgId)
    .maybeSingle()

  if (orgError) throw new Error(`org lookup: ${orgError.message}`)

  // Not a partner → nothing to do. This is the common case.
  if (!org || !org.is_partner) return null

  // Partner is not active → skip.
  if (org.partner_status === 'SUSPENDED' || org.partner_status === 'TERMINATED') {
    console.warn(
      `[commission] Partner org ${org.id} (${org.name}) is ${org.partner_status}. ` +
      `Skipping commission for invoice ${params.invoiceId}.`
    )
    return null
  }

  // 2. Idempotency: check if a ledger entry already exists for this invoice.
  const { data: existing, error: existingError } = await db
    .from('commission_ledger')
    .select('id, commission_amount, status')
    .eq('billing_invoice_id', params.invoiceId)
    .eq('partner_org_id', params.orgId)
    .eq('entry_type', 'REVENUE_SHARE')
    .maybeSingle()

  if (existingError) throw new Error(`idempotency check: ${existingError.message}`)
  if (existing) {
    console.info(
      `[commission] Entry already exists for invoice ${params.invoiceId} — skipping.`
    )
    return existing
  }

  // 3. Resolve commission plan.
  const { data: plan, error: planError } = org.commission_plan_id
    ? await db.from('commission_plans').select('id, code, rules').eq('id', org.commission_plan_id).maybeSingle()
    : await db.from('commission_plans').select('id, code, rules').eq('code', 'DEFAULT_DIRECT_15').maybeSingle()

  if (planError) throw new Error(`commission plan lookup: ${planError.message}`)
  if (!plan) {
    console.error(
      `[commission] No commission plan found for org ${org.id}. ` +
      `Ensure DEFAULT_DIRECT_15 seed has been applied.`
    )
    return null
  }

  // 4. Calculate commission amount.
  const rules = (plan.rules as Record<string, unknown> | null) ?? {}
  const ratePct = Number(rules.direct_rate_pct ?? rules.directRatePct ?? 15)
  const commissionAmount = Number(((params.amountPaid * ratePct) / 100).toFixed(2))

  // 5. Insert ledger entry.
  const { data: line, error: insertError } = await db
    .from('commission_ledger')
    .insert({
      org_id:                   params.orgId,      // partner org that paid
      partner_org_id:           params.orgId,      // same — earns commission back
      agent_id:                 null,              // agents table not used
      user_id:                  null,
      referral_attribution_id:  null,
      billing_invoice_id:       params.invoiceId,
      billing_subscription_id:  params.subscriptionId,
      commission_plan_id:       plan.id,
      entry_type:               'REVENUE_SHARE',
      level:                    1,
      basis_amount:             params.amountPaid,
      rate_pct:                 ratePct,
      commission_amount:        commissionAmount,
      currency:                 params.currency,
      status:                   'PENDING',
      eligible_at:              new Date().toISOString(),
      metadata: {
        trigger:              'INVOICE_PAID',
        commission_plan_code: plan.code,
        partner_org_name:     org.name,
      },
    })
    .select('id, commission_amount, status')
    .single()

  if (insertError) throw new Error(`commission_ledger insert: ${insertError.message}`)

  console.info(
    `[commission] Created ${line.id} — ` +
    `partner ${org.name} (${org.id}), ` +
    `${params.currency} ${commissionAmount} (${ratePct}% of ${params.amountPaid}).`
  )

  return line
}
