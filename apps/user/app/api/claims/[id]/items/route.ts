// apps/user/app/api/claims/[id]/items/route.ts
// POST /api/claims/[id]/items   — add item to DRAFT claim
// DELETE handled in /api/claims/[id]/items/[item_id]/route.ts
//
// Rates model:
// - claims.user_rate_version_id = primary personal rate snapshot
// - claims.rate_version_id      = legacy / optional fallback template reference
// - claim_items.rate + amount   = final deterministic audit values
//
// Vehicle type (MILEAGE items):
// - Inherited from trip.vehicle_type, overridable in request body
// - 'car'        → uses user_rate_versions.mileage_rate_per_km
// - 'motorcycle' → uses user_rate_versions.motorcycle_rate_per_km
//                  (falls back to mileage_rate_per_km if null)

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

type VehicleType = 'car' | 'motorcycle'

type ClaimItemType =
  | 'MILEAGE'
  | 'MEAL'
  | 'LODGING'
  | 'TOLL'
  | 'PARKING'
  | 'TAXI'
  | 'GRAB'
  | 'TRAIN'
  | 'FLIGHT'
  | 'BUS'
  | 'PER_DIEM'
  | 'MISC'

type PostedItemType = ClaimItemType | 'RETAIL'
type RetailTransportType = 'TAXI' | 'GRAB' | 'TRAIN' | 'BUS'

type EffectiveRates = {
  mileage_rate_per_km: number
  motorcycle_rate_per_km: number | null
  meal_rate_default: number
  meal_rate_per_session: number
  meal_rate_full_day: number
  meal_rate_morning: number
  meal_rate_noon: number
  meal_rate_evening: number
  lodging_rate_default: number
  perdiem_rate_myr: number
}

type ClaimRow = {
  id: string
  org_id: string
  user_id: string
  status: string
  rate_version_id: string | null
  user_rate_version_id: string | null
}

const ALL_TYPES: ClaimItemType[] = [
  'MILEAGE', 'MEAL', 'LODGING',
  'TOLL', 'PARKING',
  'TAXI', 'GRAB', 'TRAIN', 'FLIGHT', 'BUS',
  'PER_DIEM',
  'MISC',
]

const POST_ACCEPTED_TYPES: PostedItemType[] = [...ALL_TYPES, 'RETAIL']
const TNG_PAYABLE_TYPES: RetailTransportType[] = ['TAXI', 'GRAB', 'TRAIN', 'BUS']
const RETAIL_TRANSPORT_TYPES: RetailTransportType[] = ['TAXI', 'GRAB', 'TRAIN', 'BUS']

const DEFAULT_RATES: EffectiveRates = {
  mileage_rate_per_km: 0.60,
  motorcycle_rate_per_km: 0.30,
  meal_rate_default: 26.67,
  meal_rate_per_session: 26.67,
  meal_rate_full_day: 60.00,
  meal_rate_morning: 20.00,
  meal_rate_noon: 30.00,
  meal_rate_evening: 30.00,
  lodging_rate_default: 120.00,
  perdiem_rate_myr: 0.00,
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function numOr(value: unknown, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function avgMeal(morning: number, noon: number, evening: number) {
  return Math.round((((morning + noon + evening) / 3) * 100)) / 100
}

function normalizeRates(row?: Record<string, unknown> | null): EffectiveRates {
  const morning = numOr(row?.meal_rate_morning, DEFAULT_RATES.meal_rate_morning)
  const noon = numOr(row?.meal_rate_noon, DEFAULT_RATES.meal_rate_noon)
  const evening = numOr(row?.meal_rate_evening, DEFAULT_RATES.meal_rate_evening)
  const perSession = numOr(
    row?.meal_rate_per_session,
    numOr(row?.meal_rate_default, avgMeal(morning, noon, evening)),
  )

  return {
    mileage_rate_per_km: numOr(row?.mileage_rate_per_km, DEFAULT_RATES.mileage_rate_per_km),
    motorcycle_rate_per_km: numOrNull(row?.motorcycle_rate_per_km),
    meal_rate_default: numOr(row?.meal_rate_default, perSession),
    meal_rate_per_session: perSession,
    meal_rate_full_day: numOr(row?.meal_rate_full_day, DEFAULT_RATES.meal_rate_full_day),
    meal_rate_morning: morning,
    meal_rate_noon: noon,
    meal_rate_evening: evening,
    lodging_rate_default: numOr(row?.lodging_rate_default, DEFAULT_RATES.lodging_rate_default),
    perdiem_rate_myr: numOr(row?.perdiem_rate_myr, DEFAULT_RATES.perdiem_rate_myr),
  }
}

// ── Pick the correct mileage rate based on vehicle type ───────────────────────
// Falls back to car rate if motorcycle_rate_per_km is not configured.
function resolveMileageRate(rates: EffectiveRates, vehicleType: VehicleType): number {
  if (vehicleType === 'motorcycle') {
    return rates.motorcycle_rate_per_km ?? rates.mileage_rate_per_km
  }
  return rates.mileage_rate_per_km
}

async function loadEffectiveRates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  claim: ClaimRow,
): Promise<EffectiveRates> {
  const RATE_FIELDS = `
    mileage_rate_per_km,
    motorcycle_rate_per_km,
    meal_rate_default,
    meal_rate_per_session,
    meal_rate_full_day,
    meal_rate_morning,
    meal_rate_noon,
    meal_rate_evening,
    lodging_rate_default,
    perdiem_rate_myr
  `

  // Primary: user_rate_version_id (personal rate snapshot on the claim)
  if (claim.user_rate_version_id) {
    const { data } = await supabase
      .from('user_rate_versions')
      .select(RATE_FIELDS)
      .eq('id', claim.user_rate_version_id)
      .eq('user_id', claim.user_id)
      .maybeSingle()

    if (data) return normalizeRates(data as Record<string, unknown>)
  }

  // Legacy fallback: rate_version_id (old org-scoped template reference)
  if (claim.rate_version_id) {
    const { data } = await supabase
      .from('rate_versions')
      .select(RATE_FIELDS)
      .eq('id', claim.rate_version_id)
      .maybeSingle()

    if (data) return normalizeRates(data as Record<string, unknown>)
  }

  // Last resort: latest personal rate for this user
  const { data: latestUserRate } = await supabase
    .from('user_rate_versions')
    .select(RATE_FIELDS)
    .eq('user_id', claim.user_id)
    .order('effective_from', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestUserRate) return normalizeRates(latestUserRate as Record<string, unknown>)

  // Absolute fallback: hardcoded defaults
  return DEFAULT_RATES
}

async function recalcTotal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  claimId: string,
  addedAmount: number,
): Promise<number> {
  const { data } = await supabase
    .from('claims')
    .select('total_amount')
    .eq('id', claimId)
    .single()

  const current = Number(data?.total_amount ?? 0)
  const next = Number((current + addedAmount).toFixed(2))

  await supabase
    .from('claims')
    .update({ total_amount: next })
    .eq('id', claimId)

  return next
}

function toYmd(ts: string | null | undefined): string | null {
  if (!ts) return null
  return new Date(ts).toISOString().slice(0, 10)
}

function normalizeVehicleType(raw: unknown): VehicleType {
  if (raw === 'motorcycle') return 'motorcycle'
  return 'car'
}

// ── TNG helpers ───────────────────────────────────────────────────────────────
function inferRetailTransportType(
  merchant: string | null | undefined,
  location: string | null | undefined,
  entry: string | null | undefined,
  exit: string | null | undefined,
): RetailTransportType | null {
  const text = [merchant, location, entry, exit].filter(Boolean).join(' ').toLowerCase()
  if (text.includes('grab')) return 'GRAB'
  if (text.includes('taxi') || text.includes('cab')) return 'TAXI'
  if (text.includes('ktm') || text.includes('lrt') || text.includes('mrt') || text.includes('monorail') || text.includes('komuter') || text.includes('rapidkl')) return 'TRAIN'
  if (text.includes('bas') || text.includes('bus') || text.includes('rapidbus')) return 'BUS'
  return null
}

function buildRetailMerchantLabel(opts: {
  merchant?: string | null
  location?: string | null
  entry_location?: string | null
  exit_location?: string | null
}): string {
  if (opts.merchant?.trim()) return opts.merchant.trim()
  const loc = opts.location ?? opts.entry_location
  const exitLoc = opts.exit_location
  if (loc && exitLoc && loc !== exitLoc) return `${loc} → ${exitLoc}`
  return loc ?? exitLoc ?? 'TNG Transaction'
}

// ── Main route handler ────────────────────────────────────────────────────────
export async function POST(request: NextRequest, { params }: Params) {
  const { id: claim_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = (await request.json().catch(() => ({}))) as {
    type?: string
    mode?: string
    amount?: number
    trip_id?: string
    receipt_url?: string
    merchant?: string
    notes?: string
    nights?: number
    claim_date?: string
    meal_session?: string
    lodging_check_in?: string
    lodging_check_out?: string
    tng_transaction_id?: string
    perdiem_rate_myr?: number
    perdiem_days?: number
    perdiem_destination?: string
    vehicle_type?: string    // 'car' | 'motorcycle' — override trip's vehicle_type
  }

  // Fetch and validate claim
  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select('id, org_id, user_id, status, rate_version_id, user_rate_version_id')
    .eq('id', claim_id)
    .eq('org_id', org.org_id)
    .single()

  if (claimErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)
  if (claim.user_id !== user.id) return err('FORBIDDEN', 'You can only add items to your own claims.', 403)
  if (claim.status === 'SUBMITTED') return err('CONFLICT', 'Cannot add items to a submitted claim.', 409)

  const rawType = String(body.type ?? '').toUpperCase()
  if (!POST_ACCEPTED_TYPES.includes(rawType as PostedItemType)) {
    return err('VALIDATION_ERROR', `type must be one of: ${POST_ACCEPTED_TYPES.join(', ')}.`, 400)
  }

  // ── TNG RETAIL shortcut (auto-infer transport type) ─────────────────────────
  if (rawType === 'RETAIL') {
    const { tng_transaction_id, merchant, claim_date, notes } = body
    if (!tng_transaction_id) return err('VALIDATION_ERROR', 'tng_transaction_id required for RETAIL type.', 400)

    const { data: tng, error: tngErr } = await supabase
      .from('tng_transactions')
      .select('id, org_id, user_id, amount, sector, entry_location, exit_location, entry_datetime, exit_datetime, claimed, location:entry_location')
      .eq('id', tng_transaction_id)
      .eq('org_id', org.org_id)
      .eq('user_id', user.id)
      .single()

    if (tngErr || !tng) return err('NOT_FOUND', 'TNG transaction not found.', 404)
    if (tng.claimed) return err('CONFLICT', 'This TNG transaction is already claimed.', 409)
    if (tng.sector !== 'RETAIL') return err('VALIDATION_ERROR', 'Only RETAIL sector TNG rows can use auto-type inference.', 400)

    const resolvedType = inferRetailTransportType(merchant, tng.location, tng.entry_location, tng.exit_location)
    if (!resolvedType) {
      return err('VALIDATION_ERROR', 'Could not infer transport type from this RETAIL TNG row. Please choose TRAIN, BUS, TAXI, or GRAB explicitly.', 400)
    }

    const effective_claim_date = claim_date ?? toYmd(tng.exit_datetime) ?? toYmd(tng.entry_datetime)
    if (!effective_claim_date) return err('VALIDATION_ERROR', 'claim_date is required.', 400)

    const item_amount = Number(Number(tng.amount ?? 0).toFixed(2))
    if (item_amount <= 0) return err('VALIDATION_ERROR', 'Linked RETAIL TNG amount must be greater than 0.', 400)

    const merchant_val = buildRetailMerchantLabel({
      merchant,
      location: tng.location,
      entry_location: tng.entry_location,
      exit_location: tng.exit_location,
    })

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: resolvedType,
        mode: 'TNG',
        amount: item_amount,
        currency: 'MYR',
        claim_date: effective_claim_date,
        merchant: merchant_val,
        notes: notes?.trim() ?? null,
        receipt_url: null,
        paid_via_tng: true,
        tng_transaction_id,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[POST items] RETAIL insert:', insertErr.message, insertErr.details)
      return err('SERVER_ERROR', `DB error: ${insertErr.message}`, 500)
    }

    await supabase.from('tng_transactions').update({ claimed: true }).eq('id', tng_transaction_id).eq('org_id', org.org_id).eq('user_id', user.id)
    const claim_total = await recalcTotal(supabase, claim_id, item_amount)
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  const itemType = rawType as ClaimItemType

  // Load effective rates for this claim
  const effectiveRates = await loadEffectiveRates(supabase, claim as ClaimRow)

  // ── MILEAGE ──────────────────────────────────────────────────────────────────
  if (itemType === 'MILEAGE') {
    const { trip_id, notes } = body
    if (!trip_id) return err('VALIDATION_ERROR', 'trip_id is required for MILEAGE items.', 400)

    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, org_id, status, final_distance_m, distance_source, started_at, vehicle_type')
      .eq('id', trip_id)
      .eq('org_id', org.org_id)
      .single()

    if (tripErr || !trip) return err('NOT_FOUND', 'Trip not found.', 404)
    if (trip.status !== 'FINAL' || !trip.final_distance_m) {
      return err('CONFLICT', 'Trip must be FINAL with a computed distance before adding to a claim.', 409)
    }

    // Vehicle type: body override takes priority, then trip's vehicle_type, then 'car'
    const vehicleType = normalizeVehicleType(body.vehicle_type ?? trip.vehicle_type)
    const rate_val = Number(resolveMileageRate(effectiveRates, vehicleType))

    const qty_km = Number((Number(trip.final_distance_m) / 1000).toFixed(2))
    const amt = Number((qty_km * rate_val).toFixed(2))
    const tripDate = trip.started_at ? new Date(trip.started_at).toISOString().slice(0, 10) : null

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: 'MILEAGE',
        trip_id,
        qty: qty_km,
        unit: 'KM',
        rate: rate_val,
        amount: amt,
        currency: 'MYR',
        notes: notes ?? null,
        claim_date: tripDate,
        vehicle_type: vehicleType,   // stored for audit trail
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

  // ── MEAL / LODGING ────────────────────────────────────────────────────────────
  if (itemType === 'MEAL' || itemType === 'LODGING') {
    const { mode, amount, receipt_url, merchant, notes, nights, claim_date, meal_session, lodging_check_in, lodging_check_out } = body
    const item_mode = mode ?? 'RECEIPT'
    if (!['RECEIPT', 'FIXED_RATE'].includes(item_mode)) return err('VALIDATION_ERROR', 'mode must be RECEIPT or FIXED_RATE.', 400)
    if (!claim_date) return err('VALIDATION_ERROR', 'claim_date is required for MEAL and LODGING items.', 400)
    if (itemType === 'MEAL' && item_mode === 'FIXED_RATE') {
      if (!meal_session || !['FULL_DAY', 'MORNING', 'NOON', 'EVENING'].includes(meal_session)) {
        return err('VALIDATION_ERROR', 'meal_session is required for Fixed Rate meals.', 400)
      }
    }

    const mealRate = meal_session === 'FULL_DAY'
      ? Number(effectiveRates.meal_rate_full_day)
      : meal_session === 'MORNING'
        ? Number(effectiveRates.meal_rate_morning)
        : meal_session === 'NOON'
          ? Number(effectiveRates.meal_rate_noon)
          : meal_session === 'EVENING'
            ? Number(effectiveRates.meal_rate_evening)
            : Number(effectiveRates.meal_rate_per_session)

    const lodgingRate = Number(effectiveRates.lodging_rate_default)

    let item_amount: number
    if (item_mode === 'RECEIPT') {
      if (!amount || amount <= 0) return err('VALIDATION_ERROR', 'amount is required and must be > 0 for RECEIPT mode.', 400)
      item_amount = Number(Number(amount).toFixed(2))
    } else {
      item_amount = itemType === 'MEAL'
        ? Number(mealRate.toFixed(2))
        : Number((lodgingRate * (nights && nights > 1 ? nights : 1)).toFixed(2))
    }

    const qty_val = itemType === 'LODGING' && nights ? Number(nights) : 1

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: itemType,
        mode: item_mode,
        qty: qty_val,
        unit: itemType === 'LODGING' ? 'NIGHT' : 'SESSION',
        rate: item_mode === 'FIXED_RATE'
          ? (itemType === 'MEAL' ? mealRate : lodgingRate)
          : null,
        amount: item_amount,
        currency: 'MYR',
        receipt_url: receipt_url ?? null,
        merchant: merchant ?? null,
        notes: notes ?? null,
        claim_date,
        meal_session: itemType === 'MEAL' ? (meal_session ?? null) : null,
        lodging_check_in: itemType === 'LODGING' ? (lodging_check_in ?? null) : null,
        lodging_check_out: itemType === 'LODGING' ? (lodging_check_out ?? null) : null,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[POST items] MEAL/LODGING insert:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to add item.', 500)
    }

    const claim_total = await recalcTotal(supabase, claim_id, item_amount)
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  // ── TOLL / PARKING ────────────────────────────────────────────────────────────
  if (itemType === 'TOLL' || itemType === 'PARKING') {
    const { amount, receipt_url, merchant, notes, claim_date, tng_transaction_id } = body
    if (!amount || amount <= 0) return err('VALIDATION_ERROR', 'amount must be > 0.', 400)
    if (!claim_date) return err('VALIDATION_ERROR', 'claim_date is required.', 400)

    const paid_via_tng = !!tng_transaction_id
    let tng_data: { entry_location?: string | null; exit_location?: string | null } | null = null

    if (tng_transaction_id) {
      const { data: tng, error: tngErr } = await supabase
        .from('tng_transactions')
        .select('id, amount, claimed, sector, entry_location, exit_location')
        .eq('id', tng_transaction_id)
        .eq('org_id', org.org_id)
        .eq('user_id', user.id)
        .single()

      if (tngErr || !tng) return err('NOT_FOUND', 'TNG transaction not found.', 404)
      if (tng.claimed) return err('CONFLICT', 'This TNG transaction is already claimed.', 409)
      const expectedSector = itemType === 'TOLL' ? 'TOLL' : 'PARKING'
      if (tng.sector !== expectedSector) return err('VALIDATION_ERROR', `TNG sector must be ${expectedSector} for ${itemType} items.`, 400)
      tng_data = tng
    }

    const merchant_val = merchant?.trim()
      ?? (tng_data ? buildRetailMerchantLabel({ entry_location: tng_data.entry_location, exit_location: tng_data.exit_location }) : null)

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: itemType,
        amount: Number(Number(amount).toFixed(2)),
        currency: 'MYR',
        receipt_url: receipt_url ?? null,
        merchant: merchant_val,
        notes: notes ?? null,
        claim_date,
        paid_via_tng,
        tng_transaction_id: tng_transaction_id ?? null,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[POST items] TOLL/PARKING insert:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to add item.', 500)
    }

    if (tng_transaction_id) {
      await supabase.from('tng_transactions').update({ claimed: true }).eq('id', tng_transaction_id).eq('org_id', org.org_id).eq('user_id', user.id)
    }

    const claim_total = await recalcTotal(supabase, claim_id, Number(Number(amount).toFixed(2)))
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  // ── TAXI / GRAB / TRAIN / FLIGHT / BUS ───────────────────────────────────────
  if (TNG_PAYABLE_TYPES.includes(itemType as RetailTransportType) || itemType === 'FLIGHT') {
    const { amount, receipt_url, merchant, notes, claim_date, tng_transaction_id } = body
    if (!amount || amount <= 0) return err('VALIDATION_ERROR', 'amount must be > 0.', 400)
    if (!claim_date) return err('VALIDATION_ERROR', 'claim_date is required.', 400)

    const paid_via_tng = !!tng_transaction_id

    if (tng_transaction_id) {
      const { data: tng, error: tngErr } = await supabase
        .from('tng_transactions')
        .select('id, claimed')
        .eq('id', tng_transaction_id)
        .eq('org_id', org.org_id)
        .eq('user_id', user.id)
        .single()

      if (tngErr || !tng) return err('NOT_FOUND', 'TNG transaction not found.', 404)
      if (tng.claimed) return err('CONFLICT', 'This TNG transaction is already claimed.', 409)
    }

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: itemType,
        amount: Number(Number(amount).toFixed(2)),
        currency: 'MYR',
        receipt_url: receipt_url ?? null,
        merchant: merchant ?? null,
        notes: notes ?? null,
        claim_date,
        paid_via_tng,
        tng_transaction_id: tng_transaction_id ?? null,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[POST items] transport insert:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to add item.', 500)
    }

    if (tng_transaction_id) {
      await supabase.from('tng_transactions').update({ claimed: true }).eq('id', tng_transaction_id).eq('org_id', org.org_id).eq('user_id', user.id)
    }

    const claim_total = await recalcTotal(supabase, claim_id, Number(Number(amount).toFixed(2)))
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  // ── PER DIEM ──────────────────────────────────────────────────────────────────
  if (itemType === 'PER_DIEM') {
    const { perdiem_rate_myr, perdiem_days, perdiem_destination, claim_date, notes } = body
    if (!claim_date) return err('VALIDATION_ERROR', 'claim_date is required.', 400)
    if (!perdiem_days || perdiem_days <= 0) return err('VALIDATION_ERROR', 'perdiem_days must be > 0.', 400)

    const rate_val = perdiem_rate_myr != null && perdiem_rate_myr >= 0
      ? Number(perdiem_rate_myr)
      : Number(effectiveRates.perdiem_rate_myr)

    const amt = Number((rate_val * Number(perdiem_days)).toFixed(2))

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: 'PER_DIEM',
        qty: Number(perdiem_days),
        unit: 'DAY',
        rate: rate_val,
        amount: amt,
        currency: 'MYR',
        claim_date,
        perdiem_rate_myr: rate_val,
        perdiem_days: Number(perdiem_days),
        perdiem_destination: perdiem_destination?.trim() ?? null,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[POST items] PER_DIEM insert:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to add per diem item.', 500)
    }

    const claim_total = await recalcTotal(supabase, claim_id, amt)
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  // ── MISC ──────────────────────────────────────────────────────────────────────
  if (itemType === 'MISC') {
    const { amount, receipt_url, merchant, notes, claim_date } = body
    if (!amount || amount <= 0) return err('VALIDATION_ERROR', 'amount must be > 0.', 400)
    if (!claim_date) return err('VALIDATION_ERROR', 'claim_date is required.', 400)

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: 'MISC',
        amount: Number(Number(amount).toFixed(2)),
        currency: 'MYR',
        receipt_url: receipt_url ?? null,
        merchant: merchant ?? null,
        notes: notes ?? null,
        claim_date,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[POST items] MISC insert:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to add misc item.', 500)
    }

    const claim_total = await recalcTotal(supabase, claim_id, Number(Number(amount).toFixed(2)))
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  return err('VALIDATION_ERROR', `Unhandled item type: ${itemType}`, 400)
}
