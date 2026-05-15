'use client'
// apps/user/components/ProfileDropdown.tsx
//
// Gear icon in the app header. Clicking opens a dropdown showing:
//   • Display name (or email prefix)
//   • Full email
//   • Subscription badge (★ Pro / Free)
//   • Settings link → /settings
//   • Sign Out button
//
// Receives all data as props from the server layout so this stays a
// thin client component with no additional data fetching.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Props = {
  displayName: string
  email:       string
  subLabel:    string   // e.g. '★ Pro' or 'Free'
  isPro:       boolean
}

export function ProfileDropdown({ displayName, email, subLabel, isPro }: Props) {
  const router              = useRouter()
  const [open, setOpen]     = useState(false)
  const wrapRef             = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div ref={wrapRef} style={S.wrap}>
      {/* Gear button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ ...S.gearBtn, backgroundColor: open ? '#f1f5f9' : 'transparent' }}
        aria-label="Profile & settings"
      >
        ⚙️
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={S.panel}>
          {/* User info */}
          <div style={S.userBlock}>
            <div style={S.avatar}>{displayName.slice(0, 1).toUpperCase()}</div>
            <div style={S.userInfo}>
              <div style={S.displayName}>{displayName}</div>
              <div style={S.emailText}>{email}</div>
            </div>
          </div>

          {/* Subscription badge */}
          <div style={S.subRow}>
            <span style={{ ...S.subBadge, backgroundColor: isPro ? '#fef9c3' : '#f1f5f9', color: isPro ? '#854d0e' : '#475569' }}>
              {subLabel}
            </span>
          </div>

          <div style={S.divider} />

          {/* Settings link */}
          <Link href="/settings" style={S.menuItem} onClick={() => setOpen(false)}>
            <span>⚙️</span>
            <span>Settings</span>
          </Link>

          <div style={S.divider} />

          {/* Sign out */}
          <button onClick={handleSignOut} style={S.signOutBtn}>
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative',
    flexShrink: 0,
  },
  gearBtn: {
    fontSize: 20,
    border: 'none',
    cursor: 'pointer',
    borderRadius: 8,
    padding: '4px 6px',
    lineHeight: 1,
    transition: 'background 0.15s',
  },
  panel: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 6,
    width: 240,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
    border: '1px solid #e2e8f0',
    zIndex: 200,
    overflow: 'hidden',
  },
  userBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 14px 10px',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  displayName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emailText: {
    fontSize: 11,
    color: '#94a3b8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  subRow: {
    padding: '0 14px 12px',
  },
  subBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 20,
    display: 'inline-block',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: 500,
    color: '#0f172a',
    textDecoration: 'none',
    transition: 'background 0.1s',
    cursor: 'pointer',
  },
  signOutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: 500,
    color: '#dc2626',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
}
