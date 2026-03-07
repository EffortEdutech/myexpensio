// apps/user/app/api/claims/route.ts
// GET  /api/claims  — list claims for user's org
// POST /api/claims  — create a new DRAFT claim

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')   // DRAFT | SUBMITTED
  const from   = searchParams.get('from')
  const to     = searchParams.get('to')

  let query = supabase
    .from('claims')
    .select(`
      id, org_id, user_id, status, title,
      period_start, period_end,
      total_amount, currency,
      submitted_at, rate_version_id,
      created_at, updated_at
    `)
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (status) query = query.eq('status', status)
  if (from)   query = query.gte('period_start', from)
  if (to)     query = query.lte('period_end',   to)

  const { data, error } = await query
  if (error) {
    console.error('[GET /api/claims]', error.message)
    return err('SERVER_ERROR', 'Failed to load claims.', 500)
  }

  return NextResponse.json({ items: data ?? [] })
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = await request.json().catch(() => ({})) as {
    title?:        string
    period_start?: string
    period_end?:   string
  }

  const { title, period_start, period_end } = body

  if (!period_start || !period_end) {
    return err('VALIDATION_ERROR', 'period_start and period_end are required.', 400)
  }
  if (period_start > period_end) {
    return err('VALIDATION_ERROR', 'period_start must be on or before period_end.', 400)
  }

  // Resolve the current active rate_version for this org
  const { data: rateVersion } = await supabase
    .from('rate_versions')
    .select('id')
    .eq('org_id', org.org_id)
    .lte('effective_from', period_start)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: claim, error } = await supabase
    .from('claims')
    .insert({
      org_id:          org.org_id,
      user_id:         user.id,
      status:          'DRAFT',
      title:           title?.trim() || null,
      period_start,
      period_end,
      total_amount:    0,
      currency:        'MYR',
      rate_version_id: rateVersion?.id ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/claims]', error.message)
    return err('SERVER_ERROR', 'Failed to create claim.', 500)
  }

  return NextResponse.json({ claim }, { status: 201 })
}
