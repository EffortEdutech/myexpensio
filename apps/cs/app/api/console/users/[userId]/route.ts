// apps/cs/app/api/console/users/[userId]/route.ts
//
// GET   — get single user with all memberships + current subscription tier
// PATCH — update display_name, department, or subscription tier (SUPER_ADMIN)
//
// Subscription tier is stored in the unified `subscriptions` table
// (entity_type='USER', entity_id=userId) — NOT in profiles.subscription_plan.

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ userId: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(_req: Request, { params }: Params) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { userId } = await params
  const db = createServiceRoleClient()

  const { data: profile, error } = await db
    .from('profiles')
    .select(`
      id, email, display_name, role, department, created_at,
      org_members (
        org_id, org_role, status,
        organizations ( id, name, workspace_type )
      )
    `)
    .eq('id', userId)
    .single()

  if (error || !profile) return err('NOT_FOUND', 'User not found', 404)

  // Fetch subscription from unified table
  const { data: sub } = await db
    .from('subscriptions')
    .select('tier, status, trial_expires_at')
    .eq('entity_type', 'USER')
    .eq('entity_id', userId)
    .maybeSingle()

  const memberships = (profile.org_members ?? []).map((m: Record<string, unknown>) => ({
    org_id:       m.org_id,
    org_role:     m.org_role,
    status:       m.status,
    organization: Array.isArray(m.organizations)
      ? (m.organizations as Record<string, unknown>[])[0] ?? null
      : m.organizations,
  }))

  return NextResponse.json({
    user: {
      ...profile,
      org_members: undefined,
      memberships,
      tier:       sub?.tier       ?? 'FREE',
      sub_status: sub?.status     ?? 'TRIALING',
    },
  })
}

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { userId } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { display_name, department, tier } = body

  const db = createServiceRoleClient()

  // ── Profile fields (display_name, department) ─────────────────────────────
  const profilePayload: Record<string, unknown> = {}
  if (display_name !== undefined) profilePayload.display_name = display_name?.trim() || null
  if (department   !== undefined) profilePayload.department   = department?.trim() || null

  if (Object.keys(profilePayload).length > 0) {
    const { error } = await db
      .from('profiles')
      .update(profilePayload)
      .eq('id', userId)
    if (error) return err('SERVER_ERROR', error.message, 500)
  }

  // ── Subscription tier — SUPER_ADMIN only ─────────────────────────────────
  if (tier !== undefined) {
    if (ctx.role !== 'SUPER_ADMIN') {
      return err('FORBIDDEN', 'SUPER_ADMIN only can change subscription tier', 403)
    }
    const VALID_TIERS = ['FREE', 'PRO', 'PREMIUM']
    if (!VALID_TIERS.includes(tier)) {
      return err('VALIDATION_ERROR', `tier must be one of: ${VALID_TIERS.join(', ')}`, 400)
    }

    // Manual override: set status to ACTIVE for paid tiers, EXPIRED for FREE
    const newStatus = tier === 'FREE' ? 'EXPIRED' : 'ACTIVE'

    const { error: subError } = await db
      .from('subscriptions')
      .upsert(
        {
          entity_type: 'USER',
          entity_id:   userId,
          tier,
          status:      newStatus,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: 'entity_type,entity_id', ignoreDuplicates: false },
      )

    if (subError) return err('SERVER_ERROR', subError.message, 500)

    await db.from('audit_logs').insert({
      org_id:        null,
      actor_user_id: ctx.userId,
      entity_type:   'profile',
      entity_id:     userId,
      action:        'USER_SUBSCRIPTION_TIER_CHANGED',
      metadata:      {
        new_tier:   tier,
        new_status: newStatus,
        note:       body.note ?? 'Manual override via Console',
        changed_by: ctx.email,
      },
    })
  }

  // ── Profile audit log (if profile fields changed) ─────────────────────────
  if (Object.keys(profilePayload).length > 0) {
    await db.from('audit_logs').insert({
      org_id:        null,
      actor_user_id: ctx.userId,
      entity_type:   'profile',
      entity_id:     userId,
      action:        'USER_PROFILE_UPDATED',
      metadata:      { changes: profilePayload, updated_by: ctx.email },
    })
  }

  if (Object.keys(profilePayload).length === 0 && tier === undefined) {
    return err('VALIDATION_ERROR', 'Nothing to update', 400)
  }

  return NextResponse.json({ success: true })
}
