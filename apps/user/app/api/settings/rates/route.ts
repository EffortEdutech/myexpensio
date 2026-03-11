// apps/user/app/api/settings/rates/route.ts
// GET  /api/settings/rates
// POST /api/settings/rates
//
// Returns or saves the org's rate configuration.
// Rates are versioned (rate_versions table) — each POST creates a new version
// effective from today. Previous versions are preserved for audit.
//
// Includes perdiem_rate_myr (new) — one org-wide daily per diem allowance rate.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export const DEFAULTS = {
  mileage_rate_per_km:    0.60,
  meal_rate_morning:     20.00,
  meal_rate_noon:        30.00,
  meal_rate_evening:     30.00,
  meal_rate_full_day:    60.00,
  lodging_rate_default: 120.00,
  perdiem_rate_myr:       0.00,   // 0 = not configured; UI prompts admin to set
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { data: rate } = await supabase
    .from('rate_versions')
    .select(`
      id, effective_from, currency,
      mileage_rate_per_km,
      meal_rate_morning, meal_rate_noon, meal_rate_evening,
      meal_rate_full_day,
      lodging_rate_default,
      perdiem_rate_myr
    `)
    .eq('org_id', org.org_id)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    rate: {
      id:                    rate?.id ?? null,
      effective_from:        rate?.effective_from ?? null,
      currency:              'MYR',
      mileage_rate_per_km:   Number(rate?.mileage_rate_per_km   ?? DEFAULTS.mileage_rate_per_km),
      meal_rate_morning:     Number(rate?.meal_rate_morning      ?? DEFAULTS.meal_rate_morning),
      meal_rate_noon:        Number(rate?.meal_rate_noon         ?? DEFAULTS.meal_rate_noon),
      meal_rate_evening:     Number(rate?.meal_rate_evening      ?? DEFAULTS.meal_rate_evening),
      meal_rate_full_day:    Number(rate?.meal_rate_full_day     ?? DEFAULTS.meal_rate_full_day),
      lodging_rate_default:  Number(rate?.lodging_rate_default   ?? DEFAULTS.lodging_rate_default),
      perdiem_rate_myr:      Number(rate?.perdiem_rate_myr       ?? DEFAULTS.perdiem_rate_myr),
    },
    defaults: DEFAULTS,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = await request.json().catch(() => ({})) as {
    mileage_rate_per_km?:    number
    meal_rate_morning?:      number
    meal_rate_noon?:         number
    meal_rate_evening?:      number
    meal_rate_full_day?:     number
    lodging_rate_default?:   number
    perdiem_rate_myr?:       number
    effective_from?:         string
  }

  const mileage   = Number(body.mileage_rate_per_km    ?? DEFAULTS.mileage_rate_per_km)
  const morning   = Number(body.meal_rate_morning       ?? DEFAULTS.meal_rate_morning)
  const noon      = Number(body.meal_rate_noon          ?? DEFAULTS.meal_rate_noon)
  const evening   = Number(body.meal_rate_evening       ?? DEFAULTS.meal_rate_evening)
  const fullDay   = Number(body.meal_rate_full_day      ?? DEFAULTS.meal_rate_full_day)
  const lodging   = Number(body.lodging_rate_default    ?? DEFAULTS.lodging_rate_default)
  const perdiem   = Number(body.perdiem_rate_myr        ?? DEFAULTS.perdiem_rate_myr)
  const effFrom   = body.effective_from ?? new Date().toISOString().slice(0, 10)

  // Validate
  if (mileage <= 0)
    return err('VALIDATION_ERROR', 'Mileage rate must be > 0.', 400)
  if (morning < 0 || noon < 0 || evening < 0 || fullDay < 0)
    return err('VALIDATION_ERROR', 'Meal rates cannot be negative.', 400)
  if (lodging < 0)
    return err('VALIDATION_ERROR', 'Lodging rate cannot be negative.', 400)
  if (perdiem < 0)
    return err('VALIDATION_ERROR', 'Per diem rate cannot be negative.', 400)

  const { data: newRate, error } = await supabase
    .from('rate_versions')
    .upsert({
      org_id:                org.org_id,
      effective_from:        effFrom,
      currency:              'MYR',
      mileage_rate_per_km:   mileage,
      meal_rate_morning:     morning,
      meal_rate_noon:        noon,
      meal_rate_evening:     evening,
      meal_rate_full_day:    fullDay,
      meal_rate_per_session: Math.round(((morning + noon + evening) / 3) * 100) / 100,
      meal_rate_default:     Math.round(((morning + noon + evening) / 3) * 100) / 100,
      lodging_rate_default:  lodging,
      perdiem_rate_myr:      perdiem,
      created_by_user_id:    user.id,
    }, { onConflict: 'org_id,effective_from' })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/settings/rates]', error.message)
    return err('SERVER_ERROR', 'Failed to save rates.', 500)
  }

  return NextResponse.json({ rate: newRate }, { status: 201 })
}
