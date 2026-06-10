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
//   7. Ensure subscriptions row exists for the org (FREE/TRIALING default)
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
  // Supports both cookie-based auth (web) and Bearer token (mobile).
  const admin = serviceClient()
  let user: Awaited<ReturnType<typeof authClient.auth.getUser>>['data']['user'] = null

  const authHeader = request.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (bearerToken) {
    // Mobile: verify the JWT via service role (admin.auth.getUser validates signature + expiry)
    const { data, error } = await admin.auth.getUser(bearerToken)
    if (!error && data.user) user = data.user
  } else {
    // Web: cookie-based session
    const { data: { user: cookieUser }, error: authError } = await authClient.auth.getUser()
    if (!authError && cookieUser) user = cookieUser
  }

  if (!user) {
    return err('UNAUTHENTICATED', 'You must be logged in to accept an invitation.', 401)
  }

  // ── 2. Parse body ────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({})) as {
    invite_id?: string
    display_name?: string
    consent_terms?: boolean
    consent_marketing?: boolean
  }

  const { invite_id, display_name, consent_terms, consent_marketing } = body

  if (!invite_id) {
    return err('VALIDATION_ERROR', 'invite_id is required.', 400)
  }

  // PDPA: consent_terms is mandatory before account activation
  if (!consent_terms) {
    return err('VALIDATION_ERROR', 'You must agree to the Terms of Service and Privacy Policy to continue.', 400)
  }

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

  // ── 4. Update display_name + PDPA consent in profiles ───────────────────
  const trimmedName = display_name?.trim()
  const consentAt   = new Date().toISOString()

  const profileUpdate: Record<string, unknown> = {
    // PDPA: store consent timestamp and flags regardless of display_name
    consent_terms:     true,
    consent_marketing: consent_marketing === true,
    consent_terms_at:  consentAt,
  }
  if (trimmedName) profileUpdate.display_name = trimmedName

  const { error: profileError } = await admin
    .from('profiles')
    .update(profileUpdate)
    .eq('id', user.id)

  if (profileError) {
    // Non-fatal — log but continue; consent is also captured in audit_logs below
    console.warn('[invite/accept] profile update failed:', profileError.message)
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

  // ── 7. Audit log (includes PDPA consent record) ──────────────────────────
  await admin.from('audit_logs').insert({
    org_id:        invite.org_id,
    actor_user_id: user.id,
    entity_type:   'INVITE',
    entity_id:     invite.id,
    action:        'INVITE_ACCEPTED',
    metadata: {
      email:              user.email,
      org_role:           invite.org_role,
      // PDPA consent audit trail
      consent_terms:      true,
      consent_marketing:  consent_marketing === true,
      consent_terms_at:   consentAt,
    },
  })

  // ── 8. Ensure subscriptions row exists for the org (FREE/TRIALING default) ──
  // Idempotent — org may already have been provisioned by a previous member.
  await admin
    .from('subscriptions')
    .upsert(
      { entity_type: 'ORG', entity_id: invite.org_id, tier: 'FREE', status: 'TRIALING' },
      { onConflict: 'entity_type,entity_id', ignoreDuplicates: true }
    )

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
