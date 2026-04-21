// apps/admin/app/api/admin/members/route.ts
//
// GET /api/admin/members
// Platform-wide member listing for admin app.
// Optional ?org_id=... filter.

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const db = createServiceRoleClient()
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('org_id')?.trim() || null

  let query = db
    .from('org_members')
    .select(`
      org_id,
      user_id,
      org_role,
      status,
      created_at,
      organizations(name),
      profiles:user_id (
        id,
        email,
        display_name
      )
    `)
    .order('created_at', { ascending: true })

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[admin/members] GET error:', error)
    return err('DB_ERROR', 'Failed to fetch members', 500)
  }

  return NextResponse.json({ members: data ?? [] })
}