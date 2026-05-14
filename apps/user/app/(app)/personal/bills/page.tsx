// apps/user/app/(app)/personal/bills/page.tsx
// Monthly Bills & Commitments — coming soon scaffold.
// Shows feature intent + categories. Full UI to be built next sprint.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Monthly Bills',
  description: 'Track your monthly commitments — loans, rental, utilities and more.',
}

const CATEGORIES = [
  { icon: '🚗', label: 'Loan',         desc: 'Car loan, personal loan, PTPTN' },
  { icon: '🏠', label: 'Mortgage',     desc: 'House mortgage / rumah loan' },
  { icon: '🔑', label: 'Rental',       desc: 'House rental, office rental' },
  { icon: '💡', label: 'Utilities',    desc: 'TNB, Syabas, Gas, TM' },
  { icon: '🛡️', label: 'Insurance',   desc: 'Life, medical, car insurance' },
  { icon: '📺', label: 'Subscription', desc: 'Astro, Netflix, Spotify, gym' },
  { icon: '📚', label: 'Education',    desc: 'School fees, tuition' },
  { icon: '📋', label: 'Other',        desc: 'Any other monthly commitment' },
]

export default function BillsPage() {
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerIcon}>📋</div>
        <div>
          <h1 style={S.title}>Monthly Bills</h1>
          <p style={S.subtitle}>Commitments &amp; recurring payments</p>
        </div>
      </div>

      {/* Coming soon card */}
      <div style={S.comingSoon}>
        <div style={S.comingSoonBadge}>Coming Soon</div>
        <p style={S.comingSoonText}>
          Register all your monthly commitments once.
          The system tracks due dates, reminds you of missed payments,
          and shows a full monthly report.
        </p>
      </div>

      {/* Feature preview */}
      <div style={S.sectionTitle}>What you will be able to track</div>
      <div style={S.categoryGrid}>
        {CATEGORIES.map(cat => (
          <div key={cat.label} style={S.catCard}>
            <span style={S.catIcon}>{cat.icon}</span>
            <div>
              <div style={S.catLabel}>{cat.label}</div>
              <div style={S.catDesc}>{cat.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature list */}
      <div style={S.sectionTitle}>Features</div>
      <div style={S.featureList}>
        {[
          { icon: '📅', text: 'Set due day — system shows upcoming payments this month' },
          { icon: '✅', text: 'Mark payments as Paid, Partial, or Missed each month' },
          { icon: '🔔', text: 'Missed payment detection — highlights overdue bills' },
          { icon: '📊', text: 'Monthly commitment report — total committed vs total paid' },
          { icon: '📆', text: 'Payment history — see every month at a glance' },
          { icon: '📄', text: 'Set loan end date — system auto-ends when term is complete' },
        ].map(f => (
          <div key={f.text} style={S.featureRow}>
            <span style={S.featureIcon}>{f.icon}</span>
            <span style={S.featureText}>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    padding: '20px 16px 100px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: 480, margin: '0 auto',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  headerIcon: {
    fontSize: 36, lineHeight: 1,
  },
  title: {
    fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0,
  },
  subtitle: {
    fontSize: 13, color: '#64748b', margin: '2px 0 0',
  },
  comingSoon: {
    background: '#eef2ff', border: '1px solid #c7d2fe',
    borderRadius: 14, padding: '16px 18px', marginBottom: 24,
  },
  comingSoonBadge: {
    display: 'inline-block', background: '#4f46e5', color: '#fff',
    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase' as const, padding: '3px 8px',
    borderRadius: 99, marginBottom: 10,
  },
  comingSoonText: {
    fontSize: 13, color: '#3730a3', lineHeight: 1.6, margin: 0,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase' as const, letterSpacing: '0.07em',
    marginBottom: 10,
  },
  categoryGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 8, marginBottom: 24,
  },
  catCard: {
    background: '#fff', border: '1px solid #e2e8f0',
    borderRadius: 10, padding: '10px 12px',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  catIcon: { fontSize: 22, lineHeight: 1 },
  catLabel: { fontSize: 12, fontWeight: 700, color: '#0f172a' },
  catDesc:  { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  featureList: {
    display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 24,
  },
  featureRow: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 10, padding: '10px 12px',
  },
  featureIcon: { fontSize: 18, lineHeight: 1, flexShrink: 0 },
  featureText: { fontSize: 13, color: '#334155', lineHeight: 1.4 },
}
