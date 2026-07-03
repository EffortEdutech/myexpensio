// apps/user/lib/subscription.ts
//
// Server-side subscription helpers.
// Import ONLY in Server Components, Route Handlers, and Server Actions.
// Never import in 'use client' files — use /api/subscription for client-side checks.
//
// NOTE (2026-07-02): tier/status resolution lives here, but actual USAGE LIMITS
// (routes/trips/exports per month) are resolved in apps/user/lib/entitlements.ts,
// which is the single source of truth for those numbers. If any other doc in this
// repo (including docs/archive/subscription_matrix_SUPERSEDED.html) disagrees with
// entitlements.ts, entitlements.ts wins — that doc describes a pre-2026-05-15
// architecture that no longer exists.
//
// Two entity types:
//   USER — individual user (Agent Subscriber, solo user)
//   ORG  — workspace subscription (Team / Agent workspace, paid by company)
//
// Tier hierarchy:  FREE (trial) → PRO (RM18) → PREMIUM (RM29)
// Feature access:
//   Exports       → PRO or PREMIUM + is_active
//   Business Space → PREMIUM + is_active

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

// ── Types ──────────────────────────────────────────────────────────────────────

export type Tier   = 'FREE' | 'PRO' | 'PREMIUM'
export type SubStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'

export type UserSubscription = {
  tier:               Tier
  status:             SubStatus
  is_active:          boolean   // true → user can use the app (paid or within trial)
  is_trial:           boolean   // true → currently in FREE trial window
  trial_days_left:    number    // 0 when expired or not trialing
  trial_expires_at:   string | null
  stripe_customer_id: string | null
  current_period_end: string | null
}

export type OrgSubscription = {
  tier:                   Tier
  status:                 SubStatus
  seat_count:             number
  is_active:              boolean
  stripe_customer_id:     string | null
  stripe_subscription_id: string | null
  current_period_end:     string | null
}

// Returned when subscription row is missing (fail-safe: deny access)
const EXPIRED_FALLBACK: UserSubscription = {
  tier:               'FREE',
  status:             'EXPIRED',
  is_active:          false,
  is_trial:           false,
  trial_days_left:    0,
  trial_expires_at:   null,
  stripe_customer_id: null,
  current_period_end: null,
}

// ── User subscription ──────────────────────────────────────────────────────────

/**
 * Returns the current authenticated user's subscription from the `subscriptions` table.
 * Calls the `get_user_subscription` Postgres RPC.
 * Safe to call on every server render — uses the user-scoped Supabase client.
 */
export async function getUserSubscription(): Promise<UserSubscription> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return EXPIRED_FALLBACK

  const { data, error } = await supabase.rpc('get_user_subscription', {
    p_user_id: user.id,
  })

  if (error) {
    console.error('[getUserSubscription] RPC error:', error.message)
    return EXPIRED_FALLBACK
  }

  // RPC returns a set — take the first (and only) row
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return EXPIRED_FALLBACK

  return {
    tier:               (row.tier          as Tier)      ?? 'FREE',
    status:             (row.status        as SubStatus) ?? 'EXPIRED',
    is_active:          row.is_active      ?? false,
    is_trial:           row.is_trial       ?? false,
    trial_days_left:    row.trial_days_left ?? 0,
    trial_expires_at:   row.trial_expires_at ?? null,
    stripe_customer_id: row.stripe_customer_id ?? null,
    current_period_end: row.current_period_end ?? null,
  }
}

/**
 * Returns the subscription for a specific user by ID.
 * Uses service role — safe for Console / webhook use only.
 */
export async function getUserSubscriptionById(userId: string): Promise<UserSubscription> {
  const db = createServiceRoleClient()
  const { data, error } = await db.rpc('get_user_subscription', { p_user_id: userId })

  if (error) {
    console.error('[getUserSubscriptionById] RPC error:', error.message)
    return EXPIRED_FALLBACK
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return EXPIRED_FALLBACK

  return {
    tier:               (row.tier          as Tier)      ?? 'FREE',
    status:             (row.status        as SubStatus) ?? 'EXPIRED',
    is_active:          row.is_active      ?? false,
    is_trial:           row.is_trial       ?? false,
    trial_days_left:    row.trial_days_left ?? 0,
    trial_expires_at:   row.trial_expires_at ?? null,
    stripe_customer_id: row.stripe_customer_id ?? null,
    current_period_end: row.current_period_end ?? null,
  }
}

// ── Org subscription ───────────────────────────────────────────────────────────

/**
 * Returns a workspace's (ORG entity) subscription.
 * Uses service role — for Console and webhook handlers only.
 */
export async function getOrgSubscription(orgId: string): Promise<OrgSubscription | null> {
  const db = createServiceRoleClient()
  const { data, error } = await db.rpc('get_org_subscription', { p_org_id: orgId })

  if (error) {
    console.error('[getOrgSubscription] RPC error:', error.message)
    return null
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null

  return {
    tier:                   (row.tier   as Tier)      ?? 'FREE',
    status:                 (row.status as SubStatus) ?? 'EXPIRED',
    seat_count:             row.seat_count             ?? 1,
    is_active:              row.is_active              ?? false,
    stripe_customer_id:     row.stripe_customer_id     ?? null,
    stripe_subscription_id: row.stripe_subscription_id ?? null,
    current_period_end:     row.current_period_end     ?? null,
  }
}

// ── Feature access helpers ─────────────────────────────────────────────────────
// Use these in layouts and API routes to keep gate logic in one place.

/** Advanced PDF/report exports — PRO or PREMIUM */
export function canAccessExports(sub: UserSubscription | null): boolean {
  return (sub?.tier === 'PRO' || sub?.tier === 'PREMIUM') && (sub?.is_active ?? false)
}

/** My Earning / Business space — PREMIUM only */
export function canAccessBusinessSpace(sub: UserSubscription | null): boolean {
  return sub?.tier === 'PREMIUM' && (sub?.is_active ?? false)
}

/** Any active subscription (trial counts) — basic Work Claims features */
export function hasActiveAccess(sub: UserSubscription | null): boolean {
  return sub?.is_active ?? false
}

// ── Stripe price → tier mapping ────────────────────────────────────────────────
// Used by the webhook to resolve tier from the purchased price ID.

export function tierFromPriceId(priceId: string | null | undefined): Tier {
  if (!priceId) return 'FREE'
  if (priceId === process.env.STRIPE_PRICE_PREMIUM) return 'PREMIUM'
  if (priceId === process.env.STRIPE_PRICE_PRO)     return 'PRO'
  // Legacy price IDs (backward compat during rollout)
  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID)      return 'PRO'
  if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID)  return 'PREMIUM'
  return 'PRO' // default paid = PRO if unrecognised
}
