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

  // -- Internal staff -----------------------------------------------------------
  if (ctx.isInternalStaff) {
    const [orgsRes, subsRes, orgSettingsRes, tplRes] = await Promise.all([
      db
        .from('organizations')
        .select('id, name, display_name, contact_email, contact_phone, address, notes, status, workspace_type, created_at, updated_at')
        .order('name', { ascending: true }),
      db
        .from('subscription_status')
        .select('org_id, tier, billing_status, period_start, period_end, updated_at'),
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
        subscriptions={subsRes.data ?? []}
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
      .from('subscription_status')
      .select('org_id, tier, billing_status, period_start, period_end, updated_at')
      .eq('org_id', orgId)
      .maybeSingle(),
  ])

  return (
    <SettingsClient
      viewMode={ctx.isAgentWorkspace ? 'agent' : 'team'}
      org={orgRes.data}
      subscription={subRes.data}
      orgRole={ctx.orgRole}
    />
  )
}
