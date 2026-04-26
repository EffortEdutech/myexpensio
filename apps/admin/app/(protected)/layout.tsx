// apps/admin/app/(protected)/layout.tsx
// Switches from requireAdminAuth (Console-only) to requireWorkspaceAuth
// which admits both internal staff AND customer workspace admins.

import { requireWorkspaceAuth } from '@/lib/workspace-auth'
import WorkspaceShell from '@/components/WorkspaceShell'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireWorkspaceAuth('page')
  return <WorkspaceShell ctx={ctx!}>{children}</WorkspaceShell>
}
