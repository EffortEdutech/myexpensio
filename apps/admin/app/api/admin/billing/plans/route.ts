/**
 * apps/admin/app/api/admin/billing/plans/route.ts
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

  const { data, error, count } = await db
    .from('billing_plans')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .range(from, to)

  if (error) return err('SERVER_ERROR', error.message, 500)
  return ok({ items: data ?? [], page, page_size: pageSize, total: count ?? 0 })
}

export async function PATCH(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const body = (await request.json().catch(() => null)) as { id?: string; is_active?: boolean } | null
  if (!body?.id) return err('VALIDATION_ERROR', 'id required.', 400)

  const { data, error } = await db
    .from('billing_plans')
    .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
    .eq('id', body.id)
    .select('id, code, name, tier, is_active')
    .single()

  if (error) return err('SERVER_ERROR', error.message, 500)
  return ok({ plan: data })
}
