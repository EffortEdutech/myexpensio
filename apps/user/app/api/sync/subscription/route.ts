// apps/user/app/api/sync/subscription/route.ts
//
// GET /api/sync/subscription
//
// Lightweight endpoint — returns only the current user's subscription.
// Called by the mobile app on every launch regardless of tier, to break
// the circular dependency where stale FREE cache prevents the PRO sync
// engine from running, which would otherwise update the cache.

import { type NextRequest, NextResponse } from 'next/server'
import { createClientForRequest } from '@/lib/supabase/api-client'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(request: NextRequest) {
  const supabase = await createClientForRequest(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('id, entity_type, entity_id, tier, status, current_period_end, seat_count')
    .eq('entity_type', 'USER')
    .eq('entity_id', user.id)
    .maybeSingle()

  if (error) {
    return err('DB_ERROR', error.message, 500)
  }

  return NextResponse.json({
    subscription: subscription ? {
      ...subscription,
      owner_type: subscription.entity_type.toLowerCase(),
      owner_id:   subscription.entity_id,
      status:     subscription.status.toLowerCase(),  // 'ACTIVE' → 'active'
    } : null,
  })
}
