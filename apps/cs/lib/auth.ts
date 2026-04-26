// apps/console/lib/auth.ts
//
// Console App — internal staff only.
// SUPER_ADMIN: full platform access including destructive operations
// SUPPORT:     read access + limited operational actions

import { redirect } from 'next/navigation'
import { createConsoleClient } from '@/lib/supabase/server'

export const CONSOLE_ROLES = ['SUPER_ADMIN', 'SUPPORT'] as const
export type ConsoleRole = typeof CONSOLE_ROLES[number]

export type ConsoleAuthContext = {
  userId:      string
  email:       string | null
  displayName: string | null
  role:        ConsoleRole
}

export function isConsoleRole(role: string | null | undefined): role is ConsoleRole {
  return CONSOLE_ROLES.includes(role as ConsoleRole)
}

export async function requireConsoleAuth(
  mode: 'page' | 'api' = 'page',
): Promise<ConsoleAuthContext | null> {
  const supabase = await createConsoleClient()
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

  if (!isConsoleRole(profile?.role)) {
    if (mode === 'page') redirect('/login?error=unauthorized')
    return null
  }

  return {
    userId:      user.id,
    email:       user.email ?? null,
    displayName: profile.display_name ?? null,
    role:        profile.role as ConsoleRole,
  }
}

export async function requireSuperAdminAuth(
  mode: 'page' | 'api' = 'page',
): Promise<ConsoleAuthContext | null> {
  const ctx = await requireConsoleAuth(mode)
  if (!ctx) return null

  if (ctx.role !== 'SUPER_ADMIN') {
    if (mode === 'page') redirect('/login?error=unauthorized')
    return null
  }

  return ctx
}
