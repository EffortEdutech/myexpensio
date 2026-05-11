// apps/admin/app/api/workspace/team-rates/route.ts
//
// Team-level rates editor for TEAM workspaces.
// Stores the team's shared rate schedule in admin_settings.settings.team_rate.
// Team employees pick up these rates when submitting claims (via the user app).
//
// GET  - returns { teamRate, defaults, templates }
// POST - saves team rate (OWNER or ADMIN only)

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export const TEAM_RATE_DEFAULTS = {
  mileage_rate_per_km:    0.60,
  motorcycle_rate_per_km: 0.30,
  meal_rate_morning:      20.00,
  meal_rate_noon:         30.00,
  meal_rate_evening:      30.00,
  meal_rate_full_day:     60.00,
  lodging_rate_default:   120.00,
  perdiem_rate_myr:       0.00,
}

function toNum(v: unknown, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function toNumNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function trimOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.isTeamWorkspace) return err('FORBIDDEN', 'Only Team workspaces can access team rates', 403)

  const db  = createServiceRoleClient()
  const orgId = ctx.orgId!

  const [{ data: settingsRow }, { data: templates, error: tplErr }] = await Promise.all([
    db.from('admin_settings').select('settings').eq('org_id', orgId).maybeSingle(),
    db.from('rate_versions')
      .select(`
        id, template_name, effective_from, currency,
        mileage_rate_per_km, motorcycle_rate_per_km,
        meal_rate_default, meal_rate_per_session,
        meal_rate_full_day, meal_rate_morning, meal_rate_noon, meal_rate_evening,
        lodging_rate_default, perdiem_rate_myr
      `)
      .order('template_name', { ascending: true })
      .order('effective_from', { ascending: false }),
  ])

  if (tplErr) console.error('[workspace/team-rates] GET templates:', tplErr.message)

  const settings = (settingsRow?.settings && typeof settingsRow.settings === 'object')
    ? settingsRow.settings as Record<string, unknown>
    : {}

  const teamRate = (settings.team_rate && typeof settings.team_rate === 'object')
    ? settings.team_rate as Record<string, unknown>
    : null

  return NextResponse.json({
    teamRate,
    defaults: TEAM_RATE_DEFAULTS,
    templates: templates ?? [],
  })
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.isTeamWorkspace) return err('FORBIDDEN', 'Only Team workspaces can set team rates', 403)
  if (ctx.orgRole !== 'OWNER' && ctx.orgRole !== 'ADMIN') {
    return err('FORBIDDEN', 'Only Owner or Admin can save team rates', 403)
  }

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const mileage = toNum(body.mileage_rate_per_km, 0)
  if (mileage <= 0) return err('VALIDATION_ERROR', 'Car mileage rate must be greater than 0', 400)

  const morning  = toNum(body.meal_rate_morning,  TEAM_RATE_DEFAULTS.meal_rate_morning)
  const noon     = toNum(body.meal_rate_noon,     TEAM_RATE_DEFAULTS.meal_rate_noon)
  const evening  = toNum(body.meal_rate_evening,  TEAM_RATE_DEFAULTS.meal_rate_evening)
  const fullDay  = toNum(body.meal_rate_full_day, TEAM_RATE_DEFAULTS.meal_rate_full_day)
  const lodging  = toNum(body.lodging_rate_default, TEAM_RATE_DEFAULTS.lodging_rate_default)
  const perdiem  = toNum(body.perdiem_rate_myr, 0)

  if (morning < 0 || noon < 0 || evening < 0 || fullDay < 0) {
    return err('VALIDATION_ERROR', 'Meal rates cannot be negative', 400)
  }
  if (lodging < 0) return err('VALIDATION_ERROR', 'Lodging rate cannot be negative', 400)
  if (perdiem < 0) return err('VALIDATION_ERROR', 'Per diem rate cannot be negative', 400)

  const motorcycleRate = toNumNull(body.motorcycle_rate_per_km)
  if (motorcycleRate !== null && motorcycleRate < 0) {
    return err('VALIDATION_ERROR', 'Motorcycle rate cannot be negative', 400)
  }

  const teamRate: Record<string, unknown> = {
    mileage_rate_per_km:    mileage,
    motorcycle_rate_per_km: motorcycleRate,
    meal_rate_morning:      morning,
    meal_rate_noon:         noon,
    meal_rate_evening:      evening,
    meal_rate_full_day:     fullDay,
    lodging_rate_default:   lodging,
    perdiem_rate_myr:       perdiem,
    rate_label:    trimOrNull(body.rate_label),
    notes:         trimOrNull(body.notes),
    effective_from: trimOrNull(body.effective_from) ?? new Date().toISOString().slice(0, 10),
    updated_at:    new Date().toISOString(),
    updated_by:    ctx.userId,
  }

  const db = createServiceRoleClient()
  const orgId = ctx.orgId!

  // Merge team_rate into existing settings JSONB
  const { data: existing } = await db
    .from('admin_settings')
    .select('settings')
    .eq('org_id', orgId)
    .maybeSingle()

  const current = (existing?.settings && typeof existing.settings === 'object')
    ? existing.settings as Record<string, unknown>
    : {}

  const { error } = await db.from('admin_settings').upsert({
    org_id:     orgId,
    settings:   { ...current, team_rate: teamRate },
    updated_at: new Date().toISOString(),
    updated_by: ctx.userId,
  })

  if (error) {
    console.error('[workspace/team-rates] POST upsert:', error.message)
    return err('DB_ERROR', error.message, 500)
  }

  return NextResponse.json({ teamRate }, { status: 200 })
}
