// apps/user/app/api/settings/rates/route.ts
// GET  /api/settings/rates
// POST /api/settings/rates
//
// Personal rates only:
// - rate_versions      = global reference templates (admin-managed)
// - user_rate_versions = personal user-owned rates used for new claims
//
// NOTE FOR CURRENT TRANSITION SCHEMA:
// user_rate_versions still has org_id NOT NULL in the current DB schema,
// so this route resolves the active org and writes org_id + created_by_user_id.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

type RateRow = {
  id: string
  template_name?: string | null
  effective_from?: string | null
  currency?: string | null
  mileage_rate_per_km?: number | null
  meal_rate_default?: number | null
  meal_rate_per_session?: number | null
  meal_rate_full_day?: number | null
  meal_rate_morning?: number | null
  meal_rate_noon?: number | null
  meal_rate_evening?: number | null
  lodging_rate_default?: number | null
  perdiem_rate_myr?: number | null
  rate_label?: string | null
  notes?: string | null
  created_at?: string | null
}

export const DEFAULTS = {
  mileage_rate_per_km: 0.60,
  meal_rate_morning: 20.00,
  meal_rate_noon: 30.00,
  meal_rate_evening: 30.00,
  meal_rate_full_day: 60.00,
  lodging_rate_default: 120.00,
  perdiem_rate_myr: 0.00,
}

function numberOr(...values: Array<number | null | undefined>): number {
  for (const value of values) {
    const n = Number(value)
    if (!Number.isNaN(n)) return n
  }
  return 0
}

function computeMealAverage(morning: number, noon: number, evening: number): number {
  return Math.round(((morning + noon + evening) / 3) * 100) / 100
}

function normalizeRateRow(rate?: RateRow | null) {
  const morning = numberOr(rate?.meal_rate_morning, DEFAULTS.meal_rate_morning)
  const noon = numberOr(rate?.meal_rate_noon, DEFAULTS.meal_rate_noon)
  const evening = numberOr(rate?.meal_rate_evening, DEFAULTS.meal_rate_evening)
  const perSession = numberOr(
    rate?.meal_rate_per_session,
    rate?.meal_rate_default,
    computeMealAverage(morning, noon, evening),
  )
  const mealDefault = numberOr(rate?.meal_rate_default, perSession)

  return {
    id: rate?.id ?? null,
    template_name: rate?.template_name ?? null,
    effective_from: rate?.effective_from ?? null,
    currency: 'MYR',
    mileage_rate_per_km: numberOr(rate?.mileage_rate_per_km, DEFAULTS.mileage_rate_per_km),
    meal_rate_default: mealDefault,
    meal_rate_per_session: perSession,
    meal_rate_morning: morning,
    meal_rate_noon: noon,
    meal_rate_evening: evening,
    meal_rate_full_day: numberOr(rate?.meal_rate_full_day, DEFAULTS.meal_rate_full_day),
    lodging_rate_default: numberOr(rate?.lodging_rate_default, DEFAULTS.lodging_rate_default),
    perdiem_rate_myr: numberOr(rate?.perdiem_rate_myr, DEFAULTS.perdiem_rate_myr),
    rate_label: rate?.rate_label ?? null,
    notes: rate?.notes ?? null,
  }
}

function trimOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numericInput(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

async function loadLatestTemplateOptions(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from('rate_versions')
    .select(`
      id,
      template_name,
      effective_from,
      currency,
      mileage_rate_per_km,
      meal_rate_default,
      meal_rate_per_session,
      meal_rate_full_day,
      meal_rate_morning,
      meal_rate_noon,
      meal_rate_evening,
      lodging_rate_default,
      perdiem_rate_myr,
      created_at
    `)
    .order('template_name', { ascending: true })
    .order('effective_from', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/settings/rates] templates:', error.message)
    return []
  }

  const latestByTemplate = new Map<string, RateRow>()
  for (const row of (data ?? []) as RateRow[]) {
    const templateName = row.template_name?.trim()
    if (!templateName) continue
    if (!latestByTemplate.has(templateName)) {
      latestByTemplate.set(templateName, row)
    }
  }

  return Array.from(latestByTemplate.values()).map((row) => ({
    id: row.id,
    ...normalizeRateRow(row),
  }))
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const [{ data: personalRate, error: personalErr }, templates] = await Promise.all([
    supabase
      .from('user_rate_versions')
      .select(`
        id,
        effective_from,
        currency,
        mileage_rate_per_km,
        meal_rate_default,
        meal_rate_per_session,
        meal_rate_full_day,
        meal_rate_morning,
        meal_rate_noon,
        meal_rate_evening,
        lodging_rate_default,
        perdiem_rate_myr,
        rate_label,
        notes,
        created_at
      `)
      .eq('user_id', user.id)
      .eq('org_id', org.org_id)
      .order('effective_from', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    loadLatestTemplateOptions(supabase),
  ])

  if (personalErr) {
    console.error('[GET /api/settings/rates] personal:', personalErr.message)
    return err('SERVER_ERROR', 'Failed to load personal rates.', 500)
  }

  return NextResponse.json({
    rate: normalizeRateRow(personalRate as RateRow | null),
    defaults: DEFAULTS,
    templates,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = (await request.json().catch(() => ({}))) as {
    template_id?: string
    effective_from?: string
    mileage_rate_per_km?: number
    meal_rate_default?: number
    meal_rate_per_session?: number
    meal_rate_full_day?: number
    meal_rate_morning?: number
    meal_rate_noon?: number
    meal_rate_evening?: number
    lodging_rate_default?: number
    perdiem_rate_myr?: number
    rate_label?: string
    notes?: string
  }

  const templateId = trimOrNull(body.template_id)
  let templateRow: RateRow | null = null

  if (templateId) {
    const { data, error } = await supabase
      .from('rate_versions')
      .select(`
        id,
        template_name,
        effective_from,
        currency,
        mileage_rate_per_km,
        meal_rate_default,
        meal_rate_per_session,
        meal_rate_full_day,
        meal_rate_morning,
        meal_rate_noon,
        meal_rate_evening,
        lodging_rate_default,
        perdiem_rate_myr,
        created_at
      `)
      .eq('id', templateId)
      .maybeSingle()

    if (error) {
      console.error('[POST /api/settings/rates] template:', error.message)
      return err('SERVER_ERROR', 'Failed to load selected template.', 500)
    }

    templateRow = (data as RateRow | null) ?? null
  }

  const template = normalizeRateRow(templateRow)

  const morning = numericInput(body.meal_rate_morning) ?? template.meal_rate_morning
  const noon = numericInput(body.meal_rate_noon) ?? template.meal_rate_noon
  const evening = numericInput(body.meal_rate_evening) ?? template.meal_rate_evening

  const computedPerSession = computeMealAverage(morning, noon, evening)
  const mealRatePerSession =
    numericInput(body.meal_rate_per_session)
    ?? template.meal_rate_per_session
    ?? computedPerSession

  const mealRateDefault =
    numericInput(body.meal_rate_default)
    ?? template.meal_rate_default
    ?? mealRatePerSession

  const ratePayload = {
    org_id: org.org_id,
    user_id: user.id,
    effective_from: trimOrNull(body.effective_from) ?? new Date().toISOString().slice(0, 10),
    currency: 'MYR',
    mileage_rate_per_km:
      numericInput(body.mileage_rate_per_km)
      ?? template.mileage_rate_per_km
      ?? DEFAULTS.mileage_rate_per_km,
    meal_rate_default: mealRateDefault,
    meal_rate_per_session: mealRatePerSession,
    meal_rate_full_day:
      numericInput(body.meal_rate_full_day)
      ?? template.meal_rate_full_day
      ?? DEFAULTS.meal_rate_full_day,
    meal_rate_morning: morning,
    meal_rate_noon: noon,
    meal_rate_evening: evening,
    lodging_rate_default:
      numericInput(body.lodging_rate_default)
      ?? template.lodging_rate_default
      ?? DEFAULTS.lodging_rate_default,
    perdiem_rate_myr:
      numericInput(body.perdiem_rate_myr)
      ?? template.perdiem_rate_myr
      ?? DEFAULTS.perdiem_rate_myr,
    rate_label:
      trimOrNull(body.rate_label)
      ?? (templateRow?.template_name ? `Copied from ${templateRow.template_name}` : 'Personal Rate'),
    notes: trimOrNull(body.notes),
    created_by_user_id: user.id,
  }

  if (ratePayload.mileage_rate_per_km <= 0) {
    return err('VALIDATION_ERROR', 'Mileage rate must be > 0.', 400)
  }
  if (
    ratePayload.meal_rate_morning < 0
    || ratePayload.meal_rate_noon < 0
    || ratePayload.meal_rate_evening < 0
    || ratePayload.meal_rate_full_day < 0
    || ratePayload.meal_rate_default < 0
    || ratePayload.meal_rate_per_session < 0
  ) {
    return err('VALIDATION_ERROR', 'Meal rates cannot be negative.', 400)
  }
  if (ratePayload.lodging_rate_default < 0) {
    return err('VALIDATION_ERROR', 'Lodging rate cannot be negative.', 400)
  }
  if (ratePayload.perdiem_rate_myr < 0) {
    return err('VALIDATION_ERROR', 'Per diem rate cannot be negative.', 400)
  }

  const { data: existingRow, error: existingErr } = await supabase
    .from('user_rate_versions')
    .select('id')
    .eq('user_id', user.id)
    .eq('org_id', org.org_id)
    .eq('effective_from', ratePayload.effective_from)
    .limit(1)
    .maybeSingle()

  if (existingErr) {
    console.error('[POST /api/settings/rates] existing lookup:', existingErr.message)
    return err('SERVER_ERROR', 'Failed to check existing personal rates.', 500)
  }

  const query = existingRow
    ? supabase.from('user_rate_versions').update(ratePayload).eq('id', existingRow.id)
    : supabase.from('user_rate_versions').insert(ratePayload)

  const { data: savedRate, error } = await query
    .select(`
      id,
      effective_from,
      currency,
      mileage_rate_per_km,
      meal_rate_default,
      meal_rate_per_session,
      meal_rate_full_day,
      meal_rate_morning,
      meal_rate_noon,
      meal_rate_evening,
      lodging_rate_default,
      perdiem_rate_myr,
      rate_label,
      notes,
      created_at
    `)
    .single()

  if (error) {
    console.error('[POST /api/settings/rates]', error.message, error.details, error.hint)
    return err('SERVER_ERROR', 'Failed to save personal rates.', 500)
  }

  return NextResponse.json({ rate: normalizeRateRow(savedRate as RateRow) }, { status: existingRow ? 200 : 201 })
}
