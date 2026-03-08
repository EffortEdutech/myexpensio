// apps/user/app/api/invite/validate/route.ts
// GET /api/invite/validate?invite_id=<uuid>
//
// Returns sanitised invite details for the Accept Invite page to render.
// Uses the service role to bypass RLS because the user has a session
// but is not yet an org member (so the standard RLS policy would block reads).
//
// Response shape (200):
//   { invite: { id, email, org_role, org_id, org_name, expires_at } }
//
// Error codes: NOT_FOUND | INVITE_ALREADY_USED | INVITE_EXPIRED | VALIDATION_ERROR

import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

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

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const invite_id = searchParams.get('invite_id')

  if (!invite_id) {
    return err('VALIDATION_ERROR', 'invite_id is required.', 400)
  }

  const admin = serviceClient()

  const { data: invite, error } = await admin
    .from('invitations')
    .select(
      `id, email, org_role, status, expires_at,
       organizations ( id, name )`
    )
    .eq('id', invite_id)
    .single()

  if (error || !invite) {
    return err('NOT_FOUND', 'Invitation not found. Please use the link from your invitation email.', 404)
  }

  if (invite.status === 'ACCEPTED') {
    return err('INVITE_ALREADY_USED', 'This invitation has already been accepted. Please log in.', 409)
  }

  if (invite.status === 'REVOKED') {
    return err('INVITE_ALREADY_USED', 'This invitation was cancelled. Please contact your admin.', 409)
  }

  if (invite.status !== 'PENDING') {
    return err('INVITE_ALREADY_USED', 'This invitation is no longer valid.', 409)
  }

  if (new Date(invite.expires_at) < new Date()) {
    return err('INVITE_EXPIRED', 'This invitation has expired. Please ask your admin to send a new one.', 410)
  }

  const orgRaw = invite.organizations as { id: string; name: string }[] | { id: string; name: string } | null
  const org = Array.isArray(orgRaw) ? (orgRaw[0] ?? null) : orgRaw

  return NextResponse.json({
    invite: {
      id: invite.id,
      email: invite.email,
      org_role: invite.org_role,
      org_id: org?.id ?? null,
      org_name: org?.name ?? 'Unknown Organisation',
      expires_at: invite.expires_at,
    },
  })
}
