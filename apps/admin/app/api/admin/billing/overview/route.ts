import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok, parsePaging } from '@/lib/billing/http'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const url = new URL(request.url)
  const { page, pageSize, from, to } = parsePaging(url)

  const q = url.searchParams.get('q')?.trim()
  const tier = url.searchParams.get('tier')?.trim()
  const billingStatus = url.searchParams.get('billing_status')?.trim()
  const orgId = url.searchParams.get('org_id')?.trim()

  let query = db
    .from('v_org_billing_snapshot')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('org_name', { ascending: true })

  if (q) query = query.ilike('org_name', `%${q}%`)
  if (tier) query = query.eq('tier', tier)
  if (billingStatus) query = query.eq('billing_status', billingStatus)
  if (orgId) query = query.eq('org_id', orgId)

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  return ok({
    items: data ?? [],
    page,
    page_size: pageSize,
    total: count ?? 0,
  })
}
