// apps/admin/app/(protected)/templates/page.tsx
import { createServiceRoleClient } from '@/lib/supabase/server'
import TemplatesClient from './TemplatesClient'

export default async function TemplatesPage() {
  const db = createServiceRoleClient()

  const [tplRes, orgsRes] = await Promise.all([
    db.from('report_templates')
      .select('id, org_id, name, description, schema, is_active, is_default, created_at, updated_at, organizations(name)')
      .order('created_at', { ascending: true }),
    db.from('organizations').select('id, name').eq('status', 'ACTIVE').order('name'),
  ])

  return <TemplatesClient initialTemplates={tplRes.data ?? []} orgs={orgsRes.data ?? []} />
}
