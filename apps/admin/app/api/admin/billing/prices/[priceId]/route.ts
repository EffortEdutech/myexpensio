import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'

type Params = { params: Promise<{ priceId: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const { priceId } = await params
  const db = createServiceRoleClient()

  const body = (await req.json().catch(() => null)) as {
    provider_product_id?: string | null
    provider_price_id?: string | null
    amount?: number
    is_default?: boolean
    is_active?: boolean
  } | null

  if (!body) return err('VALIDATION_ERROR', 'JSON body required.', 400)

  const { data: existing } = await db
    .from('billing_prices')
    .select('id, plan_id, provider')
    .eq('id', priceId)
    .maybeSingle()

  if (!existing) return err('NOT_FOUND', 'Price mapping not found.', 404)

  if (body.is_default === true) {
    await db
      .from('billing_prices')
      .update({ is_default: false })
      .eq('plan_id', existing.plan_id)
      .eq('provider', existing.provider)
      .neq('id', priceId)
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.provider_product_id !== undefined) patch.provider_product_id = body.provider_product_id?.trim() ?? null
  if (body.provider_price_id !== undefined) patch.provider_price_id = body.provider_price_id?.trim() ?? null
  if (body.amount !== undefined) patch.amount = Number(body.amount)
  if (body.is_default !== undefined) patch.is_default = body.is_default
  if (body.is_active !== undefined) patch.is_active = body.is_active

  const { data: updated, error } = await db
    .from('billing_prices')
    .update(patch)
    .eq('id', priceId)
    .select('id, plan_id, provider, provider_price_id, currency, amount, interval, is_active, is_default, updated_at')
    .single()

  if (error) return err('SERVER_ERROR', error.message, 500)
  return ok({ price: updated })
}

export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const { priceId } = await params
  const db = createServiceRoleClient()

  const { error } = await db
    .from('billing_prices')
    .update({ is_active: false, is_default: false, updated_at: new Date().toISOString() })
    .eq('id', priceId)

  if (error) return err('SERVER_ERROR', error.message, 500)
  return ok({ deleted: true, priceId })
}