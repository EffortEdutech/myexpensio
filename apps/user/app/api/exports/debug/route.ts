// apps/user/app/api/exports/debug/route.ts
// TEMPORARY DEBUG ROUTE — delete after diagnosis.
// GET /api/exports/debug
// Returns: org_id, raw claims found, items found, any errors.

import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { NextResponse }  from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const org = await getActiveOrg()

  // 1. Raw claims — no filters at all
  const { data: claims, error: claimsErr } = await supabase
    .from('claims')
    .select('id, status, period_start, period_end, total_amount, org_id')
    .eq('org_id', org?.org_id ?? '')

  // 2. Items for those claims
  const claimIds = (claims ?? []).map((c: { id: string }) => c.id)
  const { data: items, error: itemsErr } = claimIds.length > 0
    ? await supabase
        .from('claim_items')
        .select('id, claim_id, type, amount')
        .in('claim_id', claimIds)
    : { data: [], error: null }

  return NextResponse.json({
    user_id:       user.id,
    org:           org,
    claims_found:  claims?.length ?? 0,
    claims_error:  claimsErr?.message ?? null,
    items_found:   items?.length ?? 0,
    items_error:   itemsErr?.message ?? null,
    claims:        claims ?? [],
    items:         items  ?? [],
  })
}
