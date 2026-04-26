// apps/admin/app/api/workspace/invitations/route.ts
//
// GET  — list invitation_requests for this workspace
// POST — submit a new invitation request
//
// Auto-approve: if platform_config.auto_approve_invitations = true,
// immediately creates the user + sends invite email (EXECUTED).
// Otherwise, status = PENDING for Console staff to review.
//
// REDIRECT URL LOGIC (FIX):
//   EMPLOYEE role → USER_APP_URL  (MyExpensio — they don't use Workspace App)
//   All other roles → WORKSPACE_APP_URL (Expensio Workspace)

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth, resolveOrgScope } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// Roles that use Workspace App (apps/admin)
const WORKSPACE_APP_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE']

function getRedirectUrl(orgRole: string): string {
  const workspaceAppUrl = process.env.NEXT_PUBLIC_WORKSPACE_APP_URL ?? 'http://localhost:3101'
  const userAppUrl      = process.env.NEXT_PUBLIC_USER_APP_URL      ?? 'http://localhost:3100'

  // EMPLOYEE (Team member or Agent subscriber) → MyExpensio user app
  return WORKSPACE_APP_ROLES.includes(orgRole) ? workspaceAppUrl : userAppUrl
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const requestedOrgId = searchParams.get('workspace_id')?.trim() || null
  const workspaceId    = resolveOrgScope(ctx, requestedOrgId)
  const status         = searchParams.get('status')?.trim() || null
  const page           = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize       = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 50)))
  const from           = (page - 1) * pageSize

  const db = createServiceRoleClient()

  let query = db
    .from('invitation_requests')
    .select(
      `
      id, workspace_id, workspace_type, requested_by_user_id,
      requested_email, requested_role, status, rejection_reason,
      notes, created_at, approved_at, executed_at,
      profiles:requested_by_user_id ( id, display_name, email )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (workspaceId) query = query.eq('workspace_id', workspaceId)
  if (status)      query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) {
    console.error('[workspace/invitations] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch invitation requests', 500)
  }

  const requests = (data ?? []).map((row) => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles,
  }))

  return NextResponse.json({ requests, total: count ?? 0, page, pageSize })
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const workspaceId   = ctx.orgId
  const workspaceType = ctx.workspaceType

  if (!workspaceId || !workspaceType) {
    return err('FORBIDDEN', 'No workspace context', 403)
  }

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { requested_email, requested_role, notes } = body

  if (!requested_email?.trim()) return err('VALIDATION_ERROR', 'requested_email is required', 400)
  if (!requested_role?.trim())  return err('VALIDATION_ERROR', 'requested_role is required', 400)

  // Validate role for workspace type
  const TEAM_ROLES  = ['ADMIN', 'MANAGER', 'EMPLOYEE']
  const AGENT_ROLES = ['SALES', 'FINANCE', 'EMPLOYEE']
  const allowedRoles = workspaceType === 'TEAM' ? TEAM_ROLES : AGENT_ROLES

  if (!allowedRoles.includes(requested_role)) {
    return err(
      'VALIDATION_ERROR',
      `Invalid role for ${workspaceType} workspace. Allowed: ${allowedRoles.join(', ')}`,
      400,
    )
  }

  const cleanEmail = requested_email.toLowerCase().trim()
  const db = createServiceRoleClient()

  // Check for duplicate
  const { data: existing } = await db
    .from('invitation_requests')
    .select('id, status')
    .eq('workspace_id', workspaceId)
    .eq('requested_email', cleanEmail)
    .in('status', ['PENDING', 'APPROVED'])
    .maybeSingle()

  if (existing) {
    return err('CONFLICT', 'A pending or approved invitation already exists for this email', 409)
  }

  // Check auto-approve flag
  const { data: config } = await db
    .from('platform_config')
    .select('auto_approve_invitations')
    .eq('id', true)
    .maybeSingle()

  const autoApprove = config?.auto_approve_invitations === true

  // Insert the request
  const { data: created, error: insertError } = await db
    .from('invitation_requests')
    .insert({
      workspace_id:          workspaceId,
      workspace_type:        workspaceType,
      requested_by_user_id:  ctx.userId,
      requested_email:       cleanEmail,
      requested_role,
      notes:                 notes?.trim() || null,
      status:                'PENDING',
    })
    .select('id, requested_email, requested_role, status, created_at')
    .single()

  if (insertError || !created) {
    console.error('[workspace/invitations] POST error:', insertError)
    return err('SERVER_ERROR', 'Failed to create invitation request', 500)
  }

  // ── Auto-approve: execute immediately ──────────────────────────────────────

  if (autoApprove) {
    try {
      // Role-aware redirect: EMPLOYEE → user app, others → workspace app
      const redirectTo = `${getRedirectUrl(requested_role)}/auth/callback`

      // Get workspace name for the invite email
      const { data: org } = await db
        .from('organizations')
        .select('name')
        .eq('id', workspaceId)
        .single()

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
        await db.auth.admin.inviteUserByEmail(cleanEmail, { redirectTo })
      } else {
        const { data: inviteData, error: inviteError } = await db.auth.admin.inviteUserByEmail(
          cleanEmail,
          {
            redirectTo,
            data: {
              workspace_name: org?.name,
              workspace_type: workspaceType,
            },
          },
        )

        if (inviteError || !inviteData?.user?.id) {
          throw new Error(inviteError?.message ?? 'Failed to invite user')
        }
        userId = inviteData.user.id
      }

      // Upsert profile
      await db.from('profiles').upsert(
        { id: userId, email: cleanEmail, role: 'USER' },
        { onConflict: 'id', ignoreDuplicates: false },
      )

      // Upsert org_members
      await db.from('org_members').upsert(
        { org_id: workspaceId, user_id: userId, org_role: requested_role, status: 'ACTIVE' },
        { onConflict: 'org_id,user_id' },
      )

      // Mark EXECUTED
      await db
        .from('invitation_requests')
        .update({
          status:       'EXECUTED',
          executed_at:  new Date().toISOString(),
          approved_at:  new Date().toISOString(),
        })
        .eq('id', created.id)

      // Audit log
      await db.from('audit_logs').insert({
        org_id:        workspaceId,
        actor_user_id: ctx.userId,
        entity_type:   'invitation_request',
        entity_id:     created.id,
        action:        'INVITATION_REQUEST_AUTO_EXECUTED',
        metadata:      {
          email:         cleanEmail,
          role:          requested_role,
          user_id:       userId,
          user_existed:  userExisted,
          redirect_to:   redirectTo,
        },
      })

      const isEmployee = requested_role === 'EMPLOYEE'
      return NextResponse.json(
        {
          request:       { ...created, status: 'EXECUTED' },
          auto_executed: true,
          user_existed:  userExisted,
          message: isEmployee
            ? `Invite sent to ${cleanEmail}. They will log in via MyExpensio (user app) after accepting.`
            : userExisted
              ? `${cleanEmail} has been added to your workspace. They can log in to Expensio Workspace.`
              : `Invite sent to ${cleanEmail}. They can log in to Expensio Workspace after accepting.`,
        },
        { status: 201 },
      )
    } catch (autoErr) {
      console.error('[workspace/invitations] auto-execute failed:', autoErr)
      await db
        .from('invitation_requests')
        .update({ status: 'FAILED' })
        .eq('id', created.id)

      await db.from('audit_logs').insert({
        org_id:        workspaceId,
        actor_user_id: ctx.userId,
        entity_type:   'invitation_request',
        entity_id:     created.id,
        action:        'INVITATION_REQUEST_AUTO_EXECUTE_FAILED',
        metadata:      { email: cleanEmail, error: String(autoErr) },
      })

      return NextResponse.json(
        {
          request:       { ...created, status: 'FAILED' },
          auto_executed: false,
          message:       'Auto-invite failed. Sent to Console staff for manual processing.',
        },
        { status: 201 },
      )
    }
  }

  // ── Manual: save as PENDING ─────────────────────────────────────────────────

  await db.from('audit_logs').insert({
    org_id:        workspaceId,
    actor_user_id: ctx.userId,
    entity_type:   'invitation_request',
    entity_id:     created.id,
    action:        'INVITATION_REQUEST_CREATED',
    metadata:      { email: cleanEmail, role: requested_role },
  })

  return NextResponse.json(
    {
      request:       created,
      auto_executed: false,
      message:       'Your request has been sent to the platform team for review.',
    },
    { status: 201 },
  )
}
