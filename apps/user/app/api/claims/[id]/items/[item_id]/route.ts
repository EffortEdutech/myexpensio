// apps/user/app/api/claims/[id]/items/[item_id]/route.ts
// DELETE /api/claims/[id]/items/[item_id]
//
// Removes a claim item from a DRAFT claim.
// Recalculates claim total_amount after delete.
// SUBMITTED claims are blocked (409 CONFLICT).

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string; item_id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: claim_id, item_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // Fetch claim to check status
  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .select('id, status')
    .eq('id', claim_id)
    .eq('org_id', org.org_id)
    .single()

  if (claimErr || !claim) return err('NOT_FOUND', 'Claim not found.', 404)

  // ── Claim lock ────────────────────────────────────────────────────────
  if (claim.status === 'SUBMITTED') {
    return err('CONFLICT', 'Cannot delete items from a submitted claim.', 409)
  }

  // Delete the item (RLS ensures it belongs to the right org)
  const { error: deleteErr } = await supabase
    .from('claim_items')
    .delete()
    .eq('id', item_id)
    .eq('claim_id', claim_id)
    .eq('org_id', org.org_id)

  if (deleteErr) {
    console.error('[DELETE /api/claims/[id]/items/[item_id]]', deleteErr.message)
    return err('SERVER_ERROR', 'Failed to delete item.', 500)
  }

  // Recalc claim total
  await supabase.rpc('recalc_claim_total', { p_claim_id: claim_id })

  return new NextResponse(null, { status: 204 })
}
