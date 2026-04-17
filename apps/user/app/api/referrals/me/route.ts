import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getActiveOrg } from '@/lib/org'
import { err, ok } from '@/lib/billing/http'

export async function GET() {
  const supabase = await createClient()
  const db = createServiceRoleClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const [{ data: agent, error: agentError }, { data: attribution, error: attributionError }] = await Promise.all([
    db
      .from('agents')
      .select('id, agent_code, display_name, email, phone, status, payout_method, payout_details, joined_at, approved_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    db
      .from('referral_attributions')
      .select('id, agent_id, status, source, attributed_at, locked_at')
      .eq('org_id', org.org_id)
      .maybeSingle(),
  ])

  if (agentError) return err('SERVER_ERROR', agentError.message, 500)
  if (attributionError) return err('SERVER_ERROR', attributionError.message, 500)

  if (!agent) {
    return ok({
      agent: null,
      attribution: attribution ?? null,
      commissions: [],
      payouts: [],
      totals: {
        pending_amount: 0,
        approved_amount: 0,
        paid_amount: 0,
      },
    })
  }

  const [{ data: commissions, error: commissionError }, { data: payouts, error: payoutError }] = await Promise.all([
    db
      .from('commission_ledger')
      .select('id, org_id, entry_type, level, basis_amount, rate_pct, commission_amount, currency, status, eligible_at, approved_at, paid_at, created_at')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .limit(20),
    db
      .from('commission_payouts')
      .select('id, period_start, period_end, gross_amount, adjustment_amount, net_amount, currency, status, payout_method, payout_reference, paid_at, created_at')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (commissionError) return err('SERVER_ERROR', commissionError.message, 500)
  if (payoutError) return err('SERVER_ERROR', payoutError.message, 500)

  const totals = (commissions ?? []).reduce(
    (acc, row) => {
      const amount = Number(row.commission_amount ?? 0)
      if (row.status === 'PAID') acc.paid_amount += amount
      else if (row.status === 'APPROVED') acc.approved_amount += amount
      else acc.pending_amount += amount
      return acc
    },
    { pending_amount: 0, approved_amount: 0, paid_amount: 0 }
  )

  return ok({
    agent,
    attribution: attribution ?? null,
    commissions: commissions ?? [],
    payouts: payouts ?? [],
    totals,
  })
}
