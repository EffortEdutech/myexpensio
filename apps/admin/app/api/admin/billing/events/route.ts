/**
 * apps/admin/app/api/admin/billing/events/route.ts
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

  const provider = url.searchParams.get('provider')?.trim()
  const status   = url.searchParams.get('status')?.trim()
  const orgId    = url.searchParams.get('org_id')?.trim()
  const dateFrom = url.searchParams.get('date_from')?.trim()

  let query = db
    .from('billing_events')
    .select(
      `id, provider, provider_event_id, event_type, org_id,
       processing_status, attempt_count, last_error,
       received_at, processed_at,
       organizations ( name )`,
      { count: 'exact' }
    )
    .range(from, to)
    .order('received_at', { ascending: false })

  if (provider) query = query.eq('provider', provider)
  if (status)   query = query.eq('processing_status', status)
  if (orgId)    query = query.eq('org_id', orgId)
  if (dateFrom) query = query.gte('received_at', dateFrom)

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  const items = (data ?? []).map((row) => {
    const org = Array.isArray(row.organizations)
      ? row.organizations[0]
      : row.organizations
    return { ...row, org_name: (org as { name?: string } | null)?.name ?? null, organizations: undefined }
  })

  return ok({ items, page, page_size: pageSize, total: count ?? 0 })
}
