'use client'
// components/SpaceSwitcher.tsx
//
// Header component — shows the active financial space and lets the user switch.
// Fetches available spaces from GET /api/spaces on mount.
// Navigates to /personal or / (work) on selection.
//
// Spaces:
//   WORK     → / (existing dashboard, default)
//   PERSONAL → /personal
//   BUSINESS → /business  (Premium only — shows lock if not subscribed)

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type Space = {
  id:         string
  type:       'PERSONAL' | 'BUSINESS' | 'WORK'
  name:       string
  is_default: boolean
}

const SPACE_META: Record<string, { icon: string; label: string; href: string }> = {
  WORK:     { icon: '💼', label: 'Work Claims',      href: '/'         },
  PERSONAL: { icon: '👤', label: 'Personal Expense', href: '/personal' },
  BUSINESS: { icon: '🏢', label: 'My Income',        href: '/business' },
}

function deriveActiveType(pathname: string): string {
  if (pathname.startsWith('/personal')) return 'PERSONAL'
  if (pathname.startsWith('/business')) return 'BUSINESS'
  return 'WORK'
}

export function SpaceSwitcher() {
  const pathname             = usePathname()
  const router               = useRouter()
  const [spaces, setSpaces]  = useState<Space[]>([])
  const [open, setOpen]      = useState(false)
  const ref                  = useRef<HTMLDivElement>(null)

  const activeType = deriveActiveType(pathname)
  const activeMeta = SPACE_META[activeType]

  useEffect(() => {
    fetch('/api/spaces')
      .then(r => r.json())
      .then(d => {
        const fetched: Space[] = d.spaces ?? []
        // Always show WORK; add fetched spaces; always offer PERSONAL
        const types = new Set(fetched.map((s: Space) => s.type))
        if (!types.has('PERSONAL')) {
          fetched.push({ id: 'personal', type: 'PERSONAL', name: 'Personal', is_default: false })
        }
        setSpaces(fetched)
      })
      .catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelect(type: string) {
    setOpen(false)
    const meta = SPACE_META[type]
    if (meta) router.push(meta.href)
  }

  // Build display list: WORK + fetched + BUSINESS teaser if not present
  const displayTypes: string[] = ['WORK', 'PERSONAL']
  const hasBusinessSpace = spaces.some(s => s.type === 'BUSINESS')
  if (hasBusinessSpace) displayTypes.push('BUSINESS')
  else displayTypes.push('BUSINESS_LOCKED')

  return (
    <div ref={ref} style={S.wrap}>
      <button onClick={() => setOpen(o => !o)} style={S.pill}>
        <span>{activeMeta.icon}</span>
        <span style={S.pillLabel}>{activeMeta.label}</span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={S.dropdown}>
          {displayTypes.map(type => {
            const locked = type === 'BUSINESS_LOCKED'
            const key    = locked ? 'BUSINESS' : type
            const meta   = SPACE_META[key]
            const active = key === activeType
            return (
              <button
                key={type}
                onClick={() => !locked && handleSelect(key)}
                style={{
                  ...S.option,
                  backgroundColor: active ? '#f1f5f9' : 'transparent',
                  opacity: locked ? 0.5 : 1,
                  cursor:  locked ? 'not-allowed' : 'pointer',
                }}
              >
                <span style={{ fontSize: 18 }}>{meta.icon}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span style={S.optionLabel}>{meta.label}</span>
                  {locked && <span style={S.premiumBadge}> Premium</span>}
                </span>
                {active && <span style={{ color: '#0f172a', fontSize: 12 }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative',
  },
  pill: {
    display:         'flex',
    alignItems:      'center',
    gap:             5,
    padding:         '4px 10px',
    borderRadius:    20,
    border:          '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    cursor:          'pointer',
    fontSize:        12,
    fontWeight:      600,
    color:           '#0f172a',
    whiteSpace:      'nowrap',
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: 600,
  },
  dropdown: {
    position:        'absolute',
    top:             'calc(100% + 6px)',
    left:            0,
    minWidth:        180,
    backgroundColor: '#ffffff',
    border:          '1px solid #e2e8f0',
    borderRadius:    12,
    boxShadow:       '0 4px 16px rgba(0,0,0,0.10)',
    zIndex:          200,
    overflow:        'hidden',
    padding:         4,
  },
  option: {
    display:        'flex',
    alignItems:     'center',
    gap:            10,
    width:          '100%',
    padding:        '10px 12px',
    border:         'none',
    borderRadius:   8,
    fontSize:       14,
    fontFamily:     'inherit',
    transition:     'background 0.1s',
  },
  optionLabel: {
    fontWeight: 500,
    color: '#0f172a',
  },
  premiumBadge: {
    fontSize:        10,
    fontWeight:      700,
    color:           '#7c3aed',
    backgroundColor: '#f5f3ff',
    padding:         '1px 5px',
    borderRadius:    6,
  },
}
