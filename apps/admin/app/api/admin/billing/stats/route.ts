/**
 * apps/admin/app/api/admin/billing/stats/route.ts
 *
 * Returns aggregate KPI counts for the Billing Overview dashboard.
 * All counts are computed server-side via service role — no RLS involved.
 *
 * GET /api/admin/billing/stats
 * Response: BillingStats
 */

import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok } from '@/lib/billing/http'

export type BillingStats = {
  subscriptions: {
    active: number
    trialing: number
    past_due: number
    unpaid: number
    canceled: number
    total: number
    cancel_at_period_end: number
  }
  invoices: {
    paid_this_month: number
    paid_amount_this_month: number
    failed_this_month: number
  }
  commission: {
    pending_amount: number
    pending_count: number
  }
  agents: {
    active: number
    pending: number
  }
  mrr_estimate: number
  arr_estimate: number
}

export async function GET() {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Run all counts in parallel for speed.
  const [
    subsResult,
    cancelAtEndResult,
    invoicesPaidResult,
    invoicesFailedResult,
    commissionResult,
    agentsResult,
    mrrResult,
  ] = await Promise.all([
    // Subscription status counts
    db
      .from('subscription_status')
      .select('billing_status', { count: 'exact', head: false })
      .not('billing_status', 'is', null),

    // Cancel at period end count
    db
      .from('subscription_status')
      .select('org_id', { count: 'exact', head: true })
      .eq('cancel_at_period_end', true)
      .in('billing_status', ['ACTIVE', 'TRIALING']),

    // Paid invoices this month — sum and count
    db
      .from('billing_invoices')
      .select('amount_paid', { count: 'exact', head: false })
      .eq('status', 'PAID')
      .gte('paid_at', monthStart),

    // Failed invoices this month
    db
      .from('billing_invoices')
      .select('id', { count: 'exact', head: true })
      .in('status', ['FAILED', 'UNCOLLECTIBLE'])
      .gte('created_at', monthStart),

    // Pending commission ledger entries
    db
      .from('commission_ledger')
      .select('commission_amount', { count: 'exact', head: false })
      .eq('status', 'PENDING'),

    // Agent counts
    db
      .from('agents')
      .select('status', { count: 'exact', head: false }),

    // MRR estimate: sum of ACTIVE + TRIALING monthly subscription amounts
    db
      .from('billing_subscriptions')
      .select('amount, interval')
      .in('status', ['ACTIVE', 'TRIALING']),
  ])

  // Subscription counts by billing_status
  const subsByStatus: Record<string, number> = {}
  let subTotal = 0
  for (const row of subsResult.data ?? []) {
    const s = row.billing_status as string
    subsByStatus[s] = (subsByStatus[s] ?? 0) + 1
    subTotal++
  }

  // Invoices paid this month
  const invoicesPaid = invoicesPaidResult.data ?? []
  const paidCount = invoicesPaid.length
  const paidAmount = invoicesPaid.reduce(
    (sum, row) => sum + Number(row.amount_paid ?? 0),
    0
  )

  // Pending commissions
  const commissionRows = commissionResult.data ?? []
  const pendingCommissionAmount = commissionRows.reduce(
    (sum, row) => sum + Number(row.commission_amount ?? 0),
    0
  )
  const pendingCommissionCount = commissionRows.length

  // Agent counts
  const agentsByStatus: Record<string, number> = {}
  for (const row of agentsResult.data ?? []) {
    const s = row.status as string
    agentsByStatus[s] = (agentsByStatus[s] ?? 0) + 1
  }

  // MRR: monthly subs at full amount; yearly subs / 12; lifetime = 0 for MRR
  let mrr = 0
  for (const row of mrrResult.data ?? []) {
    const amount = Number(row.amount ?? 0)
    if (row.interval === 'MONTH') mrr += amount
    else if (row.interval === 'YEAR') mrr += amount / 12
  }

  const stats: BillingStats = {
    subscriptions: {
      active:   subsByStatus['ACTIVE'] ?? 0,
      trialing: subsByStatus['TRIALING'] ?? 0,
      past_due: subsByStatus['PAST_DUE'] ?? 0,
      unpaid:   subsByStatus['UNPAID'] ?? 0,
      canceled: subsByStatus['CANCELED'] ?? 0,
      total:    subTotal,
      cancel_at_period_end: cancelAtEndResult.count ?? 0,
    },
    invoices: {
      paid_this_month:        paidCount,
      paid_amount_this_month: paidAmount,
      failed_this_month:      invoicesFailedResult.count ?? 0,
    },
    commission: {
      pending_amount: pendingCommissionAmount,
      pending_count:  pendingCommissionCount,
    },
    agents: {
      active:  agentsByStatus['ACTIVE'] ?? 0,
      pending: agentsByStatus['PENDING'] ?? 0,
    },
    mrr_estimate: Math.round(mrr * 100) / 100,
    arr_estimate: Math.round(mrr * 12 * 100) / 100,
  }

  return ok(stats)
}
