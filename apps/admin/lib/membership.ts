// apps/user/lib/membership.ts
// apps/admin/lib/membership.ts
//
// Single source of truth for plan limits.
// Copied to both apps — keeps it simple without requiring a shared package.
//
// Phase 1 locked baseline (do not change without a product decision):
//   FREE  = 2 route calculations / month, unlimited trips & exports
//   PRO   = unlimited everything
//
// To override for specific orgs: use admin_settings.settings.limits
// with preset = BETA_UNLIMITED or CUSTOM. That system is in entitlements.ts.
//
// 2026-04-21: Created. Replaces platform_settings DB table (dropped in R1).

export const MEMBERSHIP_LIMITS = {
  FREE: {
    routes_per_month: 2 as number | null,
    trips_per_month:  null as number | null,
    exports_per_month: null as number | null,
    label: 'Free',
  },
  PRO: {
    routes_per_month:  null as number | null,
    trips_per_month:   null as number | null,
    exports_per_month: null as number | null,
    label: 'Pro Unlimited',
  },
} as const

export type Tier = keyof typeof MEMBERSHIP_LIMITS
