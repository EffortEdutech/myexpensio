// apps/admin/app/(protected)/settings/page.tsx
//
// Auth-aware server component.
//   Internal staff  -> all orgs + subscriptions + admin_settings + global template names
//   Workspace user  -> profile + subscription only (rates on /rates, billing on /billing)

import { redirect } from 'next/navigation'
import { requireWorkspaceAuth } from '@/lib/workspace-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const ctx = await requireWorkspaceAuth('page')
  if (!ctx) redirect('/login')

  const db = createServiceRoleClient()

  // Helper: map subscriptions row → Sub shape expected by SettingsClient
  function mapSub(row: { entity_id: string; tier: string; status: string; current_period_end: string | null; updated_at?: string | null }) {
    return {
      org_id:         row.entity_id,
      tier:           row.tier as 'FREE' | 'PRO' | 'PREMIUM',
      billing_status: row.status,
      period_start:   null as string | null,
      period_end:     row.current_period_end,
      updated_at:     row.updated_at ?? new Date().toISOString(),
    }
  }

  // -- Internal staff -----------------------------------------------------------
  if (ctx.isInternalStaff) {
    const [orgsRes, subsRes, orgSettingsRes, tplRes] = await Promise.all([
      db
        .from('organizations')
        .select('id, name, display_name, contact_email, contact_phone, address, notes, status, workspace_type, created_at, updated_at')
        .order('name', { ascending: true }),
      db
        .from('subscriptions')
        .select('entity_id, tier, status, current_period_end, updated_at')
        .eq('entity_type', 'ORG'),
      db
        .from('admin_settings')
        .select('org_id, settings, updated_at'),
      db
        .from('rate_versions')
        .select('template_name')
        .order('template_name', { ascending: true }),
    ])

    const templateNames = [...new Set(
      (tplRes.data ?? []).map(r => r.template_name).filter(Boolean) as string[]
    )]

    return (
      <SettingsClient
        viewMode="internal"
        orgs={orgsRes.data ?? []}
        subscriptions={(subsRes.data ?? []).map(mapSub)}
        orgSettings={orgSettingsRes.data ?? []}
        templateNames={templateNames}
        orgRole={null}
      />
    )
  }

  // -- Workspace user: profile + subscription only ------------------------------
  // Rates are managed on /rates. Billing is on /billing.
  const orgId = ctx.orgId!

  const [orgRes, subRes] = await Promise.all([
    db
      .from('organizations')
      .select('id, name, display_name, contact_email, contact_phone, address, notes, status, workspace_type, created_at, updated_at')
      .eq('id', orgId)
      .single(),
    db
      .from('subscriptions')
      .select('entity_id, tier, status, current_period_end, updated_at')
      .eq('entity_type', 'ORG')
      .eq('entity_id', orgId)
      .maybeSingle(),
  ])

  return (
    <SettingsClient
      viewMode={ctx.isAgentWorkspace ? 'agent' : 'team'}
      org={orgRes.data}
      subscription={subRes.data ? mapSub(subRes.data) : null}
      orgRole={ctx.orgRole}
    />
  )
}
