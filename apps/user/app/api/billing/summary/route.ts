import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getActiveOrg } from '@/lib/org'
import { err } from '@/lib/billing/http'

export async function GET() {
  const supabase = await createClient()
  const db = createServiceRoleClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const [subscriptionStateRes, liveSubscriptionRes, invoicesRes, attributionRes] = await Promise.all([
    db
      .from('subscription_status')
      .select('tier, provider, billing_status, plan_code, cancel_at_period_end, grace_until, period_start, period_end, last_invoice_at, last_synced_at')
      .eq('org_id', org.org_id)
      .maybeSingle(),
    db
      .from('billing_subscriptions')
      .select('id, provider, provider_subscription_id, status, currency, amount, interval, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at')
      .eq('org_id', org.org_id)
      .in('status', ['TRIALING', 'ACTIVE', 'PAST_DUE', 'UNPAID'])
      .order('current_period_end', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    db
      .from('billing_invoices')
      .select('id, status, currency, amount_due, amount_paid, invoice_number, invoice_url, invoice_pdf_url, issued_at, due_at, paid_at, created_at')
      .eq('org_id', org.org_id)
      .order('created_at', { ascending: false })
      .limit(10),
    db
      .from('referral_attributions')
      .select('id, agent_id, status, source, attributed_at')
      .eq('org_id', org.org_id)
      .maybeSingle(),
  ])

  if (subscriptionStateRes.error) {
    return err('SERVER_ERROR', subscriptionStateRes.error.message, 500)
  }
  if (liveSubscriptionRes.error) {
    return err('SERVER_ERROR', liveSubscriptionRes.error.message, 500)
  }
  if (invoicesRes.error) {
    return err('SERVER_ERROR', invoicesRes.error.message, 500)
  }
  if (attributionRes.error) {
    return err('SERVER_ERROR', attributionRes.error.message, 500)
  }

  let agent: Record<string, unknown> | null = null
  if (attributionRes.data?.agent_id) {
    const { data } = await db
      .from('agents')
      .select('id, agent_code, display_name, email, phone, status')
      .eq('id', attributionRes.data.agent_id)
      .maybeSingle()
    agent = data ?? null
  }

  return NextResponse.json({
    org,
    subscription_status: subscriptionStateRes.data ?? null,
    live_subscription: liveSubscriptionRes.data ?? null,
    invoices: invoicesRes.data ?? [],
    referral: attributionRes.data
      ? {
          ...attributionRes.data,
          agent,
        }
      : null,
  })
}
