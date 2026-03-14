// apps/admin/app/api/admin/rates/route.ts
//
// GET  /api/admin/rates  → list all rate versions for the org (newest first)
// POST /api/admin/rates  → create a new rate version (OWNER or MANAGER)
//
// Rate versions are immutable once created — no PATCH/DELETE.
// The latest rate version (by effective_from) is what the app uses.

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('rate_versions')
    .select(`
      id, org_id, effective_from, currency,
      mileage_rate_per_km,
      perdiem_rate_myr,
      meal_rate_per_session,
      meal_rate_full_day, meal_rate_morning, meal_rate_noon, meal_rate_evening,
      lodging_rate_default,
      created_by_user_id, created_at,
      profiles ( display_name, email )
    `)
    .eq('org_id', ctx.orgId)
    .order('effective_from', { ascending: false })

  if (error) {
    console.error('[admin/rates] GET error:', error)
    return err('DB_ERROR', 'Failed to fetch rate versions', 500)
  }

  return NextResponse.json({ rates: data })
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const body = await request.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  // Required fields
  const { effective_from, mileage_rate_per_km } = body
  if (!effective_from || mileage_rate_per_km == null) {
    return err('VALIDATION_ERROR', 'effective_from and mileage_rate_per_km are required', 400)
  }
  if (typeof mileage_rate_per_km !== 'number' || mileage_rate_per_km < 0) {
    return err('VALIDATION_ERROR', 'mileage_rate_per_km must be a non-negative number', 400)
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effective_from)) {
    return err('VALIDATION_ERROR', 'effective_from must be in YYYY-MM-DD format', 400)
  }

  const db = createServiceRoleClient()

  // Prevent duplicate effective_from date for same org
  const { data: existing } = await db
    .from('rate_versions')
    .select('id')
    .eq('org_id', ctx.orgId)
    .eq('effective_from', effective_from)
    .single()

  if (existing) {
    return err('CONFLICT', `A rate version for ${effective_from} already exists`, 409)
  }

  const { data: newRate, error } = await db
    .from('rate_versions')
    .insert({
      org_id:                ctx.orgId,
      effective_from,
      currency:              'MYR',
      mileage_rate_per_km,
      perdiem_rate_myr:      body.perdiem_rate_myr        ?? 0,
      meal_rate_per_session: body.meal_rate_per_session   ?? null,
      meal_rate_full_day:    body.meal_rate_full_day      ?? null,
      meal_rate_morning:     body.meal_rate_morning       ?? null,
      meal_rate_noon:        body.meal_rate_noon          ?? null,
      meal_rate_evening:     body.meal_rate_evening       ?? null,
      lodging_rate_default:  body.lodging_rate_default    ?? null,
      created_by_user_id:    ctx.userId,
    })
    .select()
    .single()

  if (error) {
    console.error('[admin/rates] POST error:', error)
    return err('DB_ERROR', 'Failed to create rate version', 500)
  }

  await db.from('audit_logs').insert({
    org_id:        ctx.orgId,
    actor_user_id: ctx.userId,
    entity_type:   'rate_version',
    entity_id:     newRate.id,
    action:        'RATE_VERSION_CREATED',
    metadata:      { effective_from, mileage_rate_per_km },
  })

  return NextResponse.json({ rate: newRate }, { status: 201 })
}
