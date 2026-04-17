import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok, parsePaging } from '@/lib/billing/http'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const url = new URL(request.url)
  const { page, pageSize, from, to } = parsePaging(url)

  const agentId = url.searchParams.get('agent_id')?.trim()
  const status = url.searchParams.get('status')?.trim()

  let query = db
    .from('commission_payouts')
    .select('id, agent_id, period_start, period_end, gross_amount, adjustment_amount, net_amount, currency, status, payout_method, payout_reference, paid_at, created_at', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (agentId) query = query.eq('agent_id', agentId)
  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  return ok({
    items: data ?? [],
    page,
    page_size: pageSize,
    total: count ?? 0,
  })
}

export async function POST(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const body = (await request.json().catch(() => null)) as {
    agent_id?: string
    period_start?: string
    period_end?: string
    payout_method?: 'BANK_TRANSFER' | 'TOYYIBPAY' | 'MANUAL' | null
    ledger_ids?: string[]
  } | null

  if (!body?.agent_id || !body.period_start || !body.period_end) {
    return err('VALIDATION_ERROR', 'agent_id, period_start, and period_end are required.', 400)
  }

  let ledgerRows = [] as Array<{ id: string; commission_amount: number }>

  if (body.ledger_ids?.length) {
    const { data, error } = await db
      .from('commission_ledger')
      .select('id, commission_amount')
      .in('id', body.ledger_ids)
      .eq('agent_id', body.agent_id)
      .eq('status', 'APPROVED')

    if (error) return err('SERVER_ERROR', error.message, 500)
    ledgerRows = (data ?? []).map((row) => ({
      id: row.id,
      commission_amount: Number(row.commission_amount ?? 0),
    }))
  } else {
    const { data, error } = await db
      .from('commission_ledger')
      .select('id, commission_amount, created_at')
      .eq('agent_id', body.agent_id)
      .eq('status', 'APPROVED')
      .gte('created_at', `${body.period_start}T00:00:00.000Z`)
      .lte('created_at', `${body.period_end}T23:59:59.999Z`)

    if (error) return err('SERVER_ERROR', error.message, 500)
    ledgerRows = (data ?? []).map((row) => ({
      id: row.id,
      commission_amount: Number(row.commission_amount ?? 0),
    }))
  }

  if (ledgerRows.length === 0) {
    return err('VALIDATION_ERROR', 'No APPROVED commission lines found for this payout.', 400)
  }

  const grossAmount = Number(
    ledgerRows.reduce((sum, row) => sum + Number(row.commission_amount ?? 0), 0).toFixed(2)
  )

  const { data: payout, error: payoutError } = await db
    .from('commission_payouts')
    .insert({
      agent_id: body.agent_id,
      period_start: body.period_start,
      period_end: body.period_end,
      gross_amount: grossAmount,
      adjustment_amount: 0,
      net_amount: grossAmount,
      currency: 'MYR',
      status: 'DRAFT',
      payout_method: body.payout_method ?? 'MANUAL',
      created_by_user_id: ctx.userId,
    })
    .select('id, agent_id, gross_amount, net_amount, status')
    .single()

  if (payoutError) return err('SERVER_ERROR', payoutError.message, 500)

  const { error: itemError } = await db
    .from('commission_payout_items')
    .insert(ledgerRows.map((row) => ({ payout_id: payout.id, ledger_id: row.id })))

  if (itemError) return err('SERVER_ERROR', itemError.message, 500)

  return ok({ payout }, 201)
}
