// apps/user/app/api/invite/accept/route.ts
// POST /api/invite/accept
//
// Body: { invite_id: string, display_name?: string }
//
// Server-side operations (all via service role):
//   1. Validate session — user must be authenticated
//   2. Validate invite  — PENDING, not expired, email matches session user
//   3. Update profile display_name (if provided)
//   4. Upsert org_members           (idempotent)
//   5. Mark invitation ACCEPTED
//   6. Write audit log              (INVITE_ACCEPTED)
//   7. Ensure subscription_status row exists for the org (FREE default)
//
// Response (200): { success: true, org_member: { org_id, user_id, org_role } }
//
// Error codes: UNAUTHENTICATED | VALIDATION_ERROR | NOT_FOUND |
//              INVITE_ALREADY_USED | INVITE_EXPIRED | FORBIDDEN | SERVER_ERROR

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

// ── Helpers ────────────────────────────────────────────────────────────────

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    (() => { throw new Error('Missing Supabase anon key') })()
  )
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  // Build a server client with the anon key to read the authenticated user.
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getAnonKey(),
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // ── 1. Authenticate ──────────────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser()

  if (authError || !user) {
    return err('UNAUTHENTICATED', 'You must be logged in to accept an invitation.', 401)
  }

  // ── 2. Parse body ────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({})) as {
    invite_id?: string
    display_name?: string
  }

  const { invite_id, display_name } = body

  if (!invite_id) {
    return err('VALIDATION_ERROR', 'invite_id is required.', 400)
  }

  const admin = serviceClient()

  // ── 3. Fetch and validate invitation ────────────────────────────────────
  const { data: invite, error: inviteError } = await admin
    .from('invitations')
    .select('id, org_id, email, org_role, status, expires_at')
    .eq('id', invite_id)
    .single()

  if (inviteError || !invite) {
    return err('NOT_FOUND', 'Invitation not found.', 404)
  }

  if (invite.status === 'ACCEPTED') {
    return err('INVITE_ALREADY_USED', 'This invitation has already been accepted.', 409)
  }

  if (invite.status === 'REVOKED') {
    return err('INVITE_ALREADY_USED', 'This invitation was cancelled by your admin.', 409)
  }

  if (invite.status !== 'PENDING') {
    return err('INVITE_ALREADY_USED', 'This invitation is no longer valid.', 409)
  }

  if (new Date(invite.expires_at) < new Date()) {
    return err('INVITE_EXPIRED', 'This invitation has expired. Please request a new one.', 410)
  }

  // Email must match — prevents one user accepting another user's invite
  const userEmail   = (user.email ?? '').toLowerCase().trim()
  const inviteEmail = (invite.email ?? '').toLowerCase().trim()

  if (userEmail !== inviteEmail) {
    return err(
      'FORBIDDEN',
      'This invitation was sent to a different email address.',
      403
    )
  }

  // ── 4. Update display_name (optional) ───────────────────────────────────
  const trimmedName = display_name?.trim()
  if (trimmedName) {
    const { error: profileError } = await admin
      .from('profiles')
      .update({ display_name: trimmedName })
      .eq('id', user.id)

    if (profileError) {
      // Non-fatal — log but continue
      console.warn('[invite/accept] profile update failed:', profileError.message)
    }
  }

  // ── 5. Provision org membership (upsert = idempotent) ───────────────────
  const { error: memberError } = await admin
    .from('org_members')
    .upsert(
      {
        org_id:   invite.org_id,
        user_id:  user.id,
        org_role: invite.org_role,
        status:   'ACTIVE',
      },
      { onConflict: 'org_id,user_id' }
    )

  if (memberError) {
    console.error('[invite/accept] org_members upsert failed:', memberError)
    return err('SERVER_ERROR', 'Failed to create organisation membership. Please try again.', 500)
  }

  // ── 6. Mark invitation ACCEPTED ─────────────────────────────────────────
  const { error: updateError } = await admin
    .from('invitations')
    .update({
      status:                'ACCEPTED',
      accepted_by_user_id:   user.id,
    })
    .eq('id', invite_id)

  if (updateError) {
    // Membership was created — log the failure but don't block the user
    console.error('[invite/accept] invitation status update failed:', updateError.message)
  }

  // ── 7. Audit log ─────────────────────────────────────────────────────────
  await admin.from('audit_logs').insert({
    org_id:        invite.org_id,
    actor_user_id: user.id,
    entity_type:   'INVITE',
    entity_id:     invite.id,
    action:        'INVITE_ACCEPTED',
    metadata: {
      email:    user.email,
      org_role: invite.org_role,
    },
  })

  // ── 8. Ensure subscription_status row exists for the org ────────────────
  // Idempotent — org may already have been provisioned by a previous member.
  await admin
    .from('subscription_status')
    .upsert({ org_id: invite.org_id, tier: 'FREE' }, { onConflict: 'org_id' })
    .select()    // suppress "no rows affected" warning

  // ── Done ─────────────────────────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    org_member: {
      org_id:   invite.org_id,
      user_id:  user.id,
      org_role: invite.org_role,
    },
  })
}
