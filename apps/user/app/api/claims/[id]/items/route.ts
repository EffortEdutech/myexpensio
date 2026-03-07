// apps/user/app/api/claims/[id]/items/route.ts
// POST /api/claims/[id]/items
//
// Adds a claim item (MILEAGE / MEAL / LODGING) to a DRAFT claim.
// Recalculates claim total_amount after every insert.
// SUBMITTED claims are blocked (409 CONFLICT).

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id: claim_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // ── Fetch + validate claim ─────────────────────────────────────────────
  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select('id, org_id, status, rate_version_id')
    .eq('id', claim_id)
    .eq('org_id', org.org_id)
    .single()

  if (claimErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)

  // ── Claim lock ────────────────────────────────────────────────────────
  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'Cannot add items to a submitted claim.', 409)
  }

  const body = await request.json().catch(() => ({})) as {
    type?:         string
    mode?:         string    // RECEIPT | FIXED_RATE
    trip_id?:      string
    amount?:       number
    receipt_url?:  string
    merchant?:     string
    notes?:        string
    nights?:       number    // LODGING only
    claim_date?:   string    // YYYY-MM-DD (required for MEAL / LODGING)
    meal_session?: string    // FULL_DAY | MORNING | NOON | EVENING
    lodging_check_in?:  string  // YYYY-MM-DD
    lodging_check_out?: string  // YYYY-MM-DD
  }

  const { type, mode, trip_id, amount, receipt_url, merchant, notes, nights,
          claim_date, meal_session, lodging_check_in, lodging_check_out } = body

  if (!type || !['MILEAGE', 'MEAL', 'LODGING'].includes(type)) {
    return err('VALIDATION_ERROR', 'type must be MILEAGE, MEAL, or LODGING.', 400)
  }

  // ── MILEAGE ───────────────────────────────────────────────────────────
  if (type === 'MILEAGE') {
    if (!trip_id) return err('VALIDATION_ERROR', 'trip_id is required for MILEAGE items.', 400)

    // Fetch trip — must be FINAL with a final_distance_m
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, org_id, status, final_distance_m, distance_source, started_at')
      .eq('id', trip_id)
      .eq('org_id', org.org_id)
      .single()

    if (tripErr || !trip) return err('NOT_FOUND', 'Trip not found.', 404)

    if (trip.status !== 'FINAL' || !trip.final_distance_m) {
      return err('CONFLICT', 'Trip must be FINAL with a computed distance before adding to a claim.', 409)
    }

    // Fetch mileage rate from rate_version
    const { data: rateRow } = await supabase
      .from('rate_versions')
      .select('mileage_rate_per_km')
      .eq('id', claim.rate_version_id ?? '')
      .maybeSingle()

    // Fallback: get latest rate for org
    let mileage_rate = rateRow?.mileage_rate_per_km
    if (!mileage_rate) {
      const { data: latestRate } = await supabase
        .from('rate_versions')
        .select('mileage_rate_per_km')
        .eq('org_id', org.org_id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()
      mileage_rate = latestRate?.mileage_rate_per_km ?? 0.60   // LHDN default
    }

    const qty_km   = Number((trip.final_distance_m / 1000).toFixed(2))
    const rate_val = Number(mileage_rate)
    const item_amt = Number((qty_km * rate_val).toFixed(2))

    // Derive claim_date from trip started_at (date portion only)
    const tripDate = trip.started_at
      ? new Date(trip.started_at).toISOString().slice(0, 10)
      : null

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id:     org.org_id,
        claim_id,
        type:       'MILEAGE',
        trip_id,
        qty:        qty_km,
        unit:       'KM',
        rate:       rate_val,
        amount:     item_amt,
        currency:   'MYR',
        notes:      notes ?? null,
        claim_date: tripDate,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[POST /api/claims/[id]/items] MILEAGE insert:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to add mileage item.', 500)
    }

    // Recalc claim total
    const { data: newTotal } = await supabase
      .rpc('recalc_claim_total', { p_claim_id: claim_id })

    return NextResponse.json({
      item,
      claim_total: { currency: 'MYR', amount: newTotal ?? item_amt },
    }, { status: 201 })
  }

  // ── MEAL / LODGING ─────────────────────────────────────────────────────
  if (type === 'MEAL' || type === 'LODGING') {
    const item_mode = mode ?? 'RECEIPT'

    if (!['RECEIPT', 'FIXED_RATE'].includes(item_mode)) {
      return err('VALIDATION_ERROR', 'mode must be RECEIPT or FIXED_RATE.', 400)
    }

    let item_amount: number

    // Validate claim_date
    if (!claim_date) {
      return err('VALIDATION_ERROR', 'claim_date is required for MEAL and LODGING items.', 400)
    }

    // Validate meal_session for MEAL items — only required for FIXED_RATE
    // RECEIPT mode does not need a session (user enters actual amount from receipt)
    if (type === 'MEAL' && item_mode === 'FIXED_RATE') {
      const validSessions = ['FULL_DAY', 'MORNING', 'NOON', 'EVENING']
      if (!meal_session || !validSessions.includes(meal_session)) {
        return err('VALIDATION_ERROR', 'meal_session is required for Fixed Rate meals: FULL_DAY, MORNING, NOON, or EVENING.', 400)
      }
    }

    // Fetch org rates
    const { data: rateRow } = await supabase
      .from('rate_versions')
      .select('meal_rate_per_session, meal_rate_full_day, meal_rate_default, lodging_rate_default')
      .eq('org_id', org.org_id)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle()

    const orgMealRateSess = Number(rateRow?.meal_rate_per_session ?? rateRow?.meal_rate_default ?? 25.00)
    const orgMealRateFull = Number(rateRow?.meal_rate_full_day    ?? 60.00)
    const orgLodgingRate  = Number(rateRow?.lodging_rate_default  ?? 120.00)
    // Pick correct meal rate based on session type
    const orgMealRate = (meal_session === 'FULL_DAY') ? orgMealRateFull : orgMealRateSess

    if (item_mode === 'RECEIPT') {
      if (!amount || amount <= 0) {
        return err('VALIDATION_ERROR', 'amount is required and must be > 0 for RECEIPT mode.', 400)
      }
      item_amount = Number(amount.toFixed(2))
    } else {
      // FIXED_RATE — use org rate from rate_versions
      if (type === 'MEAL') {
        item_amount = Number(orgMealRate)
      } else {
        item_amount = Number(orgLodgingRate)
        // Multiply by nights for lodging
        if (nights && nights > 1) {
          item_amount = Number((item_amount * nights).toFixed(2))
        }
      }
    }

    const qty_val   = type === 'LODGING' && nights ? nights : 1
    const unit_rate = item_mode === 'FIXED_RATE' ? (type === 'MEAL' ? orgMealRate : orgLodgingRate) : null

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id:           org.org_id,
        claim_id,
        type,
        mode:             item_mode,
        qty:              qty_val,
        unit:             type === 'LODGING' ? null : null,  // unit constraint only allows KM; qty+meal_session carry this info
        rate:             unit_rate,
        amount:           item_amount,
        currency:         'MYR',
        receipt_url:      receipt_url ?? null,
        merchant:         merchant?.trim() ?? null,
        notes:            notes?.trim() ?? null,
        claim_date:       claim_date ?? null,
        meal_session:     type === 'MEAL' ? (meal_session ?? null) : null,
        lodging_check_in:  type === 'LODGING' ? (lodging_check_in ?? claim_date ?? null) : null,
        lodging_check_out: type === 'LODGING' ? (lodging_check_out ?? null) : null,
      })
      .select()
      .single()

    if (insertErr) {
      console.error(`[POST /api/claims/[id]/items] ${type} insert:`, insertErr.message, insertErr.details, insertErr.hint)
      return err('SERVER_ERROR', `DB error: ${insertErr.message}`, 500)
    }

    const { data: newTotal } = await supabase
      .rpc('recalc_claim_total', { p_claim_id: claim_id })

    return NextResponse.json({
      item,
      claim_total: { currency: 'MYR', amount: newTotal ?? item_amount },
    }, { status: 201 })
  }

  return err('VALIDATION_ERROR', 'Unsupported item type.', 400)
}
