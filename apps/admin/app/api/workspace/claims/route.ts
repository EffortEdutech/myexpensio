// apps/admin/app/api/workspace/claims/route.ts
//
// GET /api/workspace/claims
// Returns paginated claims for the caller's workspace.
//
// Access:
//   Internal staff  → all orgs OR filtered by ?org_id=
//   Customer admin  → own org only (org_id enforced server-side)
//
// Query params:
//   org_id      (internal staff only — ignored for customers)
//   status      DRAFT | SUBMITTED
//   user_id     filter by specific user
//   from        ISO date 'YYYY-MM-DD'
//   to          ISO date 'YYYY-MM-DD'
//   page        default 1
//   page_size   default 25, max 100

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

  // Resolve org scope
  const requestedOrgId = searchParams.get('org_id')?.trim() || null
  const orgId = resolveOrgScope(ctx, requestedOrgId)

  // Filters
  const status = searchParams.get('status')?.trim() || null
  const userId = searchParams.get('user_id')?.trim() || null
  const dateFrom = searchParams.get('from')?.trim() || null
  const dateTo = searchParams.get('to')?.trim() || null

  const db = createServiceRoleClient()

  let query = db
    .from('claims')
    .select(
      `
      id,
      org_id,
      user_id,
      status,
      title,
      total_amount,
      currency,
      period_start,
      period_end,
      submitted_at,
      created_at,
      updated_at,
      profiles:user_id (
        id,
        email,
        display_name
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from * pageSize, from * pageSize + pageSize - 1)

  // Org scoping
  if (orgId) {
    query = query.eq('org_id', orgId)
  }
  // Note: if orgId is null (internal staff, no filter) — returns all orgs

  // Optional filters
  if (status && ['DRAFT', 'SUBMITTED'].includes(status)) {
    query = query.eq('status', status)
  }
  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    // End of day
    query = query.lte('created_at', `${dateTo}T23:59:59Z`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[workspace/claims] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch claims', 500)
  }

  // Normalize Supabase join arrays
  const claims = (data ?? []).map((row) => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles,
  }))

  return NextResponse.json({
    claims,
    total: count ?? 0,
    page,
    pageSize,
    hasMore: (count ?? 0) > page * pageSize,
  })
}
