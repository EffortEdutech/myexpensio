import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProviderSubscriptionStatus, SubscriptionSnapshotStatus } from '@/lib/billing/types'

export function mapProviderSubscriptionStatusToSnapshot(
  status: string | null | undefined
): SubscriptionSnapshotStatus {
  const value = (status ?? '').toUpperCase() as ProviderSubscriptionStatus
  switch (value) {
    case 'TRIALING':
      return 'TRIALING'
    case 'ACTIVE':
      return 'ACTIVE'
    case 'PAST_DUE':
      return 'PAST_DUE'
    case 'UNPAID':
      return 'UNPAID'
    case 'CANCELED':
      return 'CANCELED'
    case 'EXPIRED':
      return 'EXPIRED'
    default:
      return 'INACTIVE'
  }
}

export async function syncSubscriptionStatusSnapshot(db: SupabaseClient, orgId: string) {
  const { data: liveSubscriptions, error: liveError } = await db
    .from('billing_subscriptions')
    .select('id, org_id, plan_id, provider, status, cancel_at_period_end, current_period_start, current_period_end')
    .eq('org_id', orgId)
    .in('status', ['TRIALING', 'ACTIVE', 'PAST_DUE', 'UNPAID'])
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .limit(1)

  if (liveError) throw new Error(liveError.message)

  const live = (liveSubscriptions ?? [])[0] ?? null

  let tier: 'FREE' | 'PRO' = 'FREE'
  let planCode = 'FREE'

  if (live?.plan_id) {
    const { data: plan, error: planError } = await db
      .from('billing_plans')
      .select('code, tier')
      .eq('id', live.plan_id)
      .maybeSingle()

    if (planError) throw new Error(planError.message)
    if (plan) {
      tier = (plan.tier ?? 'FREE') as 'FREE' | 'PRO'
      planCode = plan.code ?? 'FREE'
    }
  }

  const { data: lastPaidInvoice, error: invoiceError } = await db
    .from('billing_invoices')
    .select('paid_at, created_at')
    .eq('org_id', orgId)
    .order('paid_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (invoiceError) throw new Error(invoiceError.message)

  const payload = live
    ? {
        org_id: orgId,
        tier,
        provider: live.provider,
        billing_status: mapProviderSubscriptionStatusToSnapshot(live.status),
        plan_code: planCode,
        cancel_at_period_end: Boolean(live.cancel_at_period_end),
        period_start: live.current_period_start,
        period_end: live.current_period_end,
        last_invoice_at: lastPaidInvoice?.paid_at ?? null,
        last_synced_at: new Date().toISOString(),
      }
    : {
        org_id: orgId,
        tier: 'FREE',
        provider: 'MANUAL',
        billing_status: 'INACTIVE',
        plan_code: 'FREE',
        cancel_at_period_end: false,
        period_start: null,
        period_end: null,
        grace_until: null,
        last_invoice_at: lastPaidInvoice?.paid_at ?? null,
        last_synced_at: new Date().toISOString(),
      }

  const { error: upsertError } = await db
    .from('subscription_status')
    .upsert(payload, { onConflict: 'org_id' })

  if (upsertError) throw new Error(upsertError.message)
}
