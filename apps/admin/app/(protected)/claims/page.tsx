// apps/admin/app/(protected)/claims/page.tsx
//
// All claims across all orgs — filterable by org, user, status, date range.
// Server component: fetches orgs + users for filter dropdowns, then renders ClaimsClient.

import { createServiceRoleClient } from '@/lib/supabase/server'
import ClaimsClient from './ClaimsClient'

type Org = {
  id: string
  name: string
  display_name: string | null
}

type ClaimRelationOrg = {
  name: string
  display_name: string | null
}

type ClaimRelationProfile = {
  display_name: string | null
  email: string | null
}

type ClaimRow = {
  id: string
  org_id: string
  user_id: string
  status: 'DRAFT' | 'SUBMITTED'
  title: string | null
  total_amount: number
  currency: string
  period_start: string | null
  period_end: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
  organizations: ClaimRelationOrg | ClaimRelationOrg[] | null
  profiles: ClaimRelationProfile | ClaimRelationProfile[] | null
}

type Claim = Omit<ClaimRow, 'organizations' | 'profiles'> & {
  organizations: ClaimRelationOrg | null
  profiles: ClaimRelationProfile | null
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function normalizeClaims(rows: ClaimRow[] | null | undefined): Claim[] {
  return (rows ?? []).map((row) => ({
    ...row,
    organizations: firstOrNull(row.organizations),
    profiles: firstOrNull(row.profiles),
  }))
}

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

  const initialClaims = normalizeClaims((claimsRes.data ?? []) as ClaimRow[])

  return (
    <ClaimsClient
      initialClaims={initialClaims}
      orgs={(orgsRes.data ?? []) as Org[]}
    />
  )
}