// apps/admin/app/api/admin/templates/route.ts
// GET  — all templates across all orgs
// POST — create template for any org (includes pdf_layout in schema)

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PRESET_COLUMNS, resolveColumns } from '@/lib/export-columns'
import type { ExportColumnKey, ColumnPreset } from '@/lib/export-columns'

// ── Default PDF layout (must match DEFAULT_PDF_LAYOUT in TemplateEditor.tsx) ──
const DEFAULT_PDF_LAYOUT = {
  orientation:           'portrait',
  grouping:              'BY_DATE',
  show_summary_table:    true,
  show_receipt_appendix: true,
  show_tng_appendix:     true,
  show_declaration:      true,
  accent_color:          '#0f172a',
}

function err(code: string, msg: string, s: number) {
  return NextResponse.json({ error: { code, message: msg } }, { status: s })
}

export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('report_templates')
    .select(`
      id, org_id, name, description, schema,
      is_active, is_default, created_by, created_at, updated_at,
      organizations ( name )
    `)
    .order('created_at', { ascending: true })

  if (error) return err('DB_ERROR', error.message, 500)
  return NextResponse.json({ templates: data })
}

export async function POST(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Body required', 400)

  const { org_id, name, description, preset, columns, pdf_layout, is_default } = body
  if (!org_id)    return err('VALIDATION_ERROR', 'org_id required', 400)
  if (!name?.trim()) return err('VALIDATION_ERROR', 'name required', 400)

  const validPresets: ColumnPreset[] = ['STANDARD', 'COMPLETE', 'ORIGINAL_HIGHLIGHT']
  const resolvedPreset: ColumnPreset = validPresets.includes(preset) ? preset : 'STANDARD'

  const resolvedColumns: ExportColumnKey[] = columns?.length > 0
    ? resolveColumns({ preset: resolvedPreset, columns })
    : PRESET_COLUMNS[resolvedPreset === 'ORIGINAL_HIGHLIGHT' ? 'COMPLETE' : resolvedPreset]

  // Merge pdf_layout with defaults so missing fields are always present
  const resolvedPdfLayout = {
    ...DEFAULT_PDF_LAYOUT,
    ...(pdf_layout ?? {}),
  }

  const schema = {
    version:    2,              // bumped to 2 to indicate pdf_layout is present
    preset:     resolvedPreset,
    columns:    resolvedColumns,
    pdf_layout: resolvedPdfLayout,
  }

  const db = createServiceRoleClient()

  if (is_default) {
    await db.from('report_templates').update({ is_default: false }).eq('org_id', org_id)
  }

  const { data: template, error } = await db
    .from('report_templates')
    .insert({
      org_id,
      name:        name.trim(),
      description: description?.trim() ?? null,
      schema,
      is_active:   true,
      is_default:  is_default === true,
      created_by:  ctx.userId,
    })
    .select(`id, org_id, name, description, schema, is_active, is_default, created_at, updated_at, organizations(name)`)
    .single()

  if (error) {
    if (error.code === '23505') return err('CONFLICT', `Template "${name.trim()}" already exists`, 409)
    return err('DB_ERROR', error.message, 500)
  }

  // Seed export_formats for CSV / XLSX / PDF
  await db.from('export_formats').insert(
    (['CSV', 'XLSX', 'PDF'] as const).map(f => ({
      template_id: template.id,
      format_type: f,
      columns:     resolvedColumns,
    }))
  )

  await db.from('audit_logs').insert({
    org_id,
    actor_user_id: ctx.userId,
    entity_type:   'report_template',
    entity_id:     template.id,
    action:        'TEMPLATE_CREATED',
    metadata:      { name: template.name, preset: resolvedPreset },
  })

  return NextResponse.json({ template }, { status: 201 })
}
