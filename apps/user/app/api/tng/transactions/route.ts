// apps/user/app/api/tng/transactions/route.ts
//
// GET  /api/tng/transactions?sector=TOLL|PARKING&claimed=false&from=YYYY-MM-DD&to=YYYY-MM-DD
// POST /api/tng/transactions
//
// GET  — List stored TNG transactions for the current user.
//         Now returns statement_label on every row.
// POST — Save parsed rows from /api/tng/parse into tng_transactions.
//         Deduplicates on trans_no per user. Returns saved + skipped counts.
//         Accepts statement_label (forwarded from parse route) and writes it on insert.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

type TngParsedRow = {
  trans_no:       string | null
  entry_datetime: string | null
  exit_datetime:  string | null
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  sector:         'TOLL' | 'PARKING' | 'RETAIL'
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { searchParams } = new URL(request.url)
  const sector  = searchParams.get('sector')
  const claimed = searchParams.get('claimed')
  const from    = searchParams.get('from')
  const to      = searchParams.get('to')

  let query = supabase
    .from('tng_transactions')
    .select(`
      id, trans_no,
      entry_datetime, exit_datetime,
      entry_location, exit_location,
      amount, currency, sector,
      claimed, claim_item_id,
      upload_batch_id, source_file_url,
      statement_label,
      created_at
    `)
    .eq('org_id', org.org_id)
    .eq('user_id', user.id)
    .order('exit_datetime', { ascending: false })
    .limit(200)

  if (sector && ['TOLL', 'PARKING', 'RETAIL'].includes(sector.toUpperCase())) {
    query = query.eq('sector', sector.toUpperCase())
  }
  if (claimed === 'false') {
    query = query.eq('claimed', false)
  }
  if (from) {
    query = query.gte('exit_datetime', from)
  }
  if (to) {
    query = query.lte('exit_datetime', to + 'T23:59:59+08:00')
  }

  const { data, error } = await query
  if (error) {
    console.error('[GET /api/tng/transactions]', error.message)
    return err('SERVER_ERROR', 'Failed to load transactions.', 500)
  }

  return NextResponse.json({ items: data ?? [] })
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = await request.json().catch(() => ({})) as {
    rows?:             TngParsedRow[]
    source_file_path?: string | null   // Storage path from /api/tng/parse
    statement_label?:  string | null   // Human-readable label from /api/tng/parse
  }

  if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
    return err('VALIDATION_ERROR', '"rows" array is required and must not be empty.', 400)
  }

  // Validate rows — drop malformed silently
  const validRows = body.rows.filter(r =>
    r &&
    typeof r.amount === 'number' &&
    r.amount > 0 &&
    ['TOLL', 'PARKING', 'RETAIL'].includes(r.sector)
  )

  if (validRows.length === 0) {
    return err('VALIDATION_ERROR', 'No valid TNG transaction rows in request.', 400)
  }

  const source_file_url = body.source_file_path ?? null
  const statement_label = body.statement_label  ?? null

  // One batch ID groups all rows from this upload
  const upload_batch_id = crypto.randomUUID()

  // ── Manual dedup: avoid re-inserting rows with the same trans_no ──────────
  const incomingWithTransNo = validRows.filter(r => r.trans_no !== null)
  const incomingTransNos    = incomingWithTransNo.map(r => r.trans_no as string)
  let existingTransNos: Set<string> = new Set()

  if (incomingTransNos.length > 0) {
    const { data: existing } = await supabase
      .from('tng_transactions')
      .select('trans_no')
      .eq('user_id', user.id)
      .in('trans_no', incomingTransNos)

    existingTransNos = new Set(
      (existing ?? []).map((r: { trans_no: string | null }) => r.trans_no ?? '')
    )
  }

  const newRowsWithTransNo = incomingWithTransNo.filter(
    r => !existingTransNos.has(r.trans_no as string)
  )
  const skippedWithTransNo = incomingWithTransNo.length - newRowsWithTransNo.length
  const rowsWithoutTransNo = validRows.filter(r => r.trans_no === null)

  const toInsert = [...newRowsWithTransNo, ...rowsWithoutTransNo]

  let saved_count     = 0
  const skipped_count = skippedWithTransNo

  if (toInsert.length > 0) {
    const inserts = toInsert.map(r => ({
      org_id:          org.org_id,
      user_id:         user.id,
      trans_no:        r.trans_no        ?? null,
      entry_datetime:  r.entry_datetime  ?? null,
      exit_datetime:   r.exit_datetime   ?? null,
      entry_location:  r.entry_location  ?? null,
      exit_location:   r.exit_location   ?? null,
      amount:          r.amount,
      currency:        'MYR',
      sector:          r.sector,
      upload_batch_id,
      source_file_url,
      statement_label,  // ← all rows in this batch share the same label
      claimed:          false,
    }))

    const { data: saved, error: insertErr } = await supabase
      .from('tng_transactions')
      .insert(inserts)
      .select('id')

    if (insertErr) {
      console.error('[POST /api/tng/transactions] insert:', insertErr.message, insertErr.details)
      return err('SERVER_ERROR', `Failed to save transactions: ${insertErr.message}`, 500)
    }

    saved_count = saved?.length ?? 0
  }

  return NextResponse.json({
    upload_batch_id,
    statement_label,
    saved_count,
    skipped_count,
    message: `${saved_count} transaction${saved_count !== 1 ? 's' : ''} saved. ${skipped_count} duplicate${skipped_count !== 1 ? 's' : ''} skipped.`,
  }, { status: 201 })
}
