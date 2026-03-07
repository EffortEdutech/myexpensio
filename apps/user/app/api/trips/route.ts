// apps/user/app/api/trips/route.ts
// GET  /api/trips  — list trips for authenticated user's org
// POST /api/trips  — create a new DRAFT trip

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
  const from   = searchParams.get('from')
  const to     = searchParams.get('to')
  const status = searchParams.get('status')   // DRAFT | FINAL

  let query = supabase
    .from('trips')
    .select(`
      id, org_id, user_id, status, calculation_mode,
      started_at, ended_at, origin_text, destination_text,
      gps_distance_m, selected_route_distance_m, odometer_distance_m,
      odometer_mode, final_distance_m, distance_source,
      notes, created_at, updated_at
    `)
    .eq('org_id', org.org_id)
    .order('started_at', { ascending: false })
    .limit(50)

  if (from)   query = query.gte('started_at', from)
  if (to)     query = query.lte('started_at', to + 'T23:59:59Z')
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) {
    console.error('[GET /api/trips]', error.message)
    return err('SERVER_ERROR', 'Failed to load trips.', 500)
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
    calculation_mode?: string
    origin_text?:      string
    destination_text?: string
  }

  const { calculation_mode, origin_text, destination_text } = body

  if (!calculation_mode || !['GPS_TRACKING', 'SELECTED_ROUTE'].includes(calculation_mode)) {
    return err('VALIDATION_ERROR', 'calculation_mode must be GPS_TRACKING or SELECTED_ROUTE.', 400)
  }

  if (calculation_mode === 'SELECTED_ROUTE') {
    if (!origin_text?.trim() || !destination_text?.trim()) {
      return err('VALIDATION_ERROR', 'origin_text and destination_text are required for SELECTED_ROUTE.', 400)
    }
  }

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      org_id:           org.org_id,
      user_id:          user.id,
      calculation_mode,
      status:           'DRAFT',
      started_at:       new Date().toISOString(),
      origin_text:      origin_text?.trim()      ?? null,
      destination_text: destination_text?.trim() ?? null,
      odometer_mode:    'NONE',
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/trips]', error.message)
    return err('SERVER_ERROR', 'Failed to create trip.', 500)
  }

  return NextResponse.json({ trip }, { status: 201 })
}
