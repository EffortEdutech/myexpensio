// apps/admin/app/api/admin/invitations/[inviteId]/route.ts
// DELETE — revoke a pending invitation

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ inviteId: string }> }

function err(code: string, msg: string, s: number) {
  return NextResponse.json({ error: { code, message: msg } }, { status: s })
}

export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { inviteId } = await params
  const db = createServiceRoleClient()

  const { data: inv } = await db.from('invitations').select('id, org_id, email').eq('id', inviteId).single()
  if (!inv) return err('NOT_FOUND', 'Invitation not found', 404)

  const { error } = await db.from('invitations').update({ status: 'REVOKED' }).eq('id', inviteId)
  if (error) return err('DB_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id: inv.org_id, actor_user_id: ctx.userId,
    entity_type: 'invitation', entity_id: inviteId,
    action: 'INVITE_REVOKED', metadata: { email: inv.email },
  })

  return NextResponse.json({ success: true })
}
