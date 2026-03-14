// apps/admin/app/api/admin/rates/route.ts
// POST — create rate version for any org

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, msg: string, s: number) {
  return NextResponse.json({ error: { code, message: msg } }, { status: s })
}

export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('rate_versions')
    .select(`id, org_id, effective_from, currency, mileage_rate_per_km, perdiem_rate_myr,
             meal_rate_full_day, meal_rate_morning, meal_rate_noon, meal_rate_evening,
             lodging_rate_default, created_at,
             profiles(display_name, email), organizations(name)`)
    .order('effective_from', { ascending: false })

  if (error) return err('DB_ERROR', error.message, 500)
  return NextResponse.json({ rates: data })
}

export async function POST(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Body required', 400)

  const { org_id, effective_from, mileage_rate_per_km } = body
  if (!org_id)             return err('VALIDATION_ERROR', 'org_id required', 400)
  if (!effective_from)     return err('VALIDATION_ERROR', 'effective_from required', 400)
  if (mileage_rate_per_km == null) return err('VALIDATION_ERROR', 'mileage_rate_per_km required', 400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effective_from)) return err('VALIDATION_ERROR', 'effective_from must be YYYY-MM-DD', 400)

  const db = createServiceRoleClient()

  const { data: existing } = await db.from('rate_versions')
    .select('id').eq('org_id', org_id).eq('effective_from', effective_from).single()
  if (existing) return err('CONFLICT', `Rate version for ${effective_from} already exists for this org`, 409)

  const { data: rate, error } = await db.from('rate_versions')
    .insert({
      org_id, effective_from, currency: 'MYR',
      mileage_rate_per_km:  parseFloat(mileage_rate_per_km),
      perdiem_rate_myr:     parseFloat(body.perdiem_rate_myr     ?? 0),
      meal_rate_morning:    parseFloat(body.meal_rate_morning    ?? 0),
      meal_rate_noon:       parseFloat(body.meal_rate_noon       ?? 0),
      meal_rate_evening:    parseFloat(body.meal_rate_evening    ?? 0),
      meal_rate_full_day:   parseFloat(body.meal_rate_full_day   ?? 0),
      lodging_rate_default: parseFloat(body.lodging_rate_default ?? 0),
      created_by_user_id:   ctx.userId,
    })
    .select(`id, org_id, effective_from, mileage_rate_per_km, perdiem_rate_myr,
             meal_rate_full_day, lodging_rate_default, created_at,
             profiles(display_name, email), organizations(name)`)
    .single()

  if (error) return err('DB_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id, actor_user_id: ctx.userId,
    entity_type: 'rate_version', entity_id: rate.id,
    action: 'RATE_CREATED', metadata: { effective_from, mileage_rate_per_km },
  })

  return NextResponse.json({ rate }, { status: 201 })
}
