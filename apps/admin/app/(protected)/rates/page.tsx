// apps/admin/app/(protected)/rates/page.tsx
//
// Auth-aware server component.
//   Internal staff → RatesClient with full CRUD (via /api/admin/rates)
//   TEAM workspace  → WorkspaceRatesClient — full team rates editor
//   AGENT workspace → not in AGENT nav; redirect to dashboard gracefully

import { redirect } from 'next/navigation'
import { requireWorkspaceAuth } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import RatesClient from './RatesClient'
import WorkspaceRatesClient from './WorkspaceRatesClient'

// ── Internal staff: full rate_versions CRUD ────────────────────────────────────

const RATE_SELECT = `
  id, template_name, effective_from, currency,
  mileage_rate_per_km, motorcycle_rate_per_km,
  meal_rate_default, meal_rate_per_session,
  meal_rate_full_day, meal_rate_morning, meal_rate_noon, meal_rate_evening,
  lodging_rate_default, perdiem_rate_myr,
  created_at, updated_at,
  profiles:created_by_user_id ( display_name, email )
` as const

type RateRow = {
  id: string
  template_name: string | null
  effective_from: string
  currency: string
  mileage_rate_per_km: number
  motorcycle_rate_per_km: number | null
  meal_rate_default: number | null
  meal_rate_per_session: number | null
  meal_rate_full_day: number | null
  meal_rate_morning: number | null
  meal_rate_noon: number | null
  meal_rate_evening: number | null
  lodging_rate_default: number | null
  perdiem_rate_myr: number
  created_at: string
  updated_at: string
  profiles: { display_name: string | null; email: string | null } | { display_name: string | null; email: string | null }[] | null
}

function normalise(data: RateRow[]) {
  return data.map(row => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles,
  }))
}

// ── Template type for workspace editor ────────────────────────────────────────

type GlobalTemplate = {
  id: string
  template_name: string | null
  effective_from: string
  currency: string
  mileage_rate_per_km:    number | null
  motorcycle_rate_per_km: number | null
  meal_rate_default:      number | null
  meal_rate_per_session:  number | null
  meal_rate_full_day:     number | null
  meal_rate_morning:      number | null
  meal_rate_noon:         number | null
  meal_rate_evening:      number | null
  lodging_rate_default:   number | null
  perdiem_rate_myr:       number | null
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function RatesPage() {
  const ctx = await requireWorkspaceAuth('page')
  if (!ctx) redirect('/login')

  const db = createServiceRoleClient()

  // ── Internal staff — full CRUD ─────────────────────────────────────────────
  if (ctx.isInternalStaff) {
    const { data } = await db
      .from('rate_versions')
      .select(RATE_SELECT)
      .order('template_name', { ascending: true })
      .order('effective_from', { ascending: false })

    const rates = normalise((data ?? []) as RateRow[])
    const templateNames = [...new Set(rates.map(r => r.template_name).filter(Boolean) as string[])]

    return <RatesClient initialRates={rates} templateNames={templateNames} />
  }

  // ── AGENT workspace — rates not applicable ─────────────────────────────────
  if (ctx.isAgentWorkspace) {
    redirect('/dashboard')
  }

  // ── TEAM workspace — team rates editor ────────────────────────────────────
  const orgId = ctx.orgId!

  const [{ data: templates }, { data: settingsRow }] = await Promise.all([
    db
      .from('rate_versions')
      .select(`
        id, template_name, effective_from, currency,
        mileage_rate_per_km, motorcycle_rate_per_km,
        meal_rate_default, meal_rate_per_session,
        meal_rate_full_day, meal_rate_morning, meal_rate_noon, meal_rate_evening,
        lodging_rate_default, perdiem_rate_myr
      `)
      .order('template_name', { ascending: true })
      .order('effective_from', { ascending: false }),
    db
      .from('admin_settings')
      .select('settings')
      .eq('org_id', orgId)
      .maybeSingle(),
  ])

  const settings = (settingsRow?.settings && typeof settingsRow.settings === 'object')
    ? settingsRow.settings as Record<string, unknown>
    : {}

  const teamRate = (settings.team_rate && typeof settings.team_rate === 'object')
    ? settings.team_rate as Record<string, unknown>
    : null

  return (
    <WorkspaceRatesClient
      initialTeamRate={teamRate}
      templates={(templates ?? []) as GlobalTemplate[]}
      orgRole={ctx.orgRole}
    />
  )
}
