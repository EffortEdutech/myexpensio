// apps/cs/app/api/console/system/route.ts
// GET   — read platform_config (all fields including auto_approve_invitations)
// PATCH — update platform_config (SUPER_ADMIN only)

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(_req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('platform_config')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) return err('SERVER_ERROR', error.message, 500)

  const config = data ?? {
    free_routes_per_month:     2,
    free_trips_per_month:      null,
    free_exports_per_month:    null,
    auto_approve_invitations:  false,
    updated_at:                null,
    updated_by:                null,
  }

  return NextResponse.json({ config })
}

export async function PATCH(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (ctx.role !== 'SUPER_ADMIN') return err('FORBIDDEN', 'SUPER_ADMIN only', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const {
    free_routes_per_month,
    free_trips_per_month,
    free_exports_per_month,
    auto_approve_invitations,
  } = body

  if (free_routes_per_month !== undefined &&
    (typeof free_routes_per_month !== 'number' || free_routes_per_month < 0)) {
    return err('VALIDATION_ERROR', 'free_routes_per_month must be a non-negative number', 400)
  }

  if (auto_approve_invitations !== undefined &&
    typeof auto_approve_invitations !== 'boolean') {
    return err('VALIDATION_ERROR', 'auto_approve_invitations must be boolean', 400)
  }

  const db = createServiceRoleClient()

  // Fetch current for audit diff
  const { data: current } = await db
    .from('platform_config')
    .select('free_routes_per_month, free_trips_per_month, free_exports_per_month, auto_approve_invitations')
    .limit(1)
    .maybeSingle()

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: ctx.userId,
  }

  if (free_routes_per_month  !== undefined) updatePayload.free_routes_per_month  = free_routes_per_month
  if (free_trips_per_month   !== undefined) updatePayload.free_trips_per_month   = free_trips_per_month
  if (free_exports_per_month !== undefined) updatePayload.free_exports_per_month = free_exports_per_month
  if (auto_approve_invitations !== undefined) updatePayload.auto_approve_invitations = auto_approve_invitations

  const { data: updated, error } = await db
    .from('platform_config')
    .upsert({ id: true, ...updatePayload })
    .select('*')
    .single()

  if (error) return err('SERVER_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id:        null,
    actor_user_id: ctx.userId,
    entity_type:   'platform_config',
    entity_id:     null,
    action:        'PLATFORM_CONFIG_UPDATED',
    metadata:      { before: current, after: updatePayload },
  })

  return NextResponse.json({ config: updated })
}
