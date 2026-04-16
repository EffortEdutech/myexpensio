// apps/user/app/api/transactions/route.ts
// GET /api/transactions
//
// Unified payment ledger combining two sources:
//   1. tng_transactions (TOLL + PARKING + RETAIL rows from imported TNG statements)
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
//   id:              string        — tng_transaction.id or claim_item.id
//   source:          'TNG' | 'CLAIM'
//   type:            string        — TOLL | PARKING | GRAB | TRAIN | BUS | TAXI | FLIGHT
//   date:            string        — YYYY-MM-DD
//   description:     string
//   amount:          number
//   currency:        'MYR'
//   matched:         boolean       — TNG: claimed=true; CLAIM items are always true
//   paid_via_tng:    boolean
//   claim_id:        string|null
//   claim_title:     string|null
//   tng_id:          string|null   — set when source=TNG (Direction A linking)
//   upload_batch_id: string|null   — TNG batch grouping key
//   statement_label: string|null   — human-readable statement name (TNG rows only)
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
  id:              string
  source:          'TNG' | 'CLAIM'
  type:            string
  date:            string
  description:     string
  amount:          number
  currency:        'MYR'
  matched:         boolean
  paid_via_tng:    boolean
  claim_id:        string | null
  claim_title:     string | null
  tng_id:          string | null
  mode?:           string | null
  upload_batch_id: string | null
  statement_label: string | null
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

  const since     = new Date()
  since.setMonth(since.getMonth() - months)
  const sinceIso  = since.toISOString()

  const items: UnifiedTransaction[] = []

  // ── Source 1: TNG transactions ────────────────────────────────────────────
  const showTng =
    filter === 'ALL' ||
    filter === 'UNMATCHED' ||
    filter === 'TOLL' ||
    filter === 'PARKING'

  if (showTng) {
    let tngQuery = supabase
      .from('tng_transactions')
      .select(`
        id, trans_no,
        entry_datetime, exit_datetime,
        entry_location, exit_location,
        amount, currency, sector,
        claimed, claim_item_id,
        upload_batch_id, statement_label
      `)
      .eq('org_id', org.org_id)
      .eq('user_id', user.id)
      .in('sector', ['TOLL', 'PARKING'])
      .gte('exit_datetime', sinceIso)
      .order('exit_datetime', { ascending: false })
      .limit(300)

    if (filter === 'UNMATCHED') tngQuery = tngQuery.eq('claimed', false)
    if (filter === 'TOLL')      tngQuery = tngQuery.eq('sector', 'TOLL')
    if (filter === 'PARKING')   tngQuery = tngQuery.eq('sector', 'PARKING')

    const { data: tngRows, error: tngErr } = await tngQuery
    if (tngErr) console.error('[GET /api/transactions] tng query:', tngErr.message)

    for (const row of (tngRows ?? [])) {
      const date = (row.exit_datetime ?? row.entry_datetime ?? '').slice(0, 10)
      let description = ''
      if (row.sector === 'TOLL') {
        const parts = [row.entry_location, row.exit_location].filter(Boolean)
        description = parts.join(' → ') || 'Toll'
        if (row.trans_no) description += `  [#${row.trans_no}]`
      } else if (row.sector === 'PARKING') {
        description = row.entry_location ?? row.exit_location ?? 'Parking'
        if (row.trans_no) description += `  [#${row.trans_no}]`
      } else {
        const parts = [row.entry_location, row.exit_location].filter(Boolean)
        description = parts.join(' · ') || 'Retail'
        if (row.trans_no) description += `  [#${row.trans_no}]`
      }

      items.push({
        id:              row.id,
        source:          'TNG',
        type:            row.sector,
        date,
        description,
        amount:          Number(row.amount) || 0,
        currency:        'MYR',
        matched:         row.claimed === true,
        paid_via_tng:    false,
        claim_id:        null,
        claim_title:     null,
        tng_id:          row.id,
        mode:            null,
        upload_batch_id: row.upload_batch_id ?? null,
        statement_label: row.statement_label ?? null,
      })
    }
  }

  // ── Source 2: Transport claim items ───────────────────────────────────────
  const showClaimTypes =
    filter === 'ALL' ||
    TRANSPORT_TYPES.includes(filter)

  if (showClaimTypes && filter !== 'UNMATCHED') {
    const typeFilter = TRANSPORT_TYPES.includes(filter) ? [filter] : TRANSPORT_TYPES

    const { data: ciRows, error: ciErr } = await supabase
      .from('claim_items')
      .select(`
        id, type, amount, currency,
        claim_date, merchant, notes, mode,
        paid_via_tng, receipt_url,
        tng_transaction_id,
        claims!inner (
          id, title, period_start, period_end, status
        )
      `)
      .eq('org_id', org.org_id)
      .in('type', typeFilter)
      .gte('claim_date', sinceIso.slice(0, 10))
      .order('claim_date', { ascending: false })
      .limit(500)

    if (ciErr) console.error('[GET /api/transactions] claim_items query:', ciErr.message)

    for (const row of (ciRows ?? [])) {
      const claim = (Array.isArray(row.claims) ? row.claims[0] : row.claims) as
        { id: string; title: string | null } | null

      const description =
        row.merchant ||
        row.notes    ||
        row.type

      items.push({
        id:              row.id,
        source:          'CLAIM',
        type:            row.type,
        date:            row.claim_date ?? '',
        description,
        amount:          Number(row.amount) || 0,
        currency:        'MYR',
        matched:         true,
        paid_via_tng:    row.paid_via_tng === true,
        claim_id:        claim?.id        ?? null,
        claim_title:     claim?.title     ?? null,
        tng_id:          row.tng_transaction_id ?? null,
        mode:            row.mode         ?? null,
        upload_batch_id: null,
        statement_label: null,
      })
    }
  }

  // ── Merge + sort by date desc ─────────────────────────────────────────────
  items.sort((a, b) => b.date.localeCompare(a.date))

  const summary = {
    total_count:      items.length,
    unmatched_count:  items.filter(i => i.source === 'TNG' && !i.matched).length,
    total_amount_myr: items.reduce((s, i) => s + i.amount, 0),
  }

  return NextResponse.json({ items, summary })
}
