// apps/console/app/api/console/invitation-queue/[requestId]/route.ts
//
// PATCH /api/console/invitation-queue/:requestId
// Body: { action: 'approve' | 'reject' | 'execute', rejection_reason?: string }
//
// APPROVE  → status = APPROVED
// REJECT   → status = REJECTED (requires rejection_reason)
// EXECUTE  → creates auth user + profiles row + org_members row + sends invite email
//            → status = EXECUTED
//
// Console staff only. Full audit log on every action.

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ requestId: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { requestId } = await params
  if (!requestId) return err('VALIDATION_ERROR', 'requestId required', 400)

  const body = await req.json().catch(() => null)
  if (!body?.action) return err('VALIDATION_ERROR', 'action required', 400)

  const { action, rejection_reason } = body
  const VALID_ACTIONS = ['approve', 'reject', 'execute']
  if (!VALID_ACTIONS.includes(action)) {
    return err('VALIDATION_ERROR', `action must be one of: ${VALID_ACTIONS.join(', ')}`, 400)
  }

  const db = createServiceRoleClient()

  // Fetch the invitation request
  const { data: request, error: fetchError } = await db
    .from('invitation_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) return err('NOT_FOUND', 'Invitation request not found', 404)

  // ── APPROVE ──────────────────────────────────────────────────────────────────

  if (action === 'approve') {
    if (request.status !== 'PENDING') {
      return err('CONFLICT', `Cannot approve a request with status ${request.status}`, 409)
    }

    const { error: updateError } = await db
      .from('invitation_requests')
      .update({
        status: 'APPROVED',
        internal_assigned_to: ctx.userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (updateError) return err('SERVER_ERROR', updateError.message, 500)

    await db.from('audit_logs').insert({
      org_id:        request.workspace_id,
      actor_user_id: ctx.userId,
      entity_type:   'invitation_request',
      entity_id:     requestId,
      action:        'INVITATION_REQUEST_APPROVED',
      metadata:      { email: request.requested_email, role: request.requested_role },
    })

    return NextResponse.json({ success: true, status: 'APPROVED' })
  }

  // ── REJECT ───────────────────────────────────────────────────────────────────

  if (action === 'reject') {
    if (!['PENDING', 'APPROVED'].includes(request.status)) {
      return err('CONFLICT', `Cannot reject a request with status ${request.status}`, 409)
    }
    if (!rejection_reason?.trim()) {
      return err('VALIDATION_ERROR', 'rejection_reason is required when rejecting', 400)
    }

    const { error: updateError } = await db
      .from('invitation_requests')
      .update({
        status:           'REJECTED',
        rejection_reason: rejection_reason.trim(),
        internal_assigned_to: ctx.userId,
      })
      .eq('id', requestId)

    if (updateError) return err('SERVER_ERROR', updateError.message, 500)

    await db.from('audit_logs').insert({
      org_id:        request.workspace_id,
      actor_user_id: ctx.userId,
      entity_type:   'invitation_request',
      entity_id:     requestId,
      action:        'INVITATION_REQUEST_REJECTED',
      metadata:      {
        email:  request.requested_email,
        reason: rejection_reason.trim(),
      },
    })

    return NextResponse.json({ success: true, status: 'REJECTED' })
  }

  // ── EXECUTE ──────────────────────────────────────────────────────────────────

  if (action === 'execute') {
    if (request.status !== 'APPROVED') {
      return err('CONFLICT', `Request must be APPROVED before executing. Current status: ${request.status}`, 409)
    }

    const email       = request.requested_email as string
    const workspaceId = request.workspace_id    as string
    const orgRole     = request.requested_role  as string

    // Mark FAILED if anything goes wrong below
    async function markFailed(reason: string) {
      await db
        .from('invitation_requests')
        .update({ status: 'FAILED' })
        .eq('id', requestId)

      await db.from('audit_logs').insert({
        org_id:        workspaceId,
        actor_user_id: ctx!.userId,
        entity_type:   'invitation_request',
        entity_id:     requestId,
        action:        'INVITATION_REQUEST_FAILED',
        metadata:      { email, reason },
      })
    }

    // Step 1: Check if user already exists in auth.users
    const { data: existingUsers } = await db.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    )

    let userId: string

    if (existingUser) {
      // User already exists — use their ID
      userId = existingUser.id
    } else {
      // Step 2: Create auth user via invite (sends email automatically)
      const userAppUrl = process.env.NEXT_PUBLIC_USER_APP_URL ?? 'https://myexpensio-jade.vercel.app'

      const { data: inviteData, error: inviteError } = await db.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: `${userAppUrl}/auth/callback`,
          data: {
            invited_to_workspace_id: workspaceId,
            invited_role:            orgRole,
          },
        },
      )

      if (inviteError || !inviteData?.user?.id) {
        await markFailed(inviteError?.message ?? 'Failed to create auth user')
        return err('SERVER_ERROR', `Failed to invite user: ${inviteError?.message ?? 'unknown'}`, 500)
      }

      userId = inviteData.user.id
    }

    // Step 3: Ensure profiles row exists (auth user ID = profiles.id)
    const { error: profileError } = await db
      .from('profiles')
      .upsert(
        {
          id:    userId,
          email: email.toLowerCase(),
          role:  'USER',
        },
        { onConflict: 'id', ignoreDuplicates: true },
      )

    if (profileError) {
      await markFailed(`profiles upsert: ${profileError.message}`)
      return err('SERVER_ERROR', `Failed to set up profile: ${profileError.message}`, 500)
    }

    // Step 4: Create org_members row (upsert — in case they're being re-added)
    const { error: memberError } = await db
      .from('org_members')
      .upsert(
        {
          org_id:   workspaceId,
          user_id:  userId,
          org_role: orgRole,
          status:   'ACTIVE',
        },
        { onConflict: 'org_id,user_id' },
      )

    if (memberError) {
      await markFailed(`org_members upsert: ${memberError.message}`)
      return err('SERVER_ERROR', `Failed to assign workspace membership: ${memberError.message}`, 500)
    }

    // Step 5: Mark EXECUTED
    const { error: executeError } = await db
      .from('invitation_requests')
      .update({
        status:      'EXECUTED',
        executed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (executeError) {
      // Non-fatal — user is already set up, just the status update failed
      console.error('[execute] status update failed:', executeError)
    }

    // Step 6: Audit log
    await db.from('audit_logs').insert({
      org_id:        workspaceId,
      actor_user_id: ctx.userId,
      entity_type:   'invitation_request',
      entity_id:     requestId,
      action:        'INVITATION_REQUEST_EXECUTED',
      metadata:      {
        email,
        org_role:       orgRole,
        user_id:        userId,
        user_existed:   !!existingUser,
        workspace_id:   workspaceId,
      },
    })

    return NextResponse.json({
      success:      true,
      status:       'EXECUTED',
      user_id:      userId,
      user_existed: !!existingUser,
    })
  }

  return err('VALIDATION_ERROR', 'Unknown action', 400)
}
