// apps/user/app/api/tng/statements/[batch_id]/route.ts
//
// DELETE /api/tng/statements/[batch_id]
//
// Removes all tng_transactions rows belonging to a given upload_batch_id.
// Only allowed if ZERO rows in the batch are claimed (claimed = true).
// If any row is claimed, the delete is rejected — audit trail must be preserved.
//
// Auth:  user must be logged in; deletes only their own rows (user_id + org_id check)
// RLS:   tng_transactions_user_update policy covers the DELETE via user_id predicate
//
// Response (200):
//   { deleted_count: number }
//
// Error codes:
//   UNAUTHENTICATED  401
//   NO_ORG           400
//   NOT_FOUND        404  — no rows found for this batch belonging to this user
//   CONFLICT         409  — batch has claimed rows; cannot delete

import { createClient }   from '@/lib/supabase/server'
import { getActiveOrg }   from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ batch_id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { batch_id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  // ── 1. Fetch the batch rows (ownership check) ─────────────────────────────
  const { data: rows, error: fetchErr } = await supabase
    .from('tng_transactions')
    .select('id, claimed')
    .eq('upload_batch_id', batch_id)
    .eq('user_id', user.id)
    .eq('org_id', org.org_id)

  if (fetchErr) {
    console.error('[DELETE /api/tng/statements]', fetchErr.message)
    return err('SERVER_ERROR', 'Failed to verify batch.', 500)
  }

  if (!rows || rows.length === 0) {
    return err('NOT_FOUND', 'No transactions found for this statement batch.', 404)
  }

  // ── 2. Guard: any row claimed → block delete ──────────────────────────────
  const claimedCount = rows.filter(r => r.claimed).length
  if (claimedCount > 0) {
    return err(
      'CONFLICT',
      `Cannot remove: ${claimedCount} transaction${claimedCount !== 1 ? 's' : ''} in this statement have already been claimed. Remove the linked claim items first.`,
      409,
    )
  }

  // ── 3. Delete the batch ───────────────────────────────────────────────────
  const { error: deleteErr } = await supabase
    .from('tng_transactions')
    .delete()
    .eq('upload_batch_id', batch_id)
    .eq('user_id', user.id)
    .eq('org_id', org.org_id)

  if (deleteErr) {
    console.error('[DELETE /api/tng/statements] delete:', deleteErr.message)
    return err('SERVER_ERROR', 'Failed to delete statement.', 500)
  }

  return NextResponse.json({ deleted_count: rows.length })
}
