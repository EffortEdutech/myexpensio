// apps/admin/app/api/admin/invitations/route.ts
// POST — create invitation for any org

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

  const { email, org_id, org_role = 'MEMBER' } = body
  if (!email || !org_id) return err('VALIDATION_ERROR', 'email and org_id required', 400)

  const validRoles = ['OWNER', 'MANAGER', 'MEMBER']
  if (!validRoles.includes(org_role)) return err('VALIDATION_ERROR', 'Invalid org_role', 400)

  const db = createServiceRoleClient()

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: invitation, error } = await db
    .from('invitations')
    .insert({
      org_id, email: email.toLowerCase().trim(), org_role,
      invited_by_user_id: ctx.userId,
      status: 'PENDING', expires_at: expiresAt,
    })
    .select('id, org_id, email, org_role, status, expires_at, created_at, organizations(name)')
    .single()

  if (error) {
    if (error.code === '23505') return err('CONFLICT', 'A pending invite for this email already exists', 409)
    return err('DB_ERROR', error.message, 500)
  }

  await db.from('audit_logs').insert({
    org_id, actor_user_id: ctx.userId,
    entity_type: 'invitation', entity_id: invitation.id,
    action: 'INVITE_SENT', metadata: { email, org_role },
  })

  return NextResponse.json({ invitation }, { status: 201 })
}
