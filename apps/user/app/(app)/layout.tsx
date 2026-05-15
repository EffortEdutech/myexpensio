// apps/user/app/(app)/layout.tsx
// Protected shell layout — wraps all app pages (home/trips/claims/settings).
// Header: logo | SpaceSwitcher | ⚙️ ProfileDropdown
// Settings + Sign Out are inside the ProfileDropdown gear menu.

import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bootstrapOrg } from '@/lib/org'
import { SmartNav } from '@/components/SmartNav'
import { OnlineStatusBanner } from '@/components/OnlineStatusBanner'
import { SpaceSwitcher } from '@/components/SpaceSwitcher'
import { ProfileDropdown } from '@/components/ProfileDropdown'
import { TrialBanner } from '@/components/TrialBanner'
import { getUserSubscription } from '@/lib/subscription'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await bootstrapOrg()

  // Resolve display name: prefer full_name from user metadata, fall back to email prefix
  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    'User'

  // Subscription badge in header
  const sub      = await getUserSubscription()
  const isPro    = sub.tier === 'PRO' || sub.tier === 'PREMIUM'
  const subLabel = sub.tier === 'PREMIUM' ? '★ Premium'
    : sub.tier === 'PRO'     ? '★ Pro'
    : sub.is_trial           ? 'Trial'
    : 'Free'

  return (
    <div style={S.root}>
      <header style={S.header}>
        <span style={S.logo}>myexpensio</span>
        <SpaceSwitcher />
        <ProfileDropdown
          displayName={displayName}
          email={user.email ?? ''}
          subLabel={subLabel}
          isPro={isPro}
        />
      </header>

      <main style={S.main}>
        <OnlineStatusBanner />
        <TrialBanner />
        {children}
      </main>

      <SmartNav />
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  root:   { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { position: 'fixed', top: 0, left: 0, right: 0, height: 52, backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 16px', zIndex: 100, gap: 12 },
  logo:   { fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', flex: 1 },
  main:   { display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 68, paddingBottom: 80, paddingLeft: 16, paddingRight: 16, maxWidth: 640, margin: '0 auto' },
}
