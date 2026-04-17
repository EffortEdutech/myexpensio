/**
 * apps/admin/lib/billing/providers.ts
 *
 * Billing provider utilities for myexpensio.
 *
 * Commission model (org-as-agent):
 *   - An "agent" in this system is an ORGANISATION, not an individual.
 *     The `agents` table carries an `org_id` column that identifies which
 *     organisation holds the agent record.
 *   - A "tenant" is any org (typically a single-member workspace) whose
 *     members were onboarded under an agent organisation.
 *   - The link between tenant org and agent is stored in `referral_attributions`
 *     with source = 'ADMIN_ASSIGN'. Admin creates this record when registering
 *     a new agent-tenant relationship.
 *   - When a tenant's invoice is paid, `maybeCreateCommissionForPaidInvoice`
 *     looks up that assignment and creates a `commission_ledger` entry for
 *     the agent org.
 *   - No referral links, cookies, or visit tracking are used in Phase 1.
 *     The `referral_visits` table exists in the DB but is not written to.
 */

import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

// ---------------------------------------------------------------------------
// Stripe signature verification
// ---------------------------------------------------------------------------

/**
 * Verifies the Stripe webhook signature using Node's built-in crypto.
 * No Stripe SDK required.
 *
 * If `webhookSecret` is not configured (undefined/empty), verification is
 * skipped and the function returns true. This allows local dev without a
 * secret, but MUST be set in production.
 */
export function verifyStripeSignature(
  payload: string,
  stripeSignature: string | null,
  webhookSecret?: string
): boolean {
  if (!webhookSecret) return true
  if (!stripeSignature) return false

  const parts = stripeSignature.split(',')
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2)
  const v1 = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3))

  if (!timestamp || v1.length === 0) return false

  const signedPayload = `${timestamp}.${payload}`
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  return v1.some((candidate) => safeEqual(candidate, expected))
}

// ---------------------------------------------------------------------------
// Unit conversion helper
// ---------------------------------------------------------------------------

/**
 * Converts a Unix timestamp (seconds) to an ISO 8601 string.
 * Returns null for falsy / non-numeric input.
 */
export function unixToIso(input: number | null | undefined): string | null {
  if (!input) return null
  const ms = Number(input) * 1000
  const date = new Date(ms)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// ---------------------------------------------------------------------------
// Billing customer management
// ---------------------------------------------------------------------------

/**
 * Upserts a billing customer record for an org+provider pair.
 * Returns the existing record if one already exists; inserts otherwise.
 *
 * Idempotent: safe to call on every webhook event.
 */
export async function ensureBillingCustomer(
  db: SupabaseClient,
  params: {
    orgId: string
    provider: 'STRIPE' | 'TOYYIBPAY' | 'MANUAL'
    providerCustomerId: string
    customerEmail?: string | null
    customerName?: string | null
  }
) {
  const { data: existing, error: existingError } = await db
    .from('billing_customers')
    .select('id, org_id, provider, provider_customer_id')
    .eq('org_id', params.orgId)
    .eq('provider', params.provider)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)
  if (existing) return existing

  const { data: inserted, error: insertError } = await db
    .from('billing_customers')
    .insert({
      org_id: params.orgId,
      provider: params.provider,
      provider_customer_id: params.providerCustomerId,
      customer_email: params.customerEmail ?? null,
      customer_name: params.customerName ?? null,
      status: 'ACTIVE',
    })
    .select('id, org_id, provider, provider_customer_id')
    .single()

  if (insertError) throw new Error(insertError.message)
  return inserted
}

// ---------------------------------------------------------------------------
// Plan resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the internal plan and price records for a given
 * provider + providerPriceId pair.
 *
 * Returns { plan: null, price: null } if no mapping is found —
 * not an error; it means this payment isn't mapped to a plan yet.
 */
export async function resolvePlanByProviderPrice(
  db: SupabaseClient,
  provider: 'STRIPE' | 'TOYYIBPAY' | 'MANUAL',
  providerPriceId: string | null | undefined
) {
  if (!providerPriceId) return { plan: null, price: null }

  const { data: price, error: priceError } = await db
    .from('billing_prices')
    .select('id, plan_id, provider_price_id, amount, currency, interval')
    .eq('provider', provider)
    .eq('provider_price_id', providerPriceId)
    .maybeSingle()

  if (priceError) throw new Error(priceError.message)
  if (!price) return { plan: null, price: null }

  const { data: plan, error: planError } = await db
    .from('billing_plans')
    .select('id, code, name, tier, interval')
    .eq('id', price.plan_id)
    .maybeSingle()

  if (planError) throw new Error(planError.message)

  return { plan: plan ?? null, price }
}

// ---------------------------------------------------------------------------
// Org resolution from provider webhook objects
// ---------------------------------------------------------------------------

/**
 * Resolves an org_id from a raw Stripe or ToyyibPay webhook object.
 *
 * Tries multiple resolution strategies in order:
 *  1. metadata.org_id  (passed explicitly at checkout creation)
 *  2. client_reference_id  (Stripe checkout sessions)
 *  3. metadata.checkout_session_id  → billing_checkout_sessions lookup
 *  4. object.id  → billing_checkout_sessions by provider_session_id
 *  5. object.customer  → billing_customers lookup
 *  6. object.subscription  → billing_subscriptions lookup
 *
 * Returns null if the org cannot be determined — the webhook handler
 * should log and mark the event as IGNORED in that case.
 */
export async function resolveOrgIdFromProviderObject(
  db: SupabaseClient,
  provider: 'STRIPE' | 'TOYYIBPAY',
  object: Record<string, unknown>
): Promise<string | null> {
  const metadata = (object.metadata ?? {}) as Record<string, unknown>

  const metadataOrgId =
    typeof metadata.org_id === 'string' ? metadata.org_id : null
  if (metadataOrgId) return metadataOrgId

  const clientReferenceId =
    typeof object.client_reference_id === 'string'
      ? object.client_reference_id
      : null
  if (clientReferenceId) return clientReferenceId

  const checkoutSessionId =
    typeof metadata.checkout_session_id === 'string'
      ? metadata.checkout_session_id
      : null
  if (checkoutSessionId) {
    const { data } = await db
      .from('billing_checkout_sessions')
      .select('org_id')
      .eq('id', checkoutSessionId)
      .maybeSingle()
    if (data?.org_id) return data.org_id
  }

  const providerSessionId =
    typeof object.id === 'string' ? object.id : null
  if (providerSessionId) {
    const { data } = await db
      .from('billing_checkout_sessions')
      .select('org_id')
      .eq('provider', provider)
      .eq('provider_session_id', providerSessionId)
      .maybeSingle()
    if (data?.org_id) return data.org_id
  }

  const providerCustomerId =
    typeof object.customer === 'string' ? object.customer : null
  if (providerCustomerId) {
    const { data } = await db
      .from('billing_customers')
      .select('org_id')
      .eq('provider', provider)
      .eq('provider_customer_id', providerCustomerId)
      .maybeSingle()
    if (data?.org_id) return data.org_id
  }

  const providerSubscriptionId =
    typeof object.subscription === 'string'
      ? object.subscription
      : typeof object.id === 'string' &&
          String(object.object ?? '').includes('subscription')
        ? object.id
        : null
  if (providerSubscriptionId) {
    const { data } = await db
      .from('billing_subscriptions')
      .select('org_id')
      .eq('provider', provider)
      .eq('provider_subscription_id', providerSubscriptionId)
      .maybeSingle()
    if (data?.org_id) return data.org_id
  }

  return null
}

// ---------------------------------------------------------------------------
// Checkout session status management
// ---------------------------------------------------------------------------

/**
 * Marks a checkout session as COMPLETED, FAILED, CANCELED, or EXPIRED.
 * Patches the session's metadata with any additional fields provided.
 *
 * Returns null if no session is found for the given provider+sessionId pair —
 * not an error; the webhook may arrive before or without a local session record.
 */
export async function markCheckoutSessionStatus(
  db: SupabaseClient,
  provider: 'STRIPE' | 'TOYYIBPAY' | 'MANUAL',
  providerSessionId: string,
  status: 'COMPLETED' | 'FAILED' | 'CANCELED' | 'EXPIRED',
  patchMetadata?: Record<string, unknown>
) {
  const { data: existing, error: existingError } = await db
    .from('billing_checkout_sessions')
    .select('id, metadata')
    .eq('provider', provider)
    .eq('provider_session_id', providerSessionId)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)
  if (!existing) return null

  const { data: updated, error: updateError } = await db
    .from('billing_checkout_sessions')
    .update({
      status,
      completed_at:
        status === 'COMPLETED' ? new Date().toISOString() : null,
      metadata: {
        ...((existing.metadata as Record<string, unknown> | null) ?? {}),
        ...(patchMetadata ?? {}),
      },
    })
    .eq('id', existing.id)
    .select(
      'id, org_id, user_id, plan_id, price_id, provider, provider_session_id, status, metadata'
    )
    .single()

  if (updateError) throw new Error(updateError.message)
  return updated
}

// ---------------------------------------------------------------------------
// Commission engine — org-as-agent model
// ---------------------------------------------------------------------------

/**
 * Agent-tenant assignment lookup result.
 *
 * An assignment is an admin-created record in `referral_attributions`
 * (source = 'ADMIN_ASSIGN') that links a tenant org to an agent record.
 * The agent record in turn carries `org_id` — the organisation that IS
 * the agent and will receive commission credit.
 */
type AgentAssignment = {
  attributionId: string
  attributionStatus: string
  agentId: string
  agentOrgId: string | null   // org_id on the agents row — the earning org
  commissionPlanId: string | null
  userId: string | null
}

/**
 * Resolves the active agent assignment for a tenant org.
 *
 * Looks up `referral_attributions` by `org_id` with status PENDING or ACTIVE.
 * In the org-as-agent model, these records are created by admin (ADMIN_ASSIGN)
 * when a tenant org is registered under an agent organisation.
 *
 * Returns null if no assignment exists — meaning this org has no agent parent
 * and no commission will be generated.
 */
async function resolveAgentAssignment(
  db: SupabaseClient,
  tenantOrgId: string
): Promise<AgentAssignment | null> {
  // Join referral_attributions → agents in one query to get agents.org_id.
  // Supabase returns the joined agents row as a nested object.
  const { data, error } = await db
    .from('referral_attributions')
    .select(`
      id,
      status,
      agent_id,
      commission_plan_id,
      user_id,
      agents (
        id,
        org_id,
        status
      )
    `)
    .eq('org_id', tenantOrgId)
    .in('status', ['PENDING', 'ACTIVE'])
    .maybeSingle()

  if (error) throw new Error(`resolveAgentAssignment: ${error.message}`)
  if (!data) return null

  // Supabase join returns an array when using a FK relation — normalise it.
  const agentRow = Array.isArray(data.agents)
    ? (data.agents[0] ?? null)
    : (data.agents ?? null)

  // If the joined agent record is suspended/terminated, skip commission.
  if (agentRow && agentRow.status !== 'ACTIVE') {
    console.warn(
      `[commission] Agent ${agentRow.id} is not ACTIVE (status: ${agentRow.status}). ` +
        `Skipping commission for tenant org ${tenantOrgId}.`
    )
    return null
  }

  return {
    attributionId: data.id,
    attributionStatus: data.status,
    agentId: data.agent_id,
    agentOrgId: agentRow?.org_id ?? null,
    commissionPlanId: data.commission_plan_id ?? null,
    userId: data.user_id ?? null,
  }
}

/**
 * Resolves the commission plan rules for an assignment.
 *
 * Uses the plan explicitly set on the attribution if available,
 * then falls back to the platform default ('DEFAULT_DIRECT_15').
 *
 * Returns null if no plan exists at all (edge case — default plan not seeded).
 */
async function resolveCommissionPlan(
  db: SupabaseClient,
  commissionPlanId: string | null
) {
  const query = commissionPlanId
    ? db
        .from('commission_plans')
        .select('id, code, rules')
        .eq('id', commissionPlanId)
        .maybeSingle()
    : db
        .from('commission_plans')
        .select('id, code, rules')
        .eq('code', 'DEFAULT_DIRECT_15')
        .maybeSingle()

  const { data, error } = await query
  if (error) throw new Error(`resolveCommissionPlan: ${error.message}`)
  return data ?? null
}

// ---------------------------------------------------------------------------

/**
 * Creates a REVENUE_SHARE commission ledger entry when a tenant's invoice
 * is paid — if that tenant org has an active agent assignment.
 *
 * Call this once per paid invoice from the webhook handler (Stripe or
 * ToyyibPay). The function is fully idempotent: duplicate calls for the
 * same invoice return the existing ledger row without creating a duplicate.
 *
 * --- Org-as-agent model ---
 *
 * `params.orgId` is the TENANT org (the one that paid).
 * The AGENT org is resolved via:
 *   tenant org_id → referral_attributions (ADMIN_ASSIGN) → agents.org_id
 *
 * The commission_ledger row records:
 *   - org_id       = tenant org (source of the payment)
 *   - agent_id     = agent record id
 *   - metadata.agent_org_id = agent's organisation id (for admin UI display)
 *
 * --- When no assignment exists ---
 *
 * Returns null silently. Most orgs will not have an agent parent — this
 * is normal and not an error.
 *
 * --- Status lifecycle ---
 *
 * New ledger entries are created with status = 'PENDING'.
 * Admin reviews and approves them via the Payout Runs screen before paying.
 * If the attribution was PENDING (newly assigned), it is promoted to ACTIVE
 * on first paid invoice as confirmation that the relationship is live.
 */
export async function maybeCreateCommissionForPaidInvoice(
  db: SupabaseClient,
  params: {
    orgId: string
    invoiceId: string
    subscriptionId: string | null
    amountPaid: number
    currency: string
  }
): Promise<{ id: string; commission_amount: number; status: string } | null> {
  // 1. Resolve agent assignment for this tenant org.
  const assignment = await resolveAgentAssignment(db, params.orgId)
  if (!assignment) return null   // no agent parent — nothing to do

  // 2. Idempotency guard: skip if a ledger entry already exists for this
  //    invoice + agent pair. Safe for webhook replays.
  const { data: existingLine, error: existingLineError } = await db
    .from('commission_ledger')
    .select('id, commission_amount, status')
    .eq('billing_invoice_id', params.invoiceId)
    .eq('agent_id', assignment.agentId)
    .eq('entry_type', 'REVENUE_SHARE')
    .maybeSingle()

  if (existingLineError) throw new Error(`commission idempotency check: ${existingLineError.message}`)
  if (existingLine) {
    console.info(
      `[commission] Ledger entry already exists for invoice ${params.invoiceId} ` +
        `agent ${assignment.agentId} — skipping duplicate.`
    )
    return existingLine
  }

  // 3. Resolve commission plan and calculate amount.
  const commissionPlan = await resolveCommissionPlan(db, assignment.commissionPlanId)
  if (!commissionPlan) {
    console.error(
      `[commission] No commission plan found for agent ${assignment.agentId}. ` +
        `Ensure DEFAULT_DIRECT_15 seed has been applied.`
    )
    return null
  }

  const rules = (commissionPlan.rules as Record<string, unknown> | null) ?? {}
  const directRatePct = Number(rules.direct_rate_pct ?? rules.directRatePct ?? 15)
  const commissionAmount = Number(
    ((params.amountPaid * directRatePct) / 100).toFixed(2)
  )

  // 4. Insert commission ledger entry.
  const { data: line, error: insertError } = await db
    .from('commission_ledger')
    .insert({
      // tenant org whose payment triggered this commission
      org_id: params.orgId,
      // user_id from the attribution record (may be null for org-level assignments)
      user_id: assignment.userId ?? null,
      agent_id: assignment.agentId,
      referral_attribution_id: assignment.attributionId,
      billing_invoice_id: params.invoiceId,
      billing_subscription_id: params.subscriptionId,
      commission_plan_id: commissionPlan.id,
      entry_type: 'REVENUE_SHARE',
      level: 1,
      basis_amount: params.amountPaid,
      rate_pct: directRatePct,
      commission_amount: commissionAmount,
      currency: params.currency,
      status: 'PENDING',
      eligible_at: new Date().toISOString(),
      metadata: {
        trigger: 'INVOICE_PAID',
        commission_plan_code: commissionPlan.code,
        // agent_org_id lets admin UI display which organisation earned this
        agent_org_id: assignment.agentOrgId ?? null,
      },
    })
    .select('id, commission_amount, status')
    .single()

  if (insertError) {
    throw new Error(`commission_ledger insert failed: ${insertError.message}`)
  }

  console.info(
    `[commission] Created ledger entry ${line.id} — ` +
      `tenant org ${params.orgId}, agent ${assignment.agentId}, ` +
      `agent org ${assignment.agentOrgId ?? 'unset'}, ` +
      `amount ${params.currency} ${commissionAmount} (${directRatePct}% of ${params.amountPaid}).`
  )

  // 5. If attribution was PENDING, promote to ACTIVE on first confirmed payment.
  //    This confirms the agent-tenant relationship is live.
  if (assignment.attributionStatus === 'PENDING') {
    const { error: activateError } = await db
      .from('referral_attributions')
      .update({
        status: 'ACTIVE',
        locked_at: new Date().toISOString(),
      })
      .eq('id', assignment.attributionId)

    if (activateError) {
      // Non-fatal: log but don't throw. The ledger entry is already committed.
      console.warn(
        `[commission] Could not promote attribution ${assignment.attributionId} ` +
          `to ACTIVE: ${activateError.message}`
      )
    }
  }

  return line
}
