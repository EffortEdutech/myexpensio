// apps/console/app/api/console/users/route.ts
// GET   /api/console/users — all platform users, searchable
// PATCH /api/console/users — update platform role (SUPER_ADMIN only)

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const page     = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 25)))
  const from     = (page - 1) * pageSize
  const search   = searchParams.get('search')?.trim() || null
  const role     = searchParams.get('role')?.trim() || null

  const db = createServiceRoleClient()

  let query = db
    .from('profiles')
    .select(
      `
      id, email, display_name, role, department, created_at,
      org_members (
        org_id, org_role, status,
        organizations ( id, name, workspace_type )
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (search) {
    query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`)
  }
  if (role) query = query.eq('role', role)

  const { data, error, count } = await query

  if (error) {
    console.error('[console/users] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch users', 500)
  }

  const users = (data ?? []).map((row) => {
    const memberships = (row.org_members ?? []).map((m: Record<string, unknown>) => ({
      org_id:         m.org_id,
      org_role:       m.org_role,
      status:         m.status,
      organization:   Array.isArray(m.organizations)
        ? m.organizations[0] ?? null
        : m.organizations,
    }))
    return { ...row, org_members: undefined, memberships }
  })

  return NextResponse.json({ users, total: count ?? 0, page, pageSize })
}

export async function PATCH(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)
  if (ctx.role !== 'SUPER_ADMIN') return err('FORBIDDEN', 'SUPER_ADMIN only', 403)

  const body = await req.json().catch(() => null)
  if (!body?.user_id || !body?.role) {
    return err('VALIDATION_ERROR', 'user_id and role required', 400)
  }

  const VALID_ROLES = ['USER', 'SUPPORT', 'SUPER_ADMIN']
  if (!VALID_ROLES.includes(body.role)) {
    return err('VALIDATION_ERROR', `role must be one of: ${VALID_ROLES.join(', ')}`, 400)
  }

  // Cannot demote self
  if (body.user_id === ctx.userId && body.role !== 'SUPER_ADMIN') {
    return err('CONFLICT', 'You cannot change your own role', 409)
  }

  const db = createServiceRoleClient()

  const { error } = await db
    .from('profiles')
    .update({ role: body.role })
    .eq('id', body.user_id)

  if (error) return err('SERVER_ERROR', error.message, 500)

  await db.from('audit_logs').insert({
    org_id:        null,
    actor_user_id: ctx.userId,
    entity_type:   'profile',
    entity_id:     body.user_id,
    action:        'USER_ROLE_CHANGED',
    metadata:      { new_role: body.role },
  })

  return NextResponse.json({ success: true })
}
