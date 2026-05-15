'use client'
// components/TrialBanner.tsx
//
// Shows a contextual banner for trial users:
//   • Amber  — trial active, X days remaining → "Upgrade" link
//   • Red    — trial expired, access locked   → "Upgrade to continue" link
//   • Hidden — PRO / PREMIUM users (is_trial = false, status = 'ACTIVE')

import { useEffect, useState } from 'react'
import Link from 'next/link'

type BannerState =
  | { kind: 'hidden' }
  | { kind: 'trial';   daysLeft: number }
  | { kind: 'expired' }

export function TrialBanner() {
  const [banner, setBanner] = useState<BannerState>({ kind: 'hidden' })

  useEffect(() => {
    fetch('/api/subscription')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'EXPIRED') {
          setBanner({ kind: 'expired' })
        } else if (d.is_trial && d.trial_days_left != null) {
          setBanner({ kind: 'trial', daysLeft: d.trial_days_left })
        } else {
          setBanner({ kind: 'hidden' })
        }
      })
      .catch(() => setBanner({ kind: 'hidden' }))
  }, [])

  if (banner.kind === 'hidden') return null

  if (banner.kind === 'expired') {
    return (
      <div style={{ ...S.base, ...S.expired }}>
        <span>🔒 Your free trial has ended.</span>
        <Link href="/upgrade" style={{ ...S.link, color: '#dc2626' }}>
          Upgrade to continue →
        </Link>
      </div>
    )
  }

  // trial active
  const { daysLeft } = banner
  const urgent = daysLeft <= 3

  return (
    <div style={{ ...S.base, ...(urgent ? S.urgent : S.trial) }}>
      <span>
        ⏳ <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> left in your free trial.
      </span>
      <Link href="/upgrade" style={{ ...S.link, color: urgent ? '#92400e' : '#1d4ed8' }}>
        Upgrade now →
      </Link>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  base: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            12,
    borderRadius:   10,
    padding:        '10px 14px',
    fontSize:       13,
    lineHeight:     1.5,
    flexWrap:       'wrap',
  },
  trial: {
    backgroundColor: '#eff6ff',
    border:          '1px solid #bfdbfe',
    color:           '#1e40af',
  },
  urgent: {
    backgroundColor: '#fff7ed',
    border:          '1px solid #fed7aa',
    color:           '#92400e',
  },
  expired: {
    backgroundColor: '#fef2f2',
    border:          '1px solid #fecaca',
    color:           '#991b1b',
  },
  link: {
    fontWeight:     700,
    textDecoration: 'none',
    whiteSpace:     'nowrap',
  },
}
