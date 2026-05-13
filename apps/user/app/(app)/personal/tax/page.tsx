'use client'
// apps/user/app/(app)/personal/tax/page.tsx
//
// Personal Tax Deduction Summary — LHDN filing reference.
// Calls GET /api/reports/tax-personal?year= and displays:
//   - Breakdown by LHDN relief category
//   - Grand total deductible amount
//   - Disclaimer footer
//   - Print / Share button

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Category = {
  key:   string
  label: string
  total: number
  count: number
}

type TaxSummary = {
  year:        number
  categories:  Category[]
  grand_total: number
  entry_count: number
  disclaimer:  string
}

const CATEGORY_ICONS: Record<string, string> = {
  LIFESTYLE:            '🛍️',
  MEDICAL:              '🏥',
  EDUCATION:            '📚',
  LIFE_INSURANCE_EPF:   '🔒',
  BOOKS:                '📖',
  DISABILITY_EQUIPMENT: '♿',
  OTHER:                '📌',
}

export default function PersonalTaxPage() {
  const router  = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  const currentYear = new Date().getFullYear()
  const minYear = currentYear - 4
  const [year,    setYear]    = useState(currentYear)
  const [summary, setSummary] = useState<TaxSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/reports/tax-personal?year=${year}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error.message)
        else setSummary(d)
      })
      .catch(() => setError('Failed to load tax summary.'))
      .finally(() => setLoading(false))
  }, [year])

  function handlePrint() {
    window.print()
  }

  const prevYear = () => { if (year > minYear) setYear(y => y - 1) }
  const nextYear = () => { if (year < currentYear) setYear(y => y + 1) }

  return (
    <>
      {/* Print styles — only active when window.print() is called */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #tax-print-area, #tax-print-area * { visibility: visible; }
          #tax-print-area {
            position: absolute; top: 0; left: 0; width: 100%;
            padding: 32px; font-family: Arial, sans-serif;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={S.page}>

        {/* Header */}
        <div style={S.headerRow} className="no-print">
          <button onClick={() => router.back()} style={S.back}>‹</button>
          <h1 style={S.title}>Tax Summary</h1>
          <button onClick={handlePrint} style={S.printBtn} title="Print or save as PDF">
            🖨️ Print
          </button>
        </div>

        {/* Year selector */}
        <div style={S.yearNav} className="no-print">
          <button onClick={prevYear} disabled={year <= minYear} style={S.arrow}>‹</button>
          <span style={S.yearLabel}>Year {year}</span>
          <button onClick={nextYear} disabled={year >= currentYear} style={S.arrow}>›</button>
        </div>

        {error   && <div style={S.error}>{error}</div>}
        {loading && <div style={S.empty}>Loading…</div>}

        {!loading && summary && (
          <div id="tax-print-area">

            {/* Print header (visible only in print) */}
            <div style={S.printHeader}>
              <div style={S.printTitle}>myexpensio — Personal Tax Deduction Summary</div>
              <div style={S.printSubtitle}>Year of Assessment: {year}</div>
            </div>

            {/* Grand total hero card */}
            <div style={S.heroCard}>
              <div style={S.heroLabel}>Total Deductible Expenses</div>
              <div style={S.heroAmount}>RM {summary.grand_total.toFixed(2)}</div>
              <div style={S.heroSub}>{summary.entry_count} entries · Year {year}</div>
            </div>

            {/* Empty state */}
            {summary.categories.length === 0 && (
              <div style={S.emptyCard}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
                <div style={S.emptyTitle}>No tax-deductible entries for {year}</div>
                <div style={S.emptyHint}>
                  When adding expenses, toggle "Tax Deductible" and select the LHDN relief category.
                  They will appear here.
                </div>
              </div>
            )}

            {/* Category breakdown */}
            {summary.categories.map(cat => (
              <div key={cat.key} style={S.catCard}>
                <div style={S.catLeft}>
                  <span style={S.catIcon}>{CATEGORY_ICONS[cat.key] ?? '📌'}</span>
                  <div>
                    <div style={S.catLabel}>{cat.label}</div>
                    <div style={S.catCount}>{cat.count} {cat.count === 1 ? 'entry' : 'entries'}</div>
                  </div>
                </div>
                <div style={S.catAmount}>RM {cat.total.toFixed(2)}</div>
              </div>
            ))}

            {/* Divider + grand total row */}
            {summary.categories.length > 0 && (
              <div style={S.totalRow}>
                <span style={S.totalLabel}>Grand Total Deductible</span>
                <span style={S.totalAmount}>RM {summary.grand_total.toFixed(2)}</span>
              </div>
            )}

            {/* Disclaimer */}
            <div style={S.disclaimer}>
              ⚠️ {summary.disclaimer}
            </div>

          </div>
        )}
      </div>
    </>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:        { display: 'flex', flexDirection: 'column', gap: 14 },
  headerRow:   { display: 'flex', alignItems: 'center', gap: 10 },
  back:        { fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, lineHeight: 1 },
  title:       { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, flex: 1 },
  printBtn:    { fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 10, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', color: '#0f172a', whiteSpace: 'nowrap' },
  yearNav:     { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 },
  arrow:       { fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '0 4px', lineHeight: 1 },
  yearLabel:   { fontSize: 16, fontWeight: 700, color: '#0f172a', minWidth: 80, textAlign: 'center' },
  heroCard:    { backgroundColor: '#0f172a', borderRadius: 16, padding: '24px 20px', textAlign: 'center', color: '#ffffff' },
  heroLabel:   { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  heroAmount:  { fontSize: 36, fontWeight: 900, letterSpacing: '-1px', marginBottom: 6 },
  heroSub:     { fontSize: 12, color: '#64748b' },
  catCard:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  catLeft:     { display: 'flex', alignItems: 'center', gap: 12 },
  catIcon:     { fontSize: 24 },
  catLabel:    { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  catCount:    { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  catAmount:   { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  totalRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 12, padding: '14px 16px', border: '1px solid #bbf7d0' },
  totalLabel:  { fontSize: 14, fontWeight: 700, color: '#15803d' },
  totalAmount: { fontSize: 18, fontWeight: 900, color: '#15803d' },
  disclaimer:  { backgroundColor: '#fffbeb', borderRadius: 12, padding: '14px 16px', fontSize: 12, color: '#92400e', lineHeight: 1.6, border: '1px solid #fde68a' },
  emptyCard:   { backgroundColor: '#ffffff', borderRadius: 16, padding: '32px 20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  emptyTitle:  { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 },
  emptyHint:   { fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },
  printHeader: { display: 'none', marginBottom: 24 },
  printTitle:  { fontSize: 18, fontWeight: 800 },
  printSubtitle: { fontSize: 14, color: '#475569', marginTop: 4 },
  error:       { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  empty:       { textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '32px 0' },
}
