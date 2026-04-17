import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'

type Params = { params: Promise<{ agentId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const { agentId } = await params
  const db = createServiceRoleClient()

  const body = (await request.json().catch(() => null)) as {
    status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
    parent_agent_id?: string | null
    payout_method?: 'BANK_TRANSFER' | 'TOYYIBPAY' | 'MANUAL' | null
    payout_details?: Record<string, unknown>
    metadata?: Record<string, unknown>
  } | null

  if (!body) return err('VALIDATION_ERROR', 'JSON body required.', 400)

  const { data: existing, error: existingError } = await db
    .from('agents')
    .select('id, metadata')
    .eq('id', agentId)
    .maybeSingle()

  if (existingError) return err('SERVER_ERROR', existingError.message, 500)
  if (!existing) return err('NOT_FOUND', 'Agent not found.', 404)

  const patch = {
    ...(body.status ? { status: body.status } : {}),
    ...(body.parent_agent_id !== undefined ? { parent_agent_id: body.parent_agent_id } : {}),
    ...(body.payout_method !== undefined ? { payout_method: body.payout_method } : {}),
    ...(body.payout_details !== undefined ? { payout_details: body.payout_details ?? {} } : {}),
    ...(body.metadata
      ? {
          metadata: {
            ...((existing.metadata as Record<string, unknown> | null) ?? {}),
            ...body.metadata,
            admin_updated_by: ctx.userId,
          },
        }
      : {}),
  }

  const { data: updated, error: updateError } = await db
    .from('agents')
    .update(patch)
    .eq('id', agentId)
    .select('*')
    .single()

  if (updateError) return err('SERVER_ERROR', updateError.message, 500)

  return ok({ agent: updated })
}
