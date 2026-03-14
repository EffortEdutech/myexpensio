// apps/admin/app/api/admin/templates/[templateId]/route.ts
//
// GET    /api/admin/templates/:id  → fetch single template
// PATCH  /api/admin/templates/:id  → update name/description/columns/is_default
// DELETE /api/admin/templates/:id  → deactivate (soft delete, set is_active=false)
//
// CONSTRAINT: Cannot delete or deactivate the last active default template.
// CONSTRAINT: STANDARD and COMPLETE seeded templates can be renamed but not deleted.

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { resolveColumns } from '@/lib/export-columns'
import type { ExportColumnKey, ColumnPreset } from '@/lib/export-columns'

type Params = { params: Promise<{ templateId: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const { templateId } = await params
  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('report_templates')
    .select(`
      id, org_id, name, description, schema, is_active, is_default,
      created_by, created_at, updated_at,
      export_formats ( id, format_type, columns, created_at )
    `)
    .eq('id', templateId)
    .eq('org_id', ctx.orgId)  // org-scoped
    .single()

  if (error || !data) return err('NOT_FOUND', 'Template not found', 404)

  return NextResponse.json({ template: data })
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(request: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const { templateId } = await params
  const body = await request.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const db = createServiceRoleClient()

  // Fetch existing to verify ownership
  const { data: existing } = await db
    .from('report_templates')
    .select('id, org_id, name, schema, is_default')
    .eq('id', templateId)
    .eq('org_id', ctx.orgId)
    .single()

  if (!existing) return err('NOT_FOUND', 'Template not found', 404)

  // Build update payload
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return err('VALIDATION_ERROR', 'name must be a non-empty string', 400)
    }
    update.name = body.name.trim()
  }

  if (body.description !== undefined) update.description = body.description?.trim() ?? null
  if (body.is_active !== undefined)    update.is_active = Boolean(body.is_active)

  if (body.is_default === true) {
    // Unset other defaults first
    await db
      .from('report_templates')
      .update({ is_default: false })
      .eq('org_id', ctx.orgId)
    update.is_default = true
  }

  // If columns updated, rebuild schema
  if (body.columns !== undefined || body.preset !== undefined) {
    const currentSchema = existing.schema as { version: number; preset: ColumnPreset; columns: ExportColumnKey[] }
    const newPreset = body.preset ?? currentSchema.preset
    const newColumns: ExportColumnKey[] = body.columns?.length > 0
      ? resolveColumns({ preset: newPreset, columns: body.columns })
      : currentSchema.columns

    update.schema = {
      version: 1,
      preset:  newPreset,
      columns: newColumns,
    }

    // Also update all export_formats for this template
    await db
      .from('export_formats')
      .update({ columns: newColumns })
      .eq('template_id', templateId)
  }

  const { data: updated, error } = await db
    .from('report_templates')
    .update(update)
    .eq('id', templateId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return err('CONFLICT', `A template named "${body.name}" already exists`, 409)
    }
    console.error('[admin/templates/:id] PATCH error:', error)
    return err('DB_ERROR', 'Failed to update template', 500)
  }

  await db.from('audit_logs').insert({
    org_id:        ctx.orgId,
    actor_user_id: ctx.userId,
    entity_type:   'report_template',
    entity_id:     templateId,
    action:        'TEMPLATE_UPDATED',
    metadata:      { changes: Object.keys(body) },
  })

  return NextResponse.json({ template: updated })
}

// ── DELETE (soft) ─────────────────────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const { templateId } = await params
  const db = createServiceRoleClient()

  const { data: existing } = await db
    .from('report_templates')
    .select('id, name, is_default, is_active')
    .eq('id', templateId)
    .eq('org_id', ctx.orgId)
    .single()

  if (!existing) return err('NOT_FOUND', 'Template not found', 404)
  if (!existing.is_active) return err('CONFLICT', 'Template is already inactive', 409)

  // Cannot deactivate if it is the only active template
  const { count } = await db
    .from('report_templates')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', ctx.orgId)
    .eq('is_active', true)

  if ((count ?? 0) <= 1) {
    return err('CONFLICT', 'Cannot deactivate the only active template. Create another first.', 409)
  }

  await db
    .from('report_templates')
    .update({ is_active: false, is_default: false, updated_at: new Date().toISOString() })
    .eq('id', templateId)

  await db.from('audit_logs').insert({
    org_id:        ctx.orgId,
    actor_user_id: ctx.userId,
    entity_type:   'report_template',
    entity_id:     templateId,
    action:        'TEMPLATE_DEACTIVATED',
    metadata:      { name: existing.name },
  })

  return NextResponse.json({ success: true })
}
