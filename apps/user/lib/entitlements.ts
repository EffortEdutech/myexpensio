// apps/user/lib/entitlements.ts
//
// Resolves org entitlements for usage gating.
//
// CHANGE LOG:
//   2026-04-21 — Removed platform_settings (dropped in R1).
//                Added platform_config read for admin-configurable Free tier limits.
//                PRO tier remains always unlimited (no DB read needed).
//                admin_settings org-override system (BETA_UNLIMITED/CUSTOM) preserved.

import { createClient } from '@/lib/supabase/server'

export type LimitValue = number | null

export type ResolvedEntitlements = {
  tier: 'FREE' | 'PRO'
  routes_limit: LimitValue
  trips_limit: LimitValue
  exports_limit: LimitValue
  limit_label: string | null
  limit_preset: string
  limit_source: 'ADMIN' | 'PLAN_DEFAULT' | 'ORG_OVERRIDE'
  override_expires_at: string | null
  override_notes: string | null
}

// ── Hardcoded fallback defaults ───────────────────────────────────────────────
// Used when platform_config row is missing or columns are null.
// PRO is always unlimited — not read from DB.
const FALLBACK_FREE = {
  routes_per_month:  2 as LimitValue,
  trips_per_month:   null as LimitValue,
  exports_per_month: null as LimitValue,
  label: 'Free',
}

const PRO_LIMITS = {
  routes_per_month:  null as LimitValue,
  trips_per_month:   null as LimitValue,
  exports_per_month: null as LimitValue,
  label: 'Pro Unlimited',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function isExpired(iso: string | null): boolean {
  if (!iso) return false
  const t = Date.parse(iso)
  return Number.isFinite(t) && t < Date.now()
}

// ── Org override parser (reads from admin_settings.settings.limits) ───────────
function parseOrgOverride(raw: unknown) {
  const root = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const limits = root.limits && typeof root.limits === 'object'
    ? root.limits as Record<string, unknown>
    : {}

  const presetRaw = String(limits.preset ?? 'DEFAULT').trim().toUpperCase()
  const preset =
    presetRaw === 'BETA_UNLIMITED' ? 'BETA_UNLIMITED'
    : presetRaw === 'CUSTOM' ? 'CUSTOM'
    : 'DEFAULT'

  return {
    preset,
    routes_per_month:  limits.routes_per_month  === null ? null : toNullableInt(limits.routes_per_month),
    trips_per_month:   limits.trips_per_month   === null ? null : toNullableInt(limits.trips_per_month),
    exports_per_month: limits.exports_per_month === null ? null : toNullableInt(limits.exports_per_month),
    label:      toNullableString(limits.label),
    expires_at: toNullableString(limits.expires_at),
    notes:      toNullableString(limits.notes),
  }
}

// ── Main resolver ─────────────────────────────────────────────────────────────
export async function loadOrgEntitlements(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  orgId: string
  tier: 'FREE' | 'PRO'
  isAdmin?: boolean
}): Promise<ResolvedEntitlements> {

  // Platform-level admins (SUPER_ADMIN / SUPPORT) bypass all limits.
  if (params.isAdmin) {
    return {
      tier: params.tier,
      routes_limit: null,
      trips_limit: null,
      exports_limit: null,
      limit_label: 'Admin — Unlimited',
      limit_preset: 'ADMIN',
      limit_source: 'ADMIN',
      override_expires_at: null,
      override_notes: null,
    }
  }

  // PRO tier is always unlimited — no DB read needed.
  if (params.tier === 'PRO') {
    return {
      tier: 'PRO',
      routes_limit: PRO_LIMITS.routes_per_month,
      trips_limit:  PRO_LIMITS.trips_per_month,
      exports_limit: PRO_LIMITS.exports_per_month,
      limit_label: PRO_LIMITS.label,
      limit_preset: 'DEFAULT',
      limit_source: 'PLAN_DEFAULT',
      override_expires_at: null,
      override_notes: null,
    }
  }

  // FREE tier — load platform_config + org override in parallel.
  const [platformRes, adminRes] = await Promise.all([
    params.supabase
      .from('platform_config')
      .select('free_routes_per_month, free_trips_per_month, free_exports_per_month')
      .eq('id', true)
      .maybeSingle(),
    params.supabase
      .from('admin_settings')
      .select('settings')
      .eq('org_id', params.orgId)
      .maybeSingle(),
  ])

  // Build effective FREE baseline from platform_config (admin-editable).
  // Falls back to hardcoded FALLBACK_FREE if the row/column is null.
  const base = {
    routes_per_month: platformRes.data?.free_routes_per_month !== undefined
      ? platformRes.data.free_routes_per_month   // null is valid (unlimited)
      : FALLBACK_FREE.routes_per_month,
    trips_per_month: platformRes.data?.free_trips_per_month !== undefined
      ? platformRes.data.free_trips_per_month
      : FALLBACK_FREE.trips_per_month,
    exports_per_month: platformRes.data?.free_exports_per_month !== undefined
      ? platformRes.data.free_exports_per_month
      : FALLBACK_FREE.exports_per_month,
    label: FALLBACK_FREE.label,
  }

  const override = parseOrgOverride(adminRes.data?.settings ?? null)

  // BETA_UNLIMITED — unlimited access for beta orgs.
  if (override.preset === 'BETA_UNLIMITED' && !isExpired(override.expires_at)) {
    return {
      tier: 'FREE',
      routes_limit: null,
      trips_limit: null,
      exports_limit: null,
      limit_label: override.label ?? 'Beta Unlimited',
      limit_preset: 'BETA_UNLIMITED',
      limit_source: 'ORG_OVERRIDE',
      override_expires_at: override.expires_at,
      override_notes: override.notes,
    }
  }

  // CUSTOM — specific limits set by admin for this org.
  if (override.preset === 'CUSTOM' && !isExpired(override.expires_at)) {
    return {
      tier: 'FREE',
      routes_limit: override.routes_per_month,
      trips_limit:  override.trips_per_month,
      exports_limit: override.exports_per_month,
      limit_label: override.label ?? 'Custom Policy',
      limit_preset: 'CUSTOM',
      limit_source: 'ORG_OVERRIDE',
      override_expires_at: override.expires_at,
      override_notes: override.notes,
    }
  }

  // Default: use platform_config Free baseline.
  return {
    tier: 'FREE',
    routes_limit: base.routes_per_month,
    trips_limit:  base.trips_per_month,
    exports_limit: base.exports_per_month,
    limit_label: base.label,
    limit_preset: 'DEFAULT',
    limit_source: 'PLAN_DEFAULT',
    override_expires_at: null,
    override_notes: null,
  }
}
