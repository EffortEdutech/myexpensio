// apps/user/app/api/claims/[id]/items/route.ts
//
// POST /api/claims/[id]/items
//
// Adds a claim item to a DRAFT claim. Supported types:
//   MILEAGE   — linked trip, auto-calculated from final_distance_m
//   MEAL      — receipt or fixed-rate
//   LODGING   — receipt or fixed-rate
//   TOLL      — from TNG transaction or manual entry
//   PARKING   — from TNG transaction or manual entry
//   TAXI      — manual, receipt upload
//   GRAB      — manual, receipt upload
//   TRAIN     — manual, receipt upload
//   FLIGHT    — manual, receipt upload
//
// SUBMITTED claims are blocked (409 CONFLICT) on ALL types.
// Claim total is recalculated after every insert.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── Fallback: direct SUM if recalc RPC is unavailable ─────────────────────────
async function sumAndUpdateTotal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  claim_id: string,
): Promise<number> {
  const { data: items } = await supabase
    .from('claim_items')
    .select('amount')
    .eq('claim_id', claim_id)
  const total = (items ?? []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
  await supabase
    .from('claims')
    .update({ total_amount: total, updated_at: new Date().toISOString() })
    .eq('id', claim_id)
  return total
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: Params) {
  const { id: claim_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // Fetch + validate claim
  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select('id, org_id, status, rate_version_id')
    .eq('id', claim_id)
    .eq('org_id', org.org_id)
    .single()

  if (claimErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)

  // CLAIM LOCK — absolute in Phase 1
  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'Cannot add items to a submitted claim.', 409)
  }

  const body = await request.json().catch(() => ({})) as {
    type?:                string
    mode?:                string
    trip_id?:             string
    tng_transaction_id?:  string
    amount?:              number
    receipt_url?:         string
    merchant?:            string
    notes?:               string
    nights?:              number
    claim_date?:          string
    meal_session?:        string
    lodging_check_in?:    string
    lodging_check_out?:   string
    entry_location?:      string
    exit_location?:       string
    location?:            string
  }

  const {
    type, mode, trip_id, tng_transaction_id,
    amount, receipt_url, merchant, notes, nights,
    claim_date, meal_session, lodging_check_in, lodging_check_out,
    entry_location, exit_location, location,
  } = body

  const ALL_TYPES = ['MILEAGE', 'MEAL', 'LODGING', 'TOLL', 'PARKING', 'TAXI', 'GRAB', 'TRAIN', 'FLIGHT']
  if (!type || !ALL_TYPES.includes(type)) {
    return err('VALIDATION_ERROR', `type must be one of: ${ALL_TYPES.join(', ')}.`, 400)
  }

  // ── MILEAGE ───────────────────────────────────────────────────────────────
  if (type === 'MILEAGE') {
    if (!trip_id) return err('VALIDATION_ERROR', 'trip_id is required for MILEAGE items.', 400)

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

    const { data: rateRow } = await supabase
      .from('rate_versions')
      .select('mileage_rate_per_km')
      .eq('id', claim.rate_version_id ?? '')
      .maybeSingle()

    let mileage_rate = rateRow?.mileage_rate_per_km
    if (!mileage_rate) {
      const { data: latestRate } = await supabase
        .from('rate_versions')
        .select('mileage_rate_per_km')
        .eq('org_id', org.org_id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()
      mileage_rate = latestRate?.mileage_rate_per_km ?? 0.60
    }

    const qty_km   = Number((trip.final_distance_m / 1000).toFixed(2))
    const rate_val = Number(mileage_rate)
    const item_amt = Number((qty_km * rate_val).toFixed(2))
    const tripDate = trip.started_at
      ? new Date(trip.started_at).toISOString().slice(0, 10)
      : null

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id, claim_id, type: 'MILEAGE', trip_id,
        qty: qty_km, unit: 'KM', rate: rate_val, amount: item_amt,
        currency: 'MYR', notes: notes ?? null, claim_date: tripDate,
      })
      .select().single()

    if (insertErr) {
      console.error('[POST items] MILEAGE insert:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to add mileage item.', 500)
    }

    const { data: rpcTotal, error: recalcErr } = await supabase
      .rpc('recalc_claim_total', { p_claim_id: claim_id })
    const newTotal = recalcErr
      ? await sumAndUpdateTotal(supabase, claim_id)
      : Number(rpcTotal ?? item_amt)

    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: newTotal } }, { status: 201 })
  }

  // ── MEAL / LODGING ────────────────────────────────────────────────────────
  if (type === 'MEAL' || type === 'LODGING') {
    const item_mode = mode ?? 'RECEIPT'

    if (!['RECEIPT', 'FIXED_RATE'].includes(item_mode)) {
      return err('VALIDATION_ERROR', 'mode must be RECEIPT or FIXED_RATE.', 400)
    }
    if (!claim_date) {
      return err('VALIDATION_ERROR', 'claim_date is required for MEAL and LODGING items.', 400)
    }
    if (type === 'MEAL' && item_mode === 'FIXED_RATE') {
      const validSessions = ['FULL_DAY', 'MORNING', 'NOON', 'EVENING']
      if (!meal_session || !validSessions.includes(meal_session)) {
        return err('VALIDATION_ERROR', 'meal_session is required for Fixed Rate meals: FULL_DAY, MORNING, NOON, or EVENING.', 400)
      }
    }

    const { data: rateRow } = await supabase
      .from('rate_versions')
      .select('meal_rate_per_session, meal_rate_full_day, meal_rate_default, lodging_rate_default')
      .eq('org_id', org.org_id)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle()

    const orgMealRateSess = Number(rateRow?.meal_rate_per_session ?? rateRow?.meal_rate_default ?? 25.00)
    const orgMealRateFull = Number(rateRow?.meal_rate_full_day ?? 60.00)
    const orgLodgingRate  = Number(rateRow?.lodging_rate_default ?? 120.00)
    const orgMealRate     = meal_session === 'FULL_DAY' ? orgMealRateFull : orgMealRateSess

    let item_amount: number
    if (item_mode === 'RECEIPT') {
      if (!amount || amount <= 0) {
        return err('VALIDATION_ERROR', 'amount is required and must be > 0 for RECEIPT mode.', 400)
      }
      item_amount = Number(amount.toFixed(2))
    } else {
      item_amount = type === 'MEAL'
        ? Number(orgMealRate)
        : Number(nights && nights > 1 ? (orgLodgingRate * nights).toFixed(2) : orgLodgingRate)
    }

    const qty_val   = type === 'LODGING' && nights ? nights : 1
    const unit_rate = item_mode === 'FIXED_RATE' ? (type === 'MEAL' ? orgMealRate : orgLodgingRate) : null

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id, claim_id, type, mode: item_mode,
        qty: qty_val, rate: unit_rate, amount: item_amount, currency: 'MYR',
        receipt_url: receipt_url ?? null, merchant: merchant?.trim() ?? null,
        notes: notes?.trim() ?? null, claim_date: claim_date ?? null,
        meal_session: type === 'MEAL' ? (meal_session ?? null) : null,
        lodging_check_in:  type === 'LODGING' ? (lodging_check_in ?? claim_date ?? null) : null,
        lodging_check_out: type === 'LODGING' ? (lodging_check_out ?? null) : null,
      })
      .select().single()

    if (insertErr) {
      console.error(`[POST items] ${type} insert:`, insertErr.message)
      return err('SERVER_ERROR', `DB error: ${insertErr.message}`, 500)
    }

    const { data: rpcTotal, error: recalcErr } = await supabase
      .rpc('recalc_claim_total', { p_claim_id: claim_id })
    const newTotal = recalcErr
      ? await sumAndUpdateTotal(supabase, claim_id)
      : Number(rpcTotal ?? item_amount)

    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: newTotal } }, { status: 201 })
  }

  // ── TOLL ──────────────────────────────────────────────────────────────────
  if (type === 'TOLL') {
    let toll_amount:     number
    let toll_merchant:   string | null = null
    let toll_claim_date: string | null = null

    if (tng_transaction_id) {
      // ── From TNG statement ──────────────────────────────────────────
      const { data: txn, error: txnErr } = await supabase
        .from('tng_transactions')
        .select('id, amount, entry_location, exit_location, entry_datetime, claimed, sector')
        .eq('id', tng_transaction_id)
        .eq('user_id', user.id)
        .eq('org_id', org.org_id)
        .single()

      if (txnErr || !txn)   return err('NOT_FOUND', 'TNG transaction not found.', 404)
      if (txn.claimed)      return err('CONFLICT', 'This TNG transaction has already been claimed.', 409)
      if (txn.sector !== 'TOLL') {
        return err('VALIDATION_ERROR', 'Transaction sector is not TOLL.', 400)
      }

      toll_amount     = Number(txn.amount)
      toll_claim_date = txn.entry_datetime
        ? new Date(txn.entry_datetime).toISOString().slice(0, 10)
        : null
      toll_merchant   = [txn.entry_location, txn.exit_location]
        .filter(Boolean).join(' → ') || null

    } else {
      // ── Manual entry ────────────────────────────────────────────────
      if (!amount || amount <= 0) {
        return err('VALIDATION_ERROR', 'amount is required for manual TOLL entry.', 400)
      }
      if (!claim_date) {
        return err('VALIDATION_ERROR', 'claim_date is required for manual TOLL entry.', 400)
      }
      toll_amount     = Number(amount.toFixed(2))
      toll_claim_date = claim_date
      toll_merchant   = entry_location
        ? [entry_location, exit_location].filter(Boolean).join(' → ')
        : merchant?.trim() ?? null
    }

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id:     org.org_id,
        claim_id,
        type:       'TOLL',
        amount:     toll_amount,
        currency:   'MYR',
        merchant:   toll_merchant,
        notes:      notes?.trim() ?? null,
        claim_date: toll_claim_date,
        receipt_url: receipt_url ?? null,
      })
      .select().single()

    if (insertErr) {
      console.error('[POST items] TOLL insert:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to add toll item.', 500)
    }

    // Mark TNG transaction as claimed
    if (tng_transaction_id) {
      const { error: markErr } = await supabase
        .from('tng_transactions')
        .update({ claimed: true, claim_item_id: item.id })
        .eq('id', tng_transaction_id)
      if (markErr) {
        console.error('[POST items] TOLL mark-claimed:', markErr.message)
        // Non-fatal — item is already saved
      }
    }

    const { data: rpcTotal, error: recalcErr } = await supabase
      .rpc('recalc_claim_total', { p_claim_id: claim_id })
    const newTotal = recalcErr
      ? await sumAndUpdateTotal(supabase, claim_id)
      : Number(rpcTotal ?? toll_amount)

    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: newTotal } }, { status: 201 })
  }

  // ── PARKING ───────────────────────────────────────────────────────────────
  if (type === 'PARKING') {
    let pk_amount:     number
    let pk_location:   string | null = null
    let pk_claim_date: string | null = null

    if (tng_transaction_id) {
      // ── From TNG statement ──────────────────────────────────────────
      const { data: txn, error: txnErr } = await supabase
        .from('tng_transactions')
        .select('id, amount, entry_location, entry_datetime, claimed, sector')
        .eq('id', tng_transaction_id)
        .eq('user_id', user.id)
        .eq('org_id', org.org_id)
        .single()

      if (txnErr || !txn) return err('NOT_FOUND', 'TNG transaction not found.', 404)
      if (txn.claimed)    return err('CONFLICT', 'This TNG transaction has already been claimed.', 409)
      if (txn.sector !== 'PARKING') {
        return err('VALIDATION_ERROR', 'Transaction sector is not PARKING.', 400)
      }

      pk_amount     = Number(txn.amount)
      pk_location   = txn.entry_location ?? null
      pk_claim_date = txn.entry_datetime
        ? new Date(txn.entry_datetime).toISOString().slice(0, 10)
        : null

    } else {
      // ── Manual entry ────────────────────────────────────────────────
      if (!amount || amount <= 0) {
        return err('VALIDATION_ERROR', 'amount is required for manual PARKING entry.', 400)
      }
      if (!claim_date) {
        return err('VALIDATION_ERROR', 'claim_date is required for manual PARKING entry.', 400)
      }
      pk_amount     = Number(amount.toFixed(2))
      pk_claim_date = claim_date
      pk_location   = location ?? merchant?.trim() ?? null
    }

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id:     org.org_id,
        claim_id,
        type:       'PARKING',
        amount:     pk_amount,
        currency:   'MYR',
        merchant:   pk_location,
        notes:      notes?.trim() ?? null,
        claim_date: pk_claim_date,
        receipt_url: receipt_url ?? null,
      })
      .select().single()

    if (insertErr) {
      console.error('[POST items] PARKING insert:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to add parking item.', 500)
    }

    if (tng_transaction_id) {
      await supabase
        .from('tng_transactions')
        .update({ claimed: true, claim_item_id: item.id })
        .eq('id', tng_transaction_id)
    }

    const { data: rpcTotal, error: recalcErr } = await supabase
      .rpc('recalc_claim_total', { p_claim_id: claim_id })
    const newTotal = recalcErr
      ? await sumAndUpdateTotal(supabase, claim_id)
      : Number(rpcTotal ?? pk_amount)

    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: newTotal } }, { status: 201 })
  }

  // ── TAXI / GRAB / TRAIN / FLIGHT (manual, receipt-based) ─────────────────
  if (['TAXI', 'GRAB', 'TRAIN', 'FLIGHT'].includes(type)) {
    if (!amount || amount <= 0) {
      return err('VALIDATION_ERROR', `amount is required for ${type} items.`, 400)
    }
    if (!claim_date) {
      return err('VALIDATION_ERROR', `claim_date (YYYY-MM-DD) is required for ${type} items.`, 400)
    }

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id:     org.org_id,
        claim_id,
        type,
        mode:       'RECEIPT',
        amount:     Number(amount.toFixed(2)),
        currency:   'MYR',
        receipt_url: receipt_url ?? null,
        merchant:   merchant?.trim() ?? null,
        notes:      notes?.trim() ?? null,
        claim_date,
      })
      .select().single()

    if (insertErr) {
      console.error(`[POST items] ${type} insert:`, insertErr.message)
      return err('SERVER_ERROR', `Failed to add ${type} item.`, 500)
    }

    const { data: rpcTotal, error: recalcErr } = await supabase
      .rpc('recalc_claim_total', { p_claim_id: claim_id })
    const newTotal = recalcErr
      ? await sumAndUpdateTotal(supabase, claim_id)
      : Number(rpcTotal ?? amount)

    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: newTotal } }, { status: 201 })
  }

  return err('VALIDATION_ERROR', 'Unsupported item type.', 400)
}
