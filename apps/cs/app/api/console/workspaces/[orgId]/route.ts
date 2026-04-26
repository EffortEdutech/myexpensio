// apps/cs/app/api/console/workspaces/[orgId]/route.ts
//
// GET   — get single workspace details
// PATCH — update workspace fields: name, contact_email, contact_phone, address, notes, status

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ orgId: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(_req: Request, { params }: Params) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { orgId } = await params
  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('organizations')
    .select(`
      id, name, display_name, status, workspace_type,
      contact_email, contact_phone, address, notes, created_at, updated_at,
      subscription_status (
        tier, billing_status, period_end, provider, plan_code
      )
    `)
    .eq('id', orgId)
    .single()

  if (error || !data) return err('NOT_FOUND', 'Workspace not found', 404)

  const sub = Array.isArray(data.subscription_status)
    ? data.subscription_status[0] ?? null
    : data.subscription_status

  return NextResponse.json({ workspace: { ...data, subscription_status: sub } })
}

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { orgId } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const {
    name, contact_email, contact_phone,
    address, notes, status,
  } = body

  if (name !== undefined && !name?.trim()) {
    return err('VALIDATION_ERROR', 'Organisation name cannot be empty', 400)
  }

  if (status && !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
    return err('VALIDATION_ERROR', 'Invalid status', 400)
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (name !== undefined)          updatePayload.name          = name.trim()
  if (contact_email !== undefined) updatePayload.contact_email = contact_email?.trim() || null
  if (contact_phone !== undefined) updatePayload.contact_phone = contact_phone?.trim() || null
  if (address !== undefined)       updatePayload.address       = address?.trim() || null
  if (notes !== undefined)         updatePayload.notes         = notes?.trim() || null
  if (status !== undefined)        updatePayload.status        = status

  const db = createServiceRoleClient()

  const { error } = await db
    .from('organizations')
    .update(updatePayload)
    .eq('id', orgId)

  if (error) return err('SERVER_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id:        orgId,
    actor_user_id: ctx.userId,
    entity_type:   'organization',
    entity_id:     orgId,
    action:        'WORKSPACE_UPDATED',
    metadata:      { changes: updatePayload, updated_by: ctx.email },
  })

  return NextResponse.json({ success: true })
}
