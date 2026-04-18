/**
 * apps/admin/app/api/admin/partners/route.ts
 *
 * Partners = organisations with is_partner = true.
 * No separate agents table. Everything lives in organizations.
 *
 * GET  /api/admin/partners          — list partner orgs
 * POST /api/admin/partners          — register org as partner (new or existing)
 */
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { err, ok, parsePaging } from '@/lib/billing/http'

export async function GET(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db   = createServiceRoleClient()
  const url  = new URL(request.url)
  const { from, to, page, pageSize } = parsePaging(url)

  const status = url.searchParams.get('status')?.trim()
  const q      = url.searchParams.get('q')?.trim()

  let query = db
    .from('organizations')
    .select(
      `id, name, status, is_partner, partner_code, partner_status,
       payout_method, payout_details, commission_plan_id, created_at,
       commission_plans ( id, code, name )`,
      { count: 'exact' }
    )
    .eq('is_partner', true)
    .range(from, to)
    .order('name', { ascending: true })

  if (status) query = query.eq('partner_status', status)
  if (q)      query = query.ilike('name', `%${q}%`)

  const { data, error, count } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  // Normalise commission_plans join
  const items = (data ?? []).map((row) => {
    const cp = Array.isArray(row.commission_plans)
      ? (row.commission_plans[0] ?? null)
      : (row.commission_plans ?? null)
    return {
      ...row,
      commission_plan_code: (cp as { code?: string } | null)?.code ?? null,
      commission_plan_name: (cp as { name?: string } | null)?.name ?? null,
      commission_plans: undefined,
    }
  })

  return ok({ items, page, page_size: pageSize, total: count ?? 0 })
}

export async function POST(request: Request) {
  const ctx = await requireAdminAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied.', 403)

  const db = createServiceRoleClient()
  const body = (await request.json().catch(() => null)) as {
    // Existing org mode — pass org_id to mark an existing org as partner
    org_id?: string
    // New org mode — pass name to create a brand-new org + mark as partner
    name?: string
    // Partner fields (both modes)
    partner_code?:        string
    commission_plan_id?:  string | null
    payout_method?:       string | null
    payout_details?:      Record<string, unknown>
  } | null

  if (!body) return err('VALIDATION_ERROR', 'JSON body required.', 400)
  if (!body.org_id && !body.name) {
    return err('VALIDATION_ERROR', 'Provide org_id (existing) or name (new org).', 400)
  }

  const partnerCode = body.partner_code?.trim().toUpperCase() || null

  // Validate partner_code uniqueness if provided
  if (partnerCode) {
    const { data: codeCheck } = await db
      .from('organizations')
      .select('id')
      .eq('partner_code', partnerCode)
      .maybeSingle()
    if (codeCheck) {
      return err('CONFLICT', `Partner code ${partnerCode} is already in use.`, 409)
    }
  }

  let orgId: string

  if (body.org_id) {
    // ── Mark existing org as partner ──────────────────────────────────────
    orgId = body.org_id

    const { data: existing } = await db
      .from('organizations')
      .select('id, name, is_partner')
      .eq('id', orgId)
      .maybeSingle()

    if (!existing) return err('NOT_FOUND', 'Organisation not found.', 404)
    if (existing.is_partner) {
      return err('CONFLICT', 'This organisation is already a partner.', 409)
    }

    const { error: updateError } = await db
      .from('organizations')
      .update({
        is_partner:          true,
        partner_code:        partnerCode,
        partner_status:      'ACTIVE',
        commission_plan_id:  body.commission_plan_id ?? null,
        payout_method:       body.payout_method      ?? null,
        payout_details:      body.payout_details      ?? {},
      })
      .eq('id', orgId)

    if (updateError) return err('SERVER_ERROR', updateError.message, 500)
  } else {
    // ── Create new org and immediately mark as partner ─────────────────────
    const orgName = body.name!.trim()
    if (!orgName) return err('VALIDATION_ERROR', 'name is required.', 400)

    const { data: newOrg, error: createError } = await db
      .from('organizations')
      .insert({
        name:               orgName,
        status:             'ACTIVE',
        is_partner:         true,
        partner_code:       partnerCode,
        partner_status:     'ACTIVE',
        commission_plan_id: body.commission_plan_id ?? null,
        payout_method:      body.payout_method      ?? null,
        payout_details:     body.payout_details      ?? {},
      })
      .select('id')
      .single()

    if (createError) {
      return err('SERVER_ERROR', createError.message, 500)
    }
    orgId = newOrg.id
  }

  // Return the full partner record
  const { data: partner, error: fetchError } = await db
    .from('organizations')
    .select(
      `id, name, status, is_partner, partner_code, partner_status,
       payout_method, commission_plan_id, created_at`
    )
    .eq('id', orgId)
    .single()

  if (fetchError) return err('SERVER_ERROR', fetchError.message, 500)
  return ok({ partner }, 201)
}
