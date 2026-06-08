// apps/user/app/api/sync/bootstrap/route.ts
//
// GET /api/sync/bootstrap
//
// Returns the authenticated user's initial data set:
//   - profile
//   - subscription
//   - spaces (PERSONAL always; BUSINESS for PREMIUM)
//   - rate_version (current rates)
//   - usage_counters
//   - org_context (org_id, org_role, workspace_type, effective_tier)
//
// Called once after mobile login or when the local DB has no cursor.

import { type NextRequest, NextResponse } from 'next/server'
import { createClientForRequest } from '@/lib/supabase/api-client'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// Helper — derive a cursor from the current server time
function makeCursor(): string {
  return new Date().toISOString()
}

export async function GET(request: NextRequest) {
  const supabase = await createClientForRequest(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  // ── Profile ────────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, display_name, department, location, company_name, role')
    .eq('id', user.id)
    .maybeSingle()

  // ── Subscription ───────────────────────────────────────────────────────────
  // Table uses entity_type/entity_id (not owner_type/owner_id).
  // Map to owner_type/owner_id in the payload for mobile backward-compat.
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, entity_type, entity_id, tier, status, trial_expires_at, current_period_end, seat_count')
    .eq('entity_type', 'USER')
    .eq('entity_id', user.id)
    .maybeSingle()

  // ── Spaces ─────────────────────────────────────────────────────────────────
  const { data: spaces } = await supabase
    .from('spaces')
    .select('id, type, name, currency, is_default, created_at, updated_at')
    .eq('owner_id', user.id)
    .is('deleted_at', null)

  // ── Rates ──────────────────────────────────────────────────────────────────
  const { data: rateVersion } = await supabase
    .from('user_rate_versions')
    .select('*')
    .eq('user_id', user.id)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── Usage counters ─────────────────────────────────────────────────────────
  const { data: usageCounters } = await supabase
    .from('usage_counters')
    .select('feature, count, period_start, period_end')
    .eq('user_id', user.id)

  // ── Org context ────────────────────────────────────────────────────────────
  // get_active_org resolves: ORG subscription → USER subscription (fallback).
  // Returns { org_id, org_name, org_role, tier } or null.
  let orgContext: {
    org_id: string;
    org_role: string;
    workspace_type: string | null;
    effective_tier: string;
  } | null = null

  const { data: activeOrg } = await supabase.rpc('get_active_org', {
    p_user_id: user.id,
  })

  if (activeOrg?.org_id) {
    // Fetch workspace_type from organizations table (not returned by RPC)
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('workspace_type')
      .eq('id', activeOrg.org_id)
      .maybeSingle()

    orgContext = {
      org_id: activeOrg.org_id,
      org_role: activeOrg.org_role ?? 'MEMBER',
      workspace_type: orgRow?.workspace_type ?? null,
      effective_tier: activeOrg.tier ?? 'FREE',
    }
  }

  return NextResponse.json({
    cursor: makeCursor(),
    server_time: new Date().toISOString(),
    payload: {
      profile: profile ?? null,
      // Remap entity_type/entity_id → owner_type/owner_id for mobile
      subscription: subscription ? {
        ...subscription,
        owner_type: subscription.entity_type.toLowerCase(),
        owner_id:   subscription.entity_id,
        status:     subscription.status.toLowerCase(),
        tier:       subscription.tier,
      } : null,
      spaces: spaces ?? [],
      rate_version: rateVersion ?? null,
      usage_counters: usageCounters ?? [],
      org_context: orgContext,
    },
  })
}
