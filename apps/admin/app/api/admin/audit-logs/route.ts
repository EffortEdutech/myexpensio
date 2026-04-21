// apps/admin/app/api/admin/audit-logs/route.ts
//
// GET /api/admin/audit-logs
// Returns audit log entries. Supports filter by org, actor, entity_type, date range.

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const url = new URL(req.url)

  const org_id      = url.searchParams.get('org_id')
  const actor_id    = url.searchParams.get('actor_id')
  const entity_type = url.searchParams.get('entity_type')
  const action      = url.searchParams.get('action')
  const from        = url.searchParams.get('from')
  const to          = url.searchParams.get('to')
  const page        = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const page_size   = Math.min(200, Math.max(1, parseInt(url.searchParams.get('page_size') ?? '50')))
  const offset      = (page - 1) * page_size

  let query = db
    .from('audit_logs')
    .select(`
      id,
      org_id,
      actor_user_id,
      entity_type,
      entity_id,
      action,
      metadata,
      created_at,
      profiles:actor_user_id ( display_name, email ),
      organizations:org_id ( name, display_name )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + page_size - 1)

  if (org_id)      query = query.eq('org_id', org_id)
  if (actor_id)    query = query.eq('actor_user_id', actor_id)
  if (entity_type) query = query.eq('entity_type', entity_type)
  if (action)      query = query.eq('action', action)
  if (from)        query = query.gte('created_at', from)
  if (to)          query = query.lte('created_at', to + 'T23:59:59Z')

  const { data, error, count } = await query

  if (error) {
    console.error('[GET /api/admin/audit-logs]', error.message)
    return err('DB_ERROR', error.message, 500)
  }

  // Distinct entity types for filter dropdown
  const { data: entityTypes } = await db
    .from('audit_logs')
    .select('entity_type')
    .order('entity_type')

  const distinctEntityTypes = [...new Set((entityTypes ?? []).map(r => r.entity_type).filter(Boolean))]

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    page,
    page_size,
    entity_types: distinctEntityTypes,
  })
}
