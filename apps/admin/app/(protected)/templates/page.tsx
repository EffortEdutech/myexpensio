// apps/admin/app/(protected)/templates/page.tsx
import { createServiceRoleClient } from '@/lib/supabase/server'
import TemplatesClient from './TemplatesClient'

export default async function TemplatesPage() {
  const db = createServiceRoleClient()

  const [tplRes, assignRes, orgsRes] = await Promise.all([
    // Global template library
    db.from('report_templates')
      .select('id, name, description, schema, is_active, created_at, updated_at')
      .order('name', { ascending: true }),

    // All assignments (all orgs)
    db.from('org_template_assignments')
      .select('org_id, template_id, is_default, assigned_at')
      .order('assigned_at', { ascending: true }),

    // Active organisations
    db.from('organizations')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name'),
  ])

  return (
    <TemplatesClient
      initialTemplates={tplRes.data   ?? []}
      initialAssignments={assignRes.data ?? []}
      orgs={orgsRes.data ?? []}
    />
  )
}
