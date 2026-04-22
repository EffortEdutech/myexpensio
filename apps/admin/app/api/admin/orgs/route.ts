/**
 * apps/admin/app/api/admin/orgs/route.ts
 *
 * Returns a flat list of all organisations for use in dropdowns/pickers.
 */
import { requireAdminAuth } from '@/lib/auth'
import { err, ok } from '@/lib/http'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const url = new URL(request.url)
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get('page_size') ?? 100)))
  const q = url.searchParams.get('q')?.trim()

  let query = db
    .from('organizations')
    .select('id, name, status, created_at', { count: 'exact' })
    .order('name', { ascending: true })
    .limit(pageSize)

  if (q) query = query.ilike('name', `%${q}%`)

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  return ok({ data: data ?? [], total: count ?? 0 })
}
