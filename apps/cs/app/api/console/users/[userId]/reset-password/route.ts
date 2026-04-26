// apps/cs/app/api/console/users/[userId]/reset-password/route.ts
// POST — trigger password reset email for a user via Supabase Admin API

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ userId: string }> }

export async function POST(_req: Request, { params }: Params) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 })

  const { userId } = await params
  const db = createServiceRoleClient()

  // Get user email
  const { data: profile } = await db
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (!profile?.email) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User email not found' } }, { status: 404 })
  }

  const workspaceAppUrl = process.env.NEXT_PUBLIC_WORKSPACE_APP_URL ?? 'http://localhost:3101'

  const { error } = await db.auth.admin.generateLink({
    type:       'recovery',
    email:      profile.email,
    options:    { redirectTo: `${workspaceAppUrl}/auth/callback` },
  })

  if (error) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: error.message } }, { status: 500 })
  }

  await db.from('audit_logs').insert({
    org_id:        null,
    actor_user_id: ctx.userId,
    entity_type:   'profile',
    entity_id:     userId,
    action:        'PASSWORD_RESET_TRIGGERED',
    metadata:      { email: profile.email, triggered_by: ctx.email },
  })

  return NextResponse.json({ success: true })
}
