// apps/user/app/api/spaces/route.ts
//
// GET — list all spaces for the authenticated user.
//       Auto-creates spaces based on role:
//         PERSONAL  → all users on first call
//         BUSINESS  → Premium subscribers + SUPER_ADMIN + SUPPORT (auto-created)
//
// No POST here — spaces are created automatically:
//   PERSONAL → on first GET (this file)
//   BUSINESS → on Premium activation (billing webhook) OR for internal staff here

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Internal roles that bypass the Premium gate and get all spaces automatically
const INTERNAL_ROLES = ['SUPER_ADMIN', 'SUPPORT']

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // Fetch user profile to check role and subscription plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_plan')
    .eq('id', user.id)
    .maybeSingle()

  const isInternal = INTERNAL_ROLES.includes(profile?.role ?? '')
  const isPremium  = profile?.subscription_plan === 'PREMIUM'

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
    spaces: data ?? [],
    is_premium:  isPremium,
    is_internal: isInternal,
  })
}
