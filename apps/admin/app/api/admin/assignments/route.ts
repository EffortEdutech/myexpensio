// apps/admin/app/api/admin/assignments/route.ts
//
// Manages org_template_assignments — which templates each org has access to.
//
// GET    ?org_id=xxx        — all assignments for an org (with template details)
// POST   { org_id, template_id, is_default? }  — assign template to org
// PATCH  { org_id, template_id }               — set as default for org
// DELETE { org_id, template_id }               — unassign template from org
//
// Business rules:
//   - An org must always have at least one template assigned
//   - Unassigning the last template is blocked
//   - Only one template can be default per org (PATCH clears others first)
//   - Unassigning the default clears is_default and warns (no auto-reassign)

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

function err(code: string, msg: string, s: number) {
  return NextResponse.json({ error: { code, message: msg } }, { status: s })
}

// ── GET — assignments for one org ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const org_id = req.nextUrl.searchParams.get('org_id')
  if (!org_id) return err('VALIDATION_ERROR', 'org_id query param required', 400)

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('org_template_assignments')
    .select(`
      org_id, is_default, assigned_at,
      report_templates (
        id, name, description, schema, is_active, created_at, updated_at
      )
    `)
    .eq('org_id', org_id)
    .order('assigned_at', { ascending: true })

  if (error) return err('DB_ERROR', error.message, 500)
  return NextResponse.json({ assignments: data ?? [] })
}

// ── POST — assign a template to an org ────────────────────────────────────────

export async function POST(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body?.org_id || !body?.template_id) {
    return err('VALIDATION_ERROR', 'org_id and template_id required', 400)
  }

  const { org_id, template_id, is_default = false } = body

  const db = createServiceRoleClient()

  // Verify template exists and is active
  const { data: template } = await db.from('report_templates')
    .select('id, name, is_active').eq('id', template_id).single()
  if (!template) return err('NOT_FOUND', 'Template not found', 404)
  if (!template.is_active) return err('CONFLICT', 'Cannot assign an inactive template', 409)

  // If setting as default, clear current default for this org first
  if (is_default) {
    await db.from('org_template_assignments')
      .update({ is_default: false })
      .eq('org_id', org_id)
  }

  const { data: assignment, error } = await db
    .from('org_template_assignments')
    .insert({ org_id, template_id, is_default })
    .select(`
      org_id, is_default, assigned_at,
      report_templates ( id, name, description, schema, is_active )
    `)
    .single()

  if (error) {
    if (error.code === '23505') {
      return err('CONFLICT', 'This template is already assigned to this organisation', 409)
    }
    return err('DB_ERROR', error.message, 500)
  }

  await db.from('audit_logs').insert({
    org_id,
    actor_user_id: ctx.userId,
    entity_type:   'org_template_assignment',
    entity_id:     template_id,
    action:        'TEMPLATE_ASSIGNED',
    metadata:      { template_name: template.name, is_default },
  })

  return NextResponse.json({ assignment }, { status: 201 })
}

// ── PATCH — set a template as default for an org ──────────────────────────────

export async function PATCH(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body?.org_id || !body?.template_id) {
    return err('VALIDATION_ERROR', 'org_id and template_id required', 400)
  }

  const { org_id, template_id } = body
  const db = createServiceRoleClient()

  // Verify assignment exists
  const { data: existing } = await db.from('org_template_assignments')
    .select('org_id').eq('org_id', org_id).eq('template_id', template_id).single()
  if (!existing) return err('NOT_FOUND', 'This template is not assigned to this organisation', 404)

  // Clear current default then set new one
  await db.from('org_template_assignments')
    .update({ is_default: false })
    .eq('org_id', org_id)

  const { error } = await db.from('org_template_assignments')
    .update({ is_default: true })
    .eq('org_id', org_id)
    .eq('template_id', template_id)

  if (error) return err('DB_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id,
    actor_user_id: ctx.userId,
    entity_type:   'org_template_assignment',
    entity_id:     template_id,
    action:        'TEMPLATE_SET_DEFAULT',
    metadata:      {},
  })

  return NextResponse.json({ ok: true })
}

// ── DELETE — unassign a template from an org ──────────────────────────────────

export async function DELETE(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body?.org_id || !body?.template_id) {
    return err('VALIDATION_ERROR', 'org_id and template_id required', 400)
  }

  const { org_id, template_id } = body
  const db = createServiceRoleClient()

  // Guard: block if this is the last assigned template for this org
  const { count: assignCount } = await db.from('org_template_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org_id)

  if ((assignCount ?? 0) <= 1) {
    return err(
      'CONFLICT',
      'Cannot unassign: this is the only template for this organisation. Assign another template first.',
      409,
    )
  }

  const { error } = await db.from('org_template_assignments')
    .delete()
    .eq('org_id', org_id)
    .eq('template_id', template_id)

  if (error) return err('DB_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id,
    actor_user_id: ctx.userId,
    entity_type:   'org_template_assignment',
    entity_id:     template_id,
    action:        'TEMPLATE_UNASSIGNED',
    metadata:      {},
  })

  return NextResponse.json({ ok: true })
}
