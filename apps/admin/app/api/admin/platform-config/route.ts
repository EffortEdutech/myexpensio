// apps/admin/app/api/admin/platform-config/route.ts
//
// GET   /api/admin/platform-config  — read current Free tier limits
// PATCH /api/admin/platform-config  — update Free tier limits
//
// This is the admin-editable baseline for Free tier users.
// null value = unlimited for that counter.
// PRO tier is always unlimited — not configurable here.
// Per-org overrides still live in admin_settings (BETA_UNLIMITED / CUSTOM).

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function toNullableInt(value: unknown): number | null | undefined {
  // undefined = field not provided in PATCH body (skip update)
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return undefined  // invalid — ignore
  return Math.floor(n)
}

export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('platform_config')
    .select('free_routes_per_month, free_trips_per_month, free_exports_per_month, updated_at, updated_by')
    .eq('id', true)
    .maybeSingle()

  if (error) return err('SERVER_ERROR', error.message, 500)

  // Return defaults if row doesn't exist yet
  return NextResponse.json({
    config: {
      free_routes_per_month:  data?.free_routes_per_month  ?? 2,
      free_trips_per_month:   data?.free_trips_per_month   ?? null,
      free_exports_per_month: data?.free_exports_per_month ?? null,
      updated_at: data?.updated_at ?? null,
      updated_by: data?.updated_by ?? null,
    },
    note: 'null = unlimited. PRO tier is always unlimited.',
  })
}

export async function PATCH(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'JSON body required.', 400)

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: ctx.userId,
  }

  // Only update fields that are explicitly provided in the body
  const routes = toNullableInt(body.free_routes_per_month)
  const trips  = toNullableInt(body.free_trips_per_month)
  const exports = toNullableInt(body.free_exports_per_month)

  if (routes !== undefined)  patch.free_routes_per_month  = routes
  if (trips  !== undefined)  patch.free_trips_per_month   = trips
  if (exports !== undefined) patch.free_exports_per_month = exports

  if (Object.keys(patch).length <= 2) {
    return err('VALIDATION_ERROR', 'No valid fields to update.', 400)
  }

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('platform_config')
    .upsert({ id: true, ...patch })
    .select('free_routes_per_month, free_trips_per_month, free_exports_per_month, updated_at')
    .single()

  if (error) return err('SERVER_ERROR', error.message, 500)

  // Audit log
  await db.from('audit_logs').insert({
    actor_user_id: ctx.userId,
    entity_type: 'platform_config',
    entity_id: 'singleton',
    action: 'PLATFORM_CONFIG_UPDATED',
    metadata: {
      free_routes_per_month:  data.free_routes_per_month,
      free_trips_per_month:   data.free_trips_per_month,
      free_exports_per_month: data.free_exports_per_month,
    },
  })

  return NextResponse.json({ config: data })
}
