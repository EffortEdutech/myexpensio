// apps/admin/app/(protected)/rates/page.tsx
import { createServiceRoleClient } from '@/lib/supabase/server'
import RatesClient from './RatesClient'

type RateProfile = {
  display_name: string | null
  email: string | null
}

type RateRow = {
  id: string
  template_name: string | null
  effective_from: string | null
  currency: string | null
  mileage_rate_per_km: number | null
  motorcycle_rate_per_km: number | null
  meal_rate_default: number | null
  meal_rate_per_session: number | null
  meal_rate_full_day: number | null
  meal_rate_morning: number | null
  meal_rate_noon: number | null
  meal_rate_evening: number | null
  lodging_rate_default: number | null
  perdiem_rate_myr: number | null
  created_at: string | null
  updated_at: string | null
  profiles: RateProfile | RateProfile[] | null
}

type ClientRate = {
  id: string
  template_name: string | null
  effective_from: string
  currency: string
  mileage_rate_per_km: number
  motorcycle_rate_per_km: number | null
  meal_rate_default: number | null
  meal_rate_per_session: number | null
  meal_rate_full_day: number | null
  meal_rate_morning: number | null
  meal_rate_noon: number | null
  meal_rate_evening: number | null
  lodging_rate_default: number | null
  perdiem_rate_myr: number
  created_at: string
  updated_at: string
  profiles: RateProfile | null
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function normalizeRates(rows: RateRow[] | null | undefined): ClientRate[] {
  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  return (rows ?? []).map((row) => ({
    id: row.id,
    template_name: row.template_name,
    effective_from: row.effective_from ?? row.created_at?.slice(0, 10) ?? today,
    currency: row.currency ?? 'MYR',
    mileage_rate_per_km: Number(row.mileage_rate_per_km ?? 0),
    motorcycle_rate_per_km:
      row.motorcycle_rate_per_km == null ? null : Number(row.motorcycle_rate_per_km),
    meal_rate_default:
      row.meal_rate_default == null ? null : Number(row.meal_rate_default),
    meal_rate_per_session:
      row.meal_rate_per_session == null ? null : Number(row.meal_rate_per_session),
    meal_rate_full_day:
      row.meal_rate_full_day == null ? null : Number(row.meal_rate_full_day),
    meal_rate_morning:
      row.meal_rate_morning == null ? null : Number(row.meal_rate_morning),
    meal_rate_noon:
      row.meal_rate_noon == null ? null : Number(row.meal_rate_noon),
    meal_rate_evening:
      row.meal_rate_evening == null ? null : Number(row.meal_rate_evening),
    lodging_rate_default:
      row.lodging_rate_default == null ? null : Number(row.lodging_rate_default),
    perdiem_rate_myr: Number(row.perdiem_rate_myr ?? 0),
    created_at: row.created_at ?? now,
    updated_at: row.updated_at ?? row.created_at ?? now,
    profiles: firstOrNull(row.profiles),
  }))
}

export default async function RatesPage() {
  const db = createServiceRoleClient()

  const { data } = await db
    .from('rate_versions')
    .select(`
      id,
      template_name,
      effective_from,
      currency,
      mileage_rate_per_km,
      motorcycle_rate_per_km,
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

  const rates = normalizeRates((data ?? []) as RateRow[])
  const templateNames = Array.from(new Set(rates.map((r) => r.template_name).filter(Boolean)))

  return <RatesClient initialRates={rates} templateNames={templateNames as string[]} />
}