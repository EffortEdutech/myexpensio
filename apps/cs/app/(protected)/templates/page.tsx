import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import TemplatesClient from './TemplatesClient'
import type { ExportColumnKey } from '@/lib/export-columns'

type TemplateRow = {
  id: string
  name: string
  description: string | null
  schema: {
    version: number
    preset: string
    columns: ExportColumnKey[]
    pdf_layout?: Record<string, unknown>
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export default async function ConsoleTemplatesPage() {
  await requireConsoleAuth('page')
  const db = createServiceRoleClient()

  const [templatesRes, assignmentsRes, orgsRes] = await Promise.all([
    db
      .from('report_templates')
      .select('id, name, description, schema, is_active, created_at, updated_at')
      .order('name', { ascending: true }),
    db
      .from('org_template_assignments')
      .select('org_id, template_id, is_default, assigned_at')
      .order('assigned_at', { ascending: true }),
    db
      .from('organizations')
      .select('id, name')
      .order('name', { ascending: true }),
  ])

  return (
    <TemplatesClient
      initialTemplates={(templatesRes.data ?? []) as TemplateRow[]}
      initialAssignments={assignmentsRes.data ?? []}
      orgs={orgsRes.data ?? []}
    />
  )
}
