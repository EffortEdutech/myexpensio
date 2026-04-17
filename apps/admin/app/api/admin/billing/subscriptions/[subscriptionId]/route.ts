import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'
import { syncSubscriptionStatusSnapshot } from '@/lib/billing/sync'

type Params = { params: Promise<{ subscriptionId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const { subscriptionId } = await params
  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('billing_subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .maybeSingle()

  if (error) return err('SERVER_ERROR', error.message, 500)
  if (!data) return err('NOT_FOUND', 'Subscription not found.', 404)

  return ok({ subscription: data })
}

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const { subscriptionId } = await params
  const db = createServiceRoleClient()

  const body = (await request.json().catch(() => null)) as {
    status?: string
    cancel_at_period_end?: boolean
    current_period_start?: string | null
    current_period_end?: string | null
    canceled_at?: string | null
    ended_at?: string | null
    metadata?: Record<string, unknown>
  } | null

  if (!body) return err('VALIDATION_ERROR', 'JSON body required.', 400)

  const { data: existing, error: existingError } = await db
    .from('billing_subscriptions')
    .select('id, org_id, metadata')
    .eq('id', subscriptionId)
    .maybeSingle()

  if (existingError) return err('SERVER_ERROR', existingError.message, 500)
  if (!existing) return err('NOT_FOUND', 'Subscription not found.', 404)

  const patch = {
    ...(body.status ? { status: body.status.toUpperCase() } : {}),
    ...(body.cancel_at_period_end !== undefined ? { cancel_at_period_end: body.cancel_at_period_end } : {}),
    ...(body.current_period_start !== undefined ? { current_period_start: body.current_period_start } : {}),
    ...(body.current_period_end !== undefined ? { current_period_end: body.current_period_end } : {}),
    ...(body.canceled_at !== undefined ? { canceled_at: body.canceled_at } : {}),
    ...(body.ended_at !== undefined ? { ended_at: body.ended_at } : {}),
    ...(body.metadata
      ? {
          metadata: {
            ...((existing.metadata as Record<string, unknown> | null) ?? {}),
            ...body.metadata,
            admin_updated_by: ctx.userId,
          },
        }
      : {}),
  }

  const { data: updated, error: updateError } = await db
    .from('billing_subscriptions')
    .update(patch)
    .eq('id', subscriptionId)
    .select('*')
    .single()

  if (updateError) return err('SERVER_ERROR', updateError.message, 500)

  await syncSubscriptionStatusSnapshot(db, existing.org_id)

  return ok({ subscription: updated })
}
