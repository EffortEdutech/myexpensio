// apps/user/app/api/claims/[id]/submit/route.ts
// POST /api/claims/[id]/submit
//
// Submits and permanently locks a DRAFT claim:
//   1. Validates at least 1 item exists
//   2. Recalculates total_amount from items (snapshot)
//   3. Sets status = SUBMITTED, submitted_at = now
//
// After this call, NO edits are possible (Phase 1 baseline lock).
// The total_amount stored here is the audit snapshot used for exports.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { id: claim_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // Fetch claim
  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select('id, status, total_amount')
    .eq('id', claim_id)
    .eq('org_id', org.org_id)
    .single()

  if (claimErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)

  // Idempotent — already submitted
  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'Claim is already submitted.', 409)
  }

  // Must have at least 1 item
  const { count, error: countErr } = await supabase
    .from('claim_items')
    .select('*', { count: 'exact', head: true })
    .eq('claim_id', claim_id)

  if (countErr) {
    console.error('[POST /api/claims/[id]/submit] count:', countErr.message)
    return err('SERVER_ERROR', 'Failed to validate claim items.', 500)
  }

  if (!count || count === 0) {
    return err('VALIDATION_ERROR', 'Cannot submit a claim with no items. Add at least one item first.', 400)
  }

  // Final recalc — snapshot the total at submission time
  const { data: finalTotal, error: calcErr } = await supabase
    .rpc('recalc_claim_total', { p_claim_id: claim_id })

  if (calcErr) {
    console.error('[POST /api/claims/[id]/submit] recalc:', calcErr.message)
    return err('SERVER_ERROR', 'Failed to calculate claim total.', 500)
  }

  // Lock the claim
  const now = new Date().toISOString()
  const { data: submitted, error: submitErr } = await supabase
    .from('claims')
    .update({
      status:       'SUBMITTED',
      submitted_at: now,
      total_amount: finalTotal ?? 0,
      updated_at:   now,
    })
    .eq('id', claim_id)
    .eq('org_id', org.org_id)
    .select()
    .single()

  if (submitErr) {
    console.error('[POST /api/claims/[id]/submit] update:', submitErr.message)
    return err('SERVER_ERROR', 'Failed to submit claim.', 500)
  }

  return NextResponse.json({
    claim: submitted,
  })
}
