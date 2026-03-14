// apps/admin/app/api/admin/settings/route.ts
//
// PATCH /api/admin/settings
//
// Updates organisation-level settings.
// Currently supports: name
//
// Access: OWNER only (requireOwner guard).
// Uses service role client to bypass RLS and update the organizations table.
//
// Request body:
//   { name: string }
//
// Response:
//   200 { org: { id, name, status, created_at } }
//   400 VALIDATION_ERROR
//   403 UNAUTHORIZED
//   500 DB_ERROR

import { NextResponse } from 'next/server'
import { requireOwner } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function PATCH(request: Request) {
  const ctx = await requireOwner('api')
  if (!ctx) return err('UNAUTHORIZED', 'Owner access required.', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'No org_id found for this session.', 400)

  const body = await request.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required.', 400)

  const { name } = body

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return err('VALIDATION_ERROR', 'name must be a non-empty string.', 400)
    }
    if (name.trim().length > 100) {
      return err('VALIDATION_ERROR', 'name must be 100 characters or fewer.', 400)
    }
  } else {
    return err('VALIDATION_ERROR', 'At least one field to update is required (name).', 400)
  }

  const db = createServiceRoleClient()

  const { data: org, error } = await db
    .from('organizations')
    .update({ name: name.trim() })
    .eq('id', ctx.orgId)
    .select('id, name, status, created_at')
    .single()

  if (error) {
    console.error('[PATCH /api/admin/settings] DB error:', error)
    return err('DB_ERROR', 'Failed to update organisation.', 500)
  }

  // Audit log
  await db.from('audit_logs').insert({
    org_id:        ctx.orgId,
    actor_user_id: ctx.userId,
    entity_type:   'organization',
    entity_id:     ctx.orgId,
    action:        'ORG_NAME_UPDATED',
    metadata:      { new_name: name.trim() },
  })

  return NextResponse.json({ org })
}
