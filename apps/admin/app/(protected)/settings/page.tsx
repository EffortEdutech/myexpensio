// apps/admin/app/(protected)/settings/page.tsx
import { createServiceRoleClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const db = createServiceRoleClient()

  const [orgsRes, subsRes] = await Promise.all([
    db.from('organizations')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false }),
    db.from('subscription_status')
      .select('org_id, tier, period_start, period_end, updated_at'),
  ])

  return <SettingsClient orgs={orgsRes.data ?? []} subscriptions={subsRes.data ?? []} />
}
