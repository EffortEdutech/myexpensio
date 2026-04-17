/**
 * apps/admin/app/api/admin/referrals/attributions/route.ts
 *
 * In the org-as-agent model, attributions are created by admin (ADMIN_ASSIGN)
 * to link a tenant org to a partner agent. No referral link or cookie involved.
 */
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok, parsePaging } from '@/lib/billing/http'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const url = new URL(request.url)
  const { from, to, page, pageSize } = parsePaging(url)

  const status  = url.searchParams.get('status')?.trim()
  const agentId = url.searchParams.get('agent_id')?.trim()
  const orgId   = url.searchParams.get('org_id')?.trim()

  let query = db
    .from('referral_attributions')
    .select(
      `id, org_id, agent_id, source, status,
       attributed_at, locked_at, notes,
       organizations ( name ),
       agents ( agent_code, display_name )`,
      { count: 'exact' }
    )
    .range(from, to)
    .order('attributed_at', { ascending: false })

  if (status)  query = query.eq('status', status)
  if (agentId) query = query.eq('agent_id', agentId)
  if (orgId)   query = query.eq('org_id', orgId)

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  const items = (data ?? []).map((row) => {
    const org   = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations
    const agent = Array.isArray(row.agents)        ? row.agents[0]        : row.agents
    return {
      ...row,
      org_name:      (org   as { name?: string }         | null)?.name         ?? null,
      agent_code:    (agent as { agent_code?: string }   | null)?.agent_code   ?? null,
      agent_name:    (agent as { display_name?: string } | null)?.display_name ?? null,
      organizations: undefined,
      agents:        undefined,
    }
  })

  return ok({ items, page, page_size: pageSize, total: count ?? 0 })
}

export async function POST(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const body = (await request.json().catch(() => null)) as {
    org_id?: string
    agent_id?: string
    notes?: string
    commission_plan_id?: string
  } | null

  if (!body?.org_id || !body?.agent_id) {
    return err('VALIDATION_ERROR', 'org_id and agent_id are required.', 400)
  }

  const { data, error } = await db
    .from('referral_attributions')
    .insert({
      org_id:             body.org_id,
      agent_id:           body.agent_id,
      commission_plan_id: body.commission_plan_id ?? null,
      source:             'ADMIN_ASSIGN',
      status:             'ACTIVE',
      attributed_at:      new Date().toISOString(),
      locked_at:          new Date().toISOString(),
      notes:              body.notes?.trim() ?? null,
    })
    .select('id, org_id, agent_id, source, status, attributed_at')
    .single()

  if (error) {
    return err('SERVER_ERROR', error.message, error.code === '23505' ? 409 : 500)
  }

  return ok({ attribution: data }, 201)
}

export async function PATCH(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const body = (await request.json().catch(() => null)) as {
    id?: string
    status?: string
    notes?: string
  } | null

  if (!body?.id || !body?.status) {
    return err('VALIDATION_ERROR', 'id and status are required.', 400)
  }

  const allowed = ['ACTIVE', 'REJECTED', 'REVERSED']
  if (!allowed.includes(body.status)) {
    return err('VALIDATION_ERROR', `status must be one of: ${allowed.join(', ')}`, 400)
  }

  const patch: Record<string, unknown> = {
    status:     body.status,
    notes:      body.notes ?? null,
    updated_at: new Date().toISOString(),
  }
  if (body.status === 'REJECTED') patch.rejected_at = new Date().toISOString()
  if (body.status === 'REVERSED') patch.reversed_at = new Date().toISOString()

  const { data, error } = await db
    .from('referral_attributions')
    .update(patch)
    .eq('id', body.id)
    .select('id, status')
    .single()

  if (error) return err('SERVER_ERROR', error.message, 500)
  return ok({ attribution: data })
}
