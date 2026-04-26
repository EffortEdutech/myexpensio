import { requireConsoleAuth } from '@/lib/auth'
import ConsoleShell from '@/components/ConsoleShell'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireConsoleAuth('page')
  return <ConsoleShell ctx={ctx!}>{children}</ConsoleShell>
}
