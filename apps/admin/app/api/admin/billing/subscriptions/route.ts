import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok, parsePaging } from '@/lib/billing/http'
import { syncSubscriptionStatusSnapshot } from '@/lib/billing/sync'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const url = new URL(request.url)
  const { page, pageSize, from, to } = parsePaging(url)

  const orgId = url.searchParams.get('org_id')?.trim()
  const status = url.searchParams.get('status')?.trim()
  const provider = url.searchParams.get('provider')?.trim()

  let query = db
    .from('billing_subscriptions')
    .select('id, org_id, plan_id, provider, provider_subscription_id, provider_price_id, status, currency, amount, interval, started_at, current_period_start, current_period_end, cancel_at_period_end, canceled_at, ended_at, created_at, updated_at, metadata', { count: 'exact' })
    .range(from, to)
    .order('updated_at', { ascending: false })

  if (orgId) query = query.eq('org_id', orgId)
  if (status) query = query.eq('status', status)
  if (provider) query = query.eq('provider', provider)

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
    org_id?: string
    plan_code?: string
    provider?: 'MANUAL' | 'STRIPE' | 'TOYYIBPAY'
    status?: string
    amount?: number
    currency?: string
    interval?: 'MONTH' | 'YEAR' | 'LIFETIME' | null
    current_period_start?: string | null
    current_period_end?: string | null
    provider_subscription_id?: string
    metadata?: Record<string, unknown>
  } | null

  if (!body?.org_id || !body.plan_code) {
    return err('VALIDATION_ERROR', 'org_id and plan_code are required.', 400)
  }

  const provider = body.provider ?? 'MANUAL'
  const status = (body.status ?? 'ACTIVE').toUpperCase()

  const { data: plan, error: planError } = await db
    .from('billing_plans')
    .select('id, code, interval')
    .eq('code', body.plan_code.toUpperCase())
    .maybeSingle()

  if (planError) return err('SERVER_ERROR', planError.message, 500)
  if (!plan) return err('NOT_FOUND', 'Billing plan not found.', 404)

  const providerSubscriptionId =
    body.provider_subscription_id?.trim() ||
    `manual:${body.org_id}:${Date.now()}`

  const { data: inserted, error: insertError } = await db
    .from('billing_subscriptions')
    .insert({
      org_id: body.org_id,
      plan_id: plan.id,
      provider,
      provider_subscription_id: providerSubscriptionId,
      status,
      currency: body.currency ?? 'MYR',
      amount: Number(body.amount ?? 0),
      interval: body.interval ?? plan.interval ?? null,
      started_at: body.current_period_start ?? new Date().toISOString(),
      current_period_start: body.current_period_start ?? new Date().toISOString(),
      current_period_end: body.current_period_end ?? null,
      metadata: body.metadata ?? {
        source: 'ADMIN_MANUAL_CREATE',
        actor_user_id: ctx.userId,
      },
    })
    .select('id, org_id, provider, provider_subscription_id, status')
    .single()

  if (insertError) {
    return err('SERVER_ERROR', insertError.message, insertError.code === '23505' ? 409 : 500)
  }

  await syncSubscriptionStatusSnapshot(db, body.org_id)

  return ok({ subscription: inserted }, 201)
}
