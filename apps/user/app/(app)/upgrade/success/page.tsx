'use client'
// apps/user/app/(app)/upgrade/success/page.tsx
// Shown after a successful Stripe checkout for Pro or Premium.
// Reads ?tier= from URL (set in checkout success_url) to tailor messaging.

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Tier = 'PRO' | 'PREMIUM'

const PLAN_COPY: Record<Tier, {
  emoji:    string
  headline: string
  desc:     string
  features: string[]
  ctaLabel: string
  ctaHref:  string
}> = {
  PRO: {
    emoji:    '🎉',
    headline: 'You are now Pro!',
    desc:     'Advanced exports are unlocked. Generate PDF reports and Excel files for all your claims and expenses.',
    features: [
      'PDF claim reports',
      'Excel exports (trips & expenses)',
      'Tax summary export',
      'Shareable report links',
    ],
    ctaLabel: 'Go to Exports →',
    ctaHref:  '/exports',
  },
  PREMIUM: {
    emoji:    '🌟',
    headline: 'You are now Premium!',
    desc:     'Your Business Space is live — track income, monitor profit, and prepare for tax season.',
    features: [
      'Income tracking',
      'Monthly profit dashboard',
      'P&L report PDF',
      'LHDN tax estimation summary',
    ],
    ctaLabel: 'Go to My Business →',
    ctaHref:  '/business',
  },
}

export default function UpgradeSuccess() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Determine tier from query param; default to PREMIUM for backward compat
  const rawTier = (searchParams.get('tier') ?? 'PREMIUM').toUpperCase() as Tier
  const tier    = rawTier === 'PRO' ? 'PRO' : 'PREMIUM'
  const copy    = PLAN_COPY[tier]

  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          router.push(copy.ctaHref)
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [router, copy.ctaHref])

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.icon}>{copy.emoji}</div>
        <h1 style={S.title}>{copy.headline}</h1>
        <p style={S.desc}>{copy.desc}</p>

        <div style={S.features}>
          {copy.features.map(f => (
            <div key={f} style={S.feature}>✓ {f}</div>
          ))}
        </div>

        <Link href={copy.ctaHref} style={S.cta}>{copy.ctaLabel}</Link>

        <p style={S.hint}>
          Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}…
        </p>
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
