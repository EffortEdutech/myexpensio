'use client'
// components/BusinessNav.tsx
// Bottom nav for Business Space (/business/*).
// Green accent — 5 tabs: Dashboard · Income · Add · Expenses · Reports
// Centre Add tab is the primary action (raised, filled button).

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ACCENT    = '#16a34a' // green — business space colour
const ACCENT_BG = '#f0fdf4'

type Tab = {
  href:     string
  label:    string
  icon:     string
  exact?:   boolean
  primary?: boolean  // renders as the raised centre button
  disabled?: boolean // not yet built — greyed out
}

const TABS: Tab[] = [
  { href: '/business',             label: 'Dashboard', icon: '📊', exact: true },
  { href: '/business/income',      label: 'Income',    icon: '💵' },
  { href: '/business/add-income',  label: 'Add',       icon: '+',  primary: true },
  { href: '/business/expenses',    label: 'Expenses',  icon: '💸' },
  { href: '/business/reports',     label: 'Reports',   icon: '📈', disabled: true },
]

export function BusinessNav() {
  const pathname = usePathname()

  return (
    <nav style={S.nav}>
      {/* thin space-colour accent strip at top */}
      <div style={{ ...S.accentBar, backgroundColor: ACCENT }} />

      {/* small space label */}
      <div style={S.spaceLabel}>Business Space</div>

      <div style={S.tabs}>
        {TABS.map(tab => {
          const active = !tab.disabled && (
            tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href)
          )

          if (tab.primary) {
            return (
              <Link key={tab.href} href={tab.href} style={S.tab}>
                <div style={{
                  ...S.addCircle,
                  backgroundColor: ACCENT,
                  boxShadow: '0 4px 12px rgba(22,163,74,0.4)',
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

          if (tab.disabled) {
            return (
              <div key={tab.href} style={{ ...S.tab, cursor: 'default' }}>
                <div style={{ ...S.iconWrap, backgroundColor: 'transparent' }}>
                  <span style={{ fontSize: 20, filter: 'grayscale(100%) opacity(25%)' }}>
                    {tab.icon}
                  </span>
                </div>
                <span style={{ ...S.label, color: '#cbd5e1', fontWeight: 400 }}>
                  {tab.label}
                </span>
              </div>
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
    color: '#16a34a', letterSpacing: '0.08em',
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
