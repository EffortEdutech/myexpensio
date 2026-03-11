// apps/user/app/api/transactions/route.ts
// GET /api/transactions
//
// Unified payment ledger combining two sources:
//   1. tng_transactions (TOLL + PARKING rows from imported TNG statements)
//   2. claim_items of transport types (TAXI / GRAB / TRAIN / FLIGHT / BUS / TOLL-manual / PARKING-manual)
//
// Returns a single merged + date-sorted array for the Transactions tab.
//
// Query params:
//   ?filter=all|unmatched|TOLL|PARKING|GRAB|TRAIN|BUS|TAXI|FLIGHT
//   ?months=6     (default 6, max 12)
//
// Response:
// {
//   items: UnifiedTransaction[]
//   summary: { total_count, unmatched_count, total_amount_myr }
// }
//
// UnifiedTransaction shape:
// {
//   id:           string        — tng_transaction.id or claim_item.id
//   source:       'TNG' | 'CLAIM'
//   type:         string        — TOLL | PARKING | GRAB | TRAIN | BUS | TAXI | FLIGHT
//   date:         string        — YYYY-MM-DD (exit_datetime for TNG, claim_date for CLAIM)
//   description:  string        — entry→exit for TOLL, location/merchant for others
//   amount:       number
//   currency:     'MYR'
//   matched:      boolean       — TNG: claimed=true; CLAIM: always true
//   paid_via_tng: boolean       — CLAIM items with paid_via_tng flag
//   claim_id:     string|null
//   claim_title:  string|null
//   tng_id:       string|null   — set when source=TNG (used for Direction A linking)
// }

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

const TRANSPORT_TYPES = ['TAXI', 'GRAB', 'TRAIN', 'FLIGHT', 'BUS', 'TOLL', 'PARKING']

type UnifiedTransaction = {
  id:           string
  source:       'TNG' | 'CLAIM'
  type:         string
  date:         string
  description:  string
  amount:       number
  currency:     'MYR'
  matched:      boolean
  paid_via_tng: boolean
  claim_id:     string | null
  claim_title:  string | null
  tng_id:       string | null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { searchParams } = new URL(request.url)
  const filter = (searchParams.get('filter') ?? 'all').toUpperCase()
  const months = Math.min(12, Math.max(1, parseInt(searchParams.get('months') ?? '6', 10)))

  // Date window: last N months (MYT — use UTC offset approximation)
  const since = new Date()
  since.setMonth(since.getMonth() - months)
  const sinceIso = since.toISOString().slice(0, 10)

  const items: UnifiedTransaction[] = []

  // ── Source 1: TNG transactions ─────────────────────────────────────────────
  // Always TOLL or PARKING sector (RETAIL not stored by choice — user ticks flag instead)
  if (filter === 'ALL' || filter === 'UNMATCHED' || filter === 'TOLL' || filter === 'PARKING') {
    let tngQuery = supabase
      .from('tng_transactions')
      .select(`
        id, trans_no,
        entry_datetime, exit_datetime,
        entry_location, exit_location,
        amount, sector, claimed,
        claim_item_id, upload_batch_id
      `)
      .eq('org_id', org.org_id)
      .eq('user_id', user.id)
      .in('sector', ['TOLL', 'PARKING'])
      .gte('exit_datetime', sinceIso)
      .order('exit_datetime', { ascending: false })
      .limit(500)

    if (filter === 'UNMATCHED') {
      tngQuery = tngQuery.eq('claimed', false)
    } else if (filter === 'TOLL') {
      tngQuery = tngQuery.eq('sector', 'TOLL')
    } else if (filter === 'PARKING') {
      tngQuery = tngQuery.eq('sector', 'PARKING')
    }

    const { data: tngRows, error: tngErr } = await tngQuery
    if (tngErr) {
      console.error('[GET /api/transactions] tng query:', tngErr.message)
    }

    for (const row of tngRows ?? []) {
      const date = (row.exit_datetime ?? row.entry_datetime ?? '').slice(0, 10)
      let description = ''
      if (row.sector === 'TOLL') {
        const parts = [row.entry_location, row.exit_location].filter(Boolean)
        description = parts.join(' → ') || 'Toll'
        if (row.trans_no) description += `  [#${row.trans_no}]`
      } else {
        description = row.entry_location ?? 'Parking'
        if (row.trans_no) description += `  [#${row.trans_no}]`
      }

      items.push({
        id:           row.id,
        source:       'TNG',
        type:         row.sector,
        date,
        description,
        amount:       Number(row.amount) || 0,
        currency:     'MYR',
        matched:      row.claimed === true,
        paid_via_tng: false,
        claim_id:     null,   // we don't join claims here for performance
        claim_title:  null,
        tng_id:       row.id,
      })
    }
  }

  // ── Source 2: Transport claim items ───────────────────────────────────────
  // TAXI / GRAB / TRAIN / FLIGHT / BUS / TOLL-manual / PARKING-manual
  // Joined with their claim for title
  const showClaimTypes =
    filter === 'ALL' ||
    TRANSPORT_TYPES.includes(filter)

  if (showClaimTypes && filter !== 'UNMATCHED') {
    const typeFilter = TRANSPORT_TYPES.includes(filter) ? [filter] : TRANSPORT_TYPES

    const { data: ciRows, error: ciErr } = await supabase
      .from('claim_items')
      .select(`
        id, type, amount, currency,
        claim_date, merchant, notes,
        paid_via_tng, receipt_url,
        tng_transaction_id,
        claims!inner (
          id, title, period_start, period_end, status
        )
      `)
      .eq('org_id', org.org_id)
      .in('type', typeFilter)
      .gte('claim_date', sinceIso)
      .order('claim_date', { ascending: false })
      .limit(500)

    if (ciErr) {
      console.error('[GET /api/transactions] claim_items query:', ciErr.message)
    }

    for (const row of ciRows ?? []) {
      const claim = (Array.isArray(row.claims) ? row.claims[0] : row.claims) as { id: string; title: string | null; period_start: string; period_end: string; status: string } | null ?? null

      // Skip TOLL/PARKING items that came from TNG — they already appear in Source 1
      // (TNG-linked items have tng_transaction_id set)
      if ((row.type === 'TOLL' || row.type === 'PARKING') && row.tng_transaction_id) continue

      const description = row.merchant?.trim() || row.notes?.trim() || row.type

      items.push({
        id:           row.id,
        source:       'CLAIM',
        type:         row.type,
        date:         row.claim_date ?? '',
        description,
        amount:       Number(row.amount) || 0,
        currency:     'MYR',
        matched:      true,   // claim items are always "matched" by definition
        paid_via_tng: row.paid_via_tng === true,
        claim_id:     claim?.id ?? null,
        claim_title:  claim?.title ?? buildPeriodLabel(claim?.period_start, claim?.period_end),
        tng_id:       null,
      })
    }
  }

  // ── Sort: newest first ─────────────────────────────────────────────────────
  items.sort((a, b) => {
    if (b.date > a.date) return 1
    if (b.date < a.date) return -1
    return 0
  })

  // ── Summary ────────────────────────────────────────────────────────────────
  const unmatched_count = items.filter(i => i.source === 'TNG' && !i.matched).length
  const total_amount    = items.reduce((s, i) => s + i.amount, 0)

  return NextResponse.json({
    items,
    summary: {
      total_count:      items.length,
      unmatched_count,
      total_amount_myr: Number(total_amount.toFixed(2)),
    },
  })
}

function buildPeriodLabel(start?: string, end?: string): string {
  if (!start) return 'Untitled Claim'
  const s = new Date(start)
  if (!end) return s.toLocaleDateString('en-MY', { month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })
  const e = new Date(end)
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return s.toLocaleDateString('en-MY', { month: 'long', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })
  }
  return `${s.toLocaleDateString('en-MY', { month: 'short', timeZone: 'Asia/Kuala_Lumpur' })} – ${e.toLocaleDateString('en-MY', { month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })}`
}
