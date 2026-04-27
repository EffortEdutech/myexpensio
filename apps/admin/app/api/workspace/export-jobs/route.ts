// apps/admin/app/api/workspace/export-jobs/route.ts
//
// GET /api/workspace/export-jobs
// Returns paginated export_jobs for the caller's workspace.
// Internal staff can filter by org_id; workspace admins see own org only.

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
  const page     = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 25)))
  const from     = (page - 1) * pageSize

  const requestedOrgId = searchParams.get('org_id')?.trim() || null
  const orgId          = resolveOrgScope(ctx, requestedOrgId)

  const format = searchParams.get('format')?.trim() || null
  const status = searchParams.get('status')?.trim() || null

  const db = createServiceRoleClient()

  let query = db
    .from('export_jobs')
    .select(
      `
      id,
      org_id,
      user_id,
      format,
      status,
      row_count,
      error_message,
      created_at,
      completed_at,
      file_path,
      template_id,
      profiles:user_id (
        id, email, display_name
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (orgId)   query = query.eq('org_id', orgId)
  if (format)  query = query.eq('format', format)
  if (status && ['PENDING','PROCESSING','DONE','FAILED'].includes(status))
    query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) {
    console.error('[workspace/export-jobs] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch export jobs', 500)
  }

  const jobs = (data ?? []).map(row => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles,
  }))

  return NextResponse.json({ jobs, total: count ?? 0, page, pageSize })
}
