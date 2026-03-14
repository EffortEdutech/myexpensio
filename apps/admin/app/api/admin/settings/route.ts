// apps/admin/app/api/admin/settings/route.ts
// POST  — create new organisation  (body: { action: 'create_org', name })
// PATCH — update org status or tier (body: { org_id, status? | tier? })

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, msg: string, s: number) {
  return NextResponse.json({ error: { code, message: msg } }, { status: s })
}

export async function POST(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Body required', 400)

  if (body.action === 'create_org') {
    if (!body.name?.trim()) return err('VALIDATION_ERROR', 'name required', 400)

    const db = createServiceRoleClient()

    const { data: org, error: orgErr } = await db.from('organizations')
      .insert({ name: body.name.trim(), status: 'ACTIVE' })
      .select('id, name, status, created_at').single()

    if (orgErr) {
      if (orgErr.code === '23505') return err('CONFLICT', `Organisation "${body.name.trim()}" already exists`, 409)
      return err('DB_ERROR', orgErr.message, 500)
    }

    // Seed Free subscription
    await db.from('subscription_status').insert({ org_id: org.id, tier: 'FREE' })

    await db.from('audit_logs').insert({
      actor_user_id: ctx.userId,
      entity_type: 'organization', entity_id: org.id,
      action: 'ORG_CREATED', metadata: { name: org.name },
    })

    return NextResponse.json({ org }, { status: 201 })
  }

  return err('VALIDATION_ERROR', 'Unknown action', 400)
}

export async function PATCH(req: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body?.org_id) return err('VALIDATION_ERROR', 'org_id required', 400)

  const db = createServiceRoleClient()

  // Update org status
  if (body.status !== undefined) {
    if (!['ACTIVE', 'SUSPENDED'].includes(body.status)) return err('VALIDATION_ERROR', 'Invalid status', 400)

    const { error } = await db.from('organizations')
      .update({ status: body.status }).eq('id', body.org_id)
    if (error) return err('DB_ERROR', error.message, 500)

    await db.from('audit_logs').insert({
      org_id: body.org_id, actor_user_id: ctx.userId,
      entity_type: 'organization', entity_id: body.org_id,
      action: 'ORG_STATUS_CHANGED', metadata: { status: body.status },
    })
  }

  // Update subscription tier
  if (body.tier !== undefined) {
    if (!['FREE', 'PRO'].includes(body.tier)) return err('VALIDATION_ERROR', 'Invalid tier', 400)

    const { error } = await db.from('subscription_status')
      .upsert({ org_id: body.org_id, tier: body.tier, updated_at: new Date().toISOString() })
    if (error) return err('DB_ERROR', error.message, 500)

    await db.from('audit_logs').insert({
      org_id: body.org_id, actor_user_id: ctx.userId,
      entity_type: 'subscription_status', entity_id: body.org_id,
      action: 'ORG_TIER_CHANGED', metadata: { tier: body.tier },
    })
  }

  return NextResponse.json({ success: true })
}
