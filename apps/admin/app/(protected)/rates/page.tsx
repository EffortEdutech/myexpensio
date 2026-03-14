// apps/admin/app/(protected)/rates/page.tsx
import { createServiceRoleClient } from '@/lib/supabase/server'
import RatesClient from './RatesClient'

export default async function RatesPage() {
  const db = createServiceRoleClient()

  const [ratesRes, orgsRes] = await Promise.all([
    db.from('rate_versions').select(`
      id, org_id, effective_from, currency,
      mileage_rate_per_km, perdiem_rate_myr,
      meal_rate_full_day, meal_rate_morning, meal_rate_noon, meal_rate_evening,
      lodging_rate_default, created_at,
      profiles ( display_name, email ),
      organizations ( name )
    `).order('effective_from', { ascending: false }),
    db.from('organizations').select('id, name').eq('status', 'ACTIVE').order('name'),
  ])

  return <RatesClient initialRates={ratesRes.data ?? []} orgs={orgsRes.data ?? []} />
}
