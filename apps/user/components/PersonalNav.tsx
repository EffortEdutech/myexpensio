'use client'
// components/PersonalNav.tsx
// Bottom nav shown only inside the Personal Space (/personal/*).
// 4 tabs: Dashboard · Expenses · Add · Tax

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = { href: string; label: string; icon: string }

const TABS: Tab[] = [
  { href: '/personal',          label: 'Dashboard', icon: '📊' },
  { href: '/personal/expenses', label: 'Expenses',  icon: '💸' },
  { href: '/personal/add',      label: 'Add',       icon: '➕' },
  { href: '/personal/tax',      label: 'Tax',       icon: '🧾' },
]

export function PersonalNav() {
  const pathname = usePathname()

  return (
    <nav style={S.nav}>
      {TABS.map(tab => {
        const active = tab.href === '/personal'
          ? pathname === '/personal'
          : pathname.startsWith(tab.href)
        return (
          <Link key={tab.href} href={tab.href} style={S.tab}>
            <span style={{ fontSize: 22, filter: active ? 'none' : 'grayscale(100%) opacity(40%)' }}>
              {tab.icon}
            </span>
            <span style={{ ...S.label, color: active ? '#0f172a' : '#94a3b8', fontWeight: active ? 700 : 400 }}>
              {tab.label}
            </span>
            {active && <span style={S.dot} />}
          </Link>
        )
      })}
    </nav>
  )
}

const S: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
    backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0',
    display: 'flex', alignItems: 'stretch', zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  tab: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 1, textDecoration: 'none', position: 'relative', paddingTop: 4,
  },
  label: { fontSize: 10, lineHeight: 1, whiteSpace: 'nowrap' },
  dot: {
    position: 'absolute', top: 3, width: 4, height: 4,
    borderRadius: '50%', backgroundColor: '#0f172a',
  },
}
