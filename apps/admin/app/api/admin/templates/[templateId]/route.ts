// apps/admin/app/api/admin/templates/[templateId]/route.ts
// PATCH — update name/description/columns/is_default/is_active

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { resolveColumns } from '@/lib/export-columns'
import type { ExportColumnKey, ColumnPreset } from '@/lib/export-columns'

type Params = { params: Promise<{ templateId: string }> }

function err(code: string, msg: string, s: number) {
  return NextResponse.json({ error: { code, message: msg } }, { status: s })
}

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { templateId } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Body required', 400)

  const db = createServiceRoleClient()

  const { data: existing } = await db.from('report_templates')
    .select('id, org_id, name, schema, is_active, is_default').eq('id', templateId).single()
  if (!existing) return err('NOT_FOUND', 'Template not found', 404)

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name        !== undefined) update.name        = body.name.trim()
  if (body.description !== undefined) update.description = body.description?.trim() ?? null
  if (body.is_active   !== undefined) update.is_active   = Boolean(body.is_active)

  if (body.is_default === true) {
    await db.from('report_templates').update({ is_default: false }).eq('org_id', existing.org_id)
    update.is_default = true
  }

  if (body.columns !== undefined || body.preset !== undefined) {
    const currentSchema = existing.schema as { version: number; preset: ColumnPreset; columns: ExportColumnKey[] }
    const newPreset  = body.preset ?? currentSchema.preset
    const newColumns = body.columns?.length > 0
      ? resolveColumns({ preset: newPreset, columns: body.columns })
      : currentSchema.columns
    update.schema = { version: 1, preset: newPreset, columns: newColumns }
    await db.from('export_formats').update({ columns: newColumns }).eq('template_id', templateId)
  }

  const { data: updated, error } = await db.from('report_templates')
    .update(update).eq('id', templateId).select().single()

  if (error) {
    if (error.code === '23505') return err('CONFLICT', `Template name already exists`, 409)
    return err('DB_ERROR', error.message, 500)
  }

  await db.from('audit_logs').insert({
    org_id: existing.org_id, actor_user_id: ctx.userId,
    entity_type: 'report_template', entity_id: templateId,
    action: 'TEMPLATE_UPDATED', metadata: { changes: Object.keys(body) },
  })

  return NextResponse.json({ template: updated })
}
