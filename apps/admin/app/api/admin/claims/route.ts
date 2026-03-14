// apps/admin/app/api/admin/claims/route.ts
//
// GET /api/admin/claims
// Returns all claims for the admin's org (SUBMITTED + DRAFT, read-only).
// Optional query params: status=SUBMITTED|DRAFT

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const url    = new URL(request.url)
  const status = url.searchParams.get('status')

  const db = createServiceRoleClient()

  let query = db
    .from('claims')
    .select(`
      id, user_id, status, title, total_amount, currency,
      period_start, period_end, submitted_at, created_at,
      profiles ( display_name, email )
    `)
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: false })

  if (status === 'SUBMITTED' || status === 'DRAFT') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('[admin/claims] GET error:', error)
    return err('DB_ERROR', 'Failed to fetch claims', 500)
  }

  return NextResponse.json({ claims: data })
}
