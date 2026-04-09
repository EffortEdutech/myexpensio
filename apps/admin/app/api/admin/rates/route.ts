// apps/admin/app/api/admin/rates/route.ts
// Global rate template library (admin only)

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, msg: string, s: number) {
  return NextResponse.json({ error: { code, message: msg } }, { status: s })
}

function num(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function avgMeal(morning: number, noon: number, evening: number) {
  return Math.round((((morning + noon + evening) / 3) * 100)) / 100
}

export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const db = createServiceRoleClient()
  const { data, error } = await db
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
      created_at,
      updated_at,
      profiles:created_by_user_id(display_name, email)
    `)
    .order('template_name', { ascending: true })
    .order('effective_from', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return err('DB_ERROR', error.message, 500)
  return NextResponse.json({ rates: data ?? [] })
}

export async function POST(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Body required', 400)

  const template_name = typeof body.template_name === 'string' ? body.template_name.trim() : ''
  const effective_from = typeof body.effective_from === 'string' ? body.effective_from.trim() : ''
  if (!template_name) return err('VALIDATION_ERROR', 'template_name required', 400)
  if (!effective_from) return err('VALIDATION_ERROR', 'effective_from required', 400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effective_from)) return err('VALIDATION_ERROR', 'effective_from must be YYYY-MM-DD', 400)

  const mileage = num(body.mileage_rate_per_km, NaN)
  const morning = num(body.meal_rate_morning, 20)
  const noon = num(body.meal_rate_noon, 30)
  const evening = num(body.meal_rate_evening, 30)
  const fullDay = num(body.meal_rate_full_day, 60)
  const lodging = num(body.lodging_rate_default, 120)
  const perdiem = num(body.perdiem_rate_myr, 0)
  const mealDefault = num(body.meal_rate_default, avgMeal(morning, noon, evening))
  const mealPerSession = num(body.meal_rate_per_session, mealDefault)

  if (!Number.isFinite(mileage) || mileage <= 0) return err('VALIDATION_ERROR', 'mileage_rate_per_km must be > 0', 400)
  if ([morning, noon, evening, fullDay, lodging, perdiem, mealDefault, mealPerSession].some((v) => v < 0)) {
    return err('VALIDATION_ERROR', 'Rates cannot be negative', 400)
  }

  const db = createServiceRoleClient()
  const { data: existing } = await db
    .from('rate_versions')
    .select('id')
    .eq('template_name', template_name)
    .eq('effective_from', effective_from)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return err('CONFLICT', `Rate template version for ${template_name} on ${effective_from} already exists`, 409)
  }

  const { data: rate, error } = await db
    .from('rate_versions')
    .insert({
      org_id: null,
      template_name,
      effective_from,
      currency: 'MYR',
      mileage_rate_per_km: mileage,
      meal_rate_default: mealDefault,
      meal_rate_per_session: mealPerSession,
      meal_rate_morning: morning,
      meal_rate_noon: noon,
      meal_rate_evening: evening,
      meal_rate_full_day: fullDay,
      lodging_rate_default: lodging,
      perdiem_rate_myr: perdiem,
      created_by_user_id: ctx.userId,
      updated_at: new Date().toISOString(),
    })
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
      created_at,
      updated_at,
      profiles:created_by_user_id(display_name, email)
    `)
    .single()

  if (error) return err('DB_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id: null,
    actor_user_id: ctx.userId,
    entity_type: 'rate_version',
    entity_id: rate.id,
    action: 'RATE_TEMPLATE_CREATED',
    metadata: { template_name, effective_from, mileage_rate_per_km: mileage },
  })

  return NextResponse.json({ rate }, { status: 201 })
}
