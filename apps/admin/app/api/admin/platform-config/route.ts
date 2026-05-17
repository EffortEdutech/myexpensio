import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function limitValue(value: unknown, fallback: number | null) {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback
}

export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('platform_config')
    .select('free_routes_per_month, free_trips_per_month, free_exports_per_month')
    .limit(1)
    .maybeSingle()

  if (error) return err('SERVER_ERROR', error.message, 500)

  return NextResponse.json({
    config: data ?? {
      free_routes_per_month: 2,
      free_trips_per_month: null,
      free_exports_per_month: 0,
    },
  })
}

export async function PATCH(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (ctx.role !== 'SUPER_ADMIN') return err('FORBIDDEN', 'SUPER_ADMIN only', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const payload = {
    id: true,
    free_routes_per_month: limitValue(body.free_routes_per_month, 2),
    free_trips_per_month: limitValue(body.free_trips_per_month, null),
    free_exports_per_month: limitValue(body.free_exports_per_month, 0),
    updated_at: new Date().toISOString(),
    updated_by: ctx.userId,
  }

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('platform_config')
    .upsert(payload)
    .select('free_routes_per_month, free_trips_per_month, free_exports_per_month')
    .single()

  if (error) return err('SERVER_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id: null,
    actor_user_id: ctx.userId,
    entity_type: 'platform_config',
    entity_id: null,
    action: 'PLATFORM_CONFIG_UPDATED',
    metadata: { after: payload },
  })

  return NextResponse.json({ config: data })
}
