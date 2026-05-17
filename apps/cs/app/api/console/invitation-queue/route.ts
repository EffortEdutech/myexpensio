// apps/console/app/api/console/invitation-queue/route.ts
//
// GET /api/console/invitation-queue
// All invitation_requests across all workspaces, ordered by created_at.
// Console staff only. No org scoping.

import { NextResponse } from 'next/server'
import { requireConsoleAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

type InviteRow = {
  id: string
  status: string
  [key: string]: unknown
}

type AuditRow = {
  entity_id: string
  metadata: { user_id?: string } | null
}

type AuthAppMetadata = {
  must_change_password?: boolean
}

async function addOnboardingStatus(db: ReturnType<typeof createServiceRoleClient>, rows: InviteRow[]) {
  const base = rows.map((row) => ({
    ...row,
    onboarding_status:
      row.status === 'EXECUTED' ? 'AWAITING_FIRST_LOGIN' :
      row.status === 'APPROVED' ? 'APPROVED_PENDING_SEND' :
      row.status,
  }))

  const executedIds = base
    .filter((row) => row.status === 'EXECUTED')
    .map((row) => row.id)

  if (executedIds.length === 0) return base

  const { data: auditRows } = await db
    .from('audit_logs')
    .select('entity_id, metadata')
    .eq('entity_type', 'invitation_request')
    .in('entity_id', executedIds)
    .in('action', ['INVITATION_REQUEST_EXECUTED', 'INVITATION_REQUEST_AUTO_EXECUTED'])
    .order('created_at', { ascending: false })

  const userIdByRequest = new Map<string, string>()
  for (const row of (auditRows ?? []) as AuditRow[]) {
    const userId = row.metadata?.user_id
    if (userId && !userIdByRequest.has(row.entity_id)) {
      userIdByRequest.set(row.entity_id, userId)
    }
  }

  const userIds = [...new Set([...userIdByRequest.values()])]
  if (userIds.length === 0) return base

  const { data: profiles } = await db
    .from('profiles')
    .select('id, consent_terms, consent_terms_at')
    .in('id', userIds)

  const consentByUser = new Map(
    (profiles ?? []).map((profile) => [
      profile.id as string,
      profile.consent_terms === true || Boolean(profile.consent_terms_at),
    ]),
  )

  const authByUser = new Map<string, AuthAppMetadata>()
  await Promise.all(userIds.map(async (userId) => {
    const { data } = await db.auth.admin.getUserById(userId)
    authByUser.set(userId, (data.user?.app_metadata ?? {}) as AuthAppMetadata)
  }))

  return base.map((row) => {
    if (row.status !== 'EXECUTED') return row

    const userId = userIdByRequest.get(row.id)
    const mustChangePassword = userId ? authByUser.get(userId)?.must_change_password === true : true
    const hasConsent = userId ? consentByUser.get(userId) === true : false

    return {
      ...row,
      invitation_user_id: userId ?? null,
      onboarding_status: !mustChangePassword && hasConsent
        ? 'COMPLETED'
        : 'AWAITING_FIRST_LOGIN',
    }
  })
}

export async function GET(req: Request) {
  const ctx = await requireConsoleAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')?.trim() || null
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 50)))
  const from = (page - 1) * pageSize

  const db = createServiceRoleClient()

  let query = db
    .from('invitation_requests')
    .select(
      `
      id,
      workspace_id,
      workspace_type,
      requested_by_user_id,
      requested_email,
      requested_role,
      status,
      internal_assigned_to,
      rejection_reason,
      notes,
      created_at,
      approved_at,
      executed_at,
      organizations:workspace_id (
        id,
        name,
        workspace_type
      ),
      requester:requested_by_user_id (
        id,
        email,
        display_name
      ),
      assignee:internal_assigned_to (
        id,
        email,
        display_name
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[console/invitation-queue] GET error:', error)
    return err('SERVER_ERROR', 'Failed to fetch invitation requests', 500)
  }

  const normalized = (data ?? []).map((row) => ({
    ...row,
    organizations: Array.isArray(row.organizations) ? row.organizations[0] ?? null : row.organizations,
    requester:     Array.isArray(row.requester)     ? row.requester[0]     ?? null : row.requester,
    assignee:      Array.isArray(row.assignee)      ? row.assignee[0]      ?? null : row.assignee,
  }))

  const requests = await addOnboardingStatus(db, normalized)

  return NextResponse.json({ requests, total: count ?? 0, page, pageSize })
}
