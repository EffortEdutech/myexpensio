// apps/admin/app/api/admin/templates/route.ts
//
// GET  /api/admin/templates  → list all templates for the org
// POST /api/admin/templates  → create a new template

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PRESET_COLUMNS, resolveColumns } from '@/lib/export-columns'
import type { ExportColumnKey, ColumnPreset } from '@/lib/export-columns'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('report_templates')
    .select(`
      id, org_id, name, description, schema,
      is_active, is_default, created_by, created_at, updated_at,
      profiles ( display_name, email )
    `)
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[admin/templates] GET error:', error)
    return err('DB_ERROR', 'Failed to fetch templates', 500)
  }

  return NextResponse.json({ templates: data })
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const body = await request.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { name, description, preset, columns, is_default } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return err('VALIDATION_ERROR', 'name is required', 400)
  }

  const validPresets: ColumnPreset[] = ['STANDARD', 'COMPLETE', 'ORIGINAL_HIGHLIGHT']
  const resolvedPreset: ColumnPreset = validPresets.includes(preset) ? preset : 'STANDARD'

  // Resolve the actual column list
  const resolvedColumns: ExportColumnKey[] = columns?.length > 0
    ? resolveColumns({ preset: resolvedPreset, columns })
    : PRESET_COLUMNS[resolvedPreset === 'ORIGINAL_HIGHLIGHT' ? 'COMPLETE' : resolvedPreset]

  const schema = {
    version: 1,
    preset:  resolvedPreset,
    columns: resolvedColumns,
  }

  const db = createServiceRoleClient()

  // If setting as default, unset all other defaults first
  if (is_default) {
    await db
      .from('report_templates')
      .update({ is_default: false })
      .eq('org_id', ctx.orgId)
  }

  const { data: template, error } = await db
    .from('report_templates')
    .insert({
      org_id:      ctx.orgId,
      name:        name.trim(),
      description: description?.trim() ?? null,
      schema,
      is_active:   true,
      is_default:  is_default === true,
      created_by:  ctx.userId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return err('CONFLICT', `A template named "${name.trim()}" already exists`, 409)
    }
    console.error('[admin/templates] POST error:', error)
    return err('DB_ERROR', 'Failed to create template', 500)
  }

  // Insert default export_formats rows (one per format using same column set)
  const formats = ['CSV', 'XLSX', 'PDF'] as const
  await db.from('export_formats').insert(
    formats.map((f) => ({
      template_id: template.id,
      format_type: f,
      columns:     resolvedColumns,
    }))
  )

  await db.from('audit_logs').insert({
    org_id:        ctx.orgId,
    actor_user_id: ctx.userId,
    entity_type:   'report_template',
    entity_id:     template.id,
    action:        'TEMPLATE_CREATED',
    metadata:      { name: template.name, preset: resolvedPreset },
  })

  return NextResponse.json({ template }, { status: 201 })
}
