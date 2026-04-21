/**
 * apps/admin/app/api/admin/partners/[orgId]/route.ts
 *
 * PATCH /api/admin/partners/:orgId
 * Update a partner org's status, commission plan, or payout details.
 */
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'

type Params = { params: Promise<{ orgId: string }> }

export async function PATCH(
  request: Request,
  { params }: Params
) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const { orgId } = await params

  const body = (await request.json().catch(() => null)) as {
    partner_status?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
    commission_plan_id?: string | null
    payout_method?: string | null
    payout_details?: Record<string, unknown>
    partner_code?: string | null
    notes?: string
  } | null

  if (!body) return err('VALIDATION_ERROR', 'JSON body required.', 400)

  const { data: existing } = await db
    .from('organizations')
    .select('id, name, is_partner, partner_status')
    .eq('id', orgId)
    .maybeSingle()

  if (!existing) return err('NOT_FOUND', 'Organisation not found.', 404)
  if (!existing.is_partner) {
    return err('VALIDATION_ERROR', 'Organisation is not a partner.', 400)
  }

  const allowed = ['ACTIVE', 'SUSPENDED', 'TERMINATED']
  if (body.partner_status && !allowed.includes(body.partner_status)) {
    return err(
      'VALIDATION_ERROR',
      `partner_status must be one of: ${allowed.join(', ')}`,
      400
    )
  }

  const patch: Record<string, unknown> = {}

  if (body.partner_status !== undefined) patch.partner_status = body.partner_status
  if (body.commission_plan_id !== undefined) patch.commission_plan_id = body.commission_plan_id
  if (body.payout_method !== undefined) patch.payout_method = body.payout_method
  if (body.payout_details !== undefined) patch.payout_details = body.payout_details
  if (body.partner_code !== undefined) {
    patch.partner_code = body.partner_code?.trim().toUpperCase() || null
  }

  if (Object.keys(patch).length === 0) {
    return err('VALIDATION_ERROR', 'No fields to update.', 400)
  }

  const { data: updated, error: updateError } = await db
    .from('organizations')
    .update(patch)
    .eq('id', orgId)
    .select('id, name, partner_status, commission_plan_id, payout_method, partner_code')
    .single()

  if (updateError) return err('SERVER_ERROR', updateError.message, 500)
  return ok({ partner: updated })
}