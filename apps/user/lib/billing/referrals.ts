import { createHash, randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export const REFERRAL_CODE_COOKIE = 'mx_ref_code'
export const REFERRAL_ANON_COOKIE = 'mx_ref_anon'

export function normalizeAgentCode(input: string | null | undefined): string | null {
  const value = input?.trim().toUpperCase()
  return value && value.length > 0 ? value : null
}

export function readReferralCodeFromCookie(request: NextRequest): string | null {
  return normalizeAgentCode(request.cookies.get(REFERRAL_CODE_COOKIE)?.value ?? null)
}

export function readAnonymousCookie(request: NextRequest): string | null {
  const value = request.cookies.get(REFERRAL_ANON_COOKIE)?.value?.trim()
  return value && value.length > 0 ? value : null
}

export function ensureAnonymousCookieId(existing?: string | null): string {
  return existing && existing.length > 0 ? existing : randomUUID()
}

function sha256Hex(value: string | null | undefined): string | null {
  if (!value) return null
  return createHash('sha256').update(value).digest('hex')
}

export async function loadActiveAgentByCode(db: SupabaseClient, code: string) {
  const { data, error } = await db
    .from('agents')
    .select('id, agent_code, display_name, email, status, commission_plan_id')
    .eq('agent_code', code)
    .eq('status', 'ACTIVE')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function createReferralVisit(
  db: SupabaseClient,
  request: NextRequest,
  options: {
    referralCode: string
    agentId: string
    anonymousCookieId: string
    source: 'LINK' | 'CHECKOUT' | 'MANUAL'
    landingPath?: string | null
    utmSource?: string | null
    utmMedium?: string | null
    utmCampaign?: string | null
    utmContent?: string | null
    utmTerm?: string | null
  }
) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent')

  const { data, error } = await db
    .from('referral_visits')
    .insert({
      agent_id: options.agentId,
      referral_code: options.referralCode,
      landing_path: options.landingPath ?? null,
      utm_source: options.utmSource ?? null,
      utm_medium: options.utmMedium ?? null,
      utm_campaign: options.utmCampaign ?? null,
      utm_content: options.utmContent ?? null,
      utm_term: options.utmTerm ?? null,
      anonymous_cookie_id: options.anonymousCookieId,
      ip_hash: sha256Hex(ip),
      user_agent_hash: sha256Hex(userAgent),
      source: options.source,
    })
    .select('id, agent_id, referral_code, visited_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function ensureReferralAttributionForOrg(
  db: SupabaseClient,
  params: {
    orgId: string
    userId: string | null
    agentId: string
    commissionPlanId: string | null
    firstVisitId: string | null
    lastVisitId: string | null
    source: 'SIGNUP_CODE' | 'LINK' | 'CHECKOUT' | 'ADMIN_ASSIGN'
    campaignData?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
) {
  const { data: existing, error: existingError } = await db
    .from('referral_attributions')
    .select('id, org_id, user_id, agent_id, commission_plan_id, status, first_visit_id, last_visit_id')
    .eq('org_id', params.orgId)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)

  if (existing) {
    if (existing.agent_id === params.agentId) {
      const patch = {
        user_id: params.userId ?? existing.user_id ?? null,
        last_visit_id: params.lastVisitId ?? existing.last_visit_id ?? null,
        metadata: params.metadata ?? {},
      }

      const { data: updated, error: updateError } = await db
        .from('referral_attributions')
        .update(patch)
        .eq('id', existing.id)
        .select('id, org_id, agent_id, status, first_visit_id, last_visit_id')
        .single()

      if (updateError) throw new Error(updateError.message)
      return updated
    }

    return existing
  }

  const { data: inserted, error: insertError } = await db
    .from('referral_attributions')
    .insert({
      org_id: params.orgId,
      user_id: params.userId,
      agent_id: params.agentId,
      commission_plan_id: params.commissionPlanId,
      source: params.source,
      status: 'PENDING',
      first_visit_id: params.firstVisitId,
      last_visit_id: params.lastVisitId,
      campaign_data: params.campaignData ?? {},
      metadata: params.metadata ?? {},
    })
    .select('id, org_id, agent_id, status, first_visit_id, last_visit_id')
    .single()

  if (insertError) throw new Error(insertError.message)
  return inserted
}
