// apps/user/app/api/claims/route.ts
// GET  /api/claims  — list claims for user's org
// POST /api/claims  — create a new DRAFT claim
//
// Rates model:
// - rate_versions      = global template library
// - user_rate_versions = personal user-owned rates used for calculations
//
// NOTE FOR CURRENT TRANSITION SCHEMA:
// user_rate_versions still has org_id NOT NULL, so claim creation must pass org_id
// when auto-creating a fallback personal rate row.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

const PERSONAL_DEFAULTS = {
  mileage_rate_per_km: 0.60,
  meal_rate_morning: 20.00,
  meal_rate_noon: 30.00,
  meal_rate_evening: 30.00,
  meal_rate_full_day: 60.00,
  lodging_rate_default: 120.00,
  perdiem_rate_myr: 0.00,
}

function averageMealRate(morning: number, noon: number, evening: number) {
  return Math.round(((morning + noon + evening) / 3) * 100) / 100
}

async function ensureCurrentUserRateVersion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  userId: string,
  effectiveFrom: string,
) {
  const { data: existing } = await supabase
    .from('user_rate_versions')
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .lte('effective_from', effectiveFrom)
    .order('effective_from', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) return existing.id

  const morning = PERSONAL_DEFAULTS.meal_rate_morning
  const noon = PERSONAL_DEFAULTS.meal_rate_noon
  const evening = PERSONAL_DEFAULTS.meal_rate_evening
  const perSession = averageMealRate(morning, noon, evening)

  const { data: created, error } = await supabase
    .from('user_rate_versions')
    .insert({
      org_id: orgId,
      user_id: userId,
      effective_from: effectiveFrom,
      currency: 'MYR',
      mileage_rate_per_km: PERSONAL_DEFAULTS.mileage_rate_per_km,
      meal_rate_default: perSession,
      meal_rate_per_session: perSession,
      meal_rate_full_day: PERSONAL_DEFAULTS.meal_rate_full_day,
      meal_rate_morning: morning,
      meal_rate_noon: noon,
      meal_rate_evening: evening,
      lodging_rate_default: PERSONAL_DEFAULTS.lodging_rate_default,
      perdiem_rate_myr: PERSONAL_DEFAULTS.perdiem_rate_myr,
      rate_label: 'Auto default personal rate',
      notes: 'Auto-created while creating a claim because no personal rate existed yet.',
      created_by_user_id: userId,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[ensureCurrentUserRateVersion]', error.message, error.details, error.hint)
    return null
  }

  return created?.id ?? null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('claims')
    .select(`
      id, org_id, user_id, status, title,
      period_start, period_end,
      total_amount, currency,
      submitted_at, rate_version_id, user_rate_version_id,
      created_at, updated_at
    `)
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (status) query = query.eq('status', status)
  if (from) query = query.gte('period_start', from)
  if (to) query = query.lte('period_end', to)

  const { data, error } = await query
  if (error) {
    console.error('[GET /api/claims]', error.message)
    return err('SERVER_ERROR', 'Failed to load claims.', 500)
  }

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = (await request.json().catch(() => ({}))) as {
    title?: string
    period_start?: string
    period_end?: string
  }

  const { title, period_start, period_end } = body

  if (!period_start || !period_end) {
    return err('VALIDATION_ERROR', 'period_start and period_end are required.', 400)
  }
  if (period_start > period_end) {
    return err('VALIDATION_ERROR', 'period_start must be on or before period_end.', 400)
  }

  const userRateVersionId = await ensureCurrentUserRateVersion(supabase, org.org_id, user.id, period_start)

  const { data: claim, error } = await supabase
    .from('claims')
    .insert({
      org_id: org.org_id,
      user_id: user.id,
      status: 'DRAFT',
      title: title?.trim() || null,
      period_start,
      period_end,
      total_amount: 0,
      currency: 'MYR',
      rate_version_id: null,
      user_rate_version_id: userRateVersionId,
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/claims]', error.message, error.details, error.hint)
    return err('SERVER_ERROR', 'Failed to create claim.', 500)
  }

  return NextResponse.json({ claim }, { status: 201 })
}
