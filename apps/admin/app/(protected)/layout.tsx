// apps/admin/app/(protected)/layout.tsx
//
// Layout for all protected admin pages.
// Wraps content in AdminShell (sidebar + topbar).
// requireAdminAuth() here is a safety net; middleware already checked.

import { requireAdminAuth } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Belt-and-suspenders: if middleware somehow passed but user is not valid
  const ctx = await requireAdminAuth('page')

  return <AdminShell ctx={ctx!}>{children}</AdminShell>
}
