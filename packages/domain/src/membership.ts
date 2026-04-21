export const MEMBERSHIP_LIMITS = {
  FREE: {
    routes_per_month: 2 as number | null,
    trips_per_month: null as number | null,
    exports_per_month: null as number | null,
    label: 'Free',
  },
  PRO: {
    routes_per_month: null as number | null,
    trips_per_month: null as number | null,
    exports_per_month: null as number | null,
    label: 'Pro Unlimited',
  },
} as const

export type MembershipTier = keyof typeof MEMBERSHIP_LIMITS
export type MembershipLimits = (typeof MEMBERSHIP_LIMITS)[MembershipTier]

export const MEMBERSHIP_TIERS = Object.keys(MEMBERSHIP_LIMITS) as MembershipTier[]

export function isMembershipTier(value: unknown): value is MembershipTier {
  return typeof value === 'string' && MEMBERSHIP_TIERS.includes(value as MembershipTier)
}

export function normalizeMembershipTier(value: unknown): MembershipTier {
  return isMembershipTier(value) ? value : 'FREE'
}

export function getMembershipLimits(value: unknown): MembershipLimits {
  return MEMBERSHIP_LIMITS[normalizeMembershipTier(value)]
}

export function isUnlimited(value: number | null | undefined): boolean {
  return value === null || value === undefined
}
