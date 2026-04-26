// packages/domain/src/roles.ts
//
// SURGICAL EXTENSION — 24 Apr 2026
// Added:
//   - WORKSPACE_TYPES: removed PERSONAL from active use (kept for DB compat)
//   - TEAM_ROLES, AGENT_ROLES: workspace-type-specific role sets
//   - OrgRole: full union of all org_members.org_role values
//   - Helper functions for new role types

// ── Platform roles (profiles.role) ───────────────────────────────────────────

export const PLATFORM_ROLES = ['USER', 'SUPPORT', 'SUPER_ADMIN'] as const
export type PlatformRole = (typeof PLATFORM_ROLES)[number]

// ── Workspace types (organizations.workspace_type) ───────────────────────────

// PERSONAL kept for DB backward compat only — not used for new registrations
export const WORKSPACE_TYPES = ['PERSONAL', 'TEAM', 'AGENT', 'INTERNAL'] as const
export type WorkspaceType = (typeof WORKSPACE_TYPES)[number]

// Active workspace types for new registrations
export const ACTIVE_WORKSPACE_TYPES = ['TEAM', 'AGENT', 'INTERNAL'] as const
export type ActiveWorkspaceType = (typeof ACTIVE_WORKSPACE_TYPES)[number]

// ── Org roles (org_members.org_role) ─────────────────────────────────────────

// Legacy — kept for backward compat
export const WORKSPACE_ROLES = ['OWNER', 'MANAGER', 'MEMBER'] as const
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number]

// Team workspace roles
export const TEAM_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'] as const
export type TeamRole = (typeof TEAM_ROLES)[number]

// Agent/Partner workspace roles
export const AGENT_ROLES = ['OWNER', 'SALES', 'FINANCE'] as const
export type AgentRole = (typeof AGENT_ROLES)[number]

// Full union of all possible org_members.org_role values
export const ORG_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'SALES', 'FINANCE', 'MEMBER'] as const
export type OrgRole = (typeof ORG_ROLES)[number]

// ── Type guards ───────────────────────────────────────────────────────────────

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === 'string' && PLATFORM_ROLES.includes(value as PlatformRole)
}

export function isWorkspaceType(value: unknown): value is WorkspaceType {
  return typeof value === 'string' && WORKSPACE_TYPES.includes(value as WorkspaceType)
}

export function isActiveWorkspaceType(value: unknown): value is ActiveWorkspaceType {
  return typeof value === 'string' && ACTIVE_WORKSPACE_TYPES.includes(value as ActiveWorkspaceType)
}

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return typeof value === 'string' && WORKSPACE_ROLES.includes(value as WorkspaceRole)
}

export function isOrgRole(value: unknown): value is OrgRole {
  return typeof value === 'string' && ORG_ROLES.includes(value as OrgRole)
}

export function isPrivilegedPlatformRole(value: unknown): boolean {
  return value === 'SUPER_ADMIN' || value === 'SUPPORT'
}

export function isTeamWorkspace(type: unknown): type is 'TEAM' {
  return type === 'TEAM'
}

export function isAgentWorkspace(type: unknown): type is 'AGENT' {
  return type === 'AGENT'
}

export function isInternalWorkspace(type: unknown): type is 'INTERNAL' {
  return type === 'INTERNAL'
}

// ── Role helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the valid org_role values for a given workspace type.
 * Used for invitation request role dropdowns.
 */
export function getRolesForWorkspace(type: WorkspaceType): readonly OrgRole[] {
  if (type === 'TEAM') return TEAM_ROLES
  if (type === 'AGENT') return AGENT_ROLES
  return [] // INTERNAL managed via profiles.role
}

/**
 * Display labels for org roles, given workspace type context.
 */
export function getOrgRoleLabel(role: OrgRole, workspaceType: WorkspaceType): string {
  const teamLabels: Record<string, string> = {
    OWNER: 'Owner', ADMIN: 'Admin', MANAGER: 'Manager', EMPLOYEE: 'Employee',
  }
  const agentLabels: Record<string, string> = {
    OWNER: 'Owner', SALES: 'Sales', FINANCE: 'Finance',
  }
  if (workspaceType === 'TEAM') return teamLabels[role] ?? role
  if (workspaceType === 'AGENT') return agentLabels[role] ?? role
  return role
}

/**
 * Returns true if this role can manage members (invite, remove, change roles).
 */
export function canManageMembers(role: OrgRole, workspaceType: WorkspaceType): boolean {
  if (workspaceType === 'TEAM') return ['OWNER', 'ADMIN', 'MANAGER'].includes(role)
  if (workspaceType === 'AGENT') return role === 'OWNER'
  return false
}

/**
 * Returns true if this role can submit invitation requests.
 */
export function canRequestInvitation(role: OrgRole): boolean {
  return ['OWNER', 'ADMIN', 'MANAGER'].includes(role)
}

/**
 * Returns true if this role can view commission/referral data.
 * Agent workspace only.
 */
export function canViewCommission(role: OrgRole, workspaceType: WorkspaceType): boolean {
  return workspaceType === 'AGENT' && ['OWNER', 'FINANCE'].includes(role)
}

/**
 * Returns true if this role can view all org claims (admin overview).
 * Team workspace only.
 */
export function canViewOrgClaims(role: OrgRole, workspaceType: WorkspaceType): boolean {
  return workspaceType === 'TEAM' && ['OWNER', 'ADMIN', 'MANAGER'].includes(role)
}
