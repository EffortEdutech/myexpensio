/**
 * apps/admin/app/api/admin/billing/commission-plans/route.ts
 *
 * Returns commission plans for use in the Agents create/edit form.
 */
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'

export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('commission_plans')
    .select('id, code, name, status, rules')
    .order('code', { ascending: true })

  if (error) return err('SERVER_ERROR', error.message, 500)

  return ok({ items: data ?? [] })
}
