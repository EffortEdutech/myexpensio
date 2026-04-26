// apps/admin/app/api/workspace/claims/[claimId]/route.ts
//
// GET /api/workspace/claims/:claimId
// Returns a single claim with all items and trip data.
// READ-ONLY — workspace admins cannot edit claims.
// SUBMITTED claims are always locked (returned as-is for audit).

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ claimId: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(_req: Request, { params }: Params) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { claimId } = await params
  if (!claimId) return err('VALIDATION_ERROR', 'claimId required', 400)

  const db = createServiceRoleClient()

  // Fetch claim
  const { data: claim, error: claimError } = await db
    .from('claims')
    .select(
      `
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
      created_at,
      updated_at,
      rate_version_id,
      profiles:user_id (
        id,
        email,
        display_name,
        department
      )
    `,
    )
    .eq('id', claimId)
    .single()

  if (claimError || !claim) {
    return err('NOT_FOUND', 'Claim not found', 404)
  }

  // Enforce org scope for customer admins
  if (!ctx.isInternalStaff && ctx.orgId !== claim.org_id) {
    return err('FORBIDDEN', 'Access denied to this claim', 403)
  }

  // Fetch claim items with trip data
  const { data: items, error: itemsError } = await db
    .from('claim_items')
    .select(
      `
      id,
      type,
      amount,
      currency,
      claim_date,
      merchant,
      notes,
      receipt_url,
      qty,
      unit,
      rate,
      paid_via_tng,
      vehicle_type,
      meal_session,
      lodging_check_in,
      lodging_check_out,
      perdiem_rate_myr,
      perdiem_days,
      perdiem_destination,
      tng_transaction_id,
      trips (
        id,
        origin_text,
        destination_text,
        final_distance_m,
        distance_source,
        transport_type,
        vehicle_type,
        odometer_mode,
        started_at,
        ended_at
      )
    `,
    )
    .eq('claim_id', claimId)
    .order('claim_date', { ascending: true, nullsFirst: false })

  if (itemsError) {
    console.error('[workspace/claims/detail] items error:', itemsError)
    return err('SERVER_ERROR', 'Failed to fetch claim items', 500)
  }

  // Normalize Supabase join arrays
  const profile = Array.isArray(claim.profiles) ? claim.profiles[0] ?? null : claim.profiles

  const normalizedItems = (items ?? []).map((item) => ({
    ...item,
    trips: Array.isArray(item.trips) ? item.trips[0] ?? null : item.trips,
  }))

  return NextResponse.json({
    claim: {
      ...claim,
      profiles: profile,
    },
    items: normalizedItems,
    isLocked: claim.status === 'SUBMITTED',
  })
}
