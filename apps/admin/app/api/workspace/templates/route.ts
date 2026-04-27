// apps/admin/app/api/workspace/templates/route.ts
//
// GET /api/workspace/templates
// Returns report_templates assigned to this workspace via org_template_assignments.
// Workspace admins can READ their assigned templates.
// Template creation/editing is managed by Console internal staff only.

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth, resolveOrgScope } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const requestedOrgId = searchParams.get('org_id')?.trim() || null
  const orgId = resolveOrgScope(ctx, requestedOrgId)

  if (!orgId) return err('VALIDATION_ERROR', 'org_id required', 400)

  const db = createServiceRoleClient()

  // Fetch templates assigned to this workspace
  const { data, error } = await db
    .from('org_template_assignments')
    .select(`
      org_id,
      is_default,
      assigned_at,
      report_templates (
        id,
        name,
        description,
        schema,
        is_active,
        created_at,
        updated_at
      )
    `)
    .eq('org_id', orgId)
    .order('assigned_at', { ascending: true })

  if (error) {
    console.error('[workspace/templates] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch templates', 500)
  }

  const templates = (data ?? []).map((row) => {
    const template = Array.isArray(row.report_templates)
      ? row.report_templates[0] ?? null
      : row.report_templates

    return {
      ...template,
      is_default: row.is_default,
      assigned_at: row.assigned_at,
    }
  }).filter(Boolean)

  return NextResponse.json({ templates })
}
