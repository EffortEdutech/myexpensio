/**
 * apps/admin/app/api/admin/audit/route.ts
 */
import { requireAdminAuth } from '@/lib/auth'
import { err, ok, parsePaging } from '@/lib/http'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db  = createServiceRoleClient()
  const url = new URL(request.url)
  const { from, to, page, pageSize } = parsePaging(url)

  const entityType = url.searchParams.get('entity_type')?.trim()
  const actorId    = url.searchParams.get('actor_user_id')?.trim()

  let query = db
    .from('audit_logs')
    .select(
      `id, org_id, actor_user_id, entity_type, entity_id,
       action, metadata, created_at,
       profiles ( display_name, email )`,
      { count: 'exact' }
    )
    .range(from, to)
    .order('created_at', { ascending: false })

  if (entityType) query = query.eq('entity_type', entityType)
  if (actorId)    query = query.eq('actor_user_id', actorId)

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  const items = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles)
      ? (row.profiles[0] ?? null)
      : (row.profiles ?? null)
    return { ...row, profiles: profile }
  })

  return ok({ items, page, page_size: pageSize, total: count ?? 0 })
}
