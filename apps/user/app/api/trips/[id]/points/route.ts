// apps/user/app/api/trips/[id]/points/route.ts
// POST /api/trips/[id]/points
//
// Accepts a batch of GPS points.  Idempotent: duplicate (trip_id, seq)
// pairs are silently ignored by the DB unique constraint.
// Called every ~30 seconds by the active GPS tracking screen.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

type RawPoint = {
  seq:         number
  lat:         number
  lng:         number
  accuracy_m?: number
  recorded_at: string
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id: trip_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // Verify trip belongs to org and is a GPS trip still in DRAFT
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, org_id, status, calculation_mode')
    .eq('id', trip_id)
    .eq('org_id', org.org_id)
    .single()

  if (tripError || !trip) return err('NOT_FOUND', 'Trip not found.', 404)
  if (trip.calculation_mode !== 'GPS_TRACKING') {
    return err('CONFLICT', 'Points can only be added to GPS_TRACKING trips.', 409)
  }
  if (trip.status === 'FINAL') {
    return err('CONFLICT', 'Cannot add points to a finalized trip.', 409)
  }

  // Parse and validate body
  const body = await request.json().catch(() => ({})) as { points?: RawPoint[] }
  const points = body.points

  if (!Array.isArray(points) || points.length === 0) {
    return err('VALIDATION_ERROR', 'points array is required and must not be empty.', 400)
  }
  if (points.length > 500) {
    return err('VALIDATION_ERROR', 'Maximum 500 points per batch.', 400)
  }

  // Validate each point minimally
  for (const p of points) {
    if (typeof p.seq !== 'number' || typeof p.lat !== 'number' || typeof p.lng !== 'number') {
      return err('VALIDATION_ERROR', 'Each point requires numeric seq, lat, lng.', 400)
    }
    if (p.lat < -90 || p.lat > 90 || p.lng < -180 || p.lng > 180) {
      return err('VALIDATION_ERROR', `Point seq=${p.seq} has invalid lat/lng.`, 400)
    }
  }

  // Build insert payload
  const rows = points.map((p) => ({
    trip_id,
    seq:         p.seq,
    lat:         p.lat,
    lng:         p.lng,
    accuracy_m:  p.accuracy_m ?? null,
    recorded_at: p.recorded_at,
  }))

  // Upsert — onConflict(trip_id, seq) = dedupe silently
  const { error: insertError, count } = await supabase
    .from('trip_points')
    .upsert(rows, { onConflict: 'trip_id,seq', ignoreDuplicates: true })
    .select('id')

  if (insertError) {
    console.error('[POST /api/trips/[id]/points]', insertError.message)
    return err('SERVER_ERROR', 'Failed to store GPS points.', 500)
  }

  const accepted = count ?? rows.length
  const deduped  = rows.length - accepted

  return NextResponse.json({ accepted, deduped })
}
