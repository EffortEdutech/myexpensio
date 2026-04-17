import type { BillingProvider, ResolvedPlanPrice } from '@/lib/billing/types'

type CheckoutProviderResult = {
  providerSessionId: string | null
  checkoutUrl: string
  raw: Record<string, unknown>
}

type CreateCheckoutParams = {
  provider: BillingProvider
  checkoutSessionId: string
  orgId: string
  orgName: string
  customerEmail: string
  customerName: string | null
  successUrl: string
  cancelUrl: string
  resolved: ResolvedPlanPrice
  referralCode?: string | null
}

function appendQueryParam(url: string, key: string, value: string) {
  const parsed = new URL(url)
  parsed.searchParams.set(key, value)
  return parsed.toString()
}

function toStripeMode(interval: string | null) {
  return interval === 'LIFETIME' ? 'payment' : 'subscription'
}

async function createStripeCheckout(params: CreateCheckoutParams): Promise<CheckoutProviderResult> {
  const secret = process.env.STRIPE_SECRET_KEY
  const priceId = params.resolved.price?.provider_price_id

  if (!secret || !priceId) {
    return {
      providerSessionId: `manual_stripe_${params.checkoutSessionId}`,
      checkoutUrl: appendQueryParam(params.successUrl, 'checkout_session_id', params.checkoutSessionId),
      raw: {
        mode: 'MANUAL_FALLBACK',
        reason: 'Missing STRIPE_SECRET_KEY or billing_prices.provider_price_id',
      },
    }
  }

  const body = new URLSearchParams()
  body.set('mode', toStripeMode(params.resolved.price?.interval ?? null))
  body.set('success_url', appendQueryParam(params.successUrl, 'checkout_session_id', params.checkoutSessionId))
  body.set('cancel_url', appendQueryParam(params.cancelUrl, 'checkout_session_id', params.checkoutSessionId))
  body.set('line_items[0][price]', priceId)
  body.set('line_items[0][quantity]', '1')
  body.set('client_reference_id', params.orgId)
  body.set('customer_email', params.customerEmail)
  body.set('metadata[org_id]', params.orgId)
  body.set('metadata[checkout_session_id]', params.checkoutSessionId)
  body.set('metadata[plan_code]', params.resolved.plan.code)
  if (params.referralCode) body.set('metadata[referral_code]', params.referralCode)

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(`Stripe checkout creation failed: ${(raw.error as Record<string, unknown> | undefined)?.message ?? response.statusText}`)
  }

  const checkoutUrl = typeof raw.url === 'string'
    ? raw.url
    : appendQueryParam(params.successUrl, 'checkout_session_id', params.checkoutSessionId)

  return {
    providerSessionId: typeof raw.id === 'string' ? raw.id : null,
    checkoutUrl,
    raw,
  }
}

async function createToyyibPayCheckout(params: CreateCheckoutParams): Promise<CheckoutProviderResult> {
  const secret = process.env.TOYYIBPAY_SECRET_KEY
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE
  const baseUrl = (process.env.TOYYIBPAY_BASE_URL ?? 'https://dev.toyyibpay.com').replace(/\/$/, '')
  const callbackUrl = process.env.TOYYIBPAY_CALLBACK_URL

  if (!secret || !categoryCode || !params.resolved.price) {
    return {
      providerSessionId: `manual_toyyib_${params.checkoutSessionId}`,
      checkoutUrl: appendQueryParam(params.successUrl, 'checkout_session_id', params.checkoutSessionId),
      raw: {
        mode: 'MANUAL_FALLBACK',
        reason: 'Missing TOYYIBPAY secrets/category or price config',
      },
    }
  }

  const body = new URLSearchParams()
  body.set('userSecretKey', secret)
  body.set('categoryCode', categoryCode)
  body.set('billName', `MyExpensio ${params.resolved.plan.name}`)
  body.set('billDescription', params.resolved.plan.description ?? `Subscription for ${params.orgName}`)
  body.set('billPriceSetting', '1')
  body.set('billPayorInfo', '1')
  body.set('billAmount', String(Math.round(Number(params.resolved.price.amount ?? 0) * 100)))
  body.set('billReturnUrl', appendQueryParam(params.successUrl, 'checkout_session_id', params.checkoutSessionId))
  if (callbackUrl) body.set('billCallbackUrl', callbackUrl)
  body.set('billExternalReferenceNo', params.checkoutSessionId)
  body.set('billTo', params.customerName ?? params.orgName)
  body.set('billEmail', params.customerEmail)
  body.set('billContentEmail', 'Thank you for subscribing to MyExpensio.')

  const response = await fetch(`${baseUrl}/index.php/api/createBill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const raw = (await response.json().catch(() => ([]))) as Array<Record<string, unknown>> | Record<string, unknown>
  const first = Array.isArray(raw) ? raw[0] ?? {} : raw
  const billCode = typeof first.BillCode === 'string' ? first.BillCode : null

  if (!response.ok || !billCode) {
    throw new Error('ToyyibPay bill creation failed.')
  }

  return {
    providerSessionId: billCode,
    checkoutUrl: `${baseUrl}/${billCode}`,
    raw: Array.isArray(raw) ? { rows: raw } : raw,
  }
}

export async function createProviderCheckoutSession(
  params: CreateCheckoutParams
): Promise<CheckoutProviderResult> {
  switch (params.provider) {
    case 'STRIPE':
      return createStripeCheckout(params)
    case 'TOYYIBPAY':
      return createToyyibPayCheckout(params)
    default:
      return {
        providerSessionId: `manual_${params.checkoutSessionId}`,
        checkoutUrl: appendQueryParam(params.successUrl, 'checkout_session_id', params.checkoutSessionId),
        raw: {
          mode: 'MANUAL',
        },
      }
  }
}
