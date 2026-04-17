import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'

type Params = { params: Promise<{ batchId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const { batchId } = await params
  const db = createServiceRoleClient()
  const body = (await request.json().catch(() => null)) as {
    status?: 'DRAFT' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELED'
    payout_reference?: string | null
    paid_at?: string | null
  } | null

  if (!body) return err('VALIDATION_ERROR', 'JSON body required.', 400)

  const { data: existing, error: existingError } = await db
    .from('commission_payouts')
    .select('id, status')
    .eq('id', batchId)
    .maybeSingle()

  if (existingError) return err('SERVER_ERROR', existingError.message, 500)
  if (!existing) return err('NOT_FOUND', 'Payout batch not found.', 404)

  const { data: payout, error: payoutError } = await db
    .from('commission_payouts')
    .update({
      ...(body.status ? { status: body.status } : {}),
      ...(body.payout_reference !== undefined ? { payout_reference: body.payout_reference } : {}),
      ...(body.paid_at !== undefined
        ? { paid_at: body.paid_at }
        : body.status === 'PAID'
          ? { paid_at: new Date().toISOString() }
          : {}),
      ...(body.status === 'APPROVED' ? { approved_by_user_id: ctx.userId } : {}),
    })
    .eq('id', batchId)
    .select('*')
    .single()

  if (payoutError) return err('SERVER_ERROR', payoutError.message, 500)

  if (body.status === 'PAID') {
    const { data: items, error: itemsError } = await db
      .from('commission_payout_items')
      .select('ledger_id')
      .eq('payout_id', batchId)

    if (itemsError) return err('SERVER_ERROR', itemsError.message, 500)

    const ledgerIds = (items ?? []).map((row) => row.ledger_id)
    if (ledgerIds.length > 0) {
      const { error: markPaidError } = await db
        .from('commission_ledger')
        .update({
          status: 'PAID',
          paid_at: payout.paid_at ?? new Date().toISOString(),
          metadata: {
            payout_batch_id: batchId,
            payout_reference: payout.payout_reference ?? null,
          },
        })
        .in('id', ledgerIds)

      if (markPaidError) return err('SERVER_ERROR', markPaidError.message, 500)
    }
  }

  return ok({ payout })
}
