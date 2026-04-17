export type BillingProvider = 'STRIPE' | 'TOYYIBPAY' | 'MANUAL'
export type CheckoutSessionStatus = 'CREATED' | 'OPEN' | 'COMPLETED' | 'EXPIRED' | 'FAILED' | 'CANCELED'
export type BillingStatus =
  | 'INACTIVE'
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'UNPAID'
  | 'CANCELED'
  | 'EXPIRED'

export type CheckoutCreateBody = {
  plan_code?: string
  provider?: BillingProvider | string
  success_url?: string
  cancel_url?: string
  agent_code?: string
  metadata?: Record<string, unknown>
}

export type ReferralTrackBody = {
  code?: string
  landing_path?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

export type ResolvedPlanPrice = {
  plan: {
    id: string
    code: string
    name: string
    tier: 'FREE' | 'PRO' | string
    interval: 'MONTH' | 'YEAR' | 'LIFETIME' | null
    description: string | null
    entitlements: Record<string, unknown> | null
  }
  price: null | {
    id: string
    provider: BillingProvider
    provider_product_id: string | null
    provider_price_id: string | null
    currency: string
    amount: number
    interval: 'MONTH' | 'YEAR' | 'LIFETIME' | null
    metadata: Record<string, unknown> | null
  }
}
