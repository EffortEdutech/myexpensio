// apps/user/app/api/auth/complete-first-login/route.ts
//
// POST /api/auth/complete-first-login
//
// Body: { consent_terms?: boolean, consent_marketing?: boolean }
//
// Operations (all via service role):
//   1. Validate session — user must be authenticated
//   2. Validate consent — consent_terms must be true (PDPA requirement)
//   3. Clear must_change_password flag from app_metadata
//   4. Write consent to profiles table (consent_terms, consent_marketing, consent_terms_at)
//   5. Write PDPA_CONSENT_RECORDED entry to audit_logs

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return err('UNAUTHENTICATED', 'Login required.', 401)
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({})) as {
    consent_terms?:     boolean
    consent_marketing?: boolean
  }

  const { consent_terms, consent_marketing } = body

  // PDPA: consent_terms is mandatory before account activation
  if (!consent_terms) {
    return err(
      'VALIDATION_ERROR',
      'You must agree to the Terms of Service and Privacy Policy to continue.',
      400
    )
  }

  try {
    const service = createServiceRoleClient()

    // ── 1. Clear must_change_password flag ───────────────────────────────────
    const nextAppMetadata = {
      ...(user.app_metadata ?? {}),
      must_change_password: false,
    }

    const { error: metaError } = await service.auth.admin.updateUserById(user.id, {
      app_metadata: nextAppMetadata,
    })

    if (metaError) {
      return err('SERVER_ERROR', `Failed to complete first login: ${metaError.message}`, 500)
    }

    // ── 2. Store PDPA consent in profiles ────────────────────────────────────
    const consentAt = new Date().toISOString()

    const { error: profileError } = await service
      .from('profiles')
      .update({
        consent_terms:     true,
        consent_marketing: consent_marketing === true,
        consent_terms_at:  consentAt,
      })
      .eq('id', user.id)

    if (profileError) {
      // Non-fatal — consent is also captured in audit_logs below
      console.warn('[complete-first-login] profile consent update failed:', profileError.message)
    }

    // ── 3. Audit log — PDPA consent record ───────────────────────────────────
    // Fetch org membership so we can record org_id on the audit entry.
    const { data: membership } = await service
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    await service.from('audit_logs').insert({
      org_id:        membership?.org_id ?? null,
      actor_user_id: user.id,
      entity_type:   'USER',
      entity_id:     user.id,
      action:        'PDPA_CONSENT_RECORDED',
      metadata: {
        email:              user.email,
        consent_terms:      true,
        consent_marketing:  consent_marketing === true,
        consent_terms_at:   consentAt,
        flow:               'change_password_first_login',
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected server error.'
    return err('SERVER_ERROR', message, 500)
  }
}