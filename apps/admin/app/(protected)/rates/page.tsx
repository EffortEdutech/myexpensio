// apps/admin/app/(protected)/rates/page.tsx
import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import RatesClient from './RatesClient'

async function fetchRates(orgId: string) {
  const db = createServiceRoleClient()
  const { data } = await db
    .from('rate_versions')
    .select(`
      id, effective_from, currency,
      mileage_rate_per_km, perdiem_rate_myr,
      meal_rate_full_day, meal_rate_morning, meal_rate_noon, meal_rate_evening,
      lodging_rate_default, created_at,
      profiles ( display_name, email )
    `)
    .eq('org_id', orgId)
    .order('effective_from', { ascending: false })
  return data ?? []
}

export default async function RatesPage() {
  const ctx = await requireAdminAuth('page')
  if (!ctx!.orgId) {
    return <div className="text-sm text-gray-500">Select an organisation to manage rates.</div>
  }
  const rates = await fetchRates(ctx!.orgId)
  return <RatesClient initialRates={rates} canCreate={true} />
}
