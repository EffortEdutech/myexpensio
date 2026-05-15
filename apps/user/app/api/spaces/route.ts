// apps/user/app/api/spaces/route.ts
//
// GET — list all spaces for the authenticated user.
//       Auto-creates spaces based on subscription tier:
//         PERSONAL  → all users (always)
//         BUSINESS  → PREMIUM users + internal staff
//
// Spaces are created automatically:
//   PERSONAL → on first GET (this file)
//   BUSINESS → on PREMIUM activation (billing webhook) OR internal staff here

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canAccessBusinessSpace } from '@/lib/subscription'

const INTERNAL_ROLES = ['SUPER_ADMIN', 'SUPPORT']

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // Check internal role (bypass gate for staff)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isInternal = INTERNAL_ROLES.includes(profile?.role ?? '')

  // Get subscription from the unified subscriptions table
  const sub        = await getUserSubscription()
  const isPremium  = canAccessBusinessSpace(sub)

  // Always ensure PERSONAL space exists
  await supabase
    .from('spaces')
    .upsert(
      { user_id: user.id, type: 'PERSONAL', name: 'Personal', is_default: true },
      { onConflict: 'user_id,type', ignoreDuplicates: true },
    )

  // Auto-create BUSINESS space for Premium users and internal staff
  if (isPremium || isInternal) {
    await supabase
      .from('spaces')
      .upsert(
        { user_id: user.id, type: 'BUSINESS', name: 'My Business', is_default: false },
        { onConflict: 'user_id,type', ignoreDuplicates: true },
      )
  }

  const { data, error } = await supabase
    .from('spaces')
    .select('id, type, name, currency, is_default, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[GET /api/spaces]', error.message)
    return err('SERVER_ERROR', 'Failed to load spaces.', 500)
  }

  return NextResponse.json({
    spaces:      data ?? [],
    tier:        sub.tier,
    is_trial:    sub.is_trial,
    trial_days_left: sub.trial_days_left,
    is_premium:  isPremium,
    is_internal: isInternal,
  })
}
