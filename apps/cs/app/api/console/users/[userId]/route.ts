// apps/cs/app/api/console/users/[userId]/route.ts
//
// GET   — get single user with all memberships
// PATCH — update display_name and department

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
      id, email, display_name, role, department, subscription_plan, created_at,
      org_members (
        org_id, org_role, status,
        organizations ( id, name, workspace_type )
      )
    `)
    .eq('id', userId)
    .single()

  if (error || !profile) return err('NOT_FOUND', 'User not found', 404)

  const memberships = (profile.org_members ?? []).map((m: Record<string, unknown>) => ({
    org_id:       m.org_id,
    org_role:     m.org_role,
    status:       m.status,
    organization: Array.isArray(m.organizations)
      ? (m.organizations as Record<string, unknown>[])[0] ?? null
      : m.organizations,
  }))

  return NextResponse.json({ user: { ...profile, org_members: undefined, memberships } })
}

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { userId } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { display_name, department, subscription_plan } = body

  const updatePayload: Record<string, unknown> = {}
  if (display_name !== undefined) updatePayload.display_name = display_name?.trim() || null
  if (department   !== undefined) updatePayload.department   = department?.trim() || null

  // subscription_plan can only be changed by SUPER_ADMIN
  if (subscription_plan !== undefined) {
    if (ctx.role !== 'SUPER_ADMIN') {
      return err('FORBIDDEN', 'SUPER_ADMIN only can change subscription plan', 403)
    }
    const VALID_PLANS = ['FREE', 'STANDARD', 'PREMIUM']
    if (!VALID_PLANS.includes(subscription_plan)) {
      return err('VALIDATION_ERROR', `subscription_plan must be one of: ${VALID_PLANS.join(', ')}`, 400)
    }
    updatePayload.subscription_plan = subscription_plan
  }

  if (Object.keys(updatePayload).length === 0) {
    return err('VALIDATION_ERROR', 'Nothing to update', 400)
  }

  const db = createServiceRoleClient()

  const { error } = await db
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)

  if (error) return err('SERVER_ERROR', error.message, 500)

  const action = subscription_plan !== undefined
    ? 'USER_SUBSCRIPTION_PLAN_CHANGED'
    : 'USER_PROFILE_UPDATED'

  await db.from('audit_logs').insert({
    org_id:        null,
    actor_user_id: ctx.userId,
    entity_type:   'profile',
    entity_id:     userId,
    action,
    metadata:      {
      changes:    updatePayload,
      updated_by: ctx.email,
      ...(subscription_plan !== undefined ? { note: body.note ?? 'Manual override via Console' } : {}),
    },
  })

  return NextResponse.json({ success: true })
}
