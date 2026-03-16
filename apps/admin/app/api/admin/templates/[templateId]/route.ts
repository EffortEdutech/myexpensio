// apps/admin/app/api/admin/templates/[templateId]/route.ts
// PATCH  — edit a global template (name, description, columns, pdf_layout, is_active)
// DELETE — hard delete from library
//
// DELETE guards:
//   1. Cannot delete if export_jobs reference it (audit trail)
//   2. Cannot delete if any org still has it assigned — unassign from all orgs first

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { resolveColumns } from '@/lib/export-columns'
import type { ExportColumnKey, ColumnPreset } from '@/lib/export-columns'

type Params = { params: Promise<{ templateId: string }> }

function err(code: string, msg: string, s: number) {
  return NextResponse.json({ error: { code, message: msg } }, { status: s })
}

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { templateId } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Body required', 400)

  const db = createServiceRoleClient()

  const { data: existing } = await db.from('report_templates')
    .select('id, name, schema, is_active').eq('id', templateId).single()
  if (!existing) return err('NOT_FOUND', 'Template not found', 404)

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name        !== undefined) update.name        = body.name.trim()
  if (body.description !== undefined) update.description = body.description?.trim() ?? null
  if (body.is_active   !== undefined) update.is_active   = Boolean(body.is_active)

  if (body.columns !== undefined || body.preset !== undefined || body.pdf_layout !== undefined) {
    const cur = existing.schema as {
      version:    number
      preset:     ColumnPreset
      columns:    ExportColumnKey[]
      pdf_layout?: Record<string, unknown>
    }
    const newPreset  = body.preset ?? cur.preset
    const newColumns = body.columns?.length > 0
      ? resolveColumns({ preset: newPreset, columns: body.columns })
      : cur.columns
    update.schema = {
      version:    2,
      preset:     newPreset,
      columns:    newColumns,
      pdf_layout: body.pdf_layout != null
        ? { ...(cur.pdf_layout ?? {}), ...body.pdf_layout }
        : (cur.pdf_layout ?? {}),
    }
    await db.from('export_formats').update({ columns: newColumns }).eq('template_id', templateId)
  }

  const { data: updated, error } = await db.from('report_templates')
    .update(update).eq('id', templateId).select().single()

  if (error) {
    if (error.code === '23505') return err('CONFLICT', 'A template with that name already exists', 409)
    return err('DB_ERROR', error.message, 500)
  }

  await db.from('audit_logs').insert({
    org_id:        null,
    actor_user_id: ctx.userId,
    entity_type:   'report_template',
    entity_id:     templateId,
    action:        'TEMPLATE_UPDATED',
    metadata:      { name: existing.name, changes: Object.keys(body) },
  })

  return NextResponse.json({ template: updated })
}

// ── DELETE ─────────────────────────────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { templateId } = await params
  const db = createServiceRoleClient()

  const { data: existing } = await db.from('report_templates')
    .select('id, name, is_active').eq('id', templateId).single()
  if (!existing) return err('NOT_FOUND', 'Template not found', 404)

  // Guard 1: block if export_jobs reference this template
  const { count: jobCount } = await db.from('export_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', templateId)

  if ((jobCount ?? 0) > 0) {
    return err(
      'CONFLICT',
      `Cannot delete: this template was used in ${jobCount} export job${jobCount !== 1 ? 's' : ''}. Deactivate it instead to hide it while preserving the audit trail.`,
      409,
    )
  }

  // Guard 2: block if any org still has it assigned
  const { count: assignCount } = await db.from('org_template_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', templateId)

  if ((assignCount ?? 0) > 0) {
    return err(
      'CONFLICT',
      `Cannot delete: this template is still assigned to ${assignCount} organisation${assignCount !== 1 ? 's' : ''}. Unassign it from all organisations first.`,
      409,
    )
  }

  // Delete export_formats (no ON DELETE CASCADE)
  await db.from('export_formats').delete().eq('template_id', templateId)

  const { error: delErr } = await db.from('report_templates').delete().eq('id', templateId)
  if (delErr) return err('DB_ERROR', delErr.message, 500)

  await db.from('audit_logs').insert({
    org_id:        null,
    actor_user_id: ctx.userId,
    entity_type:   'report_template',
    entity_id:     templateId,
    action:        'TEMPLATE_DELETED',
    metadata:      { name: existing.name },
  })

  return NextResponse.json({ deleted: true, template_id: templateId })
}
