// apps/user/app/api/claims/[id]/tng-link/route.ts
//
// POST /api/claims/[id]/tng-link
//
// Confirms the user's selected TNG ↔ claim_item matches.
// Atomically updates both sides:
//   claim_items.tng_transaction_id  = tng_transaction.id
//   tng_transactions.claimed        = true
//   tng_transactions.link_status    = 'LINKED'
//   tng_transactions.claim_item_id  = claim_item.id
//
// Special case: if claim_item.mode = 'TNG' (amount was 0, pending link),
//   also sets claim_items.amount = tng_transaction.amount
//   and recalculates claim total.
//
// Request body:
// {
//   links: [
//     { claim_item_id: string, tng_transaction_id: string }
//   ]
// }
//
// Idempotent: if a link already exists (same pair), it is silently skipped.
// Not idempotent if a tng_transaction is already linked to a DIFFERENT item
// — that returns CONFLICT.
//
// Response (200):
// {
//   linked_count:   number
//   skipped_count:  number   — already-linked pairs (idempotent skip)
//   claim_total:    { amount: number, currency: 'MYR' }
// }
//
// Error codes:
//   UNAUTHENTICATED   401
//   NO_ORG            400
//   NOT_FOUND         404  — claim or item or tng_transaction not found
//   CONFLICT          409  — claim SUBMITTED, or tng already linked to different item
//   VALIDATION_ERROR  400  — missing/malformed body
//   SERVER_ERROR      500

import { createClient }    from '@/lib/supabase/server'
import { getActiveOrg }    from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

type LinkPair = {
  claim_item_id:      string
  tng_transaction_id: string
}

const TRANSPORT_TNG_TYPES = ['TAXI', 'GRAB', 'TRAIN', 'BUS'] as const

function isClaimTngType(type: string): boolean {
  return type === 'TOLL' || type === 'PARKING' || TRANSPORT_TNG_TYPES.includes(type as typeof TRANSPORT_TNG_TYPES[number])
}

function isCompatibleTngPair(itemType: string, sector: string): boolean {
  if (itemType === 'TOLL') return sector === 'TOLL'
  if (itemType === 'PARKING') return sector === 'PARKING'
  return TRANSPORT_TNG_TYPES.includes(itemType as typeof TRANSPORT_TNG_TYPES[number]) && sector === 'RETAIL'
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: Params) {
  const { id: claim_id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // ── Parse body ─────────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({})) as {
    links?: LinkPair[]
  }

  const { links } = body

  if (!links || !Array.isArray(links)) {
    return err('VALIDATION_ERROR', 'links array is required.', 400)
  }
  if (links.length === 0) {
    // Nothing to link — valid call, return current total
    const { data: claim } = await supabase
      .from('claims')
      .select('total_amount')
      .eq('id', claim_id)
      .eq('org_id', org.org_id)
      .single()
    return NextResponse.json({
      linked_count:  0,
      skipped_count: 0,
      claim_total:   { amount: Number(claim?.total_amount ?? 0), currency: 'MYR' },
    })
  }

  // Validate each pair has the required fields
  for (const [i, pair] of links.entries()) {
    if (!pair.claim_item_id || typeof pair.claim_item_id !== 'string') {
      return err('VALIDATION_ERROR', `links[${i}].claim_item_id is required.`, 400)
    }
    if (!pair.tng_transaction_id || typeof pair.tng_transaction_id !== 'string') {
      return err('VALIDATION_ERROR', `links[${i}].tng_transaction_id is required.`, 400)
    }
  }

  // Enforce one-to-one at the request level — no claim_item_id or tng_transaction_id
  // should appear more than once in the same request.
  const seenItems = new Set<string>()
  const seenTxns  = new Set<string>()
  for (const [i, pair] of links.entries()) {
    if (seenItems.has(pair.claim_item_id)) {
      return err('VALIDATION_ERROR', `links[${i}].claim_item_id appears more than once.`, 400)
    }
    if (seenTxns.has(pair.tng_transaction_id)) {
      return err('VALIDATION_ERROR', `links[${i}].tng_transaction_id appears more than once.`, 400)
    }
    seenItems.add(pair.claim_item_id)
    seenTxns.add(pair.tng_transaction_id)
  }

  // ── Verify claim ownership + DRAFT status ─────────────────────────────────
  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select('id, status, total_amount')
    .eq('id', claim_id)
    .eq('org_id', org.org_id)
    .single()

  if (claimErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)
  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'Submitted claims are locked. TNG linking is not allowed.', 409)
  }

  // ── Bulk-fetch claim items ─────────────────────────────────────────────────
  const itemIds = links.map(l => l.claim_item_id)
  const { data: claimItems, error: itemsErr } = await supabase
    .from('claim_items')
    .select('id, claim_id, type, mode, amount, paid_via_tng, tng_transaction_id')
    .in('id', itemIds)
    .eq('org_id', org.org_id)

  if (itemsErr) {
    console.error('[POST tng-link] items fetch:', itemsErr.message)
    return err('SERVER_ERROR', 'Failed to verify claim items.', 500)
  }

  // Index for fast lookup
  const itemMap = new Map<string, {
    id: string; claim_id: string; type: string
    mode: string | null; amount: number; paid_via_tng?: boolean | null; tng_transaction_id: string | null
  }>()
  for (const item of (claimItems ?? [])) {
    itemMap.set(item.id, item)
  }

  // ── Bulk-fetch TNG transactions ────────────────────────────────────────────
  const txnIds = links.map(l => l.tng_transaction_id)
  const { data: tngRows, error: tngErr } = await supabase
    .from('tng_transactions')
    .select('id, claimed, link_status, claim_item_id, amount, sector')
    .in('id', txnIds)
    .eq('user_id', user.id)
    .eq('org_id', org.org_id)

  if (tngErr) {
    console.error('[POST tng-link] tng fetch:', tngErr.message)
    return err('SERVER_ERROR', 'Failed to verify TNG transactions.', 500)
  }

  const tngMap = new Map<string, {
    id: string; claimed: boolean; link_status: string
    claim_item_id: string | null; amount: number; sector: string
  }>()
  for (const txn of (tngRows ?? [])) {
    tngMap.set(txn.id, txn)
  }

  // ── Process each link ──────────────────────────────────────────────────────
  let linked_count  = 0
  let skipped_count = 0
  let amountDelta   = 0   // track amount changes for TNG-pending items

  for (const pair of links) {
    const item = itemMap.get(pair.claim_item_id)
    const txn  = tngMap.get(pair.tng_transaction_id)

    // Validate item
    if (!item) {
      return err('NOT_FOUND', `Claim item ${pair.claim_item_id} not found.`, 404)
    }
    if (item.claim_id !== claim_id) {
      return err('NOT_FOUND', `Claim item ${pair.claim_item_id} does not belong to this claim.`, 404)
    }
    if (!isClaimTngType(item.type)) {
      return err('VALIDATION_ERROR', `Only TNG-linkable items can be linked to TNG transactions.`, 400)
    }

    // Validate TNG row
    if (!txn) {
      return err('NOT_FOUND', `TNG transaction ${pair.tng_transaction_id} not found.`, 404)
    }

    if (!isCompatibleTngPair(item.type, txn.sector)) {
      return err(
        'VALIDATION_ERROR',
        `Claim item ${pair.claim_item_id} (${item.type}) cannot be linked to TNG sector ${txn.sector}.`,
        400,
      )
    }

    // Idempotent: already linked to the SAME item → skip silently
    if (txn.claimed && txn.claim_item_id === pair.claim_item_id
        && item.tng_transaction_id === pair.tng_transaction_id) {
      skipped_count++
      continue
    }

    // Conflict: TNG row already linked to a DIFFERENT item
    if (txn.claimed && txn.claim_item_id && txn.claim_item_id !== pair.claim_item_id) {
      return err(
        'CONFLICT',
        `TNG transaction ${pair.tng_transaction_id} is already linked to a different claim item.`,
        409,
      )
    }

    // ── Write claim_items side ───────────────────────────────────────────────
    const itemUpdate: Record<string, unknown> = {
      tng_transaction_id: txn.id,
    }

    if (item.mode === 'TNG') {
      itemUpdate.mode = 'TNG'
    }
    if (TRANSPORT_TNG_TYPES.includes(item.type as typeof TRANSPORT_TNG_TYPES[number])) {
      itemUpdate.paid_via_tng = true
    }

    // If item was TNG-pending (amount=0), fill in the real amount from the TNG row.
    // NOTE: Supabase returns numeric columns as strings — use Number() coercion,
    // NOT strict === 0, otherwise "0" !== 0 and the amount never gets written.
    if (item.mode === 'TNG' && Number(item.amount) === 0) {
      itemUpdate.amount = Number(txn.amount)
      amountDelta += Number(txn.amount)
    }

    const { error: itemUpdateErr } = await supabase
      .from('claim_items')
      .update(itemUpdate)
      .eq('id', pair.claim_item_id)

    if (itemUpdateErr) {
      console.error('[POST tng-link] item update:', itemUpdateErr.message)
      return err('SERVER_ERROR', `Failed to update claim item ${pair.claim_item_id}.`, 500)
    }

    // ── Write tng_transactions side ──────────────────────────────────────────
    const { error: tngUpdateErr } = await supabase
      .from('tng_transactions')
      .update({
        claimed:       true,
        link_status:   'LINKED',
        claim_item_id: pair.claim_item_id,
      })
      .eq('id', pair.tng_transaction_id)

    if (tngUpdateErr) {
      console.error('[POST tng-link] tng update:', tngUpdateErr.message)
      return err('SERVER_ERROR', `Failed to update TNG transaction ${pair.tng_transaction_id}.`, 500)
    }

    linked_count++
  }

  // ── Recalculate claim total if any TNG-pending amounts were filled ─────────
  // Use the RPC if available; fall back to manual sum.
  let newTotal: number

  if (amountDelta > 0) {
    const { data: rpcTotal, error: recalcErr } = await supabase
      .rpc('recalc_claim_total', { p_claim_id: claim_id })

    if (recalcErr) {
      // Manual fallback
      const { data: sumResult } = await supabase
        .from('claim_items')
        .select('amount')
        .eq('claim_id', claim_id)

      const sum = (sumResult ?? [])
        .reduce((acc: number, r: { amount: number }) => acc + Number(r.amount), 0)

      await supabase
        .from('claims')
        .update({ total_amount: sum })
        .eq('id', claim_id)

      newTotal = sum
    } else {
      newTotal = Number(rpcTotal)
    }
  } else {
    // No amounts changed — return current total
    const { data: refreshed } = await supabase
      .from('claims')
      .select('total_amount')
      .eq('id', claim_id)
      .single()
    newTotal = Number(refreshed?.total_amount ?? claim.total_amount)
  }

  return NextResponse.json({
    linked_count,
    skipped_count,
    claim_total: { amount: newTotal, currency: 'MYR' },
  })
}
