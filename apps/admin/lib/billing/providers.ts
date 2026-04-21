import { createHmac, timingSafeEqual } from 'crypto'

type DbClient = any
type BillingProvider = 'STRIPE' | 'TOYYIBPAY'

type EnsureBillingCustomerInput = {
  orgId: string
  provider: BillingProvider
  providerCustomerId: string
  customerEmail?: string | null
  customerName?: string | null
}

type PaidInvoiceCommissionInput = {
  orgId: string
  invoiceId: string
  subscriptionId?: string | null
  amountPaid: number
  currency: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null
}

function safeCompareHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex')
  const right = Buffer.from(b, 'hex')

  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function unixToIso(value: number | null | undefined): string | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return new Date(n * 1000).toISOString()
}

export function verifyStripeSignature(
  rawBody: string,
  signature: string | null,
  webhookSecret: string | undefined
): boolean {
  if (!signature || !webhookSecret) return false

  const parts = signature.split(',')
  let timestamp: string | null = null
  let v1: string | null = null

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't' && value) timestamp = value
    if (key === 'v1' && value) v1 = value
  }

  if (!timestamp || !v1) return false

  const signedPayload = `${timestamp}.${rawBody}`
  const expected = createHmac('sha256', webhookSecret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  return safeCompareHex(expected, v1)
}

export async function resolveOrgIdFromProviderObject(
  db: DbClient,
  provider: BillingProvider,
  object: Record<string, unknown>
): Promise<string | null> {
  const metadata = asRecord(object.metadata)

  const directOrgId =
    asString(metadata.org_id) ??
    asString(metadata.orgId) ??
    asString(object.org_id)

  if (directOrgId) return directOrgId

  const externalRef =
    asString(object.client_reference_id) ??
    asString(object.order_id) ??
    asString(object.billExternalReferenceNo) ??
    asString(object.external_reference_no)

  if (externalRef) {
    const { data } = await db
      .from('billing_checkout_sessions')
      .select('org_id')
      .eq('id', externalRef)
      .maybeSingle()

    if (data?.org_id) return String(data.org_id)
  }

  const providerSessionId =
    asString(object.id) ??
    asString(object.billcode) ??
    asString(object.billCode)

  if (providerSessionId) {
    const { data } = await db
      .from('billing_checkout_sessions')
      .select('org_id')
      .eq('provider', provider)
      .eq('provider_session_id', providerSessionId)
      .maybeSingle()

    if (data?.org_id) return String(data.org_id)
  }

  const providerCustomerId =
    asString(object.customer) ??
    asString(object.email) ??
    asString(object.bill_email)

  if (providerCustomerId) {
    const { data } = await db
      .from('billing_customers')
      .select('org_id')
      .eq('provider', provider)
      .eq('provider_customer_id', providerCustomerId)
      .maybeSingle()

    if (data?.org_id) return String(data.org_id)
  }

  const providerSubscriptionId = asString(object.subscription)

  if (providerSubscriptionId) {
    const { data } = await db
      .from('billing_subscriptions')
      .select('org_id')
      .eq('provider', provider)
      .eq('provider_subscription_id', providerSubscriptionId)
      .maybeSingle()

    if (data?.org_id) return String(data.org_id)
  }

  return null
}

export async function ensureBillingCustomer(
  db: DbClient,
  input: EnsureBillingCustomerInput
): Promise<{ id: string }> {
  const email = input.customerEmail?.trim().toLowerCase() ?? null
  const name = input.customerName?.trim() ?? null

  const { data: existing } = await db
    .from('billing_customers')
    .select('id, metadata')
    .eq('provider', input.provider)
    .eq('provider_customer_id', input.providerCustomerId)
    .maybeSingle()

  if (existing?.id) {
    const { data: updated, error: updateError } = await db
      .from('billing_customers')
      .update({
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
        metadata: {
          ...asRecord(existing.metadata),
          last_synced_at: new Date().toISOString(),
        },
      })
      .eq('id', existing.id)
      .select('id')
      .single()

    if (updateError) throw new Error(updateError.message)
    return { id: String(updated.id) }
  }

  const { data: inserted, error } = await db
    .from('billing_customers')
    .upsert(
      {
        org_id: input.orgId,
        provider: input.provider,
        provider_customer_id: input.providerCustomerId,
        email,
        name,
        metadata: {
          created_via: 'billing.providers.ensureBillingCustomer',
        },
      },
      { onConflict: 'provider,provider_customer_id' }
    )
    .select('id')
    .single()

  if (error) {
    const { data: fallback, error: fallbackError } = await db
      .from('billing_customers')
      .select('id')
      .eq('provider', input.provider)
      .eq('provider_customer_id', input.providerCustomerId)
      .maybeSingle()

    if (fallback?.id) return { id: String(fallback.id) }

    throw new Error(fallbackError?.message ?? error.message)
  }

  return { id: String(inserted.id) }
}

export async function markCheckoutSessionStatus(
  db: DbClient,
  provider: BillingProvider,
  providerSessionId: string,
  status: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { data: existing } = await db
    .from('billing_checkout_sessions')
    .select('id, metadata')
    .eq('provider', provider)
    .eq('provider_session_id', providerSessionId)
    .maybeSingle()

  if (!existing?.id) return

  const nextMetadata = {
    ...asRecord(existing.metadata),
    ...(metadata ?? {}),
  }

  const { error } = await db
    .from('billing_checkout_sessions')
    .update({
      status,
      metadata: nextMetadata,
    })
    .eq('id', existing.id)

  if (error) throw new Error(error.message)
}

export async function resolvePlanByProviderPrice(
  db: DbClient,
  provider: BillingProvider,
  providerPriceId: string | null
): Promise<{
  plan: Record<string, unknown> | null
  price: Record<string, unknown> | null
}> {
  if (!providerPriceId) {
    return { plan: null, price: null }
  }

  const { data: price } = await db
    .from('billing_prices')
    .select('id, plan_id, provider, provider_price_id, amount, currency, interval')
    .eq('provider', provider)
    .eq('provider_price_id', providerPriceId)
    .maybeSingle()

  if (!price) {
    return { plan: null, price: null }
  }

  let plan: Record<string, unknown> | null = null

  if (price.plan_id) {
    const { data: planRow } = await db
      .from('billing_plans')
      .select('id, code, tier, interval')
      .eq('id', price.plan_id)
      .maybeSingle()

    plan = planRow ?? null
  }

  return { plan, price }
}

export async function maybeCreateCommissionForPaidInvoice(
  _db: DbClient,
  _input: PaidInvoiceCommissionInput
): Promise<void> {
  // Compatibility shim only.
  // The routes can build and webhook processing can continue,
  // but commission creation logic still needs the final schema/business rules.
}