// apps/admin/lib/auth.ts
//
// The admin app is myexpensio's internal platform management tool.
// Only users with profiles.role IN ('SUPER_ADMIN', 'SUPPORT') can log in.
// Middleware enforces this at the edge; this function re-checks per route handler.
//
// SUPER_ADMIN — full platform access, including destructive operations
// SUPPORT     — read access + limited operational actions (no overrides)

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'

export const ADMIN_ROLES = ['SUPER_ADMIN', 'SUPPORT'] as const
export type AdminRole = typeof ADMIN_ROLES[number]

export type AdminAuthContext = {
  userId:      string
  email:       string | null
  displayName: string | null
  role:        AdminRole          // ← now exposed so route handlers can gate by role
}

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole)
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

  if (!isAdminRole(profile?.role)) {
    if (mode === 'page') redirect('/login?error=unauthorized')
    return null
  }

  return {
    userId:      user.id,
    email:       user.email ?? null,
    displayName: profile.display_name ?? null,
    role:        profile.role as AdminRole,
  }
}

/**
 * Call this inside route handlers that require SUPER_ADMIN specifically.
 * Usage:
 *   const ctx = await requireSuperAdminAuth('api')
 *   if (!ctx) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
 */
export async function requireSuperAdminAuth(
  mode: 'page' | 'api' = 'page',
): Promise<AdminAuthContext | null> {
  const ctx = await requireAdminAuth(mode)
  if (!ctx) return null

  if (ctx.role !== 'SUPER_ADMIN') {
    if (mode === 'page') redirect('/login?error=unauthorized')
    return null
  }

  return ctx
}
