// apps/admin/app/api/admin/exports/route.ts
// GET /api/admin/exports — platform-wide export jobs for admin view

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 403 })
  }

  const db = createServiceRoleClient()
  const { searchParams } = new URL(req.url)

  const orgId = searchParams.get('org_id')?.trim() || null
  const pageSize = Math.min(Number(searchParams.get('page_size') ?? '100') || 100, 200)

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
      created_at,
      completed_at,
      profiles:user_id ( display_name, email ),
      organizations:org_id ( name, display_name ),
      report_templates:template_id ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(pageSize)

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    )
  }

  return NextResponse.json({ jobs: data ?? [] })
}