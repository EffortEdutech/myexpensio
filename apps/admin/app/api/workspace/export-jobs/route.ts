// apps/admin/app/api/workspace/export-jobs/route.ts
//
// GET /api/workspace/export-jobs
// Defensive version: selects * to avoid missing-column 500s.
// Profiles fetched in a second query (no FK join).

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
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (orgId)   query = query.eq('org_id', orgId)
  if (format)  query = query.eq('format', format)
  if (status && ['PENDING', 'PROCESSING', 'DONE', 'FAILED'].includes(status))
    query = query.eq('status', status)

  const { data: jobs, error, count } = await query

  if (error) {
    console.error('[workspace/export-jobs] DB error:', JSON.stringify(error))
    return err('SERVER_ERROR', error.message, 500)
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ jobs: [], total: count ?? 0, page, pageSize })
  }

  const userIds = [...new Set(
    jobs.map((j: Record<string, unknown>) => j.user_id as string).filter(Boolean)
  )]

  const { data: profiles } = userIds.length > 0
    ? await db.from('profiles').select('id, email, display_name').in('id', userIds)
    : { data: [] }

  const profileMap = Object.fromEntries(
    (profiles ?? []).map(p => [p.id, p])
  )

  const result = jobs.map((job: Record<string, unknown>) => ({
    id:            job.id ?? null,
    org_id:        job.org_id ?? null,
    user_id:       job.user_id ?? null,
    format:        job.format ?? job.export_format ?? null,
    status:        job.status ?? null,
    row_count:     job.row_count ?? job.rows_count ?? null,
    error_message: job.error_message ?? job.error ?? null,
    created_at:    job.created_at ?? null,
    completed_at:  job.completed_at ?? job.finished_at ?? null,
    file_path:     job.file_path ?? job.output_path ?? null,
    template_id:   job.template_id ?? null,
    profiles:      profileMap[job.user_id as string] ?? null,
  }))

  return NextResponse.json({ jobs: result, total: count ?? 0, page, pageSize })
}
