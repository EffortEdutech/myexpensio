// apps/user/app/api/claims/[id]/route.ts
// GET   /api/claims/[id]  — fetch claim with all items
// PATCH /api/claims/[id]  — update title/period (DRAFT only)
//
// PATCH vs original: items select now includes tng_transaction_id
// so the claim detail page can compute unlinked TOLL/PARKING count
// and show the "Link TNG" banner correctly.
// Also includes paid_via_tng so transport items can display the
// "via TNG" badge without being treated as statement-linked items.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select(`
      id, org_id, user_id, status, title,
      period_start, period_end,
      total_amount, currency,
      submitted_at, rate_version_id,
      created_at, updated_at
    `)
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single()

  if (claimErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)

  // PATCH: added tng_transaction_id so the claim detail page can display
  // the "Link TNG" banner and badge on TOLL/PARKING items.
  const { data: items, error: itemsErr } = await supabase
    .from('claim_items')
    .select(`
      id, claim_id, type, mode,
      trip_id, qty, unit, rate,
      amount, currency,
      receipt_url, merchant, notes,
      claim_date, meal_session,
      lodging_check_in, lodging_check_out,
      tng_transaction_id, paid_via_tng,
      created_at
    `)
    .eq('claim_id', id)
    .order('created_at', { ascending: true })

  if (itemsErr) {
    console.error('[GET /api/claims/[id]] items:', itemsErr.message)
    return err('SERVER_ERROR', 'Failed to load claim items.', 500)
  }

  return NextResponse.json({ claim, items: items ?? [] })
}

// ── PATCH ──────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const { data: claim, error: fetchErr } = await supabase
    .from('claims')
    .select('id, status')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single()

  if (fetchErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)

  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'Submitted claims cannot be edited.', 409)
  }

  const body = await request.json().catch(() => ({})) as {
    title?:        string
    period_start?: string
    period_end?:   string
  }

  const update: Record<string, string> = {}
  if (body.title        !== undefined) update.title        = body.title.trim()
  if (body.period_start !== undefined) update.period_start = body.period_start
  if (body.period_end   !== undefined) update.period_end   = body.period_end

  if (Object.keys(update).length === 0) {
    return err('VALIDATION_ERROR', 'No updatable fields provided.', 400)
  }

  const { data: updated, error: updateErr } = await supabase
    .from('claims')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (updateErr) {
    console.error('[PATCH /api/claims/[id]]', updateErr.message)
    return err('SERVER_ERROR', 'Failed to update claim.', 500)
  }

  return NextResponse.json({ claim: updated })
}
