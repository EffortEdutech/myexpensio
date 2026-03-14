// apps/admin/lib/auth.ts
//
// Server-side auth helpers for admin pages and API routes.
//
// Usage in a Server Component or Route Handler:
//
//   const ctx = await requireAdminAuth()
//   // ctx.userId, ctx.orgId, ctx.orgRole, ctx.isPlatformAdmin
//
// If the user is not authorized, throws a redirect (Server Component)
// or returns null (for Route Handlers — caller handles the 403 response).

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'

export type AdminAuthContext = {
  userId: string
  orgId: string | null        // null only for platform SUPERADMINs with no org
  orgRole: 'OWNER' | 'MANAGER' | null
  isPlatformAdmin: boolean
}

// ── requireAdminAuth ──────────────────────────────────────────────────────────
// Use in Server Components and Route Handlers.
// Returns context or redirects (Server Component) / returns null (Route Handler).
//
// mode: 'page' → throws redirect on failure (use in page.tsx)
//       'api'  → returns null on failure (use in route.ts)

export async function requireAdminAuth(mode: 'page' | 'api' = 'page'): Promise<AdminAuthContext | null> {
  const supabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (mode === 'page') redirect('/login')
    return null
  }

  // Check platform admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isPlatformAdmin = profile?.role === 'ADMIN'

  if (isPlatformAdmin) {
    // Platform admins are not org-scoped — orgId is null unless they
    // explicitly operate within an org (pass orgId in query params)
    return {
      userId: user.id,
      orgId: null,
      orgRole: null,
      isPlatformAdmin: true,
    }
  }

  // Check org membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, org_role')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .in('org_role', ['OWNER', 'MANAGER'])
    .limit(1)
    .single()

  if (!membership) {
    if (mode === 'page') redirect('/login?error=unauthorized')
    return null
  }

  return {
    userId: user.id,
    orgId: membership.org_id,
    orgRole: membership.org_role as 'OWNER' | 'MANAGER',
    isPlatformAdmin: false,
  }
}

// ── requireOwner ──────────────────────────────────────────────────────────────
// Use for OWNER-only actions (e.g. settings, role changes).
// Platform admins bypass this check.

export async function requireOwner(mode: 'page' | 'api' = 'page'): Promise<AdminAuthContext | null> {
  const ctx = await requireAdminAuth(mode)
  if (!ctx) return null

  if (!ctx.isPlatformAdmin && ctx.orgRole !== 'OWNER') {
    if (mode === 'page') redirect('/dashboard?error=owner_required')
    return null
  }

  return ctx
}

// ── getSessionUser ─────────────────────────────────────────────────────────────
// Lightweight — just returns the user without full role resolution.
// Use at the top of pages that only need to know "who is logged in".

export async function getSessionUser() {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
