// apps/cs/app/api/console/referrals/route.ts
// GET /api/console/referrals?org_id=<agentOrgId>
// Returns referrals for a given Agent workspace. Console staff only.

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
  const orgId = searchParams.get('org_id')?.trim()

  if (!orgId) return err('VALIDATION_ERROR', 'org_id required', 400)

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('referrals')
    .select(`
      id,
      agent_org_id,
      customer_email,
      customer_name,
      status,
      signed_up_at,
      subscribed_at,
      created_at,
      updated_at
    `)
    .eq('agent_org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[console/referrals] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch referrals', 500)
  }

  return NextResponse.json({ referrals: data ?? [] })
}
