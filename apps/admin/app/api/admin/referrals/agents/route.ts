import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok, parsePaging } from '@/lib/billing/http'

function normalizeCode(input: string | undefined) {
  return input?.trim().toUpperCase() ?? ''
}

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const url = new URL(request.url)
  const { page, pageSize, from, to } = parsePaging(url)

  const status = url.searchParams.get('status')?.trim()
  const q = url.searchParams.get('q')?.trim()

  let query = db
    .from('agents')
    .select('id, user_id, agent_code, display_name, email, phone, status, parent_agent_id, commission_plan_id, joined_at, approved_at, payout_method, payout_details, metadata', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (q) query = query.or(`agent_code.ilike.%${q}%,display_name.ilike.%${q}%,email.ilike.%${q}%`)

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  return ok({
    items: data ?? [],
    page,
    page_size: pageSize,
    total: count ?? 0,
  })
}

export async function POST(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const body = (await request.json().catch(() => null)) as {
    user_id?: string | null
    agent_code?: string
    display_name?: string
    email?: string | null
    phone?: string | null
    status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
    parent_agent_id?: string | null
    commission_plan_code?: string | null
    payout_method?: 'BANK_TRANSFER' | 'TOYYIBPAY' | 'MANUAL' | null
    payout_details?: Record<string, unknown>
    metadata?: Record<string, unknown>
  } | null

  const agentCode = normalizeCode(body?.agent_code)
  if (!body?.display_name || !agentCode) {
    return err('VALIDATION_ERROR', 'display_name and agent_code are required.', 400)
  }

  let commissionPlanId: string | null = null
  const commissionPlanCode = body.commission_plan_code ?? 'DEFAULT_DIRECT_15'
  const { data: commissionPlan } = await db
    .from('commission_plans')
    .select('id')
    .eq('code', commissionPlanCode)
    .maybeSingle()

  commissionPlanId = commissionPlan?.id ?? null

  const { data, error } = await db
    .from('agents')
    .insert({
      user_id: body.user_id ?? null,
      agent_code: agentCode,
      display_name: body.display_name.trim(),
      email: body.email?.trim().toLowerCase() ?? null,
      phone: body.phone?.trim() ?? null,
      status: body.status ?? 'ACTIVE',
      parent_agent_id: body.parent_agent_id ?? null,
      commission_plan_id: commissionPlanId,
      approved_by_user_id: ctx.userId,
      approved_at: new Date().toISOString(),
      payout_method: body.payout_method ?? null,
      payout_details: body.payout_details ?? {},
      metadata: body.metadata ?? {},
    })
    .select('id, agent_code, display_name, email, status, commission_plan_id')
    .single()

  if (error) {
    return err('SERVER_ERROR', error.message, error.code === '23505' ? 409 : 500)
  }

  return ok({ agent: data }, 201)
}
