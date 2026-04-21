// apps/admin/app/(protected)/audit/page.tsx
//
// Audit log viewer — all platform events, filterable by org / actor / entity / date.

import { createServiceRoleClient } from '@/lib/supabase/server'
import AuditClient from './AuditClient'

export default async function AuditPage() {
  const db = createServiceRoleClient()

  const [logsRes, orgsRes] = await Promise.all([
    db
      .from('audit_logs')
      .select(`
        id, org_id, actor_user_id, entity_type, entity_id, action, metadata, created_at,
        profiles:actor_user_id ( display_name, email ),
        organizations:org_id ( name, display_name )
      `)
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('organizations')
      .select('id, name, display_name')
      .eq('status', 'ACTIVE')
      .order('name'),
  ])

  // Distinct entity types
  const { data: entityTypeRows } = await db
    .from('audit_logs')
    .select('entity_type')
  const entityTypes = [...new Set((entityTypeRows ?? []).map(r => r.entity_type).filter(Boolean))].sort()

  type AuditLog = {
    id: string
    org_id: string | null
    actor_user_id: string | null
    entity_type: string | null
    entity_id: string | null
    action: string
    metadata: Record<string, unknown> | null
    created_at: string
    profiles: {
      display_name: string | null
      email: string | null
    } | null
    organizations: {
      name: string | null
      display_name: string | null
    } | null
  }

  const initialLogs: AuditLog[] = (logsRes.data ?? []).map((row: any) => ({
    id: row.id,
    org_id: row.org_id ?? null,
    actor_user_id: row.actor_user_id ?? null,
    entity_type: row.entity_type ?? null,
    entity_id: row.entity_id ?? null,
    action: row.action,
    metadata: row.metadata ?? null,
    created_at: row.created_at,
    profiles: Array.isArray(row.profiles)
      ? (row.profiles[0] ?? null)
      : (row.profiles ?? null),
    organizations: Array.isArray(row.organizations)
      ? (row.organizations[0] ?? null)
      : (row.organizations ?? null),
  }))

  return (
    <AuditClient
      initialLogs={initialLogs}
      orgs={orgsRes.data ?? []}
      entityTypes={entityTypes as string[]}
    />
  )
}
