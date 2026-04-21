export type CurrencyCode = 'MYR'

export type RateFields = {
  currency: CurrencyCode
  mileage_rate_per_km: number
  motorcycle_rate_per_km: number | null
  meal_rate_default: number
  meal_rate_per_session: number
  meal_rate_full_day: number
  meal_rate_morning: number
  meal_rate_noon: number
  meal_rate_evening: number
  lodging_rate_default: number
  perdiem_rate_myr: number
}

export type RateTemplate = RateFields & {
  id: string
  template_name: string | null
  effective_from: string | null
  rate_label: string | null
  notes: string | null
  created_by_user_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type UserRateVersion = RateFields & {
  id: string
  org_id: string
  user_id: string
  source_rate_version_id: string | null
  effective_from: string | null
  rate_label: string | null
  notes: string | null
  created_by_user_id: string | null
  created_at: string | null
  updated_at: string | null
}

export const DEFAULT_RATE_VALUES: RateFields = {
  currency: 'MYR',
  mileage_rate_per_km: 0.6,
  motorcycle_rate_per_km: 0.3,
  meal_rate_default: 26.67,
  meal_rate_per_session: 26.67,
  meal_rate_full_day: 60,
  meal_rate_morning: 20,
  meal_rate_noon: 30,
  meal_rate_evening: 30,
  lodging_rate_default: 120,
  perdiem_rate_myr: 0,
}

function numberOr(...values: Array<number | null | undefined>): number {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const n = Number(value)
    if (!Number.isNaN(n)) return n
  }
  return 0
}

function mealAverage(morning: number, noon: number, evening: number): number {
  return Math.round(((morning + noon + evening) / 3) * 100) / 100
}

export function normalizeRateFields(input?: Partial<RateFields> | null): RateFields {
  const morning = numberOr(input?.meal_rate_morning, DEFAULT_RATE_VALUES.meal_rate_morning)
  const noon = numberOr(input?.meal_rate_noon, DEFAULT_RATE_VALUES.meal_rate_noon)
  const evening = numberOr(input?.meal_rate_evening, DEFAULT_RATE_VALUES.meal_rate_evening)
  const perSession = numberOr(
    input?.meal_rate_per_session,
    input?.meal_rate_default,
    mealAverage(morning, noon, evening),
  )
  const mealDefault = numberOr(input?.meal_rate_default, perSession)

  return {
    currency: 'MYR',
    mileage_rate_per_km: numberOr(
      input?.mileage_rate_per_km,
      DEFAULT_RATE_VALUES.mileage_rate_per_km,
    ),
    motorcycle_rate_per_km: numberOr(
      input?.motorcycle_rate_per_km,
      DEFAULT_RATE_VALUES.motorcycle_rate_per_km ?? 0,
    ),
    meal_rate_default: mealDefault,
    meal_rate_per_session: perSession,
    meal_rate_full_day: numberOr(
      input?.meal_rate_full_day,
      DEFAULT_RATE_VALUES.meal_rate_full_day,
    ),
    meal_rate_morning: morning,
    meal_rate_noon: noon,
    meal_rate_evening: evening,
    lodging_rate_default: numberOr(
      input?.lodging_rate_default,
      DEFAULT_RATE_VALUES.lodging_rate_default,
    ),
    perdiem_rate_myr: numberOr(
      input?.perdiem_rate_myr,
      DEFAULT_RATE_VALUES.perdiem_rate_myr,
    ),
  }
}

export function resolveEffectiveRates(args: {
  userRate?: Partial<UserRateVersion> | null
  templateRate?: Partial<RateTemplate> | null
}): RateFields {
  return normalizeRateFields({
    mileage_rate_per_km:
      args.userRate?.mileage_rate_per_km ?? args.templateRate?.mileage_rate_per_km,
    motorcycle_rate_per_km:
      args.userRate?.motorcycle_rate_per_km ?? args.templateRate?.motorcycle_rate_per_km,
    meal_rate_default:
      args.userRate?.meal_rate_default ?? args.templateRate?.meal_rate_default,
    meal_rate_per_session:
      args.userRate?.meal_rate_per_session ?? args.templateRate?.meal_rate_per_session,
    meal_rate_full_day:
      args.userRate?.meal_rate_full_day ?? args.templateRate?.meal_rate_full_day,
    meal_rate_morning:
      args.userRate?.meal_rate_morning ?? args.templateRate?.meal_rate_morning,
    meal_rate_noon:
      args.userRate?.meal_rate_noon ?? args.templateRate?.meal_rate_noon,
    meal_rate_evening:
      args.userRate?.meal_rate_evening ?? args.templateRate?.meal_rate_evening,
    lodging_rate_default:
      args.userRate?.lodging_rate_default ?? args.templateRate?.lodging_rate_default,
    perdiem_rate_myr:
      args.userRate?.perdiem_rate_myr ?? args.templateRate?.perdiem_rate_myr,
  })
}
