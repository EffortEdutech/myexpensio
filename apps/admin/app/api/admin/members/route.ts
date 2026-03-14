// apps/admin/app/api/admin/members/route.ts
//
// GET  /api/admin/members         → list all org members with profiles
// POST /api/admin/members/invite  → create invitation (separate route below)

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET /api/admin/members ────────────────────────────────────────────────────
export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('org_members')
    .select(`
      org_id,
      user_id,
      org_role,
      status,
      created_at,
      profiles (
        id,
        email,
        display_name
      )
    `)
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[admin/members] GET error:', error)
    return err('DB_ERROR', 'Failed to fetch members', 500)
  }

  return NextResponse.json({ members: data })
}
