// apps/admin/app/api/workspace/invitations/route.ts
//
// GET  - list invitation_requests for this workspace
// POST - submit a new invitation request
//
// Auto-approve: if platform_config.auto_approve_invitations = true,
// immediately creates the user + sends onboarding email via Gmail SMTP (EXECUTED).
// Otherwise, status = PENDING for CS Console staff to review and execute.
//
// Password flow for new employees:
//   1. User created with random temp password + must_change_password: true
//   2. Onboarding email sent via Gmail SMTP with temp password + login URL
//   3. Employee logs in -> user app forces /change-password before dashboard access
//   4. Employee sets own password -> must_change_password cleared

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth, resolveOrgScope } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendOnboardingEmail } from '@/lib/mail/send-onboarding-email'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

type InviteRow = {
  id: string
  status: string
  [key: string]: unknown
}

type AuditRow = {
  entity_id: string
  metadata: { user_id?: string } | null
}

type AuthAppMetadata = {
  must_change_password?: boolean
}

async function addOnboardingStatus(db: ReturnType<typeof createServiceRoleClient>, rows: InviteRow[]) {
  const base = rows.map((row) => ({
    ...row,
    onboarding_status:
      row.status === 'EXECUTED' ? 'AWAITING_FIRST_LOGIN' :
      row.status === 'APPROVED' ? 'APPROVED_PENDING_SEND' :
      row.status,
  }))

  const executedIds = base
    .filter((row) => row.status === 'EXECUTED')
    .map((row) => row.id)

  if (executedIds.length === 0) return base

  const { data: auditRows } = await db
    .from('audit_logs')
    .select('entity_id, metadata')
    .eq('entity_type', 'invitation_request')
    .in('entity_id', executedIds)
    .in('action', ['INVITATION_REQUEST_EXECUTED', 'INVITATION_REQUEST_AUTO_EXECUTED'])
    .order('created_at', { ascending: false })

  const userIdByRequest = new Map<string, string>()
  for (const row of (auditRows ?? []) as AuditRow[]) {
    const userId = row.metadata?.user_id
    if (userId && !userIdByRequest.has(row.entity_id)) {
      userIdByRequest.set(row.entity_id, userId)
    }
  }

  const userIds = [...new Set([...userIdByRequest.values()])]
  if (userIds.length === 0) return base

  const { data: profiles } = await db
    .from('profiles')
    .select('id, consent_terms, consent_terms_at')
    .in('id', userIds)

  const consentByUser = new Map(
    (profiles ?? []).map((profile) => [
      profile.id as string,
      profile.consent_terms === true || Boolean(profile.consent_terms_at),
    ]),
  )

  const authByUser = new Map<string, AuthAppMetadata>()
  await Promise.all(userIds.map(async (userId) => {
    const { data } = await db.auth.admin.getUserById(userId)
    authByUser.set(userId, (data.user?.app_metadata ?? {}) as AuthAppMetadata)
  }))

  return base.map((row) => {
    if (row.status !== 'EXECUTED') return row

    const userId = userIdByRequest.get(row.id)
    const mustChangePassword = userId ? authByUser.get(userId)?.must_change_password === true : true
    const hasConsent = userId ? consentByUser.get(userId) === true : false

    return {
      ...row,
      invitation_user_id: userId ?? null,
      onboarding_status: !mustChangePassword && hasConsent
        ? 'COMPLETED'
        : 'AWAITING_FIRST_LOGIN',
    }
  })
}

// Roles that use Workspace App (apps/admin)
const WORKSPACE_APP_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE']

function getUserAppUrl(): string {
  return process.env.NEXT_PUBLIC_USER_APP_URL?.trim() || 'https://myexpensio-jade.vercel.app'
}

function getUserAppLoginUrl(): string {
  return process.env.USER_APP_LOGIN_URL?.trim() || `${getUserAppUrl()}/login`
}

function getWorkspaceAppLoginUrl(): string {
  return process.env.WORKSPACE_APP_LOGIN_URL?.trim()
    || `${process.env.NEXT_PUBLIC_WORKSPACE_APP_URL?.trim() || 'https://myexpensio-admin.vercel.app'}/login`
}

function getLoginUrl(orgRole: string): string {
  return orgRole === 'EMPLOYEE' ? getUserAppLoginUrl() : getWorkspaceAppLoginUrl()
}

// Generates a readable 10-character temp password (no ambiguous chars like 0/O/l/I)
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 10; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

// -- GET ------------------------------------------------------------------------

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

  const normalized = (data ?? []).map((row) => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles,
  }))

  const requests = await addOnboardingStatus(db, normalized)

  return NextResponse.json({ requests, total: count ?? 0, page, pageSize })
}

// -- POST -----------------------------------------------------------------------

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

  // -- Auto-approve: execute immediately --------------------------------------

  if (autoApprove) {
    try {
      const loginUrl = getLoginUrl(requested_role)

      // Get workspace name for the onboarding email
      const { data: org } = await db
        .from('organizations')
        .select('name')
        .eq('id', workspaceId)
        .single()

      const orgName = org?.name ?? workspaceId

      // Check if user already exists
      const { data: existingUsers } = await db.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail,
      )

      let userId: string
      let userExisted = false
      let tempPassword: string | null = null

      if (existingUser) {
        // Existing user — just add to org, no password change needed
        userId = existingUser.id
        userExisted = true
      } else {
        // New user — create with temp password + must_change_password flag
        tempPassword = generateTempPassword()

        const { data: newUser, error: createError } = await db.auth.admin.createUser({
          email:         cleanEmail,
          password:      tempPassword,
          email_confirm: true,
          app_metadata:  { must_change_password: true },
          user_metadata: { workspace_name: orgName, workspace_type: workspaceType },
        })

        if (createError || !newUser?.user?.id) {
          throw new Error(createError?.message ?? 'Failed to create user')
        }
        userId = newUser.user.id
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

      // Send onboarding email with temp password (new users only)
      let emailSent = false
      if (!userExisted && tempPassword) {
        try {
          await sendOnboardingEmail({
            to:                      cleanEmail,
            orgName,
            tempPassword,
            loginUrl,
            displayName:             null,
            defaultRateTemplateName: null,
          })
          emailSent = true
        } catch (mailErr) {
          console.error('[workspace/invitations] sendOnboardingEmail failed:', mailErr)
          await db
            .from('org_members')
            .delete()
            .eq('org_id', workspaceId)
            .eq('user_id', userId)
          if (!userExisted) await db.auth.admin.deleteUser(userId).catch(() => undefined)
          throw new Error(`Failed to send onboarding email: ${mailErr instanceof Error ? mailErr.message : String(mailErr)}`)
        }
      }

      // Mark EXECUTED
      await db
        .from('invitation_requests')
        .update({ status: 'EXECUTED', executed_at: new Date().toISOString(), approved_at: new Date().toISOString() })
        .eq('id', created.id)

      // Audit log
      await db.from('audit_logs').insert({
        org_id:        workspaceId,
        actor_user_id: ctx.userId,
        entity_type:   'invitation_request',
        entity_id:     created.id,
        action:        'INVITATION_REQUEST_AUTO_EXECUTED',
        metadata:      { email: cleanEmail, role: requested_role, user_id: userId, user_existed: userExisted, email_sent: emailSent },
      })

      return NextResponse.json(
        {
          request:       { ...created, status: 'EXECUTED' },
          auto_executed: true,
          user_existed:  userExisted,
          email_sent:    emailSent,
          message: userExisted
            ? `${cleanEmail} has been added to your workspace. They can log in with their existing password.`
            : `Onboarding email sent to ${cleanEmail} with login instructions and a temporary password.`,
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

  // -- Manual: save as PENDING -------------------------------------------------

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
