// apps/admin/app/(protected)/layout.tsx
import { requireAdminAuth } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdminAuth('page')
  return <AdminShell ctx={ctx!}>{children}</AdminShell>
}
