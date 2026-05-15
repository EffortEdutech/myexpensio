'use client'
// components/PremiumGate.tsx
//
// Wraps any PREMIUM-only UI section (My Earning / Business space).
// Reads tier from /api/subscription — single source of truth.
//
// Usage:
//   <PremiumGate>
//     <BusinessDashboard />
//   </PremiumGate>

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Props = {
  children: React.ReactNode
  feature?: string
}

export function PremiumGate({ children, feature = 'My Earning' }: Props) {
  const [status, setStatus] = useState<'loading' | 'allowed' | 'locked'>('loading')

  useEffect(() => {
    fetch('/api/subscription')
      .then(r => r.json())
      .then(d => setStatus(d.can_business ? 'allowed' : 'locked'))
      .catch(() => setStatus('locked'))
  }, [])

  if (status === 'loading') return <div style={S.loading}>Loading…</div>
  if (status === 'allowed') return <>{children}</>

  return (
    <div style={S.gate}>
      <div style={S.icon}>🔒</div>
      <h2 style={S.title}>Premium Feature</h2>
      <p style={S.desc}>
        Unlock {feature} with a myexpensio <strong>Premium</strong> plan —
        the complete income and tax tracker for freelancers and business owners.
      </p>
      <div style={S.benefits}>
        {[
          '💵  Income tracking',
          '💸  Business expense categorisation',
          '📊  Monthly profit dashboard',
          '📄  P&L report PDF',
          '🧾  LHDN tax estimation summary',
        ].map(b => (
          <div key={b} style={S.benefit}>{b}</div>
        ))}
      </div>
      <Link href="/upgrade" style={S.cta}>View Plans →</Link>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  loading: { textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 14 },
  gate:    { backgroundColor: '#ffffff', borderRadius: 20, padding: '32px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  icon:    { fontSize: 40 },
  title:   { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 },
  desc:    { fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0, maxWidth: 300 },
  benefits:{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 280 },
  benefit: { textAlign: 'left', fontSize: 14, color: '#374151', backgroundColor: '#f8fafc', borderRadius: 8, padding: '9px 14px' },
  cta:     { backgroundColor: '#0f172a', color: '#ffffff', padding: '13px 32px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' },
}
