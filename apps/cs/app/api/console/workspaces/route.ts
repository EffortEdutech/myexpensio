// apps/cs/app/api/console/workspaces/route.ts
//
// GET   — list all workspaces (with subscription info from unified subscriptions table)
// POST  — provision a new workspace + create ORG subscription row
// PATCH — update workspace status

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendOnboardingEmail } from '@/lib/mail/send-onboarding-email'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function getWorkspaceAppLoginUrl(): string {
  return process.env.WORKSPACE_APP_LOGIN_URL?.trim()
    || `${process.env.NEXT_PUBLIC_WORKSPACE_APP_URL?.trim() || 'https://myexpensio-admin.vercel.app'}/login`
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 10; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

// ── GET — list all workspaces ─────────────────────────────────────────────────

export async function GET(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const page          = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize      = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 25)))
  const from          = (page - 1) * pageSize
  const workspaceType = searchParams.get('workspace_type')?.trim() || null
  const status        = searchParams.get('status')?.trim() || null
  const search        = searchParams.get('search')?.trim() || null

  const db = createServiceRoleClient()

  let query = db
    .from('organizations')
    .select(
      `
      id, name, display_name, status, workspace_type,
      contact_email, created_at,
      org_members (
        user_id, status, org_role
      )
      `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (workspaceType) query = query.eq('workspace_type', workspaceType)
  if (status)        query = query.eq('status', status)
  if (search)        query = query.ilike('name', `%${search}%`)

  const { data, error, count } = await query

  if (error) {
    console.error('[console/workspaces] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch workspaces', 500)
  }

  const orgIds = (data ?? []).map((r) => r.id)

  // Batch-fetch ORG subscriptions from the unified subscriptions table
  const { data: subRows } = orgIds.length
    ? await db
        .from('subscriptions')
        .select('entity_id, tier, status, current_period_end, seat_count')
        .eq('entity_type', 'ORG')
        .in('entity_id', orgIds)
    : { data: [] }

  const subByOrg = Object.fromEntries(
    (subRows ?? []).map((s) => [s.entity_id, s]),
  )

  const workspaces = (data ?? []).map((row) => {
    const sub     = subByOrg[row.id] ?? null
    const members = row.org_members ?? []
    const owner   = members.find((m: { org_role: string }) => m.org_role === 'OWNER')

    return {
      ...row,
      subscription: sub
        ? { tier: sub.tier, status: sub.status, period_end: sub.current_period_end, seat_count: sub.seat_count }
        : null,
      org_members:         undefined,
      active_member_count: members.filter((m: { status: string }) => m.status === 'ACTIVE').length,
      total_member_count:  members.length,
      owner_user_id:       owner?.user_id ?? null,
    }
  })

  return NextResponse.json({ workspaces, total: count ?? 0, page, pageSize })
}

// ── POST — provision a new workspace ─────────────────────────────────────────

export async function POST(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const {
    workspace_type,
    name,
    owner_email,
    owner_display_name,
    contact_email,
    contact_phone,
    address,
    notes,
    initial_tier = 'PRO',
    seat_count   = 1,
  } = body

  if (!workspace_type || !['TEAM', 'AGENT'].includes(workspace_type))
    return err('VALIDATION_ERROR', 'workspace_type must be TEAM or AGENT', 400)
  if (!name?.trim())
    return err('VALIDATION_ERROR', 'Organisation name is required', 400)
  if (!owner_email?.trim())
    return err('VALIDATION_ERROR', 'Owner email is required', 400)
  if (!owner_display_name?.trim())
    return err('VALIDATION_ERROR', 'Owner name is required', 400)
  if (!['FREE', 'PRO', 'PREMIUM'].includes(initial_tier))
    return err('VALIDATION_ERROR', 'initial_tier must be FREE, PRO, or PREMIUM', 400)

  const cleanEmail        = owner_email.trim().toLowerCase()
  const cleanContactEmail = contact_email?.trim().toLowerCase() || cleanEmail

  const db = createServiceRoleClient()

  // Step 1: Create organization
  const { data: org, error: orgError } = await db
    .from('organizations')
    .insert({
      name:           name.trim(),
      workspace_type,
      status:         'ACTIVE',
      contact_email:  cleanContactEmail,
      contact_phone:  contact_phone?.trim() || null,
      address:        address?.trim() || null,
      notes:          notes?.trim() || null,
    })
    .select('id, name, workspace_type')
    .single()

  if (orgError || !org) {
    console.error('[console/workspaces] POST org insert error:', orgError)
    return err('SERVER_ERROR', `Failed to create organisation: ${orgError?.message ?? 'unknown'}`, 500)
  }

  const orgId = org.id

  // Step 2: Check for existing user / create owner with temp-password onboarding
  const { data: existingUsers } = await db.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === cleanEmail,
  )

  let userId: string
  let userExisted = false
  let tempPassword: string | null = null

  if (existingUser) {
    userId = existingUser.id
    userExisted = true
  } else {
    tempPassword = generateTempPassword()

    const { data: newUser, error: createError } = await db.auth.admin.createUser({
      email:         cleanEmail,
      password:      tempPassword,
      email_confirm: true,
      app_metadata:  { must_change_password: true },
      user_metadata: {
        display_name:   owner_display_name.trim(),
        workspace_type,
        workspace_name: name.trim(),
      },
    })

    if (createError || !newUser?.user?.id) {
      await db.from('organizations').delete().eq('id', orgId)
      return err('SERVER_ERROR', `Failed to create owner account: ${createError?.message ?? 'unknown'}`, 500)
    }

    userId = newUser.user.id
  }

  // Step 3: Upsert profile
  const { error: profileError } = await db.from('profiles').upsert(
    { id: userId, email: cleanEmail, display_name: owner_display_name.trim(), role: 'USER' },
    { onConflict: 'id', ignoreDuplicates: false },
  )

  if (profileError && !userExisted) {
    await db.from('organizations').delete().eq('id', orgId)
    await db.auth.admin.deleteUser(userId).catch(() => undefined)
    return err('SERVER_ERROR', `Failed to set up owner profile: ${profileError.message}`, 500)
  }

  // Step 4: Create org_members row (OWNER)
  const { error: memberError } = await db.from('org_members').upsert(
    { org_id: orgId, user_id: userId, org_role: 'OWNER', status: 'ACTIVE' },
    { onConflict: 'org_id,user_id' },
  )

  if (memberError) {
    await db.from('organizations').delete().eq('id', orgId)
    if (!userExisted) await db.auth.admin.deleteUser(userId).catch(() => undefined)
    return err('SERVER_ERROR', `Failed to assign owner: ${memberError.message}`, 500)
  }

  let emailSent = false
  if (!userExisted && tempPassword) {
    try {
      await sendOnboardingEmail({
        to: cleanEmail,
        orgName: org.name,
        tempPassword,
        loginUrl: getWorkspaceAppLoginUrl(),
        displayName: owner_display_name.trim(),
        defaultRateTemplateName: null,
      })
      emailSent = true
    } catch (mailErr) {
      await db.from('organizations').delete().eq('id', orgId)
      await db.auth.admin.deleteUser(userId).catch(() => undefined)
      console.error('[console/workspaces] owner onboarding email failed:', mailErr)
      return err('SERVER_ERROR', 'Workspace was not created because the owner onboarding email could not be sent.', 500)
    }
  }

  // Step 5: Create ORG subscription row in the unified subscriptions table
  // Console-provisioned workspaces are ACTIVE immediately (billing handled separately).
  // FREE = TRIALING so they can still test the workspace before paying.
  try {
    await db.from('subscriptions').upsert(
      {
        entity_type: 'ORG',
        entity_id:   orgId,
        tier:        initial_tier,
        status:      initial_tier === 'FREE' ? 'TRIALING' : 'ACTIVE',
        seat_count:  Math.max(1, Number(seat_count) || 1),
        created_at:  new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      },
      { onConflict: 'entity_type,entity_id', ignoreDuplicates: false },
    )
  } catch (subErr) {
    // Non-fatal — workspace is usable; log for ops team to investigate
    console.error('[console/workspaces] subscription upsert failed (non-fatal):', subErr)
  }

  // Step 6: Audit log
  await db.from('audit_logs').insert({
    org_id:        orgId,
    actor_user_id: ctx.userId,
    entity_type:   'organization',
    entity_id:     orgId,
    action:        'WORKSPACE_PROVISIONED',
    metadata:      {
      workspace_type, name: name.trim(),
      owner_email: cleanEmail, owner_user_id: userId,
      initial_tier, seat_count, user_existed: userExisted, email_sent: emailSent,
      provisioned_by: ctx.email,
    },
  })

  return NextResponse.json(
    { org_id: orgId, org_name: org.name, workspace_type, user_id: userId, user_existed: userExisted, email_sent: emailSent, status: 'PROVISIONED' },
    { status: 201 },
  )
}

// ── PATCH — update workspace status ──────────────────────────────────────────

export async function PATCH(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (ctx.role !== 'SUPER_ADMIN') return err('FORBIDDEN', 'SUPER_ADMIN only', 403)

  const body = await req.json().catch(() => null)
  if (!body?.org_id || !body?.status)
    return err('VALIDATION_ERROR', 'org_id and status required', 400)

  const VALID = ['ACTIVE', 'INACTIVE', 'SUSPENDED']
  if (!VALID.includes(body.status))
    return err('VALIDATION_ERROR', `status must be one of: ${VALID.join(', ')}`, 400)

  const db = createServiceRoleClient()

  const { error } = await db
    .from('organizations')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', body.org_id)

  if (error) return err('SERVER_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id:        body.org_id,
    actor_user_id: ctx.userId,
    entity_type:   'organization',
    entity_id:     body.org_id,
    action:        'WORKSPACE_STATUS_CHANGED',
    metadata:      { new_status: body.status },
  })

  return NextResponse.json({ success: true })
}
