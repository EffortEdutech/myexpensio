// apps/admin/app/(protected)/settings/page.tsx
import { requireOwner } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const ctx = await requireOwner('page')

  const db = createServiceRoleClient()

  const [orgRes, subRes] = await Promise.all([
    db.from('organizations').select('id, name, status, created_at').eq('id', ctx!.orgId!).single(),
    db.from('subscription_status').select('tier, period_start, period_end, updated_at').eq('org_id', ctx!.orgId!).single(),
  ])

  return (
    <SettingsClient
      org={orgRes.data}
      subscription={subRes.data}
      isOwner={ctx!.orgRole === 'OWNER' || ctx!.isPlatformAdmin}
    />
  )
}
