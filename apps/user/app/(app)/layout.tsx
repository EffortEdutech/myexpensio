// apps/user/app/(app)/layout.tsx
// Protected shell layout — wraps all app pages (home/trips/claims/settings).

import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bootstrapOrg } from '@/lib/org'
import { Nav } from '@/components/Nav'
import { SignOutButton } from '@/components/SignOutButton'
import { OnlineStatusBanner } from '@/components/OnlineStatusBanner'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const org = await bootstrapOrg()

  return (
    <div style={S.root}>
      <header style={S.header}>
        <span style={S.logo}>myexpensio</span>
        <div style={S.headerRight}>
          {org && <span style={S.orgBadge}>{org.tier === 'PRO' ? '★ Pro' : 'Free'}</span>}
          <span style={S.email}>{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <main style={S.main}>
        <OnlineStatusBanner />
        {children}
      </main>

      <Nav />
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { position: 'fixed', top: 0, left: 0, right: 0, height: 52, backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 16px', zIndex: 100, gap: 12 },
  logo: { fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', flex: 1 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  orgBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', backgroundColor: '#f1f5f9', borderRadius: 12, color: '#475569' },
  email: { fontSize: 12, color: '#94a3b8', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  main: { display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 68, paddingBottom: 80, paddingLeft: 16, paddingRight: 16, maxWidth: 640, margin: '0 auto' },
}
