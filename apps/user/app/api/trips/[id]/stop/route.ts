// apps/user/app/api/trips/[id]/stop/route.ts
// POST /api/trips/[id]/stop
//
// Stops a GPS trip:
//   1. Loads all trip_points (ordered by seq)
//   2. Computes Haversine total distance → gps_distance_m
//   3. Derives final_distance_m per Doc 09
//   4. Sets status = FINAL, ended_at = now
//
// Idempotent: calling again on an already-FINAL trip returns the trip unchanged.

import { createClient }   from '@/lib/supabase/server'
import { getActiveOrg }   from '@/lib/org'
import { totalDistanceMeters } from '@/lib/haversine'
import { deriveDistance } from '@/lib/distance'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(_request: NextRequest, { params }: Params) {
  const { id: trip_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // Fetch trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select(`
      id, org_id, status, calculation_mode,
      odometer_mode, odometer_distance_m,
      gps_distance_m, final_distance_m, distance_source
    `)
    .eq('id', trip_id)
    .eq('org_id', org.org_id)
    .single()

  if (tripError || !trip) return err('NOT_FOUND', 'Trip not found.', 404)

  if (trip.calculation_mode !== 'GPS_TRACKING') {
    return err('CONFLICT', 'Only GPS_TRACKING trips can be stopped via this endpoint.', 409)
  }

  // Idempotent: already finalized
  if (trip.status === 'FINAL') {
    return NextResponse.json({ trip })
  }

  // Load all GPS points ordered by seq
  const { data: points, error: pointsError } = await supabase
    .from('trip_points')
    .select('seq, lat, lng')
    .eq('trip_id', trip_id)
    .order('seq', { ascending: true })

  if (pointsError) {
    console.error('[POST /api/trips/[id]/stop] points fetch:', pointsError.message)
    return err('SERVER_ERROR', 'Failed to load GPS points.', 500)
  }

  if (!points || points.length < 2) {
    return err(
      'VALIDATION_ERROR',
      'Trip has fewer than 2 GPS points. Record more distance before stopping.',
      400
    )
  }

  // Compute Haversine distance
  const gps_distance_m = totalDistanceMeters(points)

  // Derive final_distance_m per Doc 09
  let final_distance_m: number
  let distance_source: string

  try {
    const derived = deriveDistance({
      calculation_mode:  'GPS_TRACKING',
      gps_distance_m,
      odometer_mode:     (trip.odometer_mode ?? 'NONE') as 'NONE' | 'EVIDENCE_ONLY' | 'OVERRIDE',
      odometer_distance_m: trip.odometer_distance_m ?? undefined,
    })
    final_distance_m = derived.final_distance_m
    distance_source  = derived.distance_source
  } catch (e: unknown) {
    return err('VALIDATION_ERROR', (e as Error).message, 400)
  }

  // Write finalization
  const { data: updated, error: updateError } = await supabase
    .from('trips')
    .update({
      status:           'FINAL',
      ended_at:         new Date().toISOString(),
      gps_distance_m,
      final_distance_m,
      distance_source,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', trip_id)
    .eq('org_id', org.org_id)
    .select()
    .single()

  if (updateError) {
    console.error('[POST /api/trips/[id]/stop] update:', updateError.message)
    return err('SERVER_ERROR', 'Failed to finalize trip.', 500)
  }

  return NextResponse.json({ trip: updated })
}
