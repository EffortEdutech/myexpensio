// apps/user/app/api/export/tng-preview/route.ts
//
// GET /api/export/tng-preview?claim_ids=id1,id2,...
//
// Returns a summary of TNG statements that will be automatically appended
// to the PDF export for the given claims.
//
// Logic mirrors pdf-builder.ts: find all claim_items in the selected claims
// that have a tng_transaction_id, then group by statement_label (or upload_batch_id
// as fallback) to show the user exactly which statement PDFs will be embedded.
//
// Response:
// {
//   statements: TngPreviewStatement[]
//   total_tng_transactions: number
// }
//
// TngPreviewStatement:
// {
//   statement_label:    string        — human-readable name
//   upload_batch_id:    string | null — batch key (for dedup)
//   transaction_count:  number        — rows from this statement used in the claims
//   total_amount_myr:   number
//   has_source_pdf:     boolean       — false if PDF was not saved to Storage
// }

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

type TngPreviewStatement = {
  statement_label:   string
  upload_batch_id:   string | null
  transaction_count: number
  total_amount_myr:  number
  has_source_pdf:    boolean
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { searchParams } = new URL(request.url)
  const claimIdsRaw = searchParams.get('claim_ids') ?? ''
  const claimIds = claimIdsRaw
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  if (claimIds.length === 0) {
    return NextResponse.json({ statements: [], total_tng_transactions: 0 })
  }

  // ── 1. Fetch claim_items that have a tng_transaction_id ──────────────────
  const { data: claimItems, error: ciErr } = await supabase
    .from('claim_items')
    .select('id, tng_transaction_id')
    .in('claim_id', claimIds)
    .eq('org_id', org.org_id)
    .not('tng_transaction_id', 'is', null)

  if (ciErr) {
    console.error('[GET /api/export/tng-preview] claim_items:', ciErr.message)
    return err('SERVER_ERROR', 'Failed to load claim items.', 500)
  }

  const tngIds = (claimItems ?? [])
    .map(i => i.tng_transaction_id as string)
    .filter(Boolean)

  if (tngIds.length === 0) {
    return NextResponse.json({ statements: [], total_tng_transactions: 0 })
  }

  // ── 2. Fetch TNG transaction details for those IDs ───────────────────────
  const { data: tngRows, error: tngErr } = await supabase
    .from('tng_transactions')
    .select('id, amount, statement_label, upload_batch_id, source_file_url')
    .in('id', tngIds)
    .eq('user_id', user.id)
    .eq('org_id', org.org_id)

  if (tngErr) {
    console.error('[GET /api/export/tng-preview] tng_transactions:', tngErr.message)
    return err('SERVER_ERROR', 'Failed to load TNG transactions.', 500)
  }

  // ── 3. Group by statement (by source_file_url — same logic as pdf-builder) ─
  // We group by source_file_url because that's what pdf-builder uses to decide
  // which PDF files to embed. statement_label is shown to the user; source_file_url
  // is the actual file key.
  type Group = {
    statement_label:   string
    upload_batch_id:   string | null
    transaction_count: number
    total_amount_myr:  number
    has_source_pdf:    boolean
    // source_file_url key used for grouping (not returned to client)
    _file_key:         string | null
  }

  const groupMap = new Map<string, Group>()

  for (const row of (tngRows ?? [])) {
    // Group key: source_file_url (matches pdf-builder logic) or fallback to batch id
    const groupKey  = row.source_file_url ?? row.upload_batch_id ?? row.id
    const existing  = groupMap.get(groupKey)

    // Derive a display label with fallback
    const label = row.statement_label ?? row.upload_batch_id ?? 'Unknown Statement'

    if (existing) {
      existing.transaction_count++
      existing.total_amount_myr += Number(row.amount) || 0
    } else {
      groupMap.set(groupKey, {
        statement_label:   label,
        upload_batch_id:   row.upload_batch_id ?? null,
        transaction_count: 1,
        total_amount_myr:  Number(row.amount) || 0,
        has_source_pdf:    !!row.source_file_url,
        _file_key:         row.source_file_url ?? null,
      })
    }
  }

  // Remove internal key before returning
  const statements: TngPreviewStatement[] = Array.from(groupMap.values()).map(g => ({
    statement_label:   g.statement_label,
    upload_batch_id:   g.upload_batch_id,
    transaction_count: g.transaction_count,
    total_amount_myr:  g.total_amount_myr,
    has_source_pdf:    g.has_source_pdf,
  }))

  // Sort by label for stable display order
  statements.sort((a, b) => a.statement_label.localeCompare(b.statement_label))

  return NextResponse.json({
    statements,
    total_tng_transactions: tngIds.length,
  })
}
