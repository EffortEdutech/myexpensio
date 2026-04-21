// apps/admin/app/api/admin/claims/[id]/route.ts
//
// GET /api/admin/claims/:id
// Returns a single claim with all items + trip data (read-only, all orgs).

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()

  const { data: claim, error: claimErr } = await db
    .from('claims')
    .select(`
      id,
      org_id,
      user_id,
      status,
      title,
      total_amount,
      currency,
      period_start,
      period_end,
      submitted_at,
      rate_version_id,
      user_rate_version_id,
      created_at,
      updated_at,
      organizations ( id, name, display_name ),
      profiles:user_id ( id, display_name, email, department, company_name )
    `)
    .eq('id', id)
    .single()

  if (claimErr || !claim) {
    return err('NOT_FOUND', 'Claim not found.', 404)
  }

  const { data: items, error: itemsErr } = await db
    .from('claim_items')
    .select(`
      id,
      type,
      mode,
      amount,
      currency,
      qty,
      unit,
      rate,
      receipt_url,
      merchant,
      notes,
      claim_date,
      meal_session,
      lodging_check_in,
      lodging_check_out,
      paid_via_tng,
      tng_transaction_id,
      perdiem_rate_myr,
      perdiem_days,
      perdiem_destination,
      vehicle_type,
      created_at,
      trip_id,
      trips (
        id,
        calculation_mode,
        distance_source,
        final_distance_m,
        origin_text,
        destination_text,
        vehicle_type,
        transport_type,
        started_at,
        ended_at
      )
    `)
    .eq('claim_id', id)
    .order('created_at', { ascending: true })

  if (itemsErr) {
    console.error('[GET /api/admin/claims/:id] items:', itemsErr.message)
    return err('DB_ERROR', 'Failed to load claim items.', 500)
  }

  // Load rate snapshot for display
  let rateSnapshot = null
  if (claim.user_rate_version_id) {
    const { data: rate } = await db
      .from('user_rate_versions')
      .select('mileage_rate_per_km, motorcycle_rate_per_km, perdiem_rate_myr, rate_label, effective_from')
      .eq('id', claim.user_rate_version_id)
      .maybeSingle()
    rateSnapshot = rate
  }

  return NextResponse.json({
    claim,
    items: items ?? [],
    rate_snapshot: rateSnapshot,
  })
}
