// apps/user/app/api/routes/select/route.ts
// POST /api/routes/select
//
// Selects one route alternative and finalises the trip:
//   1. Sets selected_route_distance_m on the trip
//   2. Derives final_distance_m per Doc 09 (SELECTED_ROUTE mode)
//   3. Sets status = FINAL, ended_at = now

import { createClient }   from '@/lib/supabase/server'
import { getActiveOrg }   from '@/lib/org'
import { deriveDistance } from '@/lib/distance'
import { type NextRequest, NextResponse } from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(request: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // ── Parse body ─────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({})) as {
    trip_id?:    string
    route_id?:   string
    distance_m?: number
    summary?:    string
  }

  const { trip_id, route_id, distance_m, summary } = body

  if (!trip_id)                          return err('VALIDATION_ERROR', 'trip_id is required.', 400)
  if (!route_id)                         return err('VALIDATION_ERROR', 'route_id is required.', 400)
  if (!distance_m || distance_m <= 0)   return err('VALIDATION_ERROR', 'distance_m must be a positive number.', 400)

  // ── Fetch trip ─────────────────────────────────────────────────────────
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, org_id, status, calculation_mode, odometer_mode, odometer_distance_m')
    .eq('id', trip_id)
    .eq('org_id', org.org_id)
    .single()

  if (tripError || !trip) return err('NOT_FOUND', 'Trip not found.', 404)

  if (trip.calculation_mode !== 'SELECTED_ROUTE') {
    return err('CONFLICT', 'Only SELECTED_ROUTE trips can be finalised via route selection.', 409)
  }

  // ── Idempotent: already finalised ──────────────────────────────────────
  if (trip.status === 'FINAL') {
    const { data: existing } = await supabase
      .from('trips').select().eq('id', trip_id).single()
    return NextResponse.json({ trip: existing })
  }

  // ── Derive final_distance_m per Doc 09 ────────────────────────────────
  let final_distance_m: number
  let distance_source: string

  try {
    const derived = deriveDistance({
      calculation_mode:           'SELECTED_ROUTE',
      selected_route_distance_m:  distance_m,
      odometer_mode:              (trip.odometer_mode ?? 'NONE') as 'NONE' | 'EVIDENCE_ONLY' | 'OVERRIDE',
      odometer_distance_m:        trip.odometer_distance_m ?? undefined,
    })
    final_distance_m = derived.final_distance_m
    distance_source  = derived.distance_source
  } catch (e: unknown) {
    return err('VALIDATION_ERROR', (e as Error).message, 400)
  }

  // ── Write finalisation ─────────────────────────────────────────────────
  const { data: updated, error: updateError } = await supabase
    .from('trips')
    .update({
      status:                    'FINAL',
      ended_at:                  new Date().toISOString(),
      selected_route_distance_m: distance_m,
      final_distance_m,
      distance_source,
      notes:                     summary ?? null,
      updated_at:                new Date().toISOString(),
    })
    .eq('id', trip_id)
    .eq('org_id', org.org_id)
    .select()
    .single()

  if (updateError) {
    console.error('[POST /api/routes/select]', updateError.message)
    return err('SERVER_ERROR', 'Failed to finalise trip.', 500)
  }

  return NextResponse.json({ trip: updated })
}
