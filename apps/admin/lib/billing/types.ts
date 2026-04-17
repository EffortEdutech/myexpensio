export type BillingProvider = 'STRIPE' | 'TOYYIBPAY' | 'MANUAL'
export type ProviderSubscriptionStatus =
  | 'INCOMPLETE'
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'UNPAID'
  | 'CANCELED'
  | 'EXPIRED'

export type SubscriptionSnapshotStatus =
  | 'INACTIVE'
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'UNPAID'
  | 'CANCELED'
  | 'EXPIRED'
