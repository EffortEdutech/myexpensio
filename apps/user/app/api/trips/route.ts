// apps/user/app/api/trips/route.ts
// GET  /api/trips  — list trips for authenticated user's org
// POST /api/trips  — create a new trip
//
// POST supports two modes:
//
//   A) Standard (GPS or Route):
//      { calculation_mode: 'GPS_TRACKING' | 'SELECTED_ROUTE', origin_text?, destination_text?, started_at? }
//      → Creates a DRAFT trip. GPS trips proceed to /trips/start.
//        Route trips proceed to /routes/alternatives.
//
//   B) Odometer Trip (immediate finalization):
//      { calculation_mode: 'SELECTED_ROUTE', origin_text, destination_text, started_at,
//        odometer_mode: 'OVERRIDE', odometer_distance_m: <meters> }
//      → Creates the trip AND immediately sets it to FINAL with
//        distance_source = ODOMETER_OVERRIDE.
//      → No route API call is made. Does not consume route quota.
//      → Optionally accepts: odometer_start_url, odometer_end_url, notes

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { deriveDistance } from '@/lib/distance'
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
  const status = searchParams.get('status')

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
    calculation_mode?:    string
    origin_text?:         string
    destination_text?:    string
    started_at?:          string
    // Odometer Trip fields (all required together for immediate finalization)
    odometer_mode?:       string
    odometer_distance_m?: number
    odometer_start_url?:  string | null
    odometer_end_url?:    string | null
    notes?:               string
  }

  const {
    calculation_mode,
    origin_text,
    destination_text,
    started_at,
    odometer_mode,
    odometer_distance_m,
    odometer_start_url,
    odometer_end_url,
    notes,
  } = body

  if (!calculation_mode || !['GPS_TRACKING', 'SELECTED_ROUTE'].includes(calculation_mode)) {
    return err('VALIDATION_ERROR', 'calculation_mode must be GPS_TRACKING or SELECTED_ROUTE.', 400)
  }

  if (calculation_mode === 'SELECTED_ROUTE') {
    if (!origin_text?.trim() || !destination_text?.trim()) {
      return err('VALIDATION_ERROR', 'origin_text and destination_text are required for SELECTED_ROUTE.', 400)
    }
  }

  // Resolve started_at
  let resolvedStartedAt: string
  if (started_at) {
    const parsed = new Date(started_at)
    resolvedStartedAt = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
  } else {
    resolvedStartedAt = new Date().toISOString()
  }

  // ── Detect Odometer Trip: immediate finalization ───────────────────────
  // When odometer_mode=OVERRIDE + odometer_distance_m are provided at create
  // time, we bypass the DRAFT state entirely and create a FINAL trip directly.
  // This is the Odometer Trip flow — no route API needed.
  const isOdometerTrip = odometer_mode === 'OVERRIDE'
    && typeof odometer_distance_m === 'number'
    && odometer_distance_m > 0

  if (isOdometerTrip) {
    // Derive distance using Doc 09 — OVERRIDE rule takes precedence
    let final_distance_m: number
    let distance_source:  string

    try {
      const derived = deriveDistance({
        calculation_mode:          'SELECTED_ROUTE',
        selected_route_distance_m: null,   // no route was calculated
        odometer_mode:             'OVERRIDE',
        odometer_distance_m,
      })
      final_distance_m = derived.final_distance_m
      distance_source  = derived.distance_source   // 'ODOMETER_OVERRIDE'
    } catch (e: unknown) {
      return err('VALIDATION_ERROR', (e as Error).message, 400)
    }

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        org_id:               org.org_id,
        user_id:              user.id,
        calculation_mode:     'SELECTED_ROUTE',
        status:               'FINAL',          // immediately final
        started_at:           resolvedStartedAt,
        ended_at:             resolvedStartedAt, // same timestamp for odometer trips
        origin_text:          origin_text?.trim()      ?? null,
        destination_text:     destination_text?.trim() ?? null,
        odometer_mode:        'OVERRIDE',
        odometer_distance_m,
        odometer_start_url:   odometer_start_url ?? null,
        odometer_end_url:     odometer_end_url   ?? null,
        final_distance_m,
        distance_source,
        notes:                notes?.trim() ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/trips] odometer trip insert:', error.message)
      return err('SERVER_ERROR', 'Failed to create odometer trip.', 500)
    }

    console.log(`[POST /api/trips] Odometer trip created: ${trip.id} | ${final_distance_m}m | ${distance_source}`)
    return NextResponse.json({ trip }, { status: 201 })
  }

  // ── Standard trip creation (DRAFT) ────────────────────────────────────
  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      org_id:           org.org_id,
      user_id:          user.id,
      calculation_mode,
      status:           'DRAFT',
      started_at:       resolvedStartedAt,
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
