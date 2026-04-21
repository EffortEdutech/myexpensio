// apps/admin/app/(protected)/exports/page.tsx
//
// Export job history — all users across all orgs.
// Server component: seeds initial data, then ExportsClient handles filtering.

import { createServiceRoleClient } from '@/lib/supabase/server'
import ExportsClient from './ExportsClient'

type Org = {
  id: string
  name: string
  display_name: string | null
}

type ExportJobProfile = {
  display_name: string | null
  email: string | null
}

type ExportJobOrganization = {
  name: string
  display_name: string | null
}

type ExportJobTemplate = {
  name: string
}

type ExportJobRow = {
  id: string
  org_id: string
  user_id: string
  format: string
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
  file_url: string | null
  row_count: number | null
  error_message: string | null
  filters: Record<string, unknown> | null
  template_id: string | null
  created_at: string
  completed_at: string | null
  profiles: ExportJobProfile | ExportJobProfile[] | null
  organizations: ExportJobOrganization | ExportJobOrganization[] | null
  report_templates: ExportJobTemplate | ExportJobTemplate[] | null
}

type ExportJob = Omit<ExportJobRow, 'profiles' | 'organizations' | 'report_templates'> & {
  profiles: ExportJobProfile | null
  organizations: ExportJobOrganization | null
  report_templates: ExportJobTemplate | null
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function normalizeJobs(rows: ExportJobRow[] | null | undefined): ExportJob[] {
  return (rows ?? []).map((row) => ({
    ...row,
    profiles: firstOrNull(row.profiles),
    organizations: firstOrNull(row.organizations),
    report_templates: firstOrNull(row.report_templates),
  }))
}

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

  const initialJobs = normalizeJobs((jobsRes.data ?? []) as ExportJobRow[])

  return (
    <ExportsClient
      initialJobs={initialJobs}
      orgs={(orgsRes.data ?? []) as Org[]}
    />
  )
}