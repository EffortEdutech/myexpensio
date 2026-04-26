// packages/domain/src/workspace.ts
//
// Workspace context shape — the resolved auth context for any user
// in any of the 3 apps. Built server-side, passed into context/store.
//
// NEW FILE — 24 Apr 2026

import type { WorkspaceType, OrgRole, PlatformRole } from './roles'
import type { MembershipTier } from './membership'

// ── Workspace context (resolved per request) ──────────────────────────────────

/**
 * The auth + workspace context for a logged-in user.
 * Built in auth-guard / middleware, consumed by pages and API routes.
 *
 * User App:       workspaceType tells us if user is Team or Agent flow
 * Workspace App:  used for RBAC sidebar + module gating
 * Console App:    platformRole = SUPER_ADMIN | SUPPORT (org context may be null)
 */
export type WorkspaceContext = {
  userId: string
  platformRole: PlatformRole

  // Null for Console-only internal staff with no org membership
  orgId: string | null
  orgName: string | null
  workspaceType: WorkspaceType | null
  orgRole: OrgRole | null
  membershipTier: MembershipTier | null

  // Derived convenience flags — computed by buildWorkspaceContext()
  isOwner: boolean
  isTeamWorkspace: boolean
  isAgentWorkspace: boolean
  isInternalWorkspace: boolean
  isSuperAdmin: boolean
  isInternalStaff: boolean    // SUPER_ADMIN or SUPPORT
  canManageMembers: boolean
  canViewOrgClaims: boolean   // Team: admin overview of all employee claims
  canViewCommission: boolean  // Agent: commission dashboard
  canAccessConsole: boolean   // SUPER_ADMIN or SUPPORT
}

// ── Workspace status ──────────────────────────────────────────────────────────

export type WorkspaceStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

// ── Organisation shape (lightweight — for lists and context) ──────────────────

export type OrgSummary = {
  id: string
  name: string
  displayName: string | null
  workspaceType: WorkspaceType
  status: WorkspaceStatus
  membershipTier: MembershipTier | null
}

// ── User registration requirement ─────────────────────────────────────────────
//
// Every user MUST be registered under either:
//   a) A TEAM workspace  — company employee, submits claims to team
//   b) An AGENT workspace — individual professional, submits claims personally,
//                            registered by an Agent/Partner who earns commission
//
// INTERNAL workspace: platform staff only, not for customers.
// PERSONAL workspace: DB compat only — not used for new registrations.

export type CustomerWorkspaceType = 'TEAM' | 'AGENT'

export function isCustomerWorkspaceType(type: unknown): type is CustomerWorkspaceType {
  return type === 'TEAM' || type === 'AGENT'
}
