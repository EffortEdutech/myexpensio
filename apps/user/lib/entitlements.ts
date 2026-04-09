// apps/user/lib/entitlements.ts
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

const DEFAULTS = {
  FREE: { routes_per_month: 2 as LimitValue, trips_per_month: null as LimitValue, exports_per_month: null as LimitValue, label: 'Free' },
  PRO:  { routes_per_month: null as LimitValue, trips_per_month: null as LimitValue, exports_per_month: null as LimitValue, label: 'Pro Unlimited' },
}

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

function parsePlatformSettings(raw: unknown) {
  const root = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const plans = root.plans && typeof root.plans === 'object' ? root.plans as Record<string, unknown> : {}
  const free = plans.FREE && typeof plans.FREE === 'object' ? plans.FREE as Record<string, unknown> : {}
  const pro = plans.PRO && typeof plans.PRO === 'object' ? plans.PRO as Record<string, unknown> : {}

  return {
    FREE: {
      routes_per_month: free.routes_per_month === null ? null : (toNullableInt(free.routes_per_month) ?? DEFAULTS.FREE.routes_per_month),
      trips_per_month: free.trips_per_month === null ? null : (toNullableInt(free.trips_per_month) ?? DEFAULTS.FREE.trips_per_month),
      exports_per_month: free.exports_per_month === null ? null : (toNullableInt(free.exports_per_month) ?? DEFAULTS.FREE.exports_per_month),
      label: toNullableString(free.label) ?? DEFAULTS.FREE.label,
    },
    PRO: {
      routes_per_month: pro.routes_per_month === null ? null : (toNullableInt(pro.routes_per_month) ?? DEFAULTS.PRO.routes_per_month),
      trips_per_month: pro.trips_per_month === null ? null : (toNullableInt(pro.trips_per_month) ?? DEFAULTS.PRO.trips_per_month),
      exports_per_month: pro.exports_per_month === null ? null : (toNullableInt(pro.exports_per_month) ?? DEFAULTS.PRO.exports_per_month),
      label: toNullableString(pro.label) ?? DEFAULTS.PRO.label,
    },
  }
}

function parseOrgOverride(raw: unknown) {
  const root = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const limits = root.limits && typeof root.limits === 'object' ? root.limits as Record<string, unknown> : {}
  const presetRaw = String(limits.preset ?? 'DEFAULT').trim().toUpperCase()
  const preset = presetRaw === 'BETA_UNLIMITED' ? 'BETA_UNLIMITED' : presetRaw === 'CUSTOM' ? 'CUSTOM' : 'DEFAULT'

  return {
    preset,
    routes_per_month: limits.routes_per_month === null ? null : toNullableInt(limits.routes_per_month),
    trips_per_month: limits.trips_per_month === null ? null : toNullableInt(limits.trips_per_month),
    exports_per_month: limits.exports_per_month === null ? null : toNullableInt(limits.exports_per_month),
    label: toNullableString(limits.label),
    expires_at: toNullableString(limits.expires_at),
    notes: toNullableString(limits.notes),
  }
}

export async function loadOrgEntitlements(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  orgId: string
  tier: 'FREE' | 'PRO'
  isAdmin?: boolean
}): Promise<ResolvedEntitlements> {
  const [platformRes, adminRes] = await Promise.all([
    params.supabase.from('platform_settings').select('settings').eq('id', true).maybeSingle(),
    params.supabase.from('admin_settings').select('settings').eq('org_id', params.orgId).maybeSingle(),
  ])

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

  const platform = parsePlatformSettings(platformRes.data?.settings ?? null)
  const override = parseOrgOverride(adminRes.data?.settings ?? null)
  const base = platform[params.tier]

  if (override.preset === 'BETA_UNLIMITED' && !isExpired(override.expires_at)) {
    return {
      tier: params.tier,
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

  if (override.preset === 'CUSTOM' && !isExpired(override.expires_at)) {
    return {
      tier: params.tier,
      routes_limit: override.routes_per_month,
      trips_limit: override.trips_per_month,
      exports_limit: override.exports_per_month,
      limit_label: override.label ?? 'Custom Policy',
      limit_preset: 'CUSTOM',
      limit_source: 'ORG_OVERRIDE',
      override_expires_at: override.expires_at,
      override_notes: override.notes,
    }
  }

  return {
    tier: params.tier,
    routes_limit: base.routes_per_month,
    trips_limit: base.trips_per_month,
    exports_limit: base.exports_per_month,
    limit_label: base.label,
    limit_preset: 'DEFAULT',
    limit_source: 'PLAN_DEFAULT',
    override_expires_at: null,
    override_notes: null,
  }
}
