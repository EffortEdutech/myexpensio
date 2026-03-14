// apps/admin/app/api/admin/audit/route.ts
// GET /api/admin/audit — last 200 audit log entries for the org
import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 403 })
  if (!ctx.orgId) return NextResponse.json({ error: { code: 'MISSING_ORG' } }, { status: 400 })

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('audit_logs')
    .select(`
      id, actor_user_id, entity_type, entity_id, action, metadata, created_at,
      profiles ( display_name, email )
    `)
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 500 })

  return NextResponse.json({ logs: data })
}
