// apps/user/app/api/claims/[id]/items/[item_id]/route.ts
// DELETE — Remove a claim item from a DRAFT claim
// PATCH  — Edit a MEAL or LODGING item in a DRAFT claim
//
// Both blocked on SUBMITTED claims (claim lock is absolute).

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string; item_id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── Shared: fetch + lock check ────────────────────────────────────────────────

async function getClaimAndItem(claim_id: string, item_id: string, org_id: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select('id, status')
    .eq('id', claim_id)
    .eq('org_id', org_id)
    .single()

  if (claimErr || !claim) return { claim: null, item: null, lockErr: err('NOT_FOUND', 'Claim not found.', 404) }
  if (claim.status === 'SUBMITTED') return { claim, item: null, lockErr: err('CONFLICT', 'Cannot modify a submitted claim.', 409) }

  const { data: item, error: itemErr } = await supabase
    .from('claim_items')
    .select('id, type, claim_id, org_id')
    .eq('id', item_id)
    .eq('claim_id', claim_id)
    .eq('org_id', org_id)
    .single()

  if (itemErr || !item) return { claim, item: null, lockErr: err('NOT_FOUND', 'Item not found.', 404) }

  return { claim, item, lockErr: null }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: claim_id, item_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { lockErr } = await getClaimAndItem(claim_id, item_id, org.org_id, supabase)
  if (lockErr) return lockErr

  const { error: deleteErr } = await supabase
    .from('claim_items')
    .delete()
    .eq('id', item_id)
    .eq('claim_id', claim_id)
    .eq('org_id', org.org_id)

  if (deleteErr) {
    console.error('[DELETE /api/claims/[id]/items/[item_id]]', deleteErr.message)
    return err('SERVER_ERROR', 'Failed to delete item.', 500)
  }

  await supabase.rpc('recalc_claim_total', { p_claim_id: claim_id })

  return new NextResponse(null, { status: 204 })
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
// Edits a MEAL or LODGING item. MILEAGE items are not editable (auto-calculated).

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id: claim_id, item_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { item, lockErr } = await getClaimAndItem(claim_id, item_id, org.org_id, supabase)
  if (lockErr) return lockErr
  if (!item)   return err('NOT_FOUND', 'Item not found.', 404)

  if (item.type === 'MILEAGE') {
    return err('VALIDATION_ERROR', 'Mileage items cannot be edited — they are calculated from the trip.', 400)
  }

  const body = await request.json().catch(() => ({})) as {
    type?:             string
    mode?:             string
    amount?:           number
    rate?:             number
    merchant?:         string
    notes?:            string
    receipt_url?:      string
    claim_date?:       string
    meal_session?:     string
    lodging_check_in?: string
    lodging_check_out?:string
    nights?:           number
  }

  const { type, mode, amount, rate, merchant, notes, receipt_url,
          claim_date, meal_session, lodging_check_in, lodging_check_out, nights } = body

  // Validate mode
  const item_mode = mode ?? 'FIXED_RATE'
  if (!['RECEIPT', 'FIXED_RATE'].includes(item_mode)) {
    return err('VALIDATION_ERROR', 'mode must be RECEIPT or FIXED_RATE.', 400)
  }

  // Validate claim_date
  if (!claim_date) {
    return err('VALIDATION_ERROR', 'claim_date is required.', 400)
  }

  // Build update payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    mode:        item_mode,
    claim_date:  claim_date,
    merchant:    merchant?.trim() || null,
    notes:       notes?.trim()    || null,
    receipt_url: receipt_url      || null,
  }

  if (item.type === 'MEAL') {
    const validSessions = ['FULL_DAY', 'MORNING', 'NOON', 'EVENING']
    if (item_mode === 'FIXED_RATE') {
      if (!meal_session || !validSessions.includes(meal_session)) {
        return err('VALIDATION_ERROR', 'meal_session is required for Fixed Rate meals.', 400)
      }
      updates.meal_session = meal_session

      // Re-fetch rate for correct amount
      const { data: rateRow } = await supabase
        .from('rate_versions')
        .select('meal_rate_per_session, meal_rate_full_day, meal_rate_default')
        .eq('org_id', org.org_id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()

      const sessRate    = Number(rateRow?.meal_rate_per_session ?? rateRow?.meal_rate_default ?? 25)
      const fullDayRate = Number(rateRow?.meal_rate_full_day   ?? 60)
      updates.amount    = meal_session === 'FULL_DAY' ? fullDayRate : sessRate
      updates.rate      = updates.amount
      updates.qty       = 1
      updates.unit      = 'SESSION'
    } else {
      // RECEIPT — user supplies amount
      if (!amount || amount <= 0) return err('VALIDATION_ERROR', 'amount is required for Receipt mode.', 400)
      updates.amount       = amount
      updates.rate         = null
      updates.qty          = null
      updates.unit         = null
      updates.meal_session = null
    }
  }

  if (item.type === 'LODGING') {
    const nightCount = nights ?? 1
    updates.lodging_check_in  = lodging_check_in  ?? claim_date
    updates.lodging_check_out = lodging_check_out ?? claim_date
    updates.qty               = nightCount
    updates.unit              = 'NIGHT'

    if (item_mode === 'FIXED_RATE') {
      const { data: rateRow } = await supabase
        .from('rate_versions')
        .select('lodging_rate_default')
        .eq('org_id', org.org_id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nightRate   = rate ?? Number(rateRow?.lodging_rate_default ?? 120)
      updates.rate      = nightRate
      updates.amount    = nightRate * nightCount
    } else {
      if (!amount || amount <= 0) return err('VALIDATION_ERROR', 'amount is required for Receipt mode.', 400)
      updates.amount = amount
      updates.rate   = null
    }
  }

  const { error: updateErr } = await supabase
    .from('claim_items')
    .update(updates)
    .eq('id', item_id)
    .eq('claim_id', claim_id)
    .eq('org_id', org.org_id)

  if (updateErr) {
    console.error('[PATCH /api/claims/[id]/items/[item_id]]', updateErr.message)
    return err('SERVER_ERROR', 'Failed to update item.', 500)
  }

  // Recalculate claim total — fallback to direct SUM if RPC unavailable
  const { error: recalcErr } = await supabase.rpc('recalc_claim_total', { p_claim_id: claim_id })
  if (recalcErr) {
    console.error('[PATCH items/[item_id]] recalc RPC:', recalcErr.message, '— using direct SUM')
    const { data: allItems } = await supabase.from('claim_items').select('amount').eq('claim_id', claim_id)
    const total = (allItems ?? []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
    await supabase.from('claims').update({ total_amount: total, updated_at: new Date().toISOString() }).eq('id', claim_id)
  }

  // Return updated item
  const { data: updated } = await supabase
    .from('claim_items')
    .select('*')
    .eq('id', item_id)
    .single()

  return NextResponse.json({ item: updated })
}
