// apps/admin/app/(protected)/claims/page.tsx
//
// All claims across all orgs — filterable by org, user, status, date range.
// Server component: fetches orgs + users for filter dropdowns, then renders ClaimsClient.

import { createServiceRoleClient } from '@/lib/supabase/server'
import ClaimsClient from './ClaimsClient'

export default async function ClaimsPage() {
  const db = createServiceRoleClient()

  const [orgsRes, claimsRes] = await Promise.all([
    db
      .from('organizations')
      .select('id, name, display_name')
      .eq('status', 'ACTIVE')
      .order('name'),
    db
      .from('claims')
      .select(`
        id,
        org_id,
        user_id,
        status,
        title,
        total_amount,
        currency,
        period_start,
        period_end,
        submitted_at,
        created_at,
        updated_at,
        organizations ( name, display_name ),
        profiles:user_id ( display_name, email )
      `)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <ClaimsClient
      initialClaims={claimsRes.data ?? []}
      orgs={orgsRes.data ?? []}
    />
  )
}
