// apps/console/app/api/console/invitation-queue/route.ts
//
// GET /api/console/invitation-queue
// All invitation_requests across all workspaces, ordered by created_at.
// Console staff only. No org scoping.

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
  const status = searchParams.get('status')?.trim() || null
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 50)))
  const from = (page - 1) * pageSize

  const db = createServiceRoleClient()

  let query = db
    .from('invitation_requests')
    .select(
      `
      id,
      workspace_id,
      workspace_type,
      requested_by_user_id,
      requested_email,
      requested_role,
      status,
      internal_assigned_to,
      rejection_reason,
      notes,
      created_at,
      approved_at,
      executed_at,
      organizations:workspace_id (
        id,
        name,
        workspace_type
      ),
      requester:requested_by_user_id (
        id,
        email,
        display_name
      ),
      assignee:internal_assigned_to (
        id,
        email,
        display_name
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[console/invitation-queue] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch invitation requests', 500)
  }

  const requests = (data ?? []).map((row) => ({
    ...row,
    organizations: Array.isArray(row.organizations) ? row.organizations[0] ?? null : row.organizations,
    requester:     Array.isArray(row.requester)     ? row.requester[0]     ?? null : row.requester,
    assignee:      Array.isArray(row.assignee)      ? row.assignee[0]      ?? null : row.assignee,
  }))

  return NextResponse.json({ requests, total: count ?? 0, page, pageSize })
}
