// apps/user/app/api/claims/[id]/items/route.ts
// POST /api/claims/[id]/items   — add item to DRAFT claim
// DELETE handled in /api/claims/[id]/items/[item_id]/route.ts
//
// Rates model:
// - claims.user_rate_version_id = primary personal rate snapshot
// - claims.rate_version_id      = legacy / optional fallback template reference
// - claim_items.rate + amount   = final deterministic audit values

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

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

async function loadEffectiveRates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  claim: ClaimRow,
): Promise<EffectiveRates> {
  if (claim.user_rate_version_id) {
    const { data } = await supabase
      .from('user_rate_versions')
      .select(`
        mileage_rate_per_km,
        meal_rate_default,
        meal_rate_per_session,
        meal_rate_full_day,
        meal_rate_morning,
        meal_rate_noon,
        meal_rate_evening,
        lodging_rate_default,
        perdiem_rate_myr
      `)
      .eq('id', claim.user_rate_version_id)
      .eq('user_id', claim.user_id)
      .maybeSingle()

    if (data) return normalizeRates(data as Record<string, unknown>)
  }

  if (claim.rate_version_id) {
    const { data } = await supabase
      .from('rate_versions')
      .select(`
        mileage_rate_per_km,
        meal_rate_default,
        meal_rate_per_session,
        meal_rate_full_day,
        meal_rate_morning,
        meal_rate_noon,
        meal_rate_evening,
        lodging_rate_default,
        perdiem_rate_myr
      `)
      .eq('id', claim.rate_version_id)
      .maybeSingle()

    if (data) return normalizeRates(data as Record<string, unknown>)
  }

  const { data: latestUserRate } = await supabase
    .from('user_rate_versions')
    .select(`
      mileage_rate_per_km,
      meal_rate_default,
      meal_rate_per_session,
      meal_rate_full_day,
      meal_rate_morning,
      meal_rate_noon,
      meal_rate_evening,
      lodging_rate_default,
      perdiem_rate_myr
    `)
    .eq('user_id', claim.user_id)
    .order('effective_from', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestUserRate) return normalizeRates(latestUserRate as Record<string, unknown>)

  const { data: latestTemplate } = await supabase
    .from('rate_versions')
    .select(`
      mileage_rate_per_km,
      meal_rate_default,
      meal_rate_per_session,
      meal_rate_full_day,
      meal_rate_morning,
      meal_rate_noon,
      meal_rate_evening,
      lodging_rate_default,
      perdiem_rate_myr
    `)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestTemplate) return normalizeRates(latestTemplate as Record<string, unknown>)

  return DEFAULT_RATES
}

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

function toYmd(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function inferRetailTransportType(...values: Array<string | null | undefined>): RetailTransportType | null {
  const haystack = values
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(' | ')
    .toUpperCase()

  if (!haystack) return null
  if (/(^|[^A-Z])(GRAB|MYCAR|AIRASIA\s*RIDE|MAXIM|INDRIVE|RYDE|TADA)([^A-Z]|$)/.test(haystack)) return 'GRAB'
  if (/(^|[^A-Z])(TAXI|TEKSI|CAB)([^A-Z]|$)/.test(haystack)) return 'TAXI'
  if (/(^|[^A-Z])(BUS|BAS|GO\s*KL|RAPID\s*BUS|MYBAS|STAGE\s*BUS|SHUTTLE\s*BUS|EXPRESS\s*BUS)([^A-Z]|$)/.test(haystack)) return 'BUS'
  if (/(^|[^A-Z])(MRT|LRT|KTM|KTMB|KOMUTER|ETS|ERL|KLIA\s*EKSPRES|KLIA\s*TRANSIT|MONORAIL|BRT|RAIL|TRAIN)([^A-Z]|$)/.test(haystack)) return 'TRAIN'
  return null
}

function buildRetailMerchantLabel(params: {
  merchant?: string | null
  location?: string | null
  entry_location?: string | null
  exit_location?: string | null
}): string | null {
  const manual = params.merchant?.trim()
  if (manual) return manual
  const parts = [
    params.location?.trim(),
    params.entry_location?.trim(),
    params.exit_location?.trim(),
  ].filter(Boolean)
  if (parts.length === 0) return null
  return Array.from(new Set(parts)).join(' · ')
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id: claim_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select('id, status')
    .eq('id', claim_id)
    .eq('org_id', org.org_id)
    .single()

  if (claimErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)
  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'Submitted claims are locked.', 409)
  }

  const typeParam = request.nextUrl.searchParams.get('type')
  const unlinked = request.nextUrl.searchParams.get('unlinked') === 'true'

  const types = (typeParam ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((t): t is ClaimItemType => ALL_TYPES.includes(t as ClaimItemType))

  let query = supabase
    .from('claim_items')
    .select('id, type, claim_date, merchant, amount, tng_transaction_id, mode, paid_via_tng')
    .eq('claim_id', claim_id)
    .eq('org_id', org.org_id)
    .order('claim_date', { ascending: false })

  if (types.length > 0) query = query.in('type', types)
  if (unlinked) query = query.is('tng_transaction_id', null)

  const { data: items, error } = await query
  if (error) {
    console.error('[GET items] fetch:', error.message)
    return err('SERVER_ERROR', 'Failed to load claim items.', 500)
  }

  return NextResponse.json({ items: items ?? [] })
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id: claim_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select('id, org_id, user_id, status, rate_version_id, user_rate_version_id')
    .eq('id', claim_id)
    .eq('org_id', org.org_id)
    .single()

  if (claimErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)
  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'Cannot add items to a submitted claim.', 409)
  }

  const body = (await request.json().catch(() => ({}))) as {
    type?: string
    mode?: string
    trip_id?: string
    amount?: number
    receipt_url?: string
    merchant?: string
    notes?: string
    paid_via_tng?: boolean
    claim_date?: string
    meal_session?: string
    nights?: number
    lodging_check_in?: string
    lodging_check_out?: string
    entry_location?: string
    exit_location?: string
    location?: string
    tng_transaction_id?: string
    transport_type?: string
    perdiem_days?: number
    perdiem_rate_myr?: number
    perdiem_destination?: string
  }

  const { type } = body
  if (!type || !POST_ACCEPTED_TYPES.includes(type as PostedItemType)) {
    return err('VALIDATION_ERROR', `type must be one of: ${POST_ACCEPTED_TYPES.join(', ')}.`, 400)
  }

  const postedType = type as PostedItemType
  const itemType = postedType === 'RETAIL' ? null : postedType as ClaimItemType

  if (postedType === 'RETAIL') {
    const { tng_transaction_id, transport_type, claim_date, merchant, notes } = body
    if (!tng_transaction_id) return err('VALIDATION_ERROR', 'tng_transaction_id is required for RETAIL add-to-claim.', 400)

    const { data: tng, error: tngErr } = await supabase
      .from('tng_transactions')
      .select('id, sector, claimed, exit_datetime, entry_datetime, entry_location, exit_location, location, amount')
      .eq('id', tng_transaction_id)
      .eq('org_id', org.org_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (tngErr || !tng) return err('NOT_FOUND', 'TNG transaction not found.', 404)
    if (tng.sector !== 'RETAIL') return err('VALIDATION_ERROR', `TNG transaction sector ${tng.sector} is not RETAIL.`, 400)
    if (tng.claimed) return err('CONFLICT', 'This TNG transaction is already linked to a claim item.', 409)

    const hintedType = RETAIL_TRANSPORT_TYPES.includes(body.transport_type as RetailTransportType)
      ? body.transport_type as RetailTransportType
      : null
    const resolvedType = hintedType ?? inferRetailTransportType(merchant, tng.location, tng.entry_location, tng.exit_location)
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

  const effectiveRates = await loadEffectiveRates(supabase, claim as ClaimRow)

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

    const qty_km = Number((Number(trip.final_distance_m) / 1000).toFixed(2))
    const rate_val = Number(effectiveRates.mileage_rate_per_km)
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

    const qty_val = itemType === 'LODGING' && nights ? nights : 1
    const unit_rate = item_mode === 'FIXED_RATE' ? (itemType === 'MEAL' ? mealRate : lodgingRate) : null

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: itemType,
        mode: item_mode,
        qty: qty_val,
        rate: unit_rate,
        amount: item_amount,
        currency: 'MYR',
        receipt_url: receipt_url ?? null,
        merchant: merchant?.trim() ?? null,
        notes: notes?.trim() ?? null,
        claim_date: claim_date ?? null,
        meal_session: itemType === 'MEAL' ? (meal_session ?? null) : null,
        lodging_check_in: itemType === 'LODGING' ? (lodging_check_in ?? claim_date ?? null) : null,
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

  if (itemType === 'TOLL' || itemType === 'PARKING') {
    const { mode, amount, claim_date, entry_location, exit_location, location, notes, receipt_url, tng_transaction_id } = body
    const item_mode = mode ?? (tng_transaction_id ? 'TNG' : 'MANUAL')
    if (!['TNG', 'MANUAL'].includes(item_mode)) return err('VALIDATION_ERROR', 'mode must be TNG or MANUAL for TOLL/PARKING items.', 400)

    let linkedTng: any = null
    if (tng_transaction_id) {
      const { data: tng, error: tngErr } = await supabase
        .from('tng_transactions')
        .select('id, sector, claimed, exit_datetime, entry_datetime, entry_location, exit_location, location, amount')
        .eq('id', tng_transaction_id)
        .eq('org_id', org.org_id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (tngErr || !tng) return err('NOT_FOUND', 'TNG transaction not found.', 404)
      if (tng.sector !== itemType) return err('VALIDATION_ERROR', `TNG transaction sector ${tng.sector} does not match item type ${itemType}.`, 400)
      if (tng.claimed) return err('CONFLICT', 'This TNG transaction is already linked to a claim item.', 409)
      linkedTng = tng
    }

    const effective_claim_date = claim_date ?? toYmd(linkedTng?.exit_datetime) ?? toYmd(linkedTng?.entry_datetime)
    if (!effective_claim_date) return err('VALIDATION_ERROR', 'claim_date is required.', 400)

    let item_amount: number
    if (item_mode === 'TNG') {
      item_amount = linkedTng?.amount != null ? Number(Number(linkedTng.amount).toFixed(2)) : 0
    } else {
      if (amount === undefined || amount === null || amount <= 0) return err('VALIDATION_ERROR', 'amount is required for manual TOLL/PARKING entry.', 400)
      item_amount = Number(Number(amount).toFixed(2))
    }

    let merchant_val: string | null = null
    if (itemType === 'TOLL') {
      const start = entry_location?.trim() ?? linkedTng?.entry_location?.trim() ?? null
      const end = exit_location?.trim() ?? linkedTng?.exit_location?.trim() ?? null
      const parts = [start, end].filter(Boolean)
      merchant_val = parts.length > 0 ? parts.join(' → ') : null
    } else {
      merchant_val = location?.trim() ?? linkedTng?.location?.trim() ?? (() => {
        const parts = [linkedTng?.entry_location?.trim(), linkedTng?.exit_location?.trim()].filter(Boolean)
        return parts.length > 0 ? parts.join(' → ') : null
      })()
    }

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: itemType,
        mode: item_mode,
        amount: item_amount,
        currency: 'MYR',
        claim_date: effective_claim_date,
        merchant: merchant_val,
        notes: notes?.trim() ?? null,
        receipt_url: item_mode === 'MANUAL' ? (receipt_url ?? null) : null,
        tng_transaction_id: item_mode === 'TNG' ? (tng_transaction_id ?? null) : null,
      })
      .select()
      .single()

    if (insertErr) {
      console.error(`[POST items] ${itemType} insert:`, insertErr.message, insertErr.details)
      return err('SERVER_ERROR', `DB error: ${insertErr.message}`, 500)
    }

    if (item_mode === 'TNG' && tng_transaction_id) {
      await supabase.from('tng_transactions').update({ claimed: true }).eq('id', tng_transaction_id).eq('org_id', org.org_id).eq('user_id', user.id)
    }

    const claim_total = await recalcTotal(supabase, claim_id, item_amount)
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  if (itemType && ['TAXI', 'GRAB', 'TRAIN', 'FLIGHT', 'BUS'].includes(itemType)) {
    const { amount, claim_date, merchant, notes, receipt_url, paid_via_tng, tng_transaction_id } = body
    const can_pay_tng = TNG_PAYABLE_TYPES.includes(itemType as RetailTransportType)
    let linkedTng: any = null

    if (tng_transaction_id) {
      const { data: tng, error: tngErr } = await supabase
        .from('tng_transactions')
        .select('id, sector, claimed, exit_datetime, entry_datetime, entry_location, exit_location, location, amount')
        .eq('id', tng_transaction_id)
        .eq('org_id', org.org_id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (tngErr || !tng) return err('NOT_FOUND', 'TNG transaction not found.', 404)
      if (tng.sector !== 'RETAIL') return err('VALIDATION_ERROR', `TNG transaction sector ${tng.sector} does not match transport item type ${itemType}.`, 400)
      if (tng.claimed) return err('CONFLICT', 'This TNG transaction is already linked to a claim item.', 409)
      linkedTng = tng
    }

    const tng_flag = can_pay_tng ? (paid_via_tng === true || !!tng_transaction_id) : false
    const effective_claim_date = claim_date ?? toYmd(linkedTng?.exit_datetime) ?? toYmd(linkedTng?.entry_datetime)
    if (!effective_claim_date) return err('VALIDATION_ERROR', 'claim_date is required.', 400)
    if (!tng_flag && (amount === undefined || amount === null || Number(amount) <= 0)) {
      return err('VALIDATION_ERROR', `amount is required for ${itemType} items.`, 400)
    }

    const hasLinkedTng = !!linkedTng
    const item_amount = tng_flag
      ? (hasLinkedTng ? Number(Number(linkedTng?.amount ?? 0).toFixed(2)) : 0)
      : Number(Number(amount).toFixed(2))

    if (tng_flag && hasLinkedTng && item_amount <= 0) {
      return err('VALIDATION_ERROR', `Linked TNG amount is required for ${itemType} items.`, 400)
    }

    const merchant_val = tng_flag
      ? buildRetailMerchantLabel({ merchant, location: linkedTng?.location, entry_location: linkedTng?.entry_location, exit_location: linkedTng?.exit_location })
      : merchant?.trim() ?? null

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: itemType,
        mode: tng_flag ? 'TNG' : null,
        amount: item_amount,
        currency: 'MYR',
        claim_date: effective_claim_date,
        merchant: merchant_val,
        notes: notes?.trim() ?? null,
        receipt_url: tng_flag ? null : (receipt_url ?? null),
        paid_via_tng: tng_flag,
        tng_transaction_id: tng_flag ? (tng_transaction_id ?? null) : null,
      })
      .select()
      .single()

    if (insertErr) {
      console.error(`[POST items] ${itemType} insert:`, insertErr.message, insertErr.details)
      return err('SERVER_ERROR', `Failed to add ${itemType} item.`, 500)
    }

    if (tng_flag && tng_transaction_id) {
      await supabase.from('tng_transactions').update({ claimed: true }).eq('id', tng_transaction_id).eq('org_id', org.org_id).eq('user_id', user.id)
    }

    const claim_total = await recalcTotal(supabase, claim_id, item_amount)
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  if (itemType === 'PER_DIEM') {
    const { perdiem_days, perdiem_rate_myr, perdiem_destination, claim_date, notes } = body
    if (!claim_date) return err('VALIDATION_ERROR', 'claim_date (start date of per diem period) is required.', 400)
    if (!perdiem_days || perdiem_days <= 0) return err('VALIDATION_ERROR', 'perdiem_days is required and must be > 0.', 400)

    let rate = perdiem_rate_myr ? Number(perdiem_rate_myr) : 0
    if (rate <= 0) rate = Number(effectiveRates.perdiem_rate_myr ?? 0)
    if (rate <= 0) {
      return err('VALIDATION_ERROR', 'Per diem rate is required. Set it in Settings → Rates or provide perdiem_rate_myr in the request.', 400)
    }

    const days = Number(perdiem_days)
    const item_amount = Number((rate * days).toFixed(2))

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: 'PER_DIEM',
        mode: 'FIXED_RATE',
        amount: item_amount,
        currency: 'MYR',
        qty: days,
        rate,
        claim_date,
        perdiem_rate_myr: rate,
        perdiem_days: days,
        perdiem_destination: perdiem_destination?.trim() ?? null,
        notes: notes?.trim() ?? null,
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

  if (itemType === 'MISC') {
    const { amount, claim_date, merchant, receipt_url, notes } = body
    if (!amount || amount <= 0) return err('VALIDATION_ERROR', 'amount is required for MISC items.', 400)
    if (!claim_date) return err('VALIDATION_ERROR', 'claim_date (YYYY-MM-DD) is required for MISC items.', 400)

    const { data: item, error: insertErr } = await supabase
      .from('claim_items')
      .insert({
        org_id: org.org_id,
        claim_id,
        type: 'MISC',
        amount: Number(Number(amount).toFixed(2)),
        currency: 'MYR',
        claim_date,
        merchant: merchant?.trim() ?? null,
        receipt_url: receipt_url ?? null,
        notes: notes?.trim() ?? null,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[POST items] MISC insert:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to add misc item.', 500)
    }

    const claim_total = await recalcTotal(supabase, claim_id, Number(amount))
    return NextResponse.json({ item, claim_total: { currency: 'MYR', amount: claim_total } }, { status: 201 })
  }

  return err('VALIDATION_ERROR', 'Unsupported item type.', 400)
}
