// apps/admin/app/api/admin/export-jobs/route.ts
//
// GET /api/admin/export-jobs
// Returns all export jobs across all orgs. Filter by status, org, user, format.

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

  const status    = url.searchParams.get('status')
  const org_id    = url.searchParams.get('org_id')
  const user_id   = url.searchParams.get('user_id')
  const format    = url.searchParams.get('format')
  const page      = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const page_size = Math.min(100, Math.max(1, parseInt(url.searchParams.get('page_size') ?? '50')))
  const offset    = (page - 1) * page_size

  let query = db
    .from('export_jobs')
    .select(`
      id,
      org_id,
      user_id,
      format,
      status,
      file_url,
      row_count,
      error_message,
      filters,
      template_id,
      pdf_layout,
      created_at,
      completed_at,
      profiles:user_id ( display_name, email ),
      organizations:org_id ( name, display_name ),
      report_templates:template_id ( name )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + page_size - 1)

  if (status)  query = query.eq('status', status)
  if (org_id)  query = query.eq('org_id', org_id)
  if (user_id) query = query.eq('user_id', user_id)
  if (format)  query = query.eq('format', format)

  const { data, error, count } = await query

  if (error) {
    console.error('[GET /api/admin/export-jobs]', error.message)
    return err('DB_ERROR', error.message, 500)
  }

  return NextResponse.json({
    jobs: data ?? [],
    total: count ?? 0,
    page,
    page_size,
  })
}
