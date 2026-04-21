export const PLATFORM_ROLES = ['USER', 'SUPPORT', 'SUPER_ADMIN'] as const
export type PlatformRole = (typeof PLATFORM_ROLES)[number]

export const WORKSPACE_TYPES = ['PERSONAL', 'TEAM', 'AGENT', 'INTERNAL'] as const
export type WorkspaceType = (typeof WORKSPACE_TYPES)[number]

export const WORKSPACE_ROLES = ['OWNER', 'MANAGER', 'MEMBER'] as const
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number]

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === 'string' && PLATFORM_ROLES.includes(value as PlatformRole)
}

export function isWorkspaceType(value: unknown): value is WorkspaceType {
  return typeof value === 'string' && WORKSPACE_TYPES.includes(value as WorkspaceType)
}

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return typeof value === 'string' && WORKSPACE_ROLES.includes(value as WorkspaceRole)
}

export function isPrivilegedPlatformRole(value: unknown): boolean {
  return value === 'SUPER_ADMIN' || value === 'SUPPORT'
}
