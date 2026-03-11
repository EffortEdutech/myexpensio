// apps/user/app/api/transactions/[tng_id]/link/route.ts
// POST /api/transactions/[tng_id]/link
//
// Direction A matching — user picks a TNG row from the Transactions tab
// and attaches it to an existing TOLL or PARKING claim item.
//
// This is the REVERSE of the existing /api/claims/[id]/tng-link flow (Direction B).
// Both directions call the same DB operations — just different entry points.
//
// Request body:
//   { claim_item_id: string }
//
// Validations:
//   - tng_transaction belongs to the calling user + org
//   - tng_transaction is not already claimed (idempotent: allow re-link to same item)
//   - claim_item exists, belongs to user's org
//   - claim_item.type is TOLL or PARKING
//   - claim_item.claim.status is DRAFT (SUBMITTED = locked)
//   - claim_item has no existing tng_transaction_id (or it's the same one — idempotent)
//
// On success:
//   - tng_transactions: claimed=true, claim_item_id=claim_item_id
//   - claim_items: tng_transaction_id=tng_id, amount=tng_amount (if amount was 0 or TNG mode)
//   - Recalcs claim total
//
// Response:
//   { ok: true, claim_item, claim_total, tng_transaction }
//
// Error codes:
//   400 VALIDATION_ERROR
//   404 NOT_FOUND
//   409 CONFLICT — already claimed by a different item / claim is SUBMITTED

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type Params = { params: Promise<{ tng_id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

async function recalcTotal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  claim_id: string,
  fallback: number,
): Promise<number> {
  const { data, error } = await supabase.rpc('recalc_claim_total', { p_claim_id: claim_id })
  if (error) {
    console.error('[link] recalc RPC error, using SUM fallback:', error.message)
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
  return Number(data ?? fallback)
}

export async function POST(request: NextRequest, { params }: Params) {
  const { tng_id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = await request.json().catch(() => ({})) as { claim_item_id?: string }

  if (!body.claim_item_id) {
    return err('VALIDATION_ERROR', 'claim_item_id is required.', 400)
  }

  // ── Fetch TNG transaction ─────────────────────────────────────────────────
  const { data: tng, error: tngErr } = await supabase
    .from('tng_transactions')
    .select('id, org_id, user_id, sector, amount, claimed, claim_item_id, trans_no')
    .eq('id', tng_id)
    .eq('org_id', org.org_id)
    .eq('user_id', user.id)
    .single()

  if (tngErr || !tng) return err('NOT_FOUND', 'TNG transaction not found.', 404)

  // Idempotent: if already linked to this exact item, return success
  if (tng.claimed && tng.claim_item_id === body.claim_item_id) {
    // Re-fetch item and return success — no double write
    const { data: existingItem } = await supabase
      .from('claim_items')
      .select('*, claims!inner(id, total_amount)')
      .eq('id', body.claim_item_id)
      .single()

    return NextResponse.json({
      ok:              true,
      already_linked:  true,
      claim_item:      existingItem,
      claim_total:     { currency: 'MYR', amount: Number(existingItem?.claims?.total_amount ?? 0) },
      tng_transaction: tng,
    })
  }

  // Already claimed by a different item
  if (tng.claimed && tng.claim_item_id && tng.claim_item_id !== body.claim_item_id) {
    return err('CONFLICT', 'This TNG transaction is already linked to a different claim item.', 409)
  }

  // Only TOLL and PARKING can be linked to TNG statements
  if (!['TOLL', 'PARKING'].includes(tng.sector)) {
    return err('VALIDATION_ERROR', 'Only TOLL or PARKING TNG transactions can be linked to claim items.', 400)
  }

  // ── Fetch claim item + its parent claim ───────────────────────────────────
  const { data: claimItem, error: ciErr } = await supabase
    .from('claim_items')
    .select(`
      id, org_id, type, amount, tng_transaction_id, mode,
      claims!inner (id, org_id, status)
    `)
    .eq('id', body.claim_item_id)
    .eq('org_id', org.org_id)
    .single()

  if (ciErr || !claimItem) return err('NOT_FOUND', 'Claim item not found.', 404)

  const claim = claimItem.claims as { id: string; org_id: string; status: string }

  // Claim lock check — absolute
  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'Cannot link to a submitted claim.', 409)
  }

  // Only TOLL / PARKING claim items can receive a TNG link
  if (!['TOLL', 'PARKING'].includes(claimItem.type)) {
    return err('VALIDATION_ERROR', 'Only TOLL or PARKING claim items can be linked to a TNG transaction.', 400)
  }

  // Already linked to a different TNG transaction
  if (claimItem.tng_transaction_id && claimItem.tng_transaction_id !== tng_id) {
    return err('CONFLICT', 'This claim item is already linked to a different TNG transaction. Unlink it first.', 409)
  }

  // ── Update tng_transaction ─────────────────────────────────────────────────
  const tngAmount = Number(tng.amount) || 0

  const { error: tngUpdateErr } = await supabase
    .from('tng_transactions')
    .update({
      claimed:       true,
      claim_item_id: body.claim_item_id,
    })
    .eq('id', tng_id)

  if (tngUpdateErr) {
    console.error('[POST link] tng update:', tngUpdateErr.message)
    return err('SERVER_ERROR', 'Failed to mark TNG transaction as claimed.', 500)
  }

  // ── Update claim item ──────────────────────────────────────────────────────
  // Always set tng_transaction_id.
  // Update amount if:
  //   - mode is TNG (amount was placeholder 0), OR
  //   - amount is 0 (safety: overwrite placeholder amounts only)
  const shouldUpdateAmount = claimItem.mode === 'TNG' || Number(claimItem.amount) === 0

  const itemUpdate: Record<string, unknown> = {
    tng_transaction_id: tng_id,
    mode:               'TNG',
  }
  if (shouldUpdateAmount && tngAmount > 0) {
    itemUpdate.amount = tngAmount
  }

  const { data: updatedItem, error: ciUpdateErr } = await supabase
    .from('claim_items')
    .update(itemUpdate)
    .eq('id', body.claim_item_id)
    .select()
    .single()

  if (ciUpdateErr) {
    console.error('[POST link] claim_item update:', ciUpdateErr.message)
    // Attempt to roll back TNG update
    await supabase
      .from('tng_transactions')
      .update({ claimed: false, claim_item_id: null })
      .eq('id', tng_id)
    return err('SERVER_ERROR', 'Failed to update claim item.', 500)
  }

  // ── Recalc claim total ─────────────────────────────────────────────────────
  const claim_total = await recalcTotal(supabase, claim.id, tngAmount)

  return NextResponse.json({
    ok:              true,
    claim_item:      updatedItem,
    claim_total:     { currency: 'MYR', amount: claim_total },
    tng_transaction: { ...tng, claimed: true, claim_item_id: body.claim_item_id },
  })
}
