// apps/admin/app/api/workspace/members/route.ts
//
// GET   /api/workspace/members  — list members of the workspace
// PATCH /api/workspace/members  — change a member's role (body: {user_id, org_role})
// DELETE /api/workspace/members — remove a member (body: {user_id})
//
// Customer admins: scoped to their own org.
// Internal staff:  must pass ?org_id= to scope.

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth, resolveOrgScope } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const requestedOrgId = searchParams.get('org_id')?.trim() || null
  const orgId = resolveOrgScope(ctx, requestedOrgId)

  if (!orgId) return err('VALIDATION_ERROR', 'org_id required', 400)

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('org_members')
    .select(`
      org_id,
      user_id,
      org_role,
      status,
      created_at,
      profiles:user_id (
        id,
        email,
        display_name,
        department
      )
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[workspace/members] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch members', 500)
  }

  const members = (data ?? []).map((row) => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles,
  }))

  return NextResponse.json({ members })
}

// ── PATCH — change role ────────────────────────────────────────────────────────

export async function PATCH(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  // Only OWNER can change roles (customers); internal staff can always
  if (!ctx.isInternalStaff && ctx.orgRole !== 'OWNER') {
    return err('FORBIDDEN', 'Only the workspace OWNER can change member roles', 403)
  }

  const body = await req.json().catch(() => null)
  if (!body?.user_id || !body?.org_role) {
    return err('VALIDATION_ERROR', 'user_id and org_role are required', 400)
  }

  const orgId = ctx.isInternalStaff
    ? (body.org_id ?? ctx.orgId)
    : ctx.orgId

  if (!orgId) return err('VALIDATION_ERROR', 'org_id required', 400)

  // Validate new role is appropriate for the workspace type
  const TEAM_ROLES  = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']
  const AGENT_ROLES = ['OWNER', 'SALES', 'FINANCE']
  const allowedRoles = ctx.isInternalStaff
    ? [...TEAM_ROLES, ...AGENT_ROLES, 'MEMBER']
    : ctx.isTeamWorkspace
      ? TEAM_ROLES
      : AGENT_ROLES

  if (!allowedRoles.includes(body.org_role)) {
    return err('VALIDATION_ERROR', `Invalid role: ${body.org_role}`, 400)
  }

  // Prevent removing the last OWNER
  if (body.org_role !== 'OWNER') {
    const db = createServiceRoleClient()
    const { data: owners } = await db
      .from('org_members')
      .select('user_id')
      .eq('org_id', orgId)
      .eq('org_role', 'OWNER')
      .eq('status', 'ACTIVE')

    const isTargetCurrentlyOwner = (owners ?? []).some(o => o.user_id === body.user_id)
    if (isTargetCurrentlyOwner && (owners ?? []).length === 1) {
      return err('CONFLICT', 'Cannot demote the last OWNER of the workspace', 409)
    }
  }

  const db = createServiceRoleClient()
  const { error } = await db
    .from('org_members')
    .update({ org_role: body.org_role })
    .eq('org_id', orgId)
    .eq('user_id', body.user_id)

  if (error) return err('SERVER_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id:        orgId,
    actor_user_id: ctx.userId,
    entity_type:   'org_member',
    entity_id:     body.user_id,
    action:        'MEMBER_ROLE_CHANGED',
    metadata:      { new_role: body.org_role },
  })

  return NextResponse.json({ success: true })
}

// ── DELETE — remove member ─────────────────────────────────────────────────────

export async function DELETE(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  if (!ctx.isInternalStaff && ctx.orgRole !== 'OWNER') {
    return err('FORBIDDEN', 'Only the workspace OWNER can remove members', 403)
  }

  const body = await req.json().catch(() => null)
  if (!body?.user_id) return err('VALIDATION_ERROR', 'user_id is required', 400)

  const orgId = ctx.isInternalStaff ? (body.org_id ?? ctx.orgId) : ctx.orgId
  if (!orgId) return err('VALIDATION_ERROR', 'org_id required', 400)

  // Cannot remove self
  if (body.user_id === ctx.userId) {
    return err('CONFLICT', 'You cannot remove yourself from the workspace', 409)
  }

  const db = createServiceRoleClient()

  // Cannot remove last OWNER
  const { data: member } = await db
    .from('org_members')
    .select('org_role')
    .eq('org_id', orgId)
    .eq('user_id', body.user_id)
    .single()

  if (member?.org_role === 'OWNER') {
    const { data: owners } = await db
      .from('org_members')
      .select('user_id')
      .eq('org_id', orgId)
      .eq('org_role', 'OWNER')
      .eq('status', 'ACTIVE')

    if ((owners ?? []).length === 1) {
      return err('CONFLICT', 'Cannot remove the last OWNER of the workspace', 409)
    }
  }

  const { error } = await db
    .from('org_members')
    .update({ status: 'REMOVED' })
    .eq('org_id', orgId)
    .eq('user_id', body.user_id)

  if (error) return err('SERVER_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id:        orgId,
    actor_user_id: ctx.userId,
    entity_type:   'org_member',
    entity_id:     body.user_id,
    action:        'MEMBER_REMOVED',
    metadata:      {},
  })

  return NextResponse.json({ success: true })
}
