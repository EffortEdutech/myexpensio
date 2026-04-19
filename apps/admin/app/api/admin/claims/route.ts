/**
 * apps/admin/app/api/admin/claims/route.ts
 * Already exists — this is the correct version with profile join.
 * Check if the existing file has this query; if not, replace with this.
 */
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok, parsePaging } from '@/lib/billing/http'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db  = createServiceRoleClient()
  const url = new URL(request.url)
  const { from, to, page, pageSize } = parsePaging(url)

  const status = url.searchParams.get('status')?.trim()
  const q      = url.searchParams.get('q')?.trim()

  let query = db
    .from('claims')
    .select(
      `id, org_id, user_id, status, title, total_amount, currency,
       period_start, period_end, submitted_at, created_at,
       profiles ( display_name, email )`,
      { count: 'exact' }
    )
    .range(from, to)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (q) {
    // Search by title — user search requires a separate join approach
    query = query.ilike('title', `%${q}%`)
  }

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  const items = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles)
      ? (row.profiles[0] ?? null)
      : (row.profiles ?? null)
    return {
      ...row,
      profiles: profile,
    }
  })

  return ok({ items, page, page_size: pageSize, total: count ?? 0 })
}
