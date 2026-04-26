// apps/console/app/api/console/audit/route.ts
// GET /api/console/audit — platform-wide audit logs (no org scoping)

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const page     = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 25)))
  const from     = (page - 1) * pageSize
  const entityType = searchParams.get('entity_type')?.trim() || null
  const dateFrom   = searchParams.get('from')?.trim() || null
  const dateTo     = searchParams.get('to')?.trim() || null

  const db = createServiceRoleClient()

  let query = db
    .from('audit_logs')
    .select(
      `
      id, org_id, actor_user_id, entity_type, entity_id, action, metadata, created_at,
      profiles:actor_user_id ( id, email, display_name ),
      organizations:org_id  ( id, name )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (entityType) query = query.eq('entity_type', entityType)
  if (dateFrom)   query = query.gte('created_at', dateFrom)
  if (dateTo)     query = query.lte('created_at', `${dateTo}T23:59:59Z`)

  const { data, error, count } = await query

  if (error) {
    console.error('[console/audit] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch audit logs', 500)
  }

  const logs = (data ?? []).map((row) => ({
    ...row,
    profiles:      Array.isArray(row.profiles)      ? row.profiles[0] ?? null      : row.profiles,
    organizations: Array.isArray(row.organizations) ? row.organizations[0] ?? null : row.organizations,
  }))

  return NextResponse.json({ logs, total: count ?? 0, page, pageSize })
}
