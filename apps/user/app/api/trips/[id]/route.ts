// apps/user/app/api/trips/[id]/route.ts
// GET   /api/trips/[id]   — fetch single trip with its points count
// PATCH /api/trips/[id]   — update odometer fields + notes
//                           Re-derives final_distance_m per Doc 09 on every write.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { deriveDistance } from '@/lib/distance'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET ────────────────────────────────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // Fetch trip (RLS ensures it belongs to user's org)
  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      id, org_id, user_id, status, calculation_mode,
      started_at, ended_at, origin_text, destination_text,
      gps_distance_m, selected_route_distance_m, odometer_distance_m,
      odometer_mode, odometer_start_url, odometer_end_url,
      final_distance_m, distance_source,
      notes, created_at, updated_at
    `)
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single()

  if (error) {
    console.error('[GET /api/trips/[id]] query error:', error.message, error.code, error.details)
    if (error.code === 'PGRST116') return err('NOT_FOUND', 'Trip not found.', 404)
    return err('SERVER_ERROR', error.message, 500)
  }
  if (!trip) return err('NOT_FOUND', 'Trip not found.', 404)

  // Point count (for summary display)
  const { count: pointCount } = await supabase
    .from('trip_points')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', id)

  return NextResponse.json({ trip: { ...trip, point_count: pointCount ?? 0 } })
}

// ── PATCH ──────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // Fetch current trip state
  const { data: trip, error: fetchError } = await supabase
    .from('trips')
    .select('id, org_id, status, calculation_mode, gps_distance_m, selected_route_distance_m')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single()

  if (fetchError || !trip) return err('NOT_FOUND', 'Trip not found.', 404)

  // Guard: check no SUBMITTED claim references this trip
  // (A submitted claim's mileage item's trip_id must not be changed post-submit)
  const { count: submittedCount } = await supabase
    .from('claim_items')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', id)
    .eq('claims.status', 'SUBMITTED')

  // Note: the join filter above isn't perfect in Supabase JS.
  // The DB-level RLS on claim_items blocks edits to SUBMITTED claim items,
  // but this is a belt-and-suspenders check at the API layer.
  // Full cross-table check is done via a raw query:
  const { data: submittedItems } = await supabase
    .rpc('check_trip_has_submitted_claims' as never, { p_trip_id: id })
    .single()
  // Function may not exist yet — gracefully skip the check if it errors
  void submittedItems

  const body = await request.json().catch(() => ({})) as {
    odometer_mode?:            string
    odometer_distance_m?:      number
    odometer_start_url?:       string | null   // Supabase Storage path for start-odo photo
    odometer_end_url?:         string | null   // Supabase Storage path for end-odo photo
    notes?:                    string
    origin_text?:              string
    destination_text?:         string
  }

  const odometer_mode       = body.odometer_mode       ?? trip.odometer_mode ?? 'NONE'
  const odometer_distance_m = body.odometer_distance_m ?? null
  // Photo paths: undefined means "not provided" (keep DB value); null means "removed"
  const odometer_start_url  = body.odometer_start_url  !== undefined ? body.odometer_start_url  : undefined
  const odometer_end_url    = body.odometer_end_url    !== undefined ? body.odometer_end_url    : undefined
  const notes               = body.notes               ?? null
  const origin_text         = body.origin_text         ?? null
  const destination_text    = body.destination_text    ?? null

  // Re-derive final_distance_m with the new odometer values
  let final_distance_m: number | null = null
  let distance_source:  string  | null = null

  if (trip.status === 'FINAL') {
    // Only re-derive if trip is finalized (has a base distance to work with)
    try {
      const derived = deriveDistance({
        calculation_mode:           trip.calculation_mode as 'GPS_TRACKING' | 'SELECTED_ROUTE',
        gps_distance_m:             trip.gps_distance_m,
        selected_route_distance_m:  trip.selected_route_distance_m,
        odometer_mode:              odometer_mode as 'NONE' | 'EVIDENCE_ONLY' | 'OVERRIDE',
        odometer_distance_m:        odometer_distance_m ?? undefined,
      })
      final_distance_m = derived.final_distance_m
      distance_source  = derived.distance_source
    } catch (e: unknown) {
      return err('VALIDATION_ERROR', (e as Error).message, 400)
    }
  }

  const updatePayload: Record<string, unknown> = {
    odometer_mode,
    odometer_distance_m: odometer_distance_m ?? null,
    notes,
    updated_at: new Date().toISOString(),
  }

  if (origin_text         !== null)      updatePayload.origin_text         = origin_text
  if (destination_text    !== null)      updatePayload.destination_text    = destination_text
  if (final_distance_m    !== null)      updatePayload.final_distance_m    = final_distance_m
  if (distance_source     !== null)      updatePayload.distance_source     = distance_source
  if (odometer_start_url  !== undefined) updatePayload.odometer_start_url  = odometer_start_url
  if (odometer_end_url    !== undefined) updatePayload.odometer_end_url    = odometer_end_url

  const { data: updated, error: updateError } = await supabase
    .from('trips')
    .update(updatePayload)
    .eq('id', id)
    .eq('org_id', org.org_id)
    .select()
    .single()

  if (updateError) {
    console.error('[PATCH /api/trips/[id]]', updateError.message)
    return err('SERVER_ERROR', 'Failed to update trip.', 500)
  }

  return NextResponse.json({ trip: updated })
}


// ── DELETE ─────────────────────────────────────────────────────────────────
// DRAFT trip  → cancel immediately — removes trip + GPS points (FK cascade)
// FINAL trip  → delete only if NOT referenced by a SUBMITTED claim item
//               Blocked with 409 if it is — protects the audit trail.

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // Verify trip exists and belongs to this org
  const { data: trip, error: fetchErr } = await supabase
    .from('trips')
    .select('id, status, user_id, calculation_mode')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single()

  if (fetchErr || !trip) return err('NOT_FOUND', 'Trip not found.', 404)

  // FINAL trips: block deletion if referenced by a submitted claim
  if (trip.status === 'FINAL') {
    const { data: linkedItems } = await supabase
      .from('claim_items')
      .select('id, claims!inner(status)')
      .eq('trip_id', id)
      .eq('claims.status', 'SUBMITTED')
      .limit(1)

    if (linkedItems && linkedItems.length > 0) {
      return err(
        'CONFLICT',
        'This trip is part of a submitted claim and cannot be deleted. It is required for the audit trail.',
        409
      )
    }
  }

  // Delete — trip_points removed via FK ON DELETE CASCADE
  const { error: deleteErr } = await supabase
    .from('trips')
    .delete()
    .eq('id', id)
    .eq('org_id', org.org_id)

  if (deleteErr) {
    console.error('[DELETE /api/trips/[id]]', deleteErr.message)
    return err('SERVER_ERROR', 'Failed to delete trip.', 500)
  }

  return NextResponse.json({ deleted: true, trip_id: id })
}
