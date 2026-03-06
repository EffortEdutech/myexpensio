// apps/user/app/(app)/layout.tsx
// Protected shell layout — wraps all app pages (home/trips/claims/settings).
// Responsibilities:
//   1. Bootstrap personal org silently on first load (idempotent)
//   2. Inject org context into a data attribute for client reads
//   3. Render top header (logo + user email + sign out)
//   4. Render bottom nav tabs
//   5. Add bottom padding so content clears the nav bar

import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bootstrapOrg } from '@/lib/org'
import { Nav } from '@/components/Nav'
import { SignOutButton } from '@/components/SignOutButton'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  // Verify session — middleware already guards this, but double-check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Silent org bootstrap — creates personal org if user has none yet
  const org = await bootstrapOrg()

  return (
    <div style={S.root}>
      {/* ── Top header ───────────────────────────────────────────────── */}
      <header style={S.header}>
        <span style={S.logo}>myexpensio</span>
        <div style={S.headerRight}>
          {org && (
            <span style={S.orgBadge}>
              {org.tier === 'PRO' ? '★ Pro' : 'Free'}
            </span>
          )}
          <span style={S.email}>{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────────── */}
      <main style={S.main}>
        {children}
      </main>

      {/* ── Bottom nav ───────────────────────────────────────────────── */}
      <Nav />
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight:       '100vh',
    backgroundColor: '#f8fafc',
    fontFamily:      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    position:        'fixed',
    top:             0,
    left:            0,
    right:           0,
    height:          52,
    backgroundColor: '#ffffff',
    borderBottom:    '1px solid #e2e8f0',
    display:         'flex',
    alignItems:      'center',
    padding:         '0 16px',
    zIndex:          100,
    gap:             12,
  },
  logo: {
    fontSize:      16,
    fontWeight:    800,
    color:         '#0f172a',
    letterSpacing: '-0.5px',
    flex:          1,
  },
  headerRight: {
    display:    'flex',
    alignItems: 'center',
    gap:        10,
  },
  orgBadge: {
    fontSize:        11,
    fontWeight:      600,
    padding:         '2px 8px',
    backgroundColor: '#f1f5f9',
    borderRadius:    12,
    color:           '#475569',
  },
  email: {
    fontSize: 12,
    color:    '#94a3b8',
    maxWidth: 140,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  main: {
    paddingTop:    52 + 16,   // header height + gap
    paddingBottom: 64 + 16,   // nav height + gap
    paddingLeft:   16,
    paddingRight:  16,
    maxWidth:      640,
    margin:        '0 auto',
  },
}
