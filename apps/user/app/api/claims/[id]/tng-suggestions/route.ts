// apps/user/app/api/claims/[id]/tng-suggestions/route.ts
//
// GET /api/claims/[id]/tng-suggestions
//
// Runs the TNG ↔ claim_item matching algorithm for a DRAFT claim and
// returns scored suggestions for the Link TNG UI screen.
//
// Auth:      session user must be active member of the claim's org
// Claim:     must be DRAFT (SUBMITTED claims are locked — no linking needed)
// Algorithm: apps/user/lib/tng-matcher.ts
//
// Response:
// {
//   matches:               TngMatch[]           — scored pairs, sorted by confidence
//   unmatched_claim_items: UnmatchedClaimItem[] — TNG-linkable claim items with no suggestion
//   unmatched_tng_rows:    UnmatchedTngRow[]    — unclaimed TNG rows in date window
// }
//
// Error codes:
//   UNAUTHENTICATED  401
//   NO_ORG           400
//   NOT_FOUND        404  — claim not found or not in user's org
//   CONFLICT         409  — claim is SUBMITTED (linking not applicable)
//   SERVER_ERROR     500

import { createClient }           from '@/lib/supabase/server'
import { getActiveOrg }           from '@/lib/org'
import { matchTngToClaimItems }   from '@/lib/tng-matcher'
import type {
  MatchableClaimItem,
  MatchableTngRow,
}                                 from '@/lib/tng-matcher'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── Date window helpers ───────────────────────────────────────────────────────
// Fetch TNG transactions within claim period ± 14 days to keep the candidate
// set small and avoid matching transactions from unrelated months.
const WINDOW_DAYS = 14

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: claim_id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // ── 1. Fetch claim (verify ownership + DRAFT) ─────────────────────────────
  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select('id, status, period_start, period_end')
    .eq('id', claim_id)
    .eq('org_id', org.org_id)
    .single()

  if (claimErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)
  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'This claim is submitted and locked. TNG linking is not applicable.', 409)
  }

  // ── 2. Fetch TNG-linkable items for this claim ─────────────────────────────
  const { data: rawItems, error: itemsErr } = await supabase
    .from('claim_items')
    .select('id, type, mode, paid_via_tng, claim_date, amount, merchant, tng_transaction_id')
    .eq('claim_id', claim_id)
    .in('type', ['TOLL', 'PARKING', 'TAXI', 'GRAB', 'TRAIN', 'BUS'])

  if (itemsErr) {
    console.error('[GET tng-suggestions] items fetch:', itemsErr.message)
    return err('SERVER_ERROR', 'Failed to load claim items.', 500)
  }

  // Keep only items that should participate in TNG linking.
  const eligibleItems = (rawItems ?? []).filter((i: {
    type: string; mode: string | null; paid_via_tng?: boolean | null
  }) => {
    if (i.type === 'TOLL' || i.type === 'PARKING') return true
    return ['TAXI', 'GRAB', 'TRAIN', 'BUS'].includes(i.type) && (i.mode === 'TNG' || i.paid_via_tng === true)
  })

  if (eligibleItems.length === 0) {
    return NextResponse.json({
      matches:               [],
      unmatched_claim_items: [],
      unmatched_tng_rows:    [],
      already_linked:        [],
    })
  }

  // Separate already-linked items from unlinked ones.
  // Already-linked items should not be re-matched (they're done).
  const unlinkedItems = eligibleItems.filter(
    (i: { tng_transaction_id: string | null }) => !i.tng_transaction_id
  )

  // Map to matcher input type
  const claimItems: MatchableClaimItem[] = unlinkedItems.map((i: {
    id: string; type: string; mode: string | null
    claim_date: string | null; amount: number; merchant: string | null
  }) => ({
    id:         i.id,
    type:       i.type as MatchableClaimItem['type'],
    claim_date: i.claim_date ?? new Date().toISOString().slice(0, 10),
    amount:     Number(i.amount) ?? 0,
    merchant:   i.merchant,
    mode:       i.mode,
  }))

  // ── 3. Compute date window for TNG fetch ──────────────────────────────────
  // Use claim period if available, else derive from item dates.
  const itemDates = unlinkedItems
    .map((i: { claim_date: string | null }) => i.claim_date)
    .filter(Boolean) as string[]

  const periodStart = claim.period_start
    ?? (itemDates.length > 0 ? itemDates.reduce((a, b) => a < b ? a : b) : null)
  const periodEnd   = claim.period_end
    ?? (itemDates.length > 0 ? itemDates.reduce((a, b) => a > b ? a : b) : null)

  let tngFrom: string | null = null
  let tngTo:   string | null = null

  if (periodStart) tngFrom = shiftDate(periodStart, -WINDOW_DAYS)
  if (periodEnd)   tngTo   = shiftDate(periodEnd,   +WINDOW_DAYS)

  // ── 4. Fetch unclaimed TNG transactions in the date window ────────────────
  let tngQuery = supabase
    .from('tng_transactions')
    .select('id, sector, exit_datetime, entry_datetime, entry_location, exit_location, amount, trans_no')
    .eq('user_id', user.id)
    .eq('org_id', org.org_id)
    .eq('claimed', false)
.in('sector', ['TOLL', 'PARKING', 'RETAIL'])
    .order('exit_datetime', { ascending: true })
    .limit(200)

  if (tngFrom) tngQuery = tngQuery.gte('exit_datetime', `${tngFrom}T00:00:00+08:00`)
  if (tngTo)   tngQuery = tngQuery.lte('exit_datetime', `${tngTo}T23:59:59+08:00`)

  const { data: rawTng, error: tngErr } = await tngQuery

  if (tngErr) {
    console.error('[GET tng-suggestions] tng fetch:', tngErr.message)
    return err('SERVER_ERROR', 'Failed to load TNG transactions.', 500)
  }

  const tngRows: MatchableTngRow[] = (rawTng ?? []).map((t: {
    id: string; sector: string
    exit_datetime: string | null; entry_datetime: string | null
    entry_location: string | null; exit_location: string | null
    amount: number; trans_no: string | null
  }) => ({
    id:             t.id,
    sector:         t.sector as MatchableTngRow['sector'],
    exit_datetime:  t.exit_datetime,
    entry_datetime: t.entry_datetime,
    entry_location: t.entry_location,
    exit_location:  t.exit_location,
    amount:         Number(t.amount),
    trans_no:       t.trans_no,
  }))

  // ── 5. Run matching algorithm ──────────────────────────────────────────────
  const result = matchTngToClaimItems({ claimItems, tngRows })

  // ── 6. Attach already-linked items as a separate informational field ──────
  const alreadyLinked = eligibleItems
    .filter((i: { tng_transaction_id: string | null }) => !!i.tng_transaction_id)
    .map((i: {
      id: string; type: string; mode: string | null
      claim_date: string | null; amount: number; merchant: string | null
      tng_transaction_id: string | null
    }) => ({
      id:                 i.id,
      type:               i.type,
      date:               i.claim_date,
      amount:             Number(i.amount),
      merchant:           i.merchant,
      tng_transaction_id: i.tng_transaction_id,
    }))

  return NextResponse.json({
    ...result,
    already_linked: alreadyLinked,
  })
}
