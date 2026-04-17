/**
 * apps/admin/app/api/admin/billing/invoices/route.ts
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

  const status   = url.searchParams.get('status')?.trim()
  const provider = url.searchParams.get('provider')?.trim()
  const orgId    = url.searchParams.get('org_id')?.trim()
  const dateFrom = url.searchParams.get('date_from')?.trim()
  const dateTo   = url.searchParams.get('date_to')?.trim()

  let query = db
    .from('billing_invoices')
    .select(
      `id, org_id, provider, invoice_number, status,
       amount_due, amount_paid, currency,
       issued_at, paid_at, created_at,
       invoice_url, invoice_pdf_url,
       organizations ( name )`,
      { count: 'exact' }
    )
    .range(from, to)
    .order('created_at', { ascending: false })

  if (status)   query = query.eq('status', status)
  if (provider) query = query.eq('provider', provider)
  if (orgId)    query = query.eq('org_id', orgId)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo)   query = query.lte('created_at', dateTo)

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
