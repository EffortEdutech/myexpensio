'use client'
// components/PersonalNav.tsx
// Bottom nav for Personal Expense space (/personal/*).
// Indigo accent — 5 tabs: Home · Expenses · + · Bills · Tax
// Add sits dead-centre (position 3 of 5) — perfectly symmetric.

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ACCENT    = '#4f46e5' // indigo — personal space colour
const ACCENT_BG = '#eef2ff'

type Tab = {
  href:     string
  label:    string
  icon:     string
  exact?:   boolean
  primary?: boolean   // renders as the raised centre button
}

const TABS: Tab[] = [
  { href: '/personal',          label: 'Home',     icon: '🏠', exact: true },
  { href: '/personal/expenses', label: 'Expenses', icon: '💸' },
  { href: '/personal/add',      label: 'Add',      icon: '+',  primary: true },
  { href: '/personal/bills',    label: 'Bills',    icon: '📋' },
  { href: '/personal/tax',      label: 'Tax',      icon: '🧾' },
]

export function PersonalNav() {
  const pathname = usePathname()

  return (
    <nav style={S.nav}>
      {/* thin space-colour accent strip at top */}
      <div style={{ ...S.accentBar, backgroundColor: ACCENT }} />

      {/* space label — right-justified so the + button never covers it */}
      <div style={S.spaceLabel}>Personal Expense</div>

      <div style={S.tabs}>
        {TABS.map(tab => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)

          if (tab.primary) {
            return (
              <Link key={tab.href} href={tab.href} style={S.tab}>
                <div style={{
                  ...S.addCircle,
                  backgroundColor: ACCENT,
                  boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}>
                  <span style={S.addIcon}>+</span>
                </div>
                <span style={{ ...S.label, color: active ? ACCENT : '#94a3b8', fontWeight: active ? 700 : 500 }}>
                  Add
                </span>
              </Link>
            )
          }

          return (
            <Link key={tab.href} href={tab.href} style={S.tab}>
              <div style={{
                ...S.iconWrap,
                backgroundColor: active ? ACCENT_BG : 'transparent',
              }}>
                <span style={{ fontSize: 20, filter: active ? 'none' : 'grayscale(100%) opacity(45%)' }}>
                  {tab.icon}
                </span>
              </div>
              <span style={{ ...S.label, color: active ? ACCENT : '#94a3b8', fontWeight: active ? 700 : 400 }}>
                {tab.label}
              </span>
              {active && <span style={{ ...S.dot, backgroundColor: ACCENT }} />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

const S: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    paddingBottom: 'env(safe-area-inset-bottom)',
    zIndex: 100,
  },
  accentBar: {
    height: 3, width: '100%',
  },
  spaceLabel: {
    textAlign: 'right', fontSize: 9, fontWeight: 600,
    color: '#4f46e5', letterSpacing: '0.08em',
    textTransform: 'uppercase', paddingTop: 3,
    paddingRight: 14, opacity: 0.7,
  },
  tabs: {
    display: 'flex', alignItems: 'flex-end', height: 52,
  },
  tab: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 8, gap: 2,
    textDecoration: 'none', position: 'relative',
  },
  iconWrap: {
    width: 36, height: 28, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background-color 0.15s',
  },
  addCircle: {
    width: 44, height: 44, borderRadius: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 2, transition: 'transform 0.15s',
    position: 'relative', top: -8,
  },
  addIcon: {
    fontSize: 26, fontWeight: 300, color: '#ffffff', lineHeight: 1,
    display: 'block', marginTop: -2,
  },
  label: { fontSize: 10, lineHeight: 1 },
  dot: {
    position: 'absolute', top: 4, width: 4, height: 4,
    borderRadius: '50%',
  },
}
