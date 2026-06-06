// apps/admin/app/api/workspace/templates/route.ts
//
// GET /api/workspace/templates
// Returns report_templates assigned to this workspace via org_template_assignments.
// Workspace admins can read assigned templates and choose the workspace default.
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

export async function PATCH(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  const templateId = body?.template_id?.trim()
  const requestedOrgId = body?.org_id?.trim() || null
  const orgId = resolveOrgScope(ctx, requestedOrgId)

  if (!orgId || !templateId) {
    return err('VALIDATION_ERROR', 'org_id and template_id required', 400)
  }

  if (!ctx.isInternalStaff && !['OWNER', 'ADMIN', 'MANAGER'].includes(ctx.orgRole ?? '')) {
    return err('FORBIDDEN', 'Only workspace owners, admins, or managers can set the default template.', 403)
  }

  const db = createServiceRoleClient()

  const { data: existing } = await db
    .from('org_template_assignments')
    .select('org_id, template_id')
    .eq('org_id', orgId)
    .eq('template_id', templateId)
    .maybeSingle()

  if (!existing) {
    return err('NOT_FOUND', 'This template is not assigned to this workspace.', 404)
  }

  await db
    .from('org_template_assignments')
    .update({ is_default: false })
    .eq('org_id', orgId)

  const { error } = await db
    .from('org_template_assignments')
    .update({ is_default: true })
    .eq('org_id', orgId)
    .eq('template_id', templateId)

  if (error) {
    console.error('[workspace/templates] PATCH error:', error)
    return err('SERVER_ERROR', 'Failed to set default template', 500)
  }

  await db.from('audit_logs').insert({
    org_id:        orgId,
    actor_user_id: ctx.userId,
    entity_type:   'org_template_assignment',
    entity_id:     templateId,
    action:        'WORKSPACE_TEMPLATE_SET_DEFAULT',
    metadata:      { source: 'workspace_app' },
  })

  return NextResponse.json({ ok: true })
}
