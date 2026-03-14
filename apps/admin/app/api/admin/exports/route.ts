// apps/admin/app/api/admin/exports/route.ts
// GET /api/admin/exports — all org export jobs (admin view)
import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 403 })
  if (!ctx.orgId) return NextResponse.json({ error: { code: 'MISSING_ORG' } }, { status: 400 })

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('export_jobs')
    .select(`
      id, format, status, file_url, row_count, created_at, completed_at,
      profiles ( display_name, email )
    `)
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 500 })

  return NextResponse.json({ jobs: data })
}
