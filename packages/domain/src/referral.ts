// packages/domain/src/referral.ts
//
// Agent/Partner referral and commission system.
//
// Agent/Partner workspace model (LOCKED):
//   - Agent recruits INDIVIDUAL USERS to subscribe (not companies)
//   - Each user registers under the Agent's workspace
//   - Users use MyExpensio personally: submit claims → export →
//     submit to their OWN EXTERNAL COMPANY they work for
//   - Agent earns commission from each individual user's subscription fee
//   - More users recruited = more commission (Agent's incentive)
//
// There is NO relationship between Agent and Team workspaces.
// Referral tracking is purely for commission calculation.
//
// NEW FILE — 24 Apr 2026

// ── Referral status ───────────────────────────────────────────────────────────

export const REFERRAL_STATUSES = ['INVITED', 'SIGNED_UP', 'SUBSCRIBED', 'CHURNED'] as const
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number]

export function isReferralStatus(value: unknown): value is ReferralStatus {
  return typeof value === 'string' && REFERRAL_STATUSES.includes(value as ReferralStatus)
}

// ── Commission status ─────────────────────────────────────────────────────────

export const COMMISSION_STATUSES = ['PENDING', 'APPROVED', 'PAID'] as const
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number]

// ── Payout method ─────────────────────────────────────────────────────────────

export const PAYOUT_METHODS = ['BANK_TRANSFER', 'TOYYIBPAY', 'MANUAL'] as const
export type PayoutMethod = (typeof PAYOUT_METHODS)[number]

// ── Referral shape ────────────────────────────────────────────────────────────

/**
 * A referral tracks a single individual user recruited by an Agent.
 * When the user subscribes, Agent starts earning commission.
 */
export type Referral = {
  id: string
  agentOrgId: string
  referredByUserId: string  // which Agent staff member sent the invite
  customerEmail: string     // the individual user being recruited
  customerName: string | null
  referralCode: string | null
  status: ReferralStatus
  signedUpAt: string | null
  subscribedAt: string | null
  // If the referred user signs up, their org_id if they join a Team workspace
  // (This is only for tracking — Agent has no access to Team workspace data)
  subscribedOrgId: string | null
  createdAt: string
  updatedAt: string
}

// ── Commission shape ──────────────────────────────────────────────────────────

/**
 * Commission record per referral per subscription period.
 * Created by Console when subscription payment is confirmed.
 * Agent cannot write to this table.
 */
export type Commission = {
  id: string
  agentOrgId: string
  referralId: string
  subscriptionPeriod: string   // 'YYYY-MM'
  grossAmount: number          // individual user's subscription amount (MYR)
  commissionRate: number       // e.g. 0.20 = 20%
  commissionAmount: number     // gross * rate (MYR)
  currency: 'MYR'
  status: CommissionStatus
  payoutId: string | null
  createdAt: string
  paidAt: string | null
}

// ── Agent payout settings ─────────────────────────────────────────────────────

export type AgentPayoutSettings = {
  orgId: string
  bankName: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  payoutMethod: PayoutMethod
  updatedAt: string
  updatedBy: string | null
}

// ── Commission summary (for Agent dashboard) ──────────────────────────────────

export type CommissionSummary = {
  thisMonthAmount: number
  pendingPayoutAmount: number
  paidToDateAmount: number
  lifetimeAmount: number
  currency: 'MYR'
}

// ── API payloads ──────────────────────────────────────────────────────────────

// Agent → POST /api/agent/referrals/invite
export type CreateReferralPayload = {
  customerEmail: string
  customerName?: string
}

// Agent → PATCH /api/agent/payout-settings
export type UpdatePayoutSettingsPayload = {
  bankName?: string
  bankAccountName?: string
  bankAccountNumber?: string
  payoutMethod?: PayoutMethod
}

// ── Status display helpers ────────────────────────────────────────────────────

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  INVITED:    'Invited',
  SIGNED_UP:  'Signed Up',
  SUBSCRIBED: 'Subscribed',
  CHURNED:    'Churned',
}

export function getReferralStatusLabel(status: ReferralStatus): string {
  return REFERRAL_STATUS_LABELS[status] ?? status
}

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  PENDING:  'Pending',
  APPROVED: 'Approved',
  PAID:     'Paid',
}
