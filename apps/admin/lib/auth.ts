// apps/admin/lib/auth.ts
//
// The admin app is myexpensio's internal platform management tool.
// Only users with profiles.role = 'ADMIN' can log in (middleware enforces this).
// There is no org-scoping — admins see and manage everything.
//
// One function. One check. That's it.

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'

export type AdminAuthContext = {
  userId:      string
  email:       string | null
  displayName: string | null
}

export async function requireAdminAuth(
  mode: 'page' | 'api' = 'page',
): Promise<AdminAuthContext | null> {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (mode === 'page') redirect('/login')
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    if (mode === 'page') redirect('/login?error=unauthorized')
    return null
  }

  return {
    userId:      user.id,
    email:       user.email ?? null,
    displayName: profile.display_name ?? null,
  }
}
