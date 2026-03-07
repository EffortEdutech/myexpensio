// apps/user/app/api/claims/[id]/route.ts
// GET   /api/claims/[id]  — fetch claim with all items
// PATCH /api/claims/[id]  — update title/period (DRAFT only)

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

  const { data: items, error: itemsErr } = await supabase
    .from('claim_items')
    .select(`
      id, claim_id, type, mode,
      trip_id, qty, unit, rate,
      amount, currency,
      receipt_url, merchant, notes,
      claim_date, meal_session,
      lodging_check_in, lodging_check_out,
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

  // Fetch current claim
  const { data: claim, error: fetchErr } = await supabase
    .from('claims')
    .select('id, status')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single()

  if (fetchErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)

  // ── Claim lock — SUBMITTED claims cannot be edited ────────────────────
  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'Submitted claims cannot be edited.', 409)
  }

  const body = await request.json().catch(() => ({})) as {
    title?:        string
    period_start?: string
    period_end?:   string
  }

  const { title, period_start, period_end } = body

  if (period_start && period_end && period_start > period_end) {
    return err('VALIDATION_ERROR', 'period_start must be on or before period_end.', 400)
  }

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title        !== undefined) updatePayload.title        = title?.trim() || null
  if (period_start !== undefined) updatePayload.period_start = period_start
  if (period_end   !== undefined) updatePayload.period_end   = period_end

  const { data: updated, error: updateErr } = await supabase
    .from('claims')
    .update(updatePayload)
    .eq('id', id)
    .eq('org_id', org.org_id)
    .select()
    .single()

  if (updateErr) {
    console.error('[PATCH /api/claims/[id]]', updateErr.message)
    return err('SERVER_ERROR', 'Failed to update claim.', 500)
  }

  return NextResponse.json({ claim: updated })
}


// ── DELETE ─────────────────────────────────────────────────────────────────
// DRAFT claims only — deletes claim + all claim_items (FK cascade).
// SUBMITTED claims are permanently locked — deletion is blocked with 409.
// This is a Phase 1 baseline rule and must not be bypassed.

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // Fetch claim to verify status + ownership
  const { data: claim, error: fetchErr } = await supabase
    .from('claims')
    .select('id, status, user_id')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single()

  if (fetchErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)

  // Hard lock — SUBMITTED claims cannot be deleted (Phase 1 baseline)
  if (claim.status === 'SUBMITTED') {
    return err(
      'CONFLICT',
      'Submitted claims cannot be deleted. They are part of a permanent audit trail.',
      409
    )
  }

  // Delete — claim_items removed via FK ON DELETE CASCADE
  const { error: deleteErr } = await supabase
    .from('claims')
    .delete()
    .eq('id', id)
    .eq('org_id', org.org_id)

  if (deleteErr) {
    console.error('[DELETE /api/claims/[id]]', deleteErr.message)
    return err('SERVER_ERROR', 'Failed to delete claim.', 500)
  }

  return NextResponse.json({ deleted: true, claim_id: id })
}
