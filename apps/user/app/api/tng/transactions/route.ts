// apps/user/app/api/tng/transactions/route.ts
//
// GET  /api/tng/transactions
// POST /api/tng/transactions
//
// GET  — List stored TNG transactions for the current user.
//         Used to populate the "Select from TNG" picker when adding TOLL/PARKING claim items.
//         Query params:
//           sector=TOLL|PARKING  (default: all non-RETAIL)
//           claimed=false|true   (default: all)
//           from=YYYY-MM-DD
//           to=YYYY-MM-DD
//
// POST — Persist parsed rows from /api/tng/parse.
//         Deduplicates by (user_id, trans_no) — safe to re-upload same statement.
//         Returns saved_count and skipped_count.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── Shared types ──────────────────────────────────────────────────────────────

interface TngRowInput {
  trans_no?:        string | null
  entry_datetime?:  string | null
  exit_datetime?:   string | null
  entry_location?:  string | null
  exit_location?:   string | null
  amount:           number
  sector:           'TOLL' | 'PARKING' | 'RETAIL'
  source_file_url?: string | null
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const sp      = request.nextUrl.searchParams
  const sector  = sp.get('sector')    // TOLL | PARKING | (blank = TOLL+PARKING, no RETAIL)
  const claimed = sp.get('claimed')   // true | false | (blank = all)
  const from    = sp.get('from')      // YYYY-MM-DD
  const to      = sp.get('to')        // YYYY-MM-DD

  let query = supabase
    .from('tng_transactions')
    .select('*')
    .eq('org_id', org.org_id)
    .eq('user_id', user.id)
    .order('entry_datetime', { ascending: false })

  // Default: exclude RETAIL unless explicitly requested
  if (sector && ['TOLL', 'PARKING', 'RETAIL'].includes(sector)) {
    query = query.eq('sector', sector)
  } else {
    // Return TOLL + PARKING only (not RETAIL)
    query = query.in('sector', ['TOLL', 'PARKING'])
  }

  if (claimed === 'false') query = query.eq('claimed', false)
  if (claimed === 'true')  query = query.eq('claimed', true)

  // Date filters — apply to entry_datetime
  if (from) query = query.gte('entry_datetime', `${from}T00:00:00+08:00`)
  if (to)   query = query.lte('entry_datetime', `${to}T23:59:59+08:00`)

  const { data, error: fetchErr } = await query

  if (fetchErr) {
    console.error('[GET /api/tng/transactions]', fetchErr.message)
    return err('SERVER_ERROR', 'Failed to fetch transactions.', 500)
  }

  return NextResponse.json({
    items: data ?? [],
    count: data?.length ?? 0,
  }, { status: 200 })
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = await request.json().catch(() => ({})) as {
    rows?:            TngRowInput[]
    source_file_url?: string | null
  }

  const { rows, source_file_url } = body

  // Validate
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return err('VALIDATION_ERROR', '"rows" array is required and must not be empty.', 400)
  }
  if (rows.length > 200) {
    return err('VALIDATION_ERROR', 'Maximum 200 rows per upload batch.', 400)
  }

  for (const [idx, row] of rows.entries()) {
    if (typeof row.amount !== 'number' || row.amount <= 0) {
      return err('VALIDATION_ERROR', `Row ${idx}: amount must be a positive number.`, 400)
    }
    if (!['TOLL', 'PARKING', 'RETAIL'].includes(row.sector)) {
      return err('VALIDATION_ERROR', `Row ${idx}: sector must be TOLL, PARKING, or RETAIL.`, 400)
    }
  }

  // One batch_id groups all rows from this upload session
  const upload_batch_id = randomUUID()

  const inserts = rows.map(row => ({
    org_id:          org.org_id,
    user_id:         user.id,
    trans_no:        row.trans_no        ?? null,
    entry_datetime:  row.entry_datetime  ?? null,
    exit_datetime:   row.exit_datetime   ?? null,
    entry_location:  row.entry_location  ?? null,
    exit_location:   row.exit_location   ?? null,
    amount:          Number(row.amount.toFixed(2)),
    currency:        'MYR',
    sector:          row.sector,
    source_file_url: source_file_url ?? row.source_file_url ?? null,
    upload_batch_id,
  }))

  // Upsert with ignoreDuplicates — dedup on (user_id, trans_no) unique index
  // Rows without trans_no (manual entries) always insert.
  const { data: saved, error: insertErr } = await supabase
    .from('tng_transactions')
    .upsert(inserts, {
      onConflict:       'user_id,trans_no',
      ignoreDuplicates: true,
    })
    .select('id, trans_no, sector, amount')

  if (insertErr) {
    console.error('[POST /api/tng/transactions] upsert error:', insertErr.message, insertErr.details)
    return err('SERVER_ERROR', 'Failed to save transactions.', 500)
  }

  const saved_count   = saved?.length ?? 0
  const skipped_count = rows.length - saved_count

  return NextResponse.json({
    upload_batch_id,
    saved_count,
    skipped_count,
    message: `${saved_count} transaction(s) saved. ${skipped_count} duplicate(s) skipped.`,
  }, { status: 201 })
}
