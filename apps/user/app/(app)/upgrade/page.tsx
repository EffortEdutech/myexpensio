'use client'
// apps/user/app/(app)/upgrade/page.tsx
// 3-tier plan comparison — Free (trial) · Pro RM18 · Premium RM29
// Reads current subscription from /api/subscription to highlight active plan.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Plan feature lists ─────────────────────────────────────────────────────────

const PLANS = [
  {
    key:      'FREE' as const,
    name:     'Free Trial',
    price:    'RM 0',
    per:      '3 months only',
    badge:    '3-Month Trial',
    badgeColor: '#f0fdf4',
    badgeText:  '#15803d',
    accentBg:   '#ffffff',
    accentText: '#0f172a',
    features: [
      'Route calculations',
      'Trips tracking',
      'Claims management',
      'TNG statement import',
      'Receipt scanning',
      'Personal Expense tracking',
    ],
    locked: [
      'Advanced Exports (PDF / Excel)',
      'My Earning (Business space)',
    ],
    cta:     null,  // no upgrade button — already on this tier during trial
  },
  {
    key:      'PRO' as const,
    name:     'Pro',
    price:    'RM 18',
    per:      'per month',
    badge:    'Most Popular',
    badgeColor: '#eff6ff',
    badgeText:  '#1d4ed8',
    accentBg:   '#0f172a',
    accentText: '#ffffff',
    features: [
      'Everything in Free, plus:',
      'Advanced Exports (PDF / Excel)',
      'Personal Expense tracking',
    ],
    locked: [
      'My Earning (Business space)',
    ],
    cta: 'Upgrade to Pro →',
  },
  {
    key:      'PREMIUM' as const,
    name:     'Premium',
    price:    'RM 29',
    per:      'per month',
    badge:    'Full Suite',
    badgeColor: '#fef9c3',
    badgeText:  '#854d0e',
    accentBg:   '#0f172a',
    accentText: '#ffffff',
    features: [
      'Everything in Pro, plus:',
      'My Earning — income tracking',
      'Monthly profit dashboard',
      'P&L report (PDF download)',
      'LHDN business tax estimation',
    ],
    locked: [],
    cta: 'Upgrade to Premium →',
  },
]

// ── Component ──────────────────────────────────────────────────────────────────

type SubInfo = {
  tier:            'FREE' | 'PRO' | 'PREMIUM'
  is_trial:        boolean
  trial_days_left: number
}

export default function UpgradePage() {
  const router = useRouter()

  const [sub,       setSub]       = useState<SubInfo | null>(null)
  const [loading,   setLoading]   = useState<'PRO' | 'PREMIUM' | null>(null)
  const [error,     setError]     = useState<string | null>(null)

  // Load current subscription
  useEffect(() => {
    fetch('/api/subscription')
      .then(r => r.json())
      .then(d => setSub({ tier: d.tier, is_trial: d.is_trial, trial_days_left: d.trial_days_left }))
      .catch(() => setSub({ tier: 'FREE', is_trial: true, trial_days_left: 0 }))
  }, [])

  async function handleUpgrade(tier: 'PRO' | 'PREMIUM') {
    setLoading(tier)
    setError(null)
    try {
      const res  = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tier, entity_type: 'USER' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message ?? 'Could not start checkout. Please try again.')
        return
      }
      window.location.href = data.checkout_url
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const currentTier = sub?.tier ?? 'FREE'

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.titleRow}>
        <button onClick={() => router.back()} style={S.back}>‹</button>
        <h1 style={S.title}>Choose your plan</h1>
      </div>

      {/* Trial countdown */}
      {sub?.is_trial && sub.trial_days_left > 0 && (
        <div style={S.trialNote}>
          ⏳ Your free trial ends in <strong>{sub.trial_days_left} day{sub.trial_days_left !== 1 ? 's' : ''}</strong>.
          Upgrade now to keep uninterrupted access.
        </div>
      )}

      {error && <div style={S.errorBox}>{error}</div>}

      {/* Plan cards */}
      <div style={S.cards}>
        {PLANS.map(plan => {
          const isCurrent  = plan.key === currentTier
          const isHigher   = plan.key === 'PREMIUM' || (plan.key === 'PRO' && currentTier === 'FREE')
          const isDark     = isCurrent && plan.key !== 'FREE'
          const isLoading  = loading === plan.key

          return (
            <div
              key={plan.key}
              style={{
                ...S.card,
                backgroundColor: isDark ? '#0f172a'
                  : isCurrent     ? '#f8fafc'
                  : '#ffffff',
                border: isCurrent
                  ? '2px solid #0f172a'
                  : '2px solid #e2e8f0',
              }}
            >
              {/* Plan badge */}
              <div style={S.badgeRow}>
                <span style={{
                  ...S.badge,
                  backgroundColor: plan.badgeColor,
                  color:           plan.badgeText,
                }}>
                  {isCurrent ? '✓ Current Plan' : plan.badge}
                </span>
              </div>

              {/* Name + price */}
              <div style={S.planName(isDark)}>{plan.name}</div>
              <div style={S.priceRow}>
                <span style={S.price(isDark)}>{plan.price}</span>
                <span style={S.per(isDark)}>{plan.per}</span>
              </div>

              {/* Features included */}
              <div style={S.section}>
                {plan.features.map(f => (
                  <div key={f} style={S.featureRow(isDark, false)}>
                    <span style={{ color: f.startsWith('Everything') ? 'transparent' : '#22c55e', fontSize: 13, flexShrink: 0 }}>
                      {f.startsWith('Everything') ? '·' : '✓'}
                    </span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* Locked features */}
              {plan.locked.length > 0 && (
                <div style={{ ...S.section, marginTop: 0 }}>
                  {plan.locked.map(f => (
                    <div key={f} style={S.featureRow(isDark, true)}>
                      <span style={{ color: '#94a3b8', fontSize: 13, flexShrink: 0 }}>✗</span>
                      <span style={{ color: '#94a3b8' }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA button */}
              {isCurrent ? (
                <div style={S.currentLabel}>Your current plan</div>
              ) : plan.cta && isHigher ? (
                <button
                  onClick={() => handleUpgrade(plan.key as 'PRO' | 'PREMIUM')}
                  disabled={!!loading}
                  style={{
                    ...S.ctaBtn,
                    backgroundColor: plan.key === 'PREMIUM' ? '#f59e0b' : '#3b82f6',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? 'Redirecting…' : plan.cta}
                </button>
              ) : null}

              {plan.key !== 'FREE' && (
                <div style={S.disclaimer(isDark)}>Cancel anytime · Secure payment via Stripe</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom note */}
      <div style={S.footNote}>
        Team workspace pricing: RM18 or RM29 per seat / month, managed by your organisation.
      </div>

    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  page:      { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 } as React.CSSProperties,
  titleRow:  { display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,
  back:      { fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, lineHeight: 1 } as React.CSSProperties,
  title:     { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 } as React.CSSProperties,

  trialNote: {
    backgroundColor: '#fff7ed', border: '1px solid #fed7aa',
    borderRadius: 10, padding: '10px 14px',
    fontSize: 13, color: '#92400e', lineHeight: 1.5,
  } as React.CSSProperties,

  errorBox: {
    backgroundColor: '#fef2f2', color: '#dc2626',
    borderRadius: 8, padding: '10px 14px', fontSize: 13,
  } as React.CSSProperties,

  cards: {
    display: 'flex', flexDirection: 'column' as const, gap: 14,
  } as React.CSSProperties,

  card: {
    borderRadius: 18, padding: '20px 18px',
    display: 'flex', flexDirection: 'column' as const, gap: 12,
    transition: 'box-shadow 0.15s',
  } as React.CSSProperties,

  badgeRow: { display: 'flex' } as React.CSSProperties,

  badge: {
    fontSize: 10, fontWeight: 700,
    padding: '3px 10px', borderRadius: 20,
    letterSpacing: '0.3px',
  } as React.CSSProperties,

  planName:  (dark: boolean) => ({ fontSize: 20, fontWeight: 800, color: dark ? '#ffffff' : '#0f172a' } as React.CSSProperties),

  priceRow: { display: 'flex', alignItems: 'baseline', gap: 6 } as React.CSSProperties,
  price:    (dark: boolean) => ({ fontSize: 32, fontWeight: 900, color: dark ? '#ffffff' : '#0f172a', letterSpacing: '-1px' } as React.CSSProperties),
  per:      (dark: boolean) => ({ fontSize: 13, color: dark ? '#94a3b8' : '#64748b' } as React.CSSProperties),

  section:  { display: 'flex', flexDirection: 'column' as const, gap: 8 } as React.CSSProperties,

  featureRow: (dark: boolean, locked: boolean) => ({
    display: 'flex', alignItems: 'flex-start', gap: 8,
    fontSize: 13,
    color: locked ? '#94a3b8' : dark ? '#e2e8f0' : '#374151',
  } as React.CSSProperties),

  currentLabel: {
    textAlign: 'center' as const, fontSize: 13,
    color: '#64748b', fontWeight: 600, padding: '8px 0',
  } as React.CSSProperties,

  ctaBtn: {
    width: '100%', color: '#ffffff',
    padding: '14px 0', borderRadius: 12,
    fontWeight: 700, fontSize: 15,
    border: 'none', cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  disclaimer: (dark: boolean) => ({
    textAlign: 'center' as const, fontSize: 11,
    color: dark ? '#475569' : '#94a3b8',
  } as React.CSSProperties),

  footNote: {
    textAlign: 'center' as const, fontSize: 11,
    color: '#cbd5e1', lineHeight: 1.6, marginTop: 4,
  } as React.CSSProperties,
}
