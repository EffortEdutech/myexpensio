// apps/admin/app/(protected)/exports/page.tsx
//
// Export job history — all users across all orgs.
// Server component: seeds initial data, then ExportsClient handles filtering.

import { createServiceRoleClient } from '@/lib/supabase/server'
import ExportsClient from './ExportsClient'

export default async function ExportsPage() {
  const db = createServiceRoleClient()

  const [jobsRes, orgsRes] = await Promise.all([
    db
      .from('export_jobs')
      .select(`
        id,
        org_id,
        user_id,
        format,
        status,
        file_url,
        row_count,
        error_message,
        filters,
        template_id,
        created_at,
        completed_at,
        profiles:user_id ( display_name, email ),
        organizations:org_id ( name, display_name ),
        report_templates:template_id ( name )
      `)
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('organizations')
      .select('id, name, display_name')
      .eq('status', 'ACTIVE')
      .order('name'),
  ])

  return (
    <ExportsClient
      initialJobs={jobsRes.data ?? []}
      orgs={orgsRes.data ?? []}
    />
  )
}
