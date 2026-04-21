// apps/admin/app/(protected)/settings/page.tsx
//
// 2026-04-21: Removed platform_settings query (table dropped in R1 migration).
//             Plan limits are now hardcoded in entitlements.ts / PLAN_DEFAULTS.
//             platformSettings prop is gone — SettingsClient reads limits from
//             the MEMBERSHIP_LIMITS constant imported in the client.

import { createServiceRoleClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const db = createServiceRoleClient()

  const [orgsRes, subsRes, orgSettingsRes] = await Promise.all([
    db
      .from('organizations')
      .select('id, name, display_name, contact_email, contact_phone, address, notes, status, created_at, updated_at')
      .order('created_at', { ascending: false }),
    db.from('subscription_status').select('org_id, tier, period_start, period_end, updated_at'),
    db.from('admin_settings').select('org_id, settings, updated_at'),
  ])

  return (
    <SettingsClient
      orgs={orgsRes.data ?? []}
      subscriptions={subsRes.data ?? []}
      orgSettings={orgSettingsRes.data ?? []}
    />
  )
}
