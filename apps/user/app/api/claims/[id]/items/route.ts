// apps/user/app/api/claims/[id]/items/route.ts
// POST /api/claims/[id]/items   — add item to DRAFT claim
// DELETE (handled in /api/claims/[id]/items/[item_id]/route.ts)
//
// Supported types (all 11):
//   MILEAGE   — trip_id required
//   MEAL      — mode: FIXED_RATE | RECEIPT
//   LODGING   — mode: FIXED_RATE | RECEIPT
//   TOLL      — mode: TNG (amount=0, linked later) | MANUAL (amount required)
//   PARKING   — mode: TNG (amount=0, linked later) | MANUAL (amount required)
//   TAXI      — amount required; paid_via_tng optional
//   GRAB      — amount required; paid_via_tng optional
//   TRAIN     — amount required; paid_via_tng optional
//   FLIGHT    — amount required
//   BUS       — amount required; paid_via_tng optional
//   PER_DIEM  — perdiem_days required; rate auto-fetched from Settings or user-supplied
//
// Claim lock: SUBMITTED → 409 CONFLICT (absolute, no bypass)

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// ── All valid types ────────────────────────────────────────────────────────────
const ALL_TYPES = [
  'MILEAGE', 'MEAL', 'LODGING',
  'TOLL', 'PARKING',
  'TAXI', 'GRAB', 'TRAIN', 'FLIGHT', 'BUS',
  'PER_DIEM',
] as const

// Types that support the paid_via_tng flag
const TNG_PAYABLE_TYPES = ['TAXI', 'GRAB', 'TRAIN', 'BUS']

type ClaimItemType = typeof ALL_TYPES[number]

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// Fallback SUM if RPC unavailable
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

async function recalcTotal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  claim_id: string,
  fallback: number,
): Promise<number> {
  const { data, error } = await supabase.rpc('recalc_claim_total', { p_claim_id: claim_id })
  if (error) {
    console.error('[recalcTotal] RPC error, using SUM fallback:', error.message)
    return sumAndUpdateTotal(supabase, claim_id)
  }
  return Number(data ?? fallback)
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: Params) {
  const { id: claim_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // ── Fetch + validate claim ────────────────────────────────────────────────
  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select('id, org_id, status, rate_version_id')
    .eq('id', claim_id)
    .eq('org_id', org.org_id)
    .single()

  if (claimErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)

  // ── CLAIM LOCK — absolute, no bypass ─────────────────────────────────────
  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'Cannot add items to a submitted claim.', 409)
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({})) as {
    type?:                string
    mode?:                string         // RECEIPT | FIXED_RATE | TNG | MANUAL
    trip_id?:             string         // MILEAGE only
    amount?:              number
    receipt_url?:         string
    merchant?:            string
    notes?:               string
    paid_via_tng?:        boolean        // TAXI / GRAB / TRAIN / BUS
    // MEAL
    claim_date?:          string         // YYYY-MM-DD
    meal_session?:        string
    // LODGING
    nights?:              number
    lodging_check_in?:    string
    lodging_check_out?:   string
    // TOLL
    entry_location?:      string
    exit_location?:       string
    // PARKING
    location?:            string
    // TOLL / PARKING TNG link
    tng_transaction_id?:  string
    // PER_DIEM
    perdiem_days?:        number         // required for PER_DIEM
    perdiem_rate_myr?:    number         // optional — if not provided, fetched from Settings
    perdiem_destination?: string
  }

  const { type } = body

  // ── Type validation ───────────────────────────────────────────────────────
  if (!type || !ALL_TYPES.includes(type as ClaimItemType)) {
    return err(
      'VALIDATION_ERROR',
      `type must be one of: ${ALL_TYPES.join(', ')}.`,
      400,
    )
  }

  const itemType = type as ClaimItemType

  // ══════════════════════════════════════════════════════════════════════════
  // MILEAGE
  // ══════════════════════════════════════════════════════════════════════════
  if (itemType === 'MILEAGE') {
    const { trip_id, notes } = body
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

    let mileage_rate: number | null = null
    if (claim.rate_version_id) {
      const { data: rv } = await supabase
        .from('rate_versions')
        .select('mileage_rate_per_km')
        .eq('id', claim.rate_version_id)
        .maybeSingle()
      mileage_rate = rv?.mileage_rate_per_km ?? null
    }
    if (!mileage_rate) {
      const { data: latest } = await supabase
        .from('rate_versions')
        .select('mileage_rate_per_km')
        .eq('org_id', org.org_id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()
      mileage_rate = latest?.mileage_rate_per_km ?? 0.60
    }

    const qty_km   = Number((trip.final_distance_m / 1000).toFixed(2))
    const rate_val = Number(mileage_rate)
    const amt      = Number((qty_km * rate_val).toFixed(2))
    const tripDate = trip.started_at ? new Date(trip.started_at).toISOString().slice(0, 10) : null

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
        amount:     amt,
        currency:   'MYR',
        notes:      notes ?? null,
        claim_date: tripDate,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[POST items] MILEAGE insert:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to add mileage item.', 500)
    }

    const claim_total = await recalcTotal(supabase, claim_id, amt)
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MEAL / LODGING
  // ══════════════════════════════════════════════════════════════════════════
  if (itemType === 'MEAL' || itemType === 'LODGING') {
    const { mode, amount, receipt_url, merchant, notes, nights,
            claim_date, meal_session, lodging_check_in, lodging_check_out } = body

    const item_mode = mode ?? 'RECEIPT'
    if (!['RECEIPT', 'FIXED_RATE'].includes(item_mode)) {
      return err('VALIDATION_ERROR', 'mode must be RECEIPT or FIXED_RATE.', 400)
    }
    if (!claim_date) {
      return err('VALIDATION_ERROR', 'claim_date is required for MEAL and LODGING items.', 400)
    }
    if (itemType === 'MEAL' && item_mode === 'FIXED_RATE') {
      if (!meal_session || !['FULL_DAY', 'MORNING', 'NOON', 'EVENING'].includes(meal_session)) {
        return err('VALIDATION_ERROR', 'meal_session is required for Fixed Rate meals.', 400)
      }
    }

    const { data: rateRow } = await supabase
      .from('rate_versions')
      .select('meal_rate_per_session, meal_rate_full_day, meal_rate_default, lodging_rate_default')
      .eq('org_id', org.org_id)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle()

    const orgMealSess = Number(rateRow?.meal_rate_per_session ?? rateRow?.meal_rate_default ?? 25)
    const orgMealFull = Number(rateRow?.meal_rate_full_day ?? 60)
    const orgLodging  = Number(rateRow?.lodging_rate_default ?? 120)
    const orgMealRate = meal_session === 'FULL_DAY' ? orgMealFull : orgMealSess

    let item_amount: number
    if (item_mode === 'RECEIPT') {
      if (!amount || amount <= 0) {
        return err('VALIDATION_ERROR', 'amount is required and must be > 0 for RECEIPT mode.', 400)
      }
      item_amount = Number(amount.toFixed(2))
    } else {
      item_amount = itemType === 'MEAL'
        ? Number(orgMealRate)
        : Number((orgLodging * (nights && nights > 1 ? nights : 1)).toFixed(2))
    }

    const qty_val   = itemType === 'LODGING' && nights ? nights : 1
    const unit_rate = item_mode === 'FIXED_RATE' ? (itemType === 'MEAL' ? orgMealRate : orgLodging) : null

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id:            org.org_id,
        claim_id,
        type:              itemType,
        mode:              item_mode,
        qty:               qty_val,
        rate:              unit_rate,
        amount:            item_amount,
        currency:          'MYR',
        receipt_url:       receipt_url ?? null,
        merchant:          merchant?.trim() ?? null,
        notes:             notes?.trim() ?? null,
        claim_date:        claim_date ?? null,
        meal_session:      itemType === 'MEAL' ? (meal_session ?? null) : null,
        lodging_check_in:  itemType === 'LODGING' ? (lodging_check_in ?? claim_date ?? null) : null,
        lodging_check_out: itemType === 'LODGING' ? (lodging_check_out ?? null) : null,
      })
      .select()
      .single()

    if (insertErr) {
      console.error(`[POST items] ${itemType} insert:`, insertErr.message, insertErr.details)
      return err('SERVER_ERROR', `DB error: ${insertErr.message}`, 500)
    }

    const claim_total = await recalcTotal(supabase, claim_id, item_amount)
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TOLL / PARKING
  // mode: 'TNG'    → amount = 0, linked to TNG statement later
  // mode: 'MANUAL' → amount required
  // ══════════════════════════════════════════════════════════════════════════
  if (itemType === 'TOLL' || itemType === 'PARKING') {
    const { mode, amount, claim_date, entry_location, exit_location, location,
            notes, receipt_url, tng_transaction_id } = body

    const item_mode = mode ?? 'MANUAL'

    if (!['TNG', 'MANUAL'].includes(item_mode)) {
      return err('VALIDATION_ERROR', 'mode must be TNG or MANUAL for TOLL/PARKING items.', 400)
    }
    if (!claim_date) {
      return err('VALIDATION_ERROR', 'claim_date is required.', 400)
    }

    let item_amount: number
    if (item_mode === 'TNG') {
      item_amount = 0
    } else {
      if (amount === undefined || amount === null || amount <= 0) {
        return err('VALIDATION_ERROR', 'amount is required for manual TOLL/PARKING entry.', 400)
      }
      item_amount = Number(Number(amount).toFixed(2))
    }

    let merchant_val: string | null = null
    if (itemType === 'TOLL') {
      const parts = [entry_location?.trim(), exit_location?.trim()].filter(Boolean)
      merchant_val = parts.length > 0 ? parts.join(' → ') : null
    } else {
      merchant_val = location?.trim() ?? null
    }

    if (item_mode === 'TNG' && tng_transaction_id) {
      const { error: tngErr } = await supabase
        .from('tng_transactions')
        .update({ claimed: true })
        .eq('id', tng_transaction_id)
        .eq('org_id', org.org_id)
        .eq('user_id', user.id)

      if (tngErr) {
        console.warn('[POST items] Could not mark tng_transaction claimed:', tngErr.message)
      }
    }

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id:      org.org_id,
        claim_id,
        type:        itemType,
        mode:        item_mode,
        amount:      item_amount,
        currency:    'MYR',
        claim_date:  claim_date,
        merchant:    merchant_val,
        notes:       notes?.trim() ?? null,
        receipt_url: item_mode === 'MANUAL' ? (receipt_url ?? null) : null,
      })
      .select()
      .single()

    if (insertErr) {
      console.error(`[POST items] ${itemType} insert:`, insertErr.message, insertErr.details)
      return err('SERVER_ERROR', `DB error: ${insertErr.message}`, 500)
    }

    const claim_total = await recalcTotal(supabase, claim_id, item_amount)
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAXI / GRAB / TRAIN / FLIGHT / BUS
  // FLIGHT: no paid_via_tng (flight can't be paid via TNG wallet)
  // TAXI/GRAB/TRAIN/BUS: paid_via_tng optional flag
  // ══════════════════════════════════════════════════════════════════════════
  if (['TAXI', 'GRAB', 'TRAIN', 'FLIGHT', 'BUS'].includes(itemType)) {
    const { amount, claim_date, merchant, notes, receipt_url, paid_via_tng } = body

    if (!claim_date) {
      return err('VALIDATION_ERROR', 'claim_date is required.', 400)
    }
    if (amount === undefined || amount === null || amount <= 0) {
      return err('VALIDATION_ERROR', `amount is required for ${itemType} items.`, 400)
    }

    const item_amount = Number(Number(amount).toFixed(2))

    // paid_via_tng only applies to TNG-payable types (not FLIGHT)
    const can_pay_tng = TNG_PAYABLE_TYPES.includes(itemType)
    const tng_flag    = can_pay_tng ? (paid_via_tng === true) : false

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id:       org.org_id,
        claim_id,
        type:         itemType,
        amount:       item_amount,
        currency:     'MYR',
        claim_date:   claim_date,
        merchant:     merchant?.trim() ?? null,
        notes:        notes?.trim() ?? null,
        receipt_url:  receipt_url ?? null,
        paid_via_tng: tng_flag,
      })
      .select()
      .single()

    if (insertErr) {
      console.error(`[POST items] ${itemType} insert:`, insertErr.message, insertErr.details)
      return err('SERVER_ERROR', `Failed to add ${itemType} item.`, 500)
    }

    const claim_total = await recalcTotal(supabase, claim_id, item_amount)
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PER DIEM
  // amount = perdiem_days × rate
  // rate: from body (user override) OR from latest rate_versions.perdiem_rate_myr
  // ══════════════════════════════════════════════════════════════════════════
  if (itemType === 'PER_DIEM') {
    const { perdiem_days, perdiem_rate_myr, perdiem_destination, claim_date, notes } = body

    if (!claim_date) {
      return err('VALIDATION_ERROR', 'claim_date (start date of per diem period) is required.', 400)
    }
    if (!perdiem_days || perdiem_days <= 0) {
      return err('VALIDATION_ERROR', 'perdiem_days is required and must be > 0.', 400)
    }

    // Determine rate: user-supplied takes precedence; fallback to org setting
    let rate = perdiem_rate_myr ? Number(perdiem_rate_myr) : 0

    if (rate <= 0) {
      // Fetch org-configured per diem rate from latest rate_versions
      const { data: rateRow } = await supabase
        .from('rate_versions')
        .select('perdiem_rate_myr')
        .eq('org_id', org.org_id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()

      rate = Number(rateRow?.perdiem_rate_myr ?? 0)
    }

    if (rate <= 0) {
      return err(
        'VALIDATION_ERROR',
        'Per diem rate is required. Set it in Settings → Per Diem or provide perdiem_rate_myr in the request.',
        400,
      )
    }

    const days       = Number(perdiem_days)
    const item_amount = Number((rate * days).toFixed(2))

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id:               org.org_id,
        claim_id,
        type:                 'PER_DIEM',
        mode:                 'FIXED_RATE',
        amount:               item_amount,
        currency:             'MYR',
        qty:                  days,
        rate:                 rate,
        claim_date:           claim_date,
        perdiem_rate_myr:     rate,
        perdiem_days:         days,
        perdiem_destination:  perdiem_destination?.trim() ?? null,
        notes:                notes?.trim() ?? null,
        // No receipt — per diem is an entitlement, not an expense
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[POST items] PER_DIEM insert:', insertErr.message, insertErr.details)
      return err('SERVER_ERROR', `DB error: ${insertErr.message}`, 500)
    }

    const claim_total = await recalcTotal(supabase, claim_id, item_amount)
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  // Guard — should never reach here
  return err('VALIDATION_ERROR', 'Unsupported item type.', 400)
}
