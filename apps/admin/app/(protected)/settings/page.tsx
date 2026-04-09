// apps/admin/app/(protected)/settings/page.tsx
import { createServiceRoleClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const db = createServiceRoleClient()

  const [orgsRes, subsRes, orgSettingsRes, platformRes] = await Promise.all([
    db.from('organizations').select('id, name, status, created_at').order('created_at', { ascending: false }),
    db.from('subscription_status').select('org_id, tier, period_start, period_end, updated_at'),
    db.from('admin_settings').select('org_id, settings, updated_at'),
    db.from('platform_settings').select('id, settings, updated_at').eq('id', true).maybeSingle(),
  ])

  return (
    <SettingsClient
      orgs={orgsRes.data ?? []}
      subscriptions={subsRes.data ?? []}
      orgSettings={orgSettingsRes.data ?? []}
      platformSettings={platformRes.data?.settings ?? null}
    />
  )
}
