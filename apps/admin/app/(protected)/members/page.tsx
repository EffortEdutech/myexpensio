// apps/admin/app/(protected)/members/page.tsx
//
// Members management page.
// Server component for initial data fetch; client islands for interactions.

import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import MembersClient from './MembersClient'

async function fetchMembers(orgId: string) {
  const db = createServiceRoleClient()

  const [membersRes, invitesRes] = await Promise.all([
    db
      .from('org_members')
      .select(`
        org_id, user_id, org_role, status, created_at,
        profiles ( id, email, display_name )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: true }),

    db
      .from('invitations')
      .select('id, email, org_role, status, expires_at, created_at')
      .eq('org_id', orgId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false }),
  ])

  return {
    members:     membersRes.data  ?? [],
    invitations: invitesRes.data  ?? [],
  }
}

export default async function MembersPage() {
  const ctx = await requireAdminAuth('page')
  if (!ctx!.orgId) {
    return (
      <div className="text-sm text-gray-500">
        Select an organisation to manage members.
      </div>
    )
  }

  const { members, invitations } = await fetchMembers(ctx!.orgId)

  return (
    <MembersClient
      initialMembers={members}
      initialInvitations={invitations}
      currentUserId={ctx!.userId}
      currentOrgRole={ctx!.orgRole}
      isPlatformAdmin={ctx!.isPlatformAdmin}
    />
  )
}
