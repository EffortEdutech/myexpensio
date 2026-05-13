'use client'
// apps/user/app/(app)/business/page.tsx
// Placeholder — full Business Space is built in Sprint 6.
// Shown to SUPER_ADMIN and Premium users who navigate here early.

import Link from 'next/link'

export default function BusinessPlaceholder() {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.icon}>🏢</div>
        <h1 style={S.title}>My Business</h1>
        <p style={S.subtitle}>
          Tax-ready i/o tracker for solo business
        </p>
        <div style={S.comingSoon}>
          <span style={S.badge}>Coming in Sprint 6</span>
        </div>
        <div style={S.features}>
          {[
            { icon: '💵', label: 'Income tracking' },
            { icon: '💸', label: 'Business expenses' },
            { icon: '📊', label: 'Profit dashboard' },
            { icon: '📄', label: 'P&L report (PDF)' },
            { icon: '🧾', label: 'LHDN tax summary' },
          ].map(f => (
            <div key={f.label} style={S.featureRow}>
              <span style={S.featureIcon}>{f.icon}</span>
              <span style={S.featureLabel}>{f.label}</span>
            </div>
          ))}
        </div>
        <Link href="/personal" style={S.backBtn}>← Back to Personal</Link>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:         { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24 },
  card:         { backgroundColor: '#ffffff', borderRadius: 20, padding: '32px 24px', maxWidth: 360, width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' },
  icon:         { fontSize: 48, marginBottom: 12 },
  title:        { fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' },
  subtitle:     { fontSize: 14, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 },
  comingSoon:   { marginBottom: 24 },
  badge:        { display: 'inline-block', backgroundColor: '#f0fdf4', color: '#15803d', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, border: '1px solid #bbf7d0' },
  features:     { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' },
  featureRow:   { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: 10 },
  featureIcon:  { fontSize: 20 },
  featureLabel: { fontSize: 14, fontWeight: 500, color: '#374151' },
  backBtn:      { display: 'block', padding: '12px 0', borderRadius: 12, backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: 14, textDecoration: 'none' },
}
