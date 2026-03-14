// apps/admin/app/(protected)/members/page.tsx
// Queries ALL profiles first, then their org memberships.
// Users with no org membership still appear — admin can invite them.

import { createServiceRoleClient } from '@/lib/supabase/server'
import MembersClient from './MembersClient'

export default async function MembersPage() {
  const db = createServiceRoleClient()

  const [profilesRes, membersRes, invitesRes, orgsRes] = await Promise.all([
    // ALL users on the platform — this is the primary list
    db.from('profiles')
      .select('id, email, display_name, role, created_at')
      .order('created_at', { ascending: false }),

    // All org memberships (joined to profiles client-side)
    db.from('org_members')
      .select('org_id, user_id, org_role, status, created_at, organizations(name)')
      .order('created_at', { ascending: false }),

    // Pending invitations
    db.from('invitations')
      .select('id, org_id, email, org_role, status, expires_at, created_at, organizations(name)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false }),

    // Active orgs for invite form selector
    db.from('organizations')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name'),
  ])

  return (
    <MembersClient
      initialProfiles={profilesRes.data ?? []}
      initialMemberships={membersRes.data ?? []}
      initialInvitations={invitesRes.data ?? []}
      orgs={orgsRes.data ?? []}
    />
  )
}
