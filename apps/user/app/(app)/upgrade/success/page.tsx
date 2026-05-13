'use client'
// apps/user/app/(app)/upgrade/success/page.tsx
// Shown after successful Stripe checkout for Premium.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UpgradeSuccess() {
  const router = useRouter()
  // Auto-redirect to business space after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => router.push('/business'), 4000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.icon}>🎉</div>
        <h1 style={S.title}>You are Premium!</h1>
        <p style={S.desc}>
          Welcome to myexpensio Premium — your tax-ready i/o tracker for solo business.
          Your Business Space is now active.
        </p>
        <div style={S.features}>
          {['Income tracking', 'Profit dashboard', 'P&L report', 'LHDN tax summary'].map(f => (
            <div key={f} style={S.feature}>✓ {f}</div>
          ))}
        </div>
        <Link href="/business" style={S.cta}>Go to My Business →</Link>
        <p style={S.hint}>Redirecting automatically in a few seconds…</p>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:     { display: 'flex', justifyContent: 'center', paddingTop: 24 },
  card:     { backgroundColor: '#ffffff', borderRadius: 20, padding: '36px 24px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 14 },
  icon:     { fontSize: 52 },
  title:    { fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0 },
  desc:     { fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 },
  features: { display: 'flex', flexDirection: 'column', gap: 8 },
  feature:  { backgroundColor: '#f0fdf4', color: '#15803d', borderRadius: 8, padding: '9px 14px', fontSize: 14, fontWeight: 600, textAlign: 'left' },
  cta:      { backgroundColor: '#0f172a', color: '#ffffff', padding: '14px 0', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' },
  hint:     { fontSize: 11, color: '#94a3b8', margin: 0 },
}
