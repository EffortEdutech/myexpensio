// apps/admin/app/(protected)/rates/page.tsx
import { createServiceRoleClient } from '@/lib/supabase/server'
import RatesClient from './RatesClient'

export default async function RatesPage() {
  const db = createServiceRoleClient()

  const { data: rates } = await db
    .from('rate_versions')
    .select(`
      id,
      template_name,
      effective_from,
      currency,
      mileage_rate_per_km,
      meal_rate_default,
      meal_rate_per_session,
      meal_rate_full_day,
      meal_rate_morning,
      meal_rate_noon,
      meal_rate_evening,
      lodging_rate_default,
      perdiem_rate_myr,
      created_at,
      updated_at,
      profiles:created_by_user_id(display_name, email)
    `)
    .order('template_name', { ascending: true })
    .order('effective_from', { ascending: false })
    .order('created_at', { ascending: false })

  const templateNames = Array.from(new Set((rates ?? []).map((r) => r.template_name).filter(Boolean)))

  return <RatesClient initialRates={rates ?? []} templateNames={templateNames as string[]} />
}
