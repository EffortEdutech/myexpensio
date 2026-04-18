/**
 * apps/user/app/api/billing/catalog/route.ts
 *
 * Returns a single resolved plan + price for the upgrade modal.
 *
 * GET /api/billing/catalog?plan_code=PRO_MONTHLY&provider=STRIPE
 *
 * Response: { plan: {...}, price: {...} | null }
 *
 * Used by the settings/billing page to populate the upgrade modal
 * with real prices from billing_prices.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getActiveOrg } from '@/lib/org'
import { err } from '@/lib/billing/http'
import { normalizePlanCode, normalizeProvider, resolvePlanAndPrice } from '@/lib/billing/catalog'

export async function GET(request: Request) {
  const supabase = await createClient()
  const db = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const url      = new URL(request.url)
  const planCode = normalizePlanCode(url.searchParams.get('plan_code'))
  const provider = normalizeProvider(url.searchParams.get('provider')) ?? 'STRIPE'

  if (!planCode) {
    return err('VALIDATION_ERROR', 'plan_code is required.', 400)
  }

  try {
    const resolved = await resolvePlanAndPrice(db, planCode, provider)
    return NextResponse.json(resolved)
  } catch (e) {
    // Plan or price not found — return plan with null price
    // so the UI can show "pricing not configured" gracefully
    const { data: plan } = await db
      .from('billing_plans')
      .select('id, code, name, tier, interval, description, entitlements')
      .eq('code', planCode)
      .eq('is_active', true)
      .maybeSingle()

    if (!plan) return err('NOT_FOUND', `Plan ${planCode} not found.`, 404)

    return NextResponse.json({ plan, price: null })
  }
}
