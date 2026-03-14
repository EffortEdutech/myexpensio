// apps/admin/app/api/admin/members/[userId]/route.ts
//
// PATCH /api/admin/members/:userId  → change org_role  (OWNER only)
// DELETE /api/admin/members/:userId → remove member    (OWNER only)
//
// Safety rules:
//   - Cannot change own role
//   - Cannot remove self
//   - Cannot remove/downgrade last OWNER

import { NextResponse } from 'next/server'
import { requireOwner } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { OrgRole } from '@/lib/types'

type Params = { params: Promise<{ userId: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── PATCH — change role ───────────────────────────────────────────────────────
export async function PATCH(request: Request, { params }: Params) {
  const ctx = await requireOwner('api')
  if (!ctx) return err('UNAUTHORIZED', 'Owner access required', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const { userId } = await params
  const body = await request.json().catch(() => null)
  const newRole = body?.org_role as OrgRole | undefined

  if (!newRole || !['OWNER', 'MANAGER', 'MEMBER'].includes(newRole)) {
    return err('VALIDATION_ERROR', 'org_role must be OWNER | MANAGER | MEMBER', 400)
  }

  // Cannot change own role
  if (userId === ctx.userId) {
    return err('CONFLICT', 'You cannot change your own role', 409)
  }

  const db = createServiceRoleClient()

  // If downgrading from OWNER, ensure at least one other OWNER remains
  if (newRole !== 'OWNER') {
    const { data: owners } = await db
      .from('org_members')
      .select('user_id')
      .eq('org_id', ctx.orgId)
      .eq('org_role', 'OWNER')
      .eq('status', 'ACTIVE')

    const ownerIds = (owners ?? []).map((o) => o.user_id)
    if (ownerIds.length === 1 && ownerIds[0] === userId) {
      return err('CONFLICT', 'Cannot remove the last owner. Promote another member first.', 409)
    }
  }

  const { error } = await db
    .from('org_members')
    .update({ org_role: newRole })
    .eq('org_id', ctx.orgId)
    .eq('user_id', userId)

  if (error) {
    console.error('[admin/members/:userId] PATCH error:', error)
    return err('DB_ERROR', 'Failed to update role', 500)
  }

  // Audit log
  await db.from('audit_logs').insert({
    org_id: ctx.orgId,
    actor_user_id: ctx.userId,
    entity_type: 'org_member',
    entity_id: userId,
    action: 'ROLE_CHANGED',
    metadata: { new_role: newRole },
  })

  return NextResponse.json({ success: true })
}

// ── DELETE — remove member ────────────────────────────────────────────────────
export async function DELETE(_request: Request, { params }: Params) {
  const ctx = await requireOwner('api')
  if (!ctx) return err('UNAUTHORIZED', 'Owner access required', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const { userId } = await params

  if (userId === ctx.userId) {
    return err('CONFLICT', 'You cannot remove yourself', 409)
  }

  const db = createServiceRoleClient()

  // Check not removing last owner
  const { data: target } = await db
    .from('org_members')
    .select('org_role')
    .eq('org_id', ctx.orgId)
    .eq('user_id', userId)
    .single()

  if (target?.org_role === 'OWNER') {
    const { data: owners } = await db
      .from('org_members')
      .select('user_id')
      .eq('org_id', ctx.orgId)
      .eq('org_role', 'OWNER')
      .eq('status', 'ACTIVE')

    if ((owners ?? []).length <= 1) {
      return err('CONFLICT', 'Cannot remove the last owner', 409)
    }
  }

  const { error } = await db
    .from('org_members')
    .update({ status: 'REMOVED' })
    .eq('org_id', ctx.orgId)
    .eq('user_id', userId)

  if (error) {
    console.error('[admin/members/:userId] DELETE error:', error)
    return err('DB_ERROR', 'Failed to remove member', 500)
  }

  await db.from('audit_logs').insert({
    org_id: ctx.orgId,
    actor_user_id: ctx.userId,
    entity_type: 'org_member',
    entity_id: userId,
    action: 'MEMBER_REMOVED',
    metadata: {},
  })

  return NextResponse.json({ success: true })
}
