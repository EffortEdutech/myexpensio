// apps/admin/app/api/admin/invitations/route.ts
//
// POST /api/admin/invitations  → create invitation for a new member
// GET  /api/admin/invitations  → list pending invitations for the org
//
// Invite flow:
//   1. Admin POSTs { email, org_role }
//   2. We insert into invitations table with a UUID token + 7-day expiry
//   3. Supabase Auth sends the invite email (or we trigger it)
//
// In Phase 1 we insert the DB row and rely on Supabase Auth invite email.
// The user clicks the invite link → /accept-invite in the USER app.

import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { OrgRole } from '@/lib/types'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── POST — create invitation ──────────────────────────────────────────────────
export async function POST(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  // MANAGER can invite MEMBER only; OWNER can invite any role
  const body = await request.json().catch(() => null)
  const email   = (body?.email as string)?.trim().toLowerCase()
  const orgRole = body?.org_role as OrgRole | undefined

  if (!email || !orgRole) {
    return err('VALIDATION_ERROR', 'email and org_role are required', 400)
  }
  if (!['OWNER', 'MANAGER', 'MEMBER'].includes(orgRole)) {
    return err('VALIDATION_ERROR', 'org_role must be OWNER | MANAGER | MEMBER', 400)
  }
  // MANAGER cannot invite OWNER or MANAGER
  if (ctx.orgRole === 'MANAGER' && orgRole !== 'MEMBER') {
    return err('UNAUTHORIZED', 'Managers can only invite Members', 403)
  }

  const db = createServiceRoleClient()

  // Check no active pending invite for this email+org
  const { data: existing } = await db
    .from('invitations')
    .select('id, status')
    .eq('org_id', ctx.orgId)
    .eq('email', email)
    .eq('status', 'PENDING')
    .single()

  if (existing) {
    return err('CONFLICT', 'A pending invitation already exists for this email', 409)
  }

  // Check not already a member
  const { data: existingMember } = await db
    .from('org_members')
    .select('user_id, status')
    .eq('org_id', ctx.orgId)
    .in('status', ['ACTIVE'])
    .limit(1)

  // We can't easily check by email without joining profiles — skip for now,
  // the unique constraint in org_members will catch duplicates on accept.

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: invitation, error } = await db
    .from('invitations')
    .insert({
      org_id:            ctx.orgId,
      email,
      org_role:          orgRole,
      status:            'PENDING',
      invited_by_user_id: ctx.userId,
      expires_at:        expiresAt,
    })
    .select()
    .single()

  if (error) {
    console.error('[admin/invitations] POST error:', error)
    return err('DB_ERROR', 'Failed to create invitation', 500)
  }

  // Trigger Supabase Auth invite email so the user can set their password
  // and land on the user app accept-invite page.
  const userAppUrl = process.env.USER_APP_URL ?? 'https://myexpensio-jade.vercel.app'
  const { error: inviteError } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${userAppUrl}/accept-invite?token=${invitation.token}`,
    data: {
      invited_to_org: ctx.orgId,
      invitation_token: invitation.token,
    },
  })

  if (inviteError) {
    // Non-fatal: DB row created, but email may not have sent.
    // Log and return success — admin can re-send manually.
    console.warn('[admin/invitations] Supabase invite email failed:', inviteError.message)
  }

  await db.from('audit_logs').insert({
    org_id: ctx.orgId,
    actor_user_id: ctx.userId,
    entity_type: 'invitation',
    entity_id: invitation.id,
    action: 'INVITATION_CREATED',
    metadata: { email, org_role: orgRole },
  })

  return NextResponse.json({ invitation }, { status: 201 })
}

// ── GET — list pending invitations ───────────────────────────────────────────
export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (!ctx.orgId) return err('MISSING_ORG', 'org_id required', 400)

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('invitations')
    .select('*')
    .eq('org_id', ctx.orgId)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })

  if (error) {
    return err('DB_ERROR', 'Failed to fetch invitations', 500)
  }

  return NextResponse.json({ invitations: data })
}
