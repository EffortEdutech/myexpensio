export type AuditMetadata = Record<string, unknown>

export type AuditActor = {
  display_name: string | null
  email: string | null
}

export type AuditOrganization = {
  name: string | null
  display_name: string | null
}

export type AuditLogRow = {
  id: string
  org_id: string | null
  actor_user_id: string | null
  entity_type: string | null
  entity_id: string | null
  action: string
  metadata: AuditMetadata | null
  created_at: string
  profiles?: AuditActor | AuditActor[] | null
  organizations?: AuditOrganization | AuditOrganization[] | null
}

export type AuditLog = {
  id: string
  org_id: string | null
  actor_user_id: string | null
  entity_type: string
  entity_id: string | null
  action: string
  metadata: AuditMetadata
  created_at: string
  profiles: AuditActor | null
  organizations: AuditOrganization | null
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export function normalizeAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    org_id: row.org_id ?? null,
    actor_user_id: row.actor_user_id ?? null,
    entity_type: row.entity_type ?? 'UNKNOWN',
    entity_id: row.entity_id ?? null,
    action: row.action,
    metadata: row.metadata ?? {},
    created_at: row.created_at,
    profiles: firstOrNull(row.profiles),
    organizations: firstOrNull(row.organizations),
  }
}

export function normalizeAuditLogs(rows: AuditLogRow[] | null | undefined): AuditLog[] {
  return (rows ?? []).map(normalizeAuditLog)
}
