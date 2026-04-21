// apps/admin/app/(protected)/members/page.tsx
// Queries ALL profiles first, then their org memberships.
// Users with no org membership still appear — admin can invite them.

import { createServiceRoleClient } from '@/lib/supabase/server'
import MembersClient from './MembersClient'

type Profile = {
  id: string
  email: string | null
  display_name: string | null
  role: string
  created_at: string
}

type OrgName = {
  name: string
}

type MembershipRow = {
  org_id: string
  user_id: string
  org_role: string
  status: string
  created_at: string
  organizations: OrgName | OrgName[] | null
}

type Membership = Omit<MembershipRow, 'organizations'> & {
  organizations: OrgName | null
}

type InviteRow = {
  id: string
  org_id: string
  email: string
  org_role: string
  status: string
  expires_at: string
  created_at: string
  organizations: OrgName | OrgName[] | null
}

type Invite = Omit<InviteRow, 'organizations'> & {
  organizations: OrgName | null
}

type Org = {
  id: string
  name: string
}

type RateTemplate = {
  id: string
  template_name: string | null
  effective_from: string | null
  currency: string | null
  mileage_rate_per_km: number | null
  meal_rate_default: number | null
  meal_rate_per_session: number | null
  meal_rate_full_day: number | null
  meal_rate_morning: number | null
  meal_rate_noon: number | null
  meal_rate_evening: number | null
  lodging_rate_default: number | null
  perdiem_rate_myr: number | null
  created_at?: string | null
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function normalizeMemberships(rows: MembershipRow[] | null | undefined): Membership[] {
  return (rows ?? []).map((row) => ({
    ...row,
    organizations: firstOrNull(row.organizations),
  }))
}

function normalizeInvites(rows: InviteRow[] | null | undefined): Invite[] {
  return (rows ?? []).map((row) => ({
    ...row,
    organizations: firstOrNull(row.organizations),
  }))
}

export default async function MembersPage() {
  const db = createServiceRoleClient()

  const [profilesRes, membersRes, invitesRes, orgsRes, ratesRes] = await Promise.all([
    db.from('profiles')
      .select('id, email, display_name, role, created_at')
      .order('created_at', { ascending: false }),

    db.from('org_members')
      .select('org_id, user_id, org_role, status, created_at, organizations(name)')
      .order('created_at', { ascending: false }),

    db.from('invitations')
      .select('id, org_id, email, org_role, status, expires_at, created_at, organizations(name)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false }),

    db.from('organizations')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name'),

    db.from('rate_versions')
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
        created_at
      `)
      .order('template_name', { ascending: true })
      .order('effective_from', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  return (
    <MembersClient
      initialProfiles={(profilesRes.data ?? []) as Profile[]}
      initialMemberships={normalizeMemberships((membersRes.data ?? []) as MembershipRow[])}
      initialInvitations={normalizeInvites((invitesRes.data ?? []) as InviteRow[])}
      orgs={(orgsRes.data ?? []) as Org[]}
      rateTemplates={(ratesRes.data ?? []) as RateTemplate[]}
    />
  )
}