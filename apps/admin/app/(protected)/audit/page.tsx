// apps/admin/app/(protected)/audit/page.tsx
//
// Audit log viewer — all platform events, filterable by org / actor / entity / date.

import type { AuditLogRow } from '@myexpensio/domain/audit'
import { normalizeAuditLogs } from '@myexpensio/domain/audit'
import { createServiceRoleClient } from '@/lib/supabase/server'
import AuditClient from './AuditClient'

type Org = {
  id: string
  name: string | null
  display_name: string | null
}

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

  const { data: entityTypeRows } = await db
    .from('audit_logs')
    .select('entity_type')

  const entityTypes = [...new Set((entityTypeRows ?? []).map((row: any) => row.entity_type).filter(Boolean))].sort()

  const initialLogs = normalizeAuditLogs((logsRes.data ?? []) as AuditLogRow[])

  return (
    <AuditClient
      initialLogs={initialLogs}
      orgs={(orgsRes.data ?? []) as Org[]}
      entityTypes={entityTypes as string[]}
    />
  )
}
