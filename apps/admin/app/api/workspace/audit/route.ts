// apps/admin/app/api/workspace/audit/route.ts
//
// GET /api/workspace/audit
// Returns paginated audit logs for the workspace.
//
// Access:
//   Internal staff  → all orgs OR filtered by ?org_id=
//   Customer admin  → own org only
//
// Query params:
//   org_id        (internal staff only)
//   actor_user_id filter by actor
//   entity_type   e.g., 'claim', 'invitation', 'org_member'
//   from          ISO date
//   to            ISO date
//   page          default 1
//   page_size     default 25, max 100

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth, resolveOrgScope } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 25)))
  const from = page - 1

  const requestedOrgId = searchParams.get('org_id')?.trim() || null
  const orgId = resolveOrgScope(ctx, requestedOrgId)

  const actorUserId = searchParams.get('actor_user_id')?.trim() || null
  const entityType = searchParams.get('entity_type')?.trim() || null
  const dateFrom = searchParams.get('from')?.trim() || null
  const dateTo = searchParams.get('to')?.trim() || null

  const db = createServiceRoleClient()

  let query = db
    .from('audit_logs')
    .select(
      `
      id,
      org_id,
      actor_user_id,
      entity_type,
      entity_id,
      action,
      metadata,
      created_at,
      profiles:actor_user_id (
        id,
        email,
        display_name
      ),
      organizations:org_id (
        id,
        name
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from * pageSize, from * pageSize + pageSize - 1)

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  if (actorUserId) {
    query = query.eq('actor_user_id', actorUserId)
  }
  if (entityType) {
    query = query.eq('entity_type', entityType)
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59Z`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[workspace/audit] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch audit logs', 500)
  }

  // Normalize Supabase join arrays
  const logs = (data ?? []).map((row) => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles,
    organizations: Array.isArray(row.organizations) ? row.organizations[0] ?? null : row.organizations,
  }))

  return NextResponse.json({
    logs,
    total: count ?? 0,
    page,
    pageSize,
    hasMore: (count ?? 0) > page * pageSize,
  })
}
