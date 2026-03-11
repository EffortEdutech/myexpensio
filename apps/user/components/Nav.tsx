'use client'
// apps/user/components/Nav.tsx
// Bottom tab navigation bar — shared across all (app) pages.
// 6 tabs: Home · Trips · Claims · Transactions · Exports · Settings
// Slightly smaller icons + labels to fit 6 tabs on narrow screens.

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = {
  href:       string
  label:      string
  icon:       string
  iconActive: string
}

const TABS: Tab[] = [
  { href: '/home',         label: 'Home',         icon: '🏠',  iconActive: '🏠'  },
  { href: '/trips',        label: 'Trips',        icon: '🗺️',  iconActive: '🗺️'  },
  { href: '/claims',       label: 'Claims',       icon: '📋',  iconActive: '📋'  },
  { href: '/transactions', label: 'Transactions', icon: '💳',  iconActive: '💳'  },
  { href: '/exports',      label: 'Export',       icon: '📤',  iconActive: '📤'  },
  { href: '/settings',     label: 'Settings',     icon: '⚙️',  iconActive: '⚙️'  },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav style={S.nav}>
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link key={tab.href} href={tab.href} style={S.tab}>
            <span style={{
              fontSize: 20,
              filter: active ? 'none' : 'grayscale(100%) opacity(40%)',
              transition: 'filter 0.15s',
            }}>
              {active ? tab.iconActive : tab.icon}
            </span>
            <span style={{
              ...S.label,
              color:      active ? '#0f172a' : '#94a3b8',
              fontWeight: active ? 700 : 400,
            }}>
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
    position:         'fixed',
    bottom:           0,
    left:             0,
    right:            0,
    height:           60,
    backgroundColor:  '#ffffff',
    borderTop:        '1px solid #e2e8f0',
    display:          'flex',
    alignItems:       'stretch',
    zIndex:           100,
    paddingBottom:    'env(safe-area-inset-bottom)',
  },
  tab: {
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            1,
    textDecoration: 'none',
    position:       'relative',
    paddingTop:     4,
    minWidth:       0,          // allow tabs to shrink below content width
  },
  label: {
    fontSize:     9,
    lineHeight:   1,
    whiteSpace:   'nowrap',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    maxWidth:     '100%',
    paddingLeft:  2,
    paddingRight: 2,
  },
  dot: {
    position:         'absolute',
    top:              3,
    width:            4,
    height:           4,
    borderRadius:     '50%',
    backgroundColor:  '#0f172a',
  },
}
