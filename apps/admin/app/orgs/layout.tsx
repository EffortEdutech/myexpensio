// apps/admin/app/orgs/layout.tsx
// Auth wrapper for /orgs/* pages.
// Mirrors the (protected)/layout.tsx so internal-staff-only orgs pages
// get the same WorkspaceShell without being in the (protected) route group.

import { requireWorkspaceAuth } from '@/lib/workspace-auth'
import WorkspaceShell from '@/components/WorkspaceShell'

export default async function OrgsLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireWorkspaceAuth('page')
  return <WorkspaceShell ctx={ctx!}>{children}</WorkspaceShell>
}
