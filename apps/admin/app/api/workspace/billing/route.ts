// apps/admin/app/api/workspace/billing/route.ts
//
// GET /api/workspace/billing
// Returns subscription status + current period usage for the workspace.
// Read-only — upgrades/changes are Console-only operations.

import { NextResponse } from 'next/server'
import { requireWorkspaceAuth, resolveOrgScope } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: Request) {
  const ctx = await requireWorkspaceAuth('api')
  if (!ctx) return err('UNAUTHORIZED', 'Access denied', 403)

  const { searchParams } = new URL(req.url)
  const requestedOrgId = searchParams.get('org_id')?.trim() || null
  const orgId = resolveOrgScope(ctx, requestedOrgId)

  if (!orgId) return err('VALIDATION_ERROR', 'org_id required for internal staff', 400)

  const db = createServiceRoleClient()

  // Get subscription status (may not exist for new orgs)
  const { data: subscription } = await db
    .from('subscription_status')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle()

  // Current month usage — period_start = first day of current month
  const now = new Date()
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: usage } = await db
    .from('usage_counters')
    .select('routes_calls, trips_created, exports_created, period_start')
    .eq('org_id', orgId)
    .eq('period_start', periodStart)
    .maybeSingle()

  // Platform config — free tier limits
  const { data: config } = await db
    .from('platform_config')
    .select('free_routes_per_month, free_trips_per_month, free_exports_per_month')
    .eq('id', true)
    .maybeSingle()

  const tier = subscription?.tier ?? 'FREE'
  const freeRoutesLimit = config?.free_routes_per_month ?? 2

  return NextResponse.json({
    subscription: subscription ?? {
      org_id:              orgId,
      tier:                'FREE',
      billing_status:      'INACTIVE',
      provider:            'MANUAL',
      period_start:        null,
      period_end:          null,
      cancel_at_period_end: false,
      grace_until:         null,
      last_invoice_at:     null,
    },
    usage: {
      period_start:    periodStart,
      routes_calls:    usage?.routes_calls ?? 0,
      trips_created:   usage?.trips_created ?? 0,
      exports_created: usage?.exports_created ?? 0,
    },
    limits: {
      routes_per_month:  tier === 'FREE' ? freeRoutesLimit : null, // null = unlimited
      trips_per_month:   tier === 'FREE' ? (config?.free_trips_per_month ?? null) : null,
      exports_per_month: tier === 'FREE' ? (config?.free_exports_per_month ?? null) : null,
    },
  })
}
