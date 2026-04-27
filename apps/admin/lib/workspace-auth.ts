// apps/admin/lib/workspace-auth.ts
//
// Workspace-aware auth context for Expensio Workspace App.
//
// Two access paths:
//   1. profiles.role IN ('SUPER_ADMIN','SUPPORT')
//      → Internal staff. Platform-wide access. No org scoping.
//
//   2. org_members.org_role IN ('OWNER','ADMIN','MANAGER','SALES','FINANCE')
//      → Customer workspace admin. Scoped to their org only.
//
// workspaceType defaults to 'TEAM' if the organizations row has no
// workspace_type set (i.e. created before the 3-app transformation).

import { redirect } from 'next/navigation'
import { createAdminClient, createServiceRoleClient } from '@/lib/supabase/server'
import type { WorkspaceType } from '@myexpensio/domain'

// ── Types ──────────────────────────────────────────────────────────────────────

export type WorkspaceAccessLevel = 'INTERNAL' | 'CUSTOMER'

export type WorkspaceAuthContext = {
  userId:           string
  email:            string | null
  displayName:      string | null
  platformRole:     string          // 'USER' | 'SUPPORT' | 'SUPER_ADMIN'
  accessLevel:      WorkspaceAccessLevel

  // Set for customer workspace admins; null for internal staff
  orgId:            string | null
  orgName:          string | null
  orgRole:          string | null   // 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES' | 'FINANCE'
  workspaceType:    WorkspaceType | null

  // Convenience flags
  isInternalStaff:  boolean         // SUPER_ADMIN or SUPPORT
  isSuperAdmin:     boolean
  isOwner:          boolean
  isTeamWorkspace:  boolean
  isAgentWorkspace: boolean
}

// Roles that can access Workspace App as customer admins
const CUSTOMER_WORKSPACE_ROLES = [
  'OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE',
] as const

// ── Core auth function ─────────────────────────────────────────────────────────

export async function requireWorkspaceAuth(
  mode: 'page' | 'api' = 'page',
): Promise<WorkspaceAuthContext | null> {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (mode === 'page') redirect('/login')
    return null
  }

  const db = createServiceRoleClient()

  // 1. Get profile + platform role
  const { data: profile } = await db
    .from('profiles')
    .select('role, display_name, email')
    .eq('id', user.id)
    .single()

  if (!profile) {
    if (mode === 'page') redirect('/login?error=no_profile')
    return null
  }

  const platformRole   = profile.role ?? 'USER'
  const isInternalStaff = platformRole === 'SUPER_ADMIN' || platformRole === 'SUPPORT'

  // 2. Internal staff — grant access, no org scoping
  if (isInternalStaff) {
    return {
      userId:           user.id,
      email:            user.email ?? profile.email ?? null,
      displayName:      profile.display_name ?? null,
      platformRole,
      accessLevel:      'INTERNAL',
      orgId:            null,
      orgName:          null,
      orgRole:          null,
      workspaceType:    null,
      isInternalStaff:  true,
      isSuperAdmin:     platformRole === 'SUPER_ADMIN',
      isOwner:          false,
      isTeamWorkspace:  false,
      isAgentWorkspace: false,
    }
  }

  // 3. Customer — check org_members for a qualifying admin role
  const { data: membership } = await db
    .from('org_members')
    .select(`
      org_id,
      org_role,
      status,
      organizations (
        id,
        name,
        workspace_type,
        status
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .in('org_role', [...CUSTOMER_WORKSPACE_ROLES])
    .limit(1)
    .single()

  if (!membership) {
    if (mode === 'page') redirect('/login?error=unauthorized')
    return null
  }

  const org = Array.isArray(membership.organizations)
    ? membership.organizations[0] ?? null
    : membership.organizations

  if (!org || org.status !== 'ACTIVE') {
    if (mode === 'page') redirect('/login?error=org_inactive')
    return null
  }

  // ── FIX: default to 'TEAM' if workspace_type is null ──────────────────────
  // Organisations created before the 3-app transformation may not have
  // workspace_type set. TEAM is the safe default — they will have Claims,
  // Rates, Templates, Exports etc. which is what most orgs need.
  const workspaceType: WorkspaceType =
    (org.workspace_type as WorkspaceType) ?? 'TEAM'

  return {
    userId:           user.id,
    email:            user.email ?? profile.email ?? null,
    displayName:      profile.display_name ?? null,
    platformRole,
    accessLevel:      'CUSTOMER',
    orgId:            org.id,
    orgName:          org.name,
    orgRole:          membership.org_role,
    workspaceType,
    isInternalStaff:  false,
    isSuperAdmin:     false,
    isOwner:          membership.org_role === 'OWNER',
    isTeamWorkspace:  workspaceType === 'TEAM',
    isAgentWorkspace: workspaceType === 'AGENT',
  }
}

// ── Helper: resolve org scope for API routes ───────────────────────────────────
//
// Internal staff: pass ?org_id= query param to scope to a specific org,
//                 or omit to query all orgs.
// Customer admins: always scoped to their own org (cannot override).

export function resolveOrgScope(
  ctx: WorkspaceAuthContext,
  requestedOrgId: string | null,
): string | null {
  if (ctx.isInternalStaff) return requestedOrgId
  return ctx.orgId
}
