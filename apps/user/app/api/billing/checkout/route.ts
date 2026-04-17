import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getActiveOrg } from '@/lib/org'
import { err } from '@/lib/billing/http'
import { normalizePlanCode, normalizeProvider, resolvePlanAndPrice } from '@/lib/billing/catalog'
import { createProviderCheckoutSession } from '@/lib/billing/providers'
import {
  createReferralVisit,
  ensureAnonymousCookieId,
  ensureReferralAttributionForOrg,
  loadActiveAgentByCode,
  normalizeAgentCode,
  readAnonymousCookie,
  readReferralCodeFromCookie,
} from '@/lib/billing/referrals'
import type { CheckoutCreateBody } from '@/lib/billing/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const db = createServiceRoleClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = (await request.json().catch(() => null)) as CheckoutCreateBody | null
  if (!body) return err('VALIDATION_ERROR', 'JSON body required.', 400)

  const planCode = normalizePlanCode(body.plan_code)
  if (!planCode) return err('VALIDATION_ERROR', 'plan_code is required.', 400)
  if (planCode === 'FREE') return err('VALIDATION_ERROR', 'FREE does not require checkout.', 400)

  const provider = normalizeProvider(body.provider)
  if (!provider) return err('VALIDATION_ERROR', 'provider must be STRIPE, TOYYIBPAY, or MANUAL.', 400)

  let resolved
  try {
    resolved = await resolvePlanAndPrice(db, planCode, provider)
  } catch (error) {
    return err('VALIDATION_ERROR', error instanceof Error ? error.message : 'Plan resolution failed.', 400)
  }

  const { data: profile } = await db
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  const successUrl =
    body.success_url?.trim() ||
    `${request.nextUrl.origin}/settings/billing?checkout=success`

  const cancelUrl =
    body.cancel_url?.trim() ||
    `${request.nextUrl.origin}/settings/billing?checkout=cancel`

  const agentCode = normalizeAgentCode(body.agent_code) ?? readReferralCodeFromCookie(request)
  const anonymousCookieId = ensureAnonymousCookieId(readAnonymousCookie(request))

  let referralVisitId: string | null = null
  let referralAttributionId: string | null = null

  if (agentCode) {
    const agent = await loadActiveAgentByCode(db, agentCode)
    if (agent) {
      const visit = await createReferralVisit(db, request, {
        referralCode: agentCode,
        agentId: agent.id,
        anonymousCookieId,
        source: 'CHECKOUT',
        landingPath: '/checkout',
      })
      referralVisitId = visit.id

      const attribution = await ensureReferralAttributionForOrg(db, {
        orgId: org.org_id,
        userId: user.id,
        agentId: agent.id,
        commissionPlanId: agent.commission_plan_id ?? null,
        firstVisitId: visit.id,
        lastVisitId: visit.id,
        source: 'CHECKOUT',
        campaignData: {},
        metadata: {
          checkout_plan_code: planCode,
          checkout_provider: provider,
        },
      })
      referralAttributionId = attribution.id
    }
  }

  const checkoutMetadata = {
    requested_plan_code: planCode,
    requested_provider: provider,
    referral_visit_id: referralVisitId,
    referral_attribution_id: referralAttributionId,
    referral_code: agentCode,
    ...(body.metadata ?? {}),
  }

  const { data: checkoutSession, error: checkoutInsertError } = await db
    .from('billing_checkout_sessions')
    .insert({
      org_id: org.org_id,
      user_id: user.id,
      plan_id: resolved.plan.id,
      price_id: resolved.price?.id ?? null,
      provider,
      status: 'CREATED',
      success_url: successUrl,
      cancel_url: cancelUrl,
      referral_code: agentCode,
      metadata: checkoutMetadata,
    })
    .select('id, org_id, provider, status')
    .single()

  if (checkoutInsertError || !checkoutSession) {
    return err('SERVER_ERROR', checkoutInsertError?.message ?? 'Failed to create checkout session.', 500)
  }

  try {
    const providerSession = await createProviderCheckoutSession({
      provider,
      checkoutSessionId: checkoutSession.id,
      orgId: org.org_id,
      orgName: org.org_name,
      customerEmail: user.email ?? '',
      customerName: profile?.display_name ?? null,
      successUrl,
      cancelUrl,
      resolved,
      referralCode: agentCode,
    })

    const { error: checkoutUpdateError } = await db
      .from('billing_checkout_sessions')
      .update({
        provider_session_id: providerSession.providerSessionId,
        checkout_url: providerSession.checkoutUrl,
        status: 'OPEN',
        metadata: {
          ...checkoutMetadata,
          provider_response: providerSession.raw,
        },
      })
      .eq('id', checkoutSession.id)

    if (checkoutUpdateError) {
      return err('SERVER_ERROR', checkoutUpdateError.message, 500)
    }

    const response = NextResponse.json(
      {
        checkout_session_id: checkoutSession.id,
        provider_session_id: providerSession.providerSessionId,
        provider,
        plan_code: planCode,
        checkout_url: providerSession.checkoutUrl,
      },
      { status: 201 }
    )

    if (agentCode) {
      response.cookies.set('mx_ref_code', agentCode, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    response.cookies.set('mx_ref_anon', anonymousCookieId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 180,
    })

    return response
  } catch (error) {
    await db
      .from('billing_checkout_sessions')
      .update({
        status: 'FAILED',
        metadata: {
          ...checkoutMetadata,
          error: error instanceof Error ? error.message : 'Unknown checkout error',
        },
      })
      .eq('id', checkoutSession.id)

    return err(
      'CHECKOUT_PROVIDER_ERROR',
      error instanceof Error ? error.message : 'Checkout provider error.',
      502
    )
  }
}
