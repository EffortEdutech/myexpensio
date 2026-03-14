// apps/admin/app/api/admin/members/[userId]/route.ts
// PATCH — change org role   (body: { org_id, org_role })
// DELETE — remove member    (body: { org_id })

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ userId: string }> }

function err(code: string, msg: string, s: number) {
  return NextResponse.json({ error: { code, message: msg } }, { status: s })
}

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { userId } = await params
  const body = await req.json().catch(() => null)
  if (!body?.org_id) return err('VALIDATION_ERROR', 'org_id required', 400)

  const db = createServiceRoleClient()

  if (body.org_role) {
    const valid = ['OWNER', 'MANAGER', 'MEMBER']
    if (!valid.includes(body.org_role)) return err('VALIDATION_ERROR', 'Invalid org_role', 400)

    const { error } = await db.from('org_members')
      .update({ org_role: body.org_role })
      .eq('user_id', userId).eq('org_id', body.org_id)

    if (error) return err('DB_ERROR', error.message, 500)

    await db.from('audit_logs').insert({
      org_id: body.org_id, actor_user_id: ctx.userId,
      entity_type: 'org_member', entity_id: userId,
      action: 'MEMBER_ROLE_CHANGED', metadata: { new_role: body.org_role },
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { userId } = await params
  const body = await req.json().catch(() => null)
  if (!body?.org_id) return err('VALIDATION_ERROR', 'org_id required', 400)

  const db = createServiceRoleClient()

  const { error } = await db.from('org_members')
    .update({ status: 'REMOVED' })
    .eq('user_id', userId).eq('org_id', body.org_id)

  if (error) return err('DB_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id: body.org_id, actor_user_id: ctx.userId,
    entity_type: 'org_member', entity_id: userId,
    action: 'MEMBER_REMOVED', metadata: {},
  })

  return NextResponse.json({ success: true })
}
