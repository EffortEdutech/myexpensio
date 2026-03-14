// apps/admin/app/(protected)/templates/page.tsx
//
// Export Templates list page.
// Replaces the Phase A stub.

import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import TemplatesClient from './TemplatesClient'

async function fetchTemplates(orgId: string) {
  const db = createServiceRoleClient()
  const { data } = await db
    .from('report_templates')
    .select('id, name, description, schema, is_active, is_default, created_at, updated_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export default async function TemplatesPage() {
  const ctx = await requireAdminAuth('page')
  if (!ctx!.orgId) {
    return <div className="text-sm text-gray-500">Select an organisation to manage templates.</div>
  }

  const templates = await fetchTemplates(ctx!.orgId)

  return <TemplatesClient initialTemplates={templates} />
}
