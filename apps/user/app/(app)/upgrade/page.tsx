'use client'
// apps/user/app/(app)/upgrade/page.tsx
// Plan comparison and Premium upgrade CTA.

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FREE_FEATURES = [
  'Work Claims (mileage + receipts)',
  'Personal expense tracking',
  'Tax deduction marking (LHDN)',
  'Personal tax summary',
]

const PREMIUM_FEATURES = [
  'Everything in Free, plus:',
  '💵  Business income tracking',
  '💸  Business expense categorisation',
  '📊  Monthly profit dashboard',
  '📄  P&L report (downloadable PDF)',
  '🧾  LHDN business tax estimation',
]

export default function UpgradePage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/billing/premium/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (!res.ok) { setError(data?.error?.message ?? 'Could not start checkout.'); return }
      window.location.href = data.checkout_url
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.titleRow}>
        <button onClick={() => router.back()} style={S.back}>‹</button>
        <h1 style={S.title}>Choose your plan</h1>
      </div>

      {error && <div style={S.error}>{error}</div>}

      {/* Free plan card */}
      <div style={S.card}>
        <div style={S.planHeader}>
          <div>
            <div style={S.planName}>Free</div>
            <div style={S.planPrice}>RM 0 <span style={S.planPer}>/ month</span></div>
          </div>
          <span style={S.currentBadge}>Current</span>
        </div>
        <div style={S.featureList}>
          {FREE_FEATURES.map(f => (
            <div key={f} style={S.featureRow}><span style={S.check}>✓</span>{f}</div>
          ))}
        </div>
      </div>

      {/* Premium plan card */}
      <div style={{ ...S.card, ...S.premiumCard }}>
        <div style={S.planHeader}>
          <div>
            <div style={{ ...S.planName, color: '#ffffff' }}>Premium</div>
            <div style={{ ...S.planPrice, color: '#ffffff' }}>
              RM 15 <span style={{ ...S.planPer, color: '#94a3b8' }}>/ month</span>
            </div>
          </div>
          <span style={S.premiumBadge}>Solo Biz</span>
        </div>
        <div style={S.featureList}>
          {PREMIUM_FEATURES.map(f => (
            <div key={f} style={{ ...S.featureRow, color: '#e2e8f0' }}>
              {f.startsWith('Everything') ? <span style={{ ...S.check, color: '#94a3b8' }}> </span> : <span style={{ ...S.check, color: '#4ade80' }}>✓</span>}
              {f}
            </div>
          ))}
        </div>
        <button onClick={handleUpgrade} disabled={loading} style={{ ...S.upgradeBtn, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Redirecting to checkout…' : 'Upgrade to Premium →'}
        </button>
        <div style={S.disclaimer}>Cancel anytime. Secure payment via Stripe.</div>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:         { display: 'flex', flexDirection: 'column', gap: 16 },
  titleRow:     { display: 'flex', alignItems: 'center', gap: 10 },
  back:         { fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 },
  title:        { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 },
  card:         { backgroundColor: '#ffffff', borderRadius: 16, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' },
  premiumCard:  { backgroundColor: '#0f172a' },
  planHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planName:     { fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 },
  planPrice:    { fontSize: 28, fontWeight: 900, color: '#0f172a' },
  planPer:      { fontSize: 14, fontWeight: 400 },
  currentBadge: { fontSize: 11, fontWeight: 600, backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: 20 },
  premiumBadge: { fontSize: 11, fontWeight: 700, backgroundColor: '#1e293b', color: '#7dd3fc', padding: '4px 10px', borderRadius: 20 },
  featureList:  { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 },
  featureRow:   { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#374151' },
  check:        { fontSize: 14, color: '#16a34a', fontWeight: 700, flexShrink: 0, marginTop: 1 },
  upgradeBtn:   { width: '100%', backgroundColor: '#3b82f6', color: '#ffffff', padding: '15px 0', borderRadius: 12, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' },
  disclaimer:   { textAlign: 'center', fontSize: 11, color: '#64748b', marginTop: 10 },
  error:        { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
}
