import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { err } from '@/lib/billing/http'
import {
  createReferralVisit,
  ensureAnonymousCookieId,
  loadActiveAgentByCode,
  normalizeAgentCode,
  readAnonymousCookie,
} from '@/lib/billing/referrals'
import type { ReferralTrackBody } from '@/lib/billing/types'

export async function POST(request: NextRequest) {
  const db = createServiceRoleClient()

  const body = (await request.json().catch(() => ({}))) as ReferralTrackBody
  const code = normalizeAgentCode(body.code)
  if (!code) return err('VALIDATION_ERROR', 'Referral code is required.', 400)

  const agent = await loadActiveAgentByCode(db, code)
  if (!agent) return err('NOT_FOUND', 'Referral code not found.', 404)

  const anonymousCookieId = ensureAnonymousCookieId(readAnonymousCookie(request))

  const visit = await createReferralVisit(db, request, {
    referralCode: code,
    agentId: agent.id,
    anonymousCookieId,
    source: 'LINK',
    landingPath: body.landing_path ?? null,
    utmSource: body.utm_source ?? null,
    utmMedium: body.utm_medium ?? null,
    utmCampaign: body.utm_campaign ?? null,
    utmContent: body.utm_content ?? null,
    utmTerm: body.utm_term ?? null,
  })

  const response = NextResponse.json(
    {
      tracked: true,
      visit,
      agent: {
        id: agent.id,
        agent_code: agent.agent_code,
        display_name: agent.display_name,
      },
    },
    { status: 201 }
  )

  response.cookies.set('mx_ref_code', code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  response.cookies.set('mx_ref_anon', anonymousCookieId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })

  return response
}
