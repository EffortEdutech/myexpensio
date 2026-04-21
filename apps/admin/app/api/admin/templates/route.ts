// apps/admin/app/api/admin/templates/route.ts
// GET  — all templates in the global library
// POST — create a new global template (no org_id — assign to orgs separately)

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PRESET_COLUMNS, resolveColumns } from '@/lib/export-columns'
import type { ExportColumnKey, ColumnPreset } from '@/lib/export-columns'

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

// ── GET — full template library ────────────────────────────────────────────────

export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('report_templates')
    .select('id, name, description, schema, is_active, created_by, created_at, updated_at')
    .order('name', { ascending: true })

  if (error) return err('DB_ERROR', error.message, 500)
  return NextResponse.json({ templates: data ?? [] })
}

// ── POST — create a template in the global library ─────────────────────────────
// After creation, assign it to orgs via POST /api/admin/assignments

export async function POST(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Body required', 400)

  const { name, description, preset, columns, pdf_layout } = body
  if (!name?.trim()) return err('VALIDATION_ERROR', 'name required', 400)

  const validPresets: ColumnPreset[] = ['STANDARD', 'COMPLETE']
  const resolvedPreset: ColumnPreset =
    validPresets.includes(preset as ColumnPreset) ? (preset as ColumnPreset) : 'STANDARD'

  const resolvedColumns: ExportColumnKey[] = columns?.length > 0
    ? resolveColumns({ preset: resolvedPreset, columns })
    : PRESET_COLUMNS[resolvedPreset]

  const resolvedPdfLayout = { ...DEFAULT_PDF_LAYOUT, ...(pdf_layout ?? {}) }

  const schema = {
    version:    2,
    preset:     resolvedPreset,
    columns:    resolvedColumns,
    pdf_layout: resolvedPdfLayout,
  }

  const db = createServiceRoleClient()

  const { data: template, error } = await db
    .from('report_templates')
    .insert({
      name:        name.trim(),
      description: description?.trim() ?? null,
      schema,
      is_active:   true,
      created_by:  ctx.userId,
    })
    .select('id, name, description, schema, is_active, created_at, updated_at')
    .single()

  if (error) {
    if (error.code === '23505') return err('CONFLICT', `Template "${name.trim()}" already exists in the library`, 409)
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
    org_id:        null,   // global template — not org-specific
    actor_user_id: ctx.userId,
    entity_type:   'report_template',
    entity_id:     template.id,
    action:        'TEMPLATE_CREATED',
    metadata:      { name: template.name, preset: resolvedPreset },
  })

  return NextResponse.json({ template }, { status: 201 })
}
