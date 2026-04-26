// apps/cs/app/api/console/workspaces/[orgId]/members/route.ts
//
// GET    — list all members of a workspace
// POST   — add member directly. For INTERNAL workspace, accepts optional
//          platform_role (SUPPORT | SUPER_ADMIN) to set profiles.role.
// PATCH  — change org_role
// DELETE — remove member (SUPER_ADMIN only)

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ orgId: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: Params) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { orgId } = await params
  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('org_members')
    .select(`
      org_id, user_id, org_role, status, created_at,
      profiles:user_id (
        id, email, display_name, role, department
      )
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  if (error) return err('SERVER_ERROR', error.message, 500)

  const members = (data ?? []).map((row) => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles,
  }))

  return NextResponse.json({ members })
}

// ── POST — add member (with optional platform_role for INTERNAL workspace) ────

export async function POST(req: Request, { params }: Params) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { orgId } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { email, org_role, display_name, platform_role } = body

  if (!email?.trim())    return err('VALIDATION_ERROR', 'email is required', 400)
  if (!org_role?.trim()) return err('VALIDATION_ERROR', 'org_role is required', 400)

  const cleanEmail = email.trim().toLowerCase()
  const db = createServiceRoleClient()

  // Fetch org to get workspace_type
  const { data: org } = await db
    .from('organizations')
    .select('id, name, workspace_type, status')
    .eq('id', orgId)
    .single()

  if (!org) return err('NOT_FOUND', 'Workspace not found', 404)
  if (org.status !== 'ACTIVE') {
    return err('CONFLICT', 'Cannot add members to an inactive or suspended workspace', 409)
  }

  // Validate org_role for workspace type
  const TEAM_ROLES     = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']
  const AGENT_ROLES    = ['OWNER', 'SALES', 'FINANCE', 'EMPLOYEE']
  const INTERNAL_ROLES = ['OWNER', 'MEMBER']

  const allowedRoles =
    org.workspace_type === 'TEAM'     ? TEAM_ROLES :
    org.workspace_type === 'AGENT'    ? AGENT_ROLES :
    org.workspace_type === 'INTERNAL' ? INTERNAL_ROLES :
    TEAM_ROLES

  if (!allowedRoles.includes(org_role)) {
    return err(
      'VALIDATION_ERROR',
      `Invalid role "${org_role}" for ${org.workspace_type} workspace. Allowed: ${allowedRoles.join(', ')}`,
      400,
    )
  }

  // Validate platform_role only for INTERNAL workspace
  const VALID_PLATFORM_ROLES = ['SUPPORT', 'SUPER_ADMIN']
  if (platform_role && !VALID_PLATFORM_ROLES.includes(platform_role)) {
    return err('VALIDATION_ERROR', 'platform_role must be SUPPORT or SUPER_ADMIN', 400)
  }
  if (platform_role && org.workspace_type !== 'INTERNAL') {
    return err('VALIDATION_ERROR', 'platform_role can only be set for INTERNAL workspace', 400)
  }
  if (org.workspace_type === 'INTERNAL' && !platform_role) {
    return err('VALIDATION_ERROR', 'platform_role is required when adding to INTERNAL workspace', 400)
  }

  // SUPER_ADMIN only can elevate to SUPER_ADMIN
  if (platform_role === 'SUPER_ADMIN' && ctx.role !== 'SUPER_ADMIN') {
    return err('FORBIDDEN', 'Only SUPER_ADMIN can grant SUPER_ADMIN role', 403)
  }

  const workspaceAppUrl = process.env.NEXT_PUBLIC_WORKSPACE_APP_URL ?? 'http://localhost:3101'

  // Check if user already exists
  const { data: existingUsers } = await db.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === cleanEmail,
  )

  let userId: string
  let userExisted = false

  if (existingUser) {
    userId = existingUser.id
    userExisted = true

    // Check if already an active member
    const { data: existingMember } = await db
      .from('org_members')
      .select('org_role, status')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMember?.status === 'ACTIVE') {
      return err(
        'CONFLICT',
        `${cleanEmail} is already an active member of this workspace (${existingMember.org_role})`,
        409,
      )
    }
  } else {
    // Invite new user
    const { data: inviteData, error: inviteError } = await db.auth.admin.inviteUserByEmail(
      cleanEmail,
      {
        redirectTo: `${workspaceAppUrl}/auth/callback`,
        data: {
          display_name:   display_name?.trim() || cleanEmail,
          workspace_name: org.name,
          workspace_type: org.workspace_type,
        },
      },
    )

    if (inviteError || !inviteData?.user?.id) {
      return err('SERVER_ERROR', `Failed to invite user: ${inviteError?.message ?? 'unknown'}`, 500)
    }

    userId = inviteData.user.id
  }

  // Determine the profiles.role to set
  // INTERNAL workspace: use platform_role (SUPPORT or SUPER_ADMIN)
  // All other workspaces: USER
  const profilesRole = org.workspace_type === 'INTERNAL' && platform_role
    ? platform_role
    : 'USER'

  // Upsert profile
  await db.from('profiles').upsert(
    {
      id:           userId,
      email:        cleanEmail,
      display_name: display_name?.trim() || null,
      role:         profilesRole,
    },
    { onConflict: 'id', ignoreDuplicates: false },
  )

  // Add org_members row
  const { error: memberError } = await db.from('org_members').upsert(
    { org_id: orgId, user_id: userId, org_role, status: 'ACTIVE' },
    { onConflict: 'org_id,user_id' },
  )

  if (memberError) {
    return err('SERVER_ERROR', `Failed to add member: ${memberError.message}`, 500)
  }

  // Audit log
  await db.from('audit_logs').insert({
    org_id:        orgId,
    actor_user_id: ctx.userId,
    entity_type:   'org_member',
    entity_id:     userId,
    action:        'MEMBER_ADDED_BY_CONSOLE',
    metadata:      {
      email: cleanEmail,
      org_role,
      platform_role: profilesRole,
      user_existed: userExisted,
      workspace_type: org.workspace_type,
      added_by: ctx.email,
    },
  })

  const messageMap: Record<string, string> = {
    EMPLOYEE: org.workspace_type === 'AGENT'
      ? `${cleanEmail} added as Individual Subscriber`
      : `${cleanEmail} added as Employee`,
    OWNER:   `${cleanEmail} added as Owner`,
    MANAGER: `${cleanEmail} added as Manager`,
    ADMIN:   `${cleanEmail} added as Admin`,
    SALES:   `${cleanEmail} added as Sales staff`,
    FINANCE: `${cleanEmail} added as Finance staff`,
    MEMBER:  `${cleanEmail} added as Member`,
  }

  const inviteNote = userExisted
    ? ' (already registered — added immediately)'
    : ' — invite email sent'

  return NextResponse.json(
    {
      success: true,
      user_id: userId,
      user_existed: userExisted,
      org_role,
      platform_role: profilesRole,
      message: (messageMap[org_role] ?? `${cleanEmail} added as ${org_role}`) + inviteNote,
    },
    { status: 201 },
  )
}

// ── PATCH — change org_role ────────────────────────────────────────────────────

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { orgId } = await params
  const body = await req.json().catch(() => null)
  if (!body?.user_id || !body?.org_role)
    return err('VALIDATION_ERROR', 'user_id and org_role required', 400)

  const db = createServiceRoleClient()

  // Prevent removing last OWNER
  if (body.org_role !== 'OWNER') {
    const { data: owners } = await db
      .from('org_members')
      .select('user_id')
      .eq('org_id', orgId)
      .eq('org_role', 'OWNER')
      .eq('status', 'ACTIVE')

    const isTarget = (owners ?? []).some((o) => o.user_id === body.user_id)
    if (isTarget && (owners ?? []).length === 1) {
      return err('CONFLICT', 'Cannot change the role of the last OWNER', 409)
    }
  }

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

// ── DELETE — remove member (SUPER_ADMIN only) ──────────────────────────────────

export async function DELETE(req: Request, { params }: Params) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (ctx.role !== 'SUPER_ADMIN') return err('FORBIDDEN', 'SUPER_ADMIN only', 403)

  const { orgId } = await params
  const body = await req.json().catch(() => null)
  if (!body?.user_id) return err('VALIDATION_ERROR', 'user_id required', 400)

  const db = createServiceRoleClient()

  // Prevent removing last OWNER
  const { data: member } = await db
    .from('org_members')
    .select('org_role')
    .eq('org_id', orgId)
    .eq('user_id', body.user_id)
    .maybeSingle()

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
    action:        'MEMBER_REMOVED_BY_CONSOLE',
    metadata:      {},
  })

  return NextResponse.json({ success: true })
}
