// apps/admin/app/api/admin/orgs/route.ts
//
// GET  /api/admin/orgs  — list all organisations (internal staff only)
// POST /api/admin/orgs  — provision a new workspace (internal staff only)
//
// Mirrors the CS console/workspaces logic, scoped to the workspace-auth
// pattern used in apps/admin.

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── GET — list all workspaces ─────────────────────────────────────────────────

export async function GET(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.isInternalStaff) return err('FORBIDDEN', 'Internal staff only', 403)

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
      id, name, status, workspace_type,
      contact_email, created_at,
      subscription_status (
        tier, billing_status, period_end
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
    console.error('[admin/orgs] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch workspaces', 500)
  }

  const orgs = (data ?? []).map((row) => {
    const sub = Array.isArray(row.subscription_status)
      ? row.subscription_status[0] ?? null
      : row.subscription_status
    return { ...row, subscription_status: sub }
  })

  return NextResponse.json({ orgs, total: count ?? 0, page, pageSize })
}

// ── POST — provision a new workspace ─────────────────────────────────────────

export async function POST(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.isInternalStaff) return err('FORBIDDEN', 'Internal staff only', 403)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const {
    workspace_type,
    name,
    owner_email,
    owner_display_name,
    contact_email,
    contact_phone,
    initial_tier = 'FREE',
  } = body

  if (!workspace_type || !['TEAM', 'AGENT'].includes(workspace_type))
    return err('VALIDATION_ERROR', 'workspace_type must be TEAM or AGENT', 400)
  if (!name?.trim())
    return err('VALIDATION_ERROR', 'Organisation name is required', 400)
  if (!owner_email?.trim())
    return err('VALIDATION_ERROR', 'Owner email is required', 400)
  if (!owner_display_name?.trim())
    return err('VALIDATION_ERROR', 'Owner display name is required', 400)
  if (!['FREE', 'PRO'].includes(initial_tier))
    return err('VALIDATION_ERROR', 'initial_tier must be FREE or PRO', 400)

  const cleanEmail        = owner_email.trim().toLowerCase()
  const cleanContactEmail = contact_email?.trim().toLowerCase() || cleanEmail

  const db = createServiceRoleClient()
  const workspaceAppUrl = process.env.NEXT_PUBLIC_WORKSPACE_APP_URL ?? 'http://localhost:3101'

  // Step 1: Create organisation
  const { data: org, error: orgError } = await db
    .from('organizations')
    .insert({
      name:           name.trim(),
      workspace_type,
      status:         'ACTIVE',
      contact_email:  cleanContactEmail,
      contact_phone:  contact_phone?.trim() || null,
    })
    .select('id, name, workspace_type')
    .single()

  if (orgError || !org) {
    console.error('[admin/orgs] POST org insert error:', orgError)
    return err('SERVER_ERROR', `Failed to create organisation: ${orgError?.message ?? 'unknown'}`, 500)
  }

  const orgId = org.id

  // Step 2: Invite owner (or re-invite if existing user)
  const { data: existingUsers } = await db.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === cleanEmail,
  )

  let userId: string
  let userExisted = false

  if (existingUser) {
    userId = existingUser.id
    userExisted = true
    await db.auth.admin.inviteUserByEmail(cleanEmail, {
      redirectTo: `${workspaceAppUrl}/auth/callback`,
    })
  } else {
    const { data: inviteData, error: inviteError } = await db.auth.admin.inviteUserByEmail(
      cleanEmail,
      {
        redirectTo: `${workspaceAppUrl}/auth/callback`,
        data: {
          display_name:   owner_display_name.trim(),
          workspace_type,
          workspace_name: name.trim(),
        },
      },
    )

    if (inviteError || !inviteData?.user?.id) {
      await db.from('organizations').delete().eq('id', orgId)
      return err('SERVER_ERROR', `Failed to invite owner: ${inviteError?.message ?? 'unknown'}`, 500)
    }

    userId = inviteData.user.id
  }

  // Step 3: Upsert profile
  await db.from('profiles').upsert(
    { id: userId, email: cleanEmail, display_name: owner_display_name.trim(), role: 'USER' },
    { onConflict: 'id', ignoreDuplicates: false },
  )

  // Step 4: Assign OWNER membership
  const { error: memberError } = await db.from('org_members').upsert(
    { org_id: orgId, user_id: userId, org_role: 'OWNER', status: 'ACTIVE' },
    { onConflict: 'org_id,user_id' },
  )

  if (memberError) {
    await db.from('organizations').delete().eq('id', orgId)
    return err('SERVER_ERROR', `Failed to assign owner: ${memberError.message}`, 500)
  }

  // Step 5: Create subscription_status (non-fatal)
  try {
    await db.from('subscription_status').insert({
      org_id: orgId, tier: initial_tier, billing_status: 'INACTIVE', provider: 'MANUAL',
    })
  } catch { /* non-fatal */ }

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
      initial_tier, user_existed: userExisted,
      provisioned_by: ctx.email,
    },
  })

  return NextResponse.json(
    { org_id: orgId, org_name: org.name, workspace_type, user_id: userId, user_existed: userExisted },
    { status: 201 },
  )
}
