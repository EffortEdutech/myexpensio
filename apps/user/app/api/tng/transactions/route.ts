// apps/user/app/api/tng/transactions/route.ts
//
// GET  /api/tng/transactions  — list saved TNG transactions for current user
// POST /api/tng/transactions  — save parsed rows from /api/tng/parse
//
// GET query params:
//   ?sector=TOLL|PARKING       filter by sector
//   ?claimed=false             only unclaimed rows (default: all)
//   ?from=YYYY-MM-DD           filter by exit_datetime >= from
//   ?to=YYYY-MM-DD             filter by exit_datetime <= to
//
// POST request body:
//   { rows: TngParsedRow[] }   — array from /api/tng/parse response
//
// POST response:
//   { upload_batch_id, saved_count, skipped_count, message }
//
// Dedup: same trans_no per user is skipped on re-upload (unique index in DB).
// RLS:   user can only read/write their own org's rows.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TngParsedRow = {
  trans_no:       string | null
  entry_datetime: string | null
  exit_datetime:  string | null
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  sector:         'TOLL' | 'PARKING'
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { searchParams } = new URL(request.url)
  const sector  = searchParams.get('sector')   // TOLL | PARKING
  const claimed = searchParams.get('claimed')  // 'false' → only unclaimed
  const from    = searchParams.get('from')     // YYYY-MM-DD
  const to      = searchParams.get('to')       // YYYY-MM-DD

  let query = supabase
    .from('tng_transactions')
    .select(`
      id, trans_no,
      entry_datetime, exit_datetime,
      entry_location, exit_location,
      amount, currency, sector,
      claimed, claim_item_id,
      upload_batch_id, created_at
    `)
    .eq('org_id', org.org_id)
    .eq('user_id', user.id)
    .order('exit_datetime', { ascending: false })
    .limit(200)

  if (sector && ['TOLL', 'PARKING'].includes(sector.toUpperCase())) {
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

  const body = await request.json().catch(() => ({})) as { rows?: TngParsedRow[] }

  if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
    return err('VALIDATION_ERROR', '"rows" array is required and must not be empty.', 400)
  }

  // Basic validation — drop malformed rows silently
  const validRows = body.rows.filter(r =>
    r &&
    typeof r.amount === 'number' &&
    r.amount > 0 &&
    ['TOLL', 'PARKING'].includes(r.sector)
  )

  if (validRows.length === 0) {
    return err('VALIDATION_ERROR', 'No valid TOLL or PARKING rows in request.', 400)
  }

  // One batch ID groups all rows from this upload
  const upload_batch_id = crypto.randomUUID()

  // Build insert payload
  const inserts = validRows.map(r => ({
    org_id:          org.org_id,
    user_id:         user.id,
    trans_no:        r.trans_no    ?? null,
    entry_datetime:  r.entry_datetime ?? null,
    exit_datetime:   r.exit_datetime  ?? null,
    entry_location:  r.entry_location ?? null,
    exit_location:   r.exit_location  ?? null,
    amount:          r.amount,
    currency:        'MYR',
    sector:          r.sector,
    upload_batch_id,
    claimed:         false,
  }))

  // Use upsert with onConflict on the unique index (user_id, trans_no)
  // Rows without trans_no are always inserted (no dedup possible)
  const withTransNo    = inserts.filter(r => r.trans_no !== null)
  const withoutTransNo = inserts.filter(r => r.trans_no === null)

  let saved_count   = 0
  let skipped_count = 0

  // ── Insert rows WITH trans_no — dedup via ignoreDuplicates ───────────────
  if (withTransNo.length > 0) {
    const { data: saved, error: insertErr } = await supabase
      .from('tng_transactions')
      .upsert(withTransNo, {
        onConflict:       'user_id,trans_no',
        ignoreDuplicates: true,
      })
      .select('id')

    if (insertErr) {
      console.error('[POST /api/tng/transactions] insert withTransNo:', insertErr.message)
      return err('SERVER_ERROR', 'Failed to save transactions.', 500)
    }

    saved_count   += saved?.length ?? 0
    skipped_count += withTransNo.length - (saved?.length ?? 0)
  }

  // ── Insert rows WITHOUT trans_no — always insert (no dedup possible) ────
  if (withoutTransNo.length > 0) {
    const { data: saved2, error: insertErr2 } = await supabase
      .from('tng_transactions')
      .insert(withoutTransNo)
      .select('id')

    if (insertErr2) {
      console.error('[POST /api/tng/transactions] insert withoutTransNo:', insertErr2.message)
      // Non-fatal — log and continue
    } else {
      saved_count += saved2?.length ?? 0
    }
  }

  return NextResponse.json({
    upload_batch_id,
    saved_count,
    skipped_count,
    message: `${saved_count} transaction${saved_count !== 1 ? 's' : ''} saved. ${skipped_count} duplicate${skipped_count !== 1 ? 's' : ''} skipped.`,
  }, { status: 201 })
}
